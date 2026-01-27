import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TariffRule, BillingUnit, RoundingType, DayType, PeriodType, VehicleType } from '../../entities/tariff-rule.entity';
import { PricingConfig } from '../../entities/pricing-config.entity';
import { HolidaysService } from '../holidays/holidays.service';
import { PricingQuoteInput, PricingQuoteOutput, PricingSegment } from './interfaces/pricing.interface';

@Injectable()
export class PricingEngineService {
  constructor(
    @InjectRepository(TariffRule)
    private readonly tariffRuleRepository: Repository<TariffRule>,
    @InjectRepository(PricingConfig)
    private readonly pricingConfigRepository: Repository<PricingConfig>,
    private readonly holidaysService: HolidaysService,
  ) {}

  async calculateQuote(input: PricingQuoteInput): Promise<PricingQuoteOutput> {
    const warnings: string[] = [];

    // 1. Validar entrada
    if (input.entryAt >= input.exitAt) {
      throw new UnprocessableEntityException('exitAt must be after entryAt');
    }

    // 2. Obtener configuración
    const config = await this.pricingConfigRepository.findOne({
      where: {
        parkingLotId: input.parkingLotId,
        companyId: input.companyId,
      },
    });

    if (!config && input.options?.lostTicket) {
      warnings.push('No pricing config found, cannot apply lost ticket fee');
    }

    // 3. Calcular minutos totales
    const totalMinutes = this.calculateMinutesBetween(input.entryAt, input.exitAt);

    // 4. Aplicar grace period
    const applyGrace = input.options?.applyGrace !== false;
    const graceMinutes = config?.defaultGraceMinutes || 0;
    
    let billableMinutes = totalMinutes;
    let graceAppliedMinutes = 0;

    if (applyGrace && graceMinutes > 0) {
      if (totalMinutes <= graceMinutes) {
        // Dentro del período de gracia: cobro mínimo o cero
        billableMinutes = 0;
        graceAppliedMinutes = totalMinutes;
      } else {
        // Reduce billable por grace
        billableMinutes = totalMinutes - graceMinutes;
        graceAppliedMinutes = graceMinutes;
      }
    }

    // Si estamos dentro del grace period completo, retornar cero
    if (billableMinutes === 0) {
      return {
        total: 0,
        currency: 'COP',
        breakdown: {
          totalMinutes,
          billableMinutes: 0,
          graceAppliedMinutes,
          segments: [],
          dailyMaxApplied: false,
          lostTicketFeeApplied: false,
          ruleIdsUsed: [],
        },
        debug: { warnings },
      };
    }

    // 5. Segmentar por día/noche/fecha
    const segments = await this.segmentTimeRange(
      input.entryAt,
      input.exitAt,
      input.parkingLotId,
      input.companyId,
      input.vehicleType,
      input.options?.overrideDayType,
    );

    if (segments.length === 0) {
      warnings.push(
        `No tariff rules found for vehicleType=${input.vehicleType}. Please configure tariffs.`,
      );
      throw new UnprocessableEntityException(
        `No tariff rules configured for vehicle type ${input.vehicleType}`,
      );
    }

    // 6. Calcular subtotales
    let subtotal = 0;
    const ruleIdsUsed: string[] = [];

    for (const segment of segments) {
      subtotal += segment.subtotal;
      if (!ruleIdsUsed.includes(segment.ruleId)) {
        ruleIdsUsed.push(segment.ruleId);
      }
    }

    // 7. Aplicar daily max
    let dailyMaxApplied = false;
    let dailyMaxAmount: number | undefined;
    const applyDailyMax = input.options?.applyDailyMax !== false;

    if (applyDailyMax && config?.defaultDailyMax && subtotal > config.defaultDailyMax) {
      dailyMaxAmount = config.defaultDailyMax;
      subtotal = config.defaultDailyMax;
      dailyMaxApplied = true;
    }

    // 8. Aplicar lost ticket fee
    let lostTicketFeeApplied = false;
    let lostTicketFeeAmount: number | undefined;

    if (input.options?.lostTicket && config?.lostTicketFee) {
      lostTicketFeeAmount = config.lostTicketFee;
      subtotal += config.lostTicketFee;
      lostTicketFeeApplied = true;
    }

    return {
      total: subtotal,
      currency: 'COP',
      breakdown: {
        totalMinutes,
        billableMinutes,
        graceAppliedMinutes,
        segments,
        dailyMaxApplied,
        dailyMaxAmount,
        lostTicketFeeApplied,
        lostTicketFeeAmount,
        ruleIdsUsed,
      },
      debug: { warnings },
    };
  }

  private async segmentTimeRange(
    entryAt: Date,
    exitAt: Date,
    parkingLotId: string,
    companyId: string,
    vehicleType: string,
    overrideDayType?: string,
  ): Promise<PricingSegment[]> {
    const segments: PricingSegment[] = [];
    let current = new Date(entryAt);

    while (current < exitAt) {
      // Determinar el fin del segmento actual
      const segmentEnd = this.getSegmentEnd(current, exitAt);

      // Determinar dayType y period
      const dayType = overrideDayType || (await this.determineDayType(current));
      const period = this.determinePeriod(current);

      // Buscar regla aplicable
      const rule = await this.findApplicableRule(
        parkingLotId,
        companyId,
        vehicleType as VehicleType,
        dayType as DayType,
        period as PeriodType,
      );

      if (rule) {
        const segmentMinutes = this.calculateMinutesBetween(current, segmentEnd);
        const units = this.calculateUnits(segmentMinutes, rule.billingUnit, rule.rounding);
        const subtotal = Math.max(units * rule.unitPrice, rule.minimumCharge || 0);

        segments.push({
          from: new Date(current),
          to: new Date(segmentEnd),
          dayType,
          period,
          unit: rule.billingUnit,
          unitsBilled: units,
          unitPrice: rule.unitPrice,
          subtotal,
          ruleId: rule.id,
        });
      }

      current = segmentEnd;
    }

    return segments;
  }

  private getSegmentEnd(current: Date, exitAt: Date): Date {
    // Segmentar por:
    // 1. Cambio de día (medianoche)
    // 2. Cambio de period (DAY/NIGHT a las 19:00 y 06:00)
    // 3. ExitAt si es antes

    const midnight = new Date(current);
    midnight.setHours(24, 0, 0, 0);

    const dayStart = new Date(current);
    dayStart.setHours(6, 0, 0, 0);

    const nightStart = new Date(current);
    nightStart.setHours(19, 0, 0, 0);

    const candidates = [exitAt, midnight];

    // Agregar transiciones de period
    if (dayStart > current && dayStart < exitAt) {
      candidates.push(dayStart);
    }
    if (nightStart > current && nightStart < exitAt) {
      candidates.push(nightStart);
    }

    return new Date(Math.min(...candidates.map((d) => d.getTime())));
  }

  private async determineDayType(date: Date): Promise<string> {
    const dateStr = this.formatDate(date);
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

    // Check holiday
    const isHoliday = await this.holidaysService.isHoliday(dateStr);
    if (isHoliday) {
      return DayType.HOLIDAY;
    }

    // Check weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return DayType.WEEKEND;
    }

    return DayType.WEEKDAY;
  }

  private determinePeriod(date: Date): string {
    const hour = date.getHours();
    // DAY: 06:00-18:59, NIGHT: 19:00-05:59
    if (hour >= 6 && hour < 19) {
      return PeriodType.DAY;
    }
    return PeriodType.NIGHT;
  }

  private async findApplicableRule(
    parkingLotId: string,
    companyId: string,
    vehicleType: VehicleType,
    dayType: DayType,
    period: PeriodType,
  ): Promise<TariffRule | null> {
    return this.tariffRuleRepository.findOne({
      where: {
        parkingLotId,
        companyId,
        vehicleType,
        dayType,
        period,
        isActive: true,
      },
    });
  }

  private calculateUnits(minutes: number, billingUnit: BillingUnit, rounding: RoundingType): number {
    let units = 0;

    switch (billingUnit) {
      case BillingUnit.MINUTE:
        units = minutes;
        break;
      case BillingUnit.BLOCK_15:
        units = minutes / 15;
        break;
      case BillingUnit.BLOCK_30:
        units = minutes / 30;
        break;
      case BillingUnit.HOUR:
        units = minutes / 60;
        break;
      case BillingUnit.DAY:
        units = minutes / (24 * 60);
        break;
    }

    return this.applyRounding(units, rounding);
  }

  private applyRounding(value: number, rounding: RoundingType): number {
    switch (rounding) {
      case RoundingType.CEIL:
        return Math.ceil(value);
      case RoundingType.FLOOR:
        return Math.floor(value);
      case RoundingType.NEAREST:
        return Math.round(value);
      default:
        return Math.ceil(value);
    }
  }

  private calculateMinutesBetween(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
