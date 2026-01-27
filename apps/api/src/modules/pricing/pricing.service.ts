import { Injectable, NotFoundException, UnprocessableEntityException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TariffPlan } from '../../entities/tariff-plan.entity';
import { TariffRule, VehicleType, DayType, PeriodType } from '../../entities/tariff-rule.entity';
import { PricingConfig } from '../../entities/pricing-config.entity';
import { TariffChangeLog, TariffChangeType } from '../../entities/tariff-change-log.entity';
import { ParkingSession } from '../../entities/parking-session.entity';
import { PricingEngineService } from './pricing-engine.service';
import { CreateTariffPlanDto } from './dto/create-tariff-plan.dto';
import { UpdateTariffPlanDto } from './dto/update-tariff-plan.dto';
import { CreateTariffRuleDto } from './dto/create-tariff-rule.dto';
import { UpdateTariffRuleDto } from './dto/update-tariff-rule.dto';
import { UpdatePricingConfigDto } from './dto/update-pricing-config.dto';
import { PricingQuoteDto } from './dto/pricing-quote.dto';
import { PricingQuoteOutput } from './interfaces/pricing.interface';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(TariffPlan)
    private readonly tariffPlanRepository: Repository<TariffPlan>,
    @InjectRepository(TariffRule)
    private readonly tariffRuleRepository: Repository<TariffRule>,
    @InjectRepository(PricingConfig)
    private readonly pricingConfigRepository: Repository<PricingConfig>,
    @InjectRepository(TariffChangeLog)
    private readonly changeLogRepository: Repository<TariffChangeLog>,
    @InjectRepository(ParkingSession)
    private readonly parkingSessionRepository: Repository<ParkingSession>,
    private readonly pricingEngine: PricingEngineService,
  ) {}

  // ============ TariffPlan Methods ============

  async createTariffPlan(createDto: CreateTariffPlanDto, userId: string): Promise<TariffPlan> {
    const plan = this.tariffPlanRepository.create(createDto);
    const saved = await this.tariffPlanRepository.save(plan);

    await this.logChange(
      saved.companyId,
      saved.parkingLotId,
      userId,
      'TariffPlan',
      saved.id,
      TariffChangeType.CREATE,
      null,
      saved,
    );

    return saved;
  }

  async findAllTariffPlans(parkingLotId?: string): Promise<TariffPlan[]> {
    const query = this.tariffPlanRepository.createQueryBuilder('plan');

    if (parkingLotId) {
      query.where('plan.parkingLotId = :parkingLotId', { parkingLotId });
    }

    return query.orderBy('plan.createdAt', 'DESC').getMany();
  }

  async findOneTariffPlan(id: string): Promise<TariffPlan> {
    const plan = await this.tariffPlanRepository.findOne({
      where: { id },
      relations: ['rules'],
    });

    if (!plan) {
      throw new NotFoundException(`TariffPlan with ID ${id} not found`);
    }

    return plan;
  }

  async updateTariffPlan(id: string, updateDto: UpdateTariffPlanDto, userId: string): Promise<TariffPlan> {
    const plan = await this.findOneTariffPlan(id);
    const before = { ...plan };

    Object.assign(plan, updateDto);
    const saved = await this.tariffPlanRepository.save(plan);

    await this.logChange(
      saved.companyId,
      saved.parkingLotId,
      userId,
      'TariffPlan',
      saved.id,
      TariffChangeType.UPDATE,
      before,
      saved,
    );

    return saved;
  }

  async activateTariffPlan(id: string, userId: string): Promise<TariffPlan> {
    const plan = await this.findOneTariffPlan(id);

    // Desactivar otros planes del mismo parkingLot
    await this.tariffPlanRepository.update(
      { parkingLotId: plan.parkingLotId },
      { isActive: false },
    );

    plan.isActive = true;
    const saved = await this.tariffPlanRepository.save(plan);

    await this.logChange(
      saved.companyId,
      saved.parkingLotId,
      userId,
      'TariffPlan',
      saved.id,
      TariffChangeType.ACTIVATE,
      null,
      saved,
    );

    return saved;
  }

  // ============ TariffRule Methods ============

  async createTariffRule(createDto: CreateTariffRuleDto, userId: string): Promise<TariffRule> {
    // Validar que no exista regla duplicada
    const existing = await this.tariffRuleRepository.findOne({
      where: {
        tariffPlanId: createDto.tariffPlanId,
        vehicleType: createDto.vehicleType,
        dayType: createDto.dayType,
        period: createDto.period,
        isActive: true,
      },
    });

    if (existing) {
      throw new UnprocessableEntityException(
        `A rule already exists for ${createDto.vehicleType}, ${createDto.dayType}, ${createDto.period}`,
      );
    }

    const rule = this.tariffRuleRepository.create(createDto);
    const saved = await this.tariffRuleRepository.save(rule);

    await this.logChange(
      saved.companyId,
      saved.parkingLotId,
      userId,
      'TariffRule',
      saved.id,
      TariffChangeType.CREATE,
      null,
      saved,
    );

    return saved;
  }

  async findAllTariffRules(filters: {
    parkingLotId?: string;
    planId?: string;
    vehicleType?: VehicleType;
    dayType?: DayType;
    period?: PeriodType;
    active?: boolean;
  }): Promise<TariffRule[]> {
    const query = this.tariffRuleRepository.createQueryBuilder('rule');

    if (filters.parkingLotId) {
      query.andWhere('rule.parkingLotId = :parkingLotId', { parkingLotId: filters.parkingLotId });
    }

    if (filters.planId) {
      query.andWhere('rule.tariffPlanId = :planId', { planId: filters.planId });
    }

    if (filters.vehicleType) {
      query.andWhere('rule.vehicleType = :vehicleType', { vehicleType: filters.vehicleType });
    }

    if (filters.dayType) {
      query.andWhere('rule.dayType = :dayType', { dayType: filters.dayType });
    }

    if (filters.period) {
      query.andWhere('rule.period = :period', { period: filters.period });
    }

    if (filters.active !== undefined) {
      query.andWhere('rule.isActive = :active', { active: filters.active });
    }

    return query.orderBy('rule.vehicleType', 'ASC').addOrderBy('rule.dayType', 'ASC').getMany();
  }

  async updateTariffRule(id: string, updateDto: UpdateTariffRuleDto, userId: string): Promise<TariffRule> {
    const rule = await this.tariffRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`TariffRule with ID ${id} not found`);
    }

    const before = { ...rule };
    Object.assign(rule, updateDto);
    const saved = await this.tariffRuleRepository.save(rule);

    await this.logChange(
      saved.companyId,
      saved.parkingLotId,
      userId,
      'TariffRule',
      saved.id,
      TariffChangeType.UPDATE,
      before,
      saved,
    );

    return saved;
  }

  async deleteTariffRule(id: string, userId: string): Promise<void> {
    const rule = await this.tariffRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`TariffRule with ID ${id} not found`);
    }

    await this.logChange(
      rule.companyId,
      rule.parkingLotId,
      userId,
      'TariffRule',
      rule.id,
      TariffChangeType.DELETE,
      rule,
      null,
    );

    await this.tariffRuleRepository.remove(rule);
  }

  // ============ PricingConfig Methods ============

  async findPricingConfig(parkingLotId: string): Promise<PricingConfig | null> {
    return this.pricingConfigRepository.findOne({
      where: { parkingLotId },
    });
  }

  async upsertPricingConfig(updateDto: UpdatePricingConfigDto, userId: string): Promise<PricingConfig> {
    let config = await this.pricingConfigRepository.findOne({
      where: { parkingLotId: updateDto.parkingLotId },
    });

    const isNew = !config;
    const before = config ? { ...config } : null;

    if (!config) {
      config = this.pricingConfigRepository.create(updateDto);
    } else {
      Object.assign(config, updateDto);
    }

    const saved = await this.pricingConfigRepository.save(config);

    await this.logChange(
      saved.companyId,
      saved.parkingLotId,
      userId,
      'PricingConfig',
      saved.id,
      isNew ? TariffChangeType.CREATE : TariffChangeType.UPDATE,
      before,
      saved,
    );

    return saved;
  }

  // ============ Quote / Simulation Methods ============

  async calculateQuote(quoteDto: PricingQuoteDto, companyId: string): Promise<PricingQuoteOutput> {
    return this.pricingEngine.calculateQuote({
      companyId,
      parkingLotId: quoteDto.parkingLotId,
      vehicleType: quoteDto.vehicleType,
      entryAt: new Date(quoteDto.entryAt),
      exitAt: new Date(quoteDto.exitAt),
      options: {
        lostTicket: quoteDto.lostTicket,
        overrideDayType: quoteDto.overrideDayType,
        applyGrace: true,
        applyDailyMax: true,
      },
    });
  }

  async getSessionQuote(sessionId: string, companyId: string): Promise<PricingQuoteOutput> {
    const session = await this.parkingSessionRepository.findOne({
      where: { id: sessionId, companyId },
      relations: ['vehicle'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Mapear vehicle type desde session
    const vehicleTypeMap: Record<string, VehicleType> = {
      BICYCLE: VehicleType.BICYCLE,
      MOTORCYCLE: VehicleType.MOTORCYCLE,
      CAR: VehicleType.CAR,
      TRUCK: VehicleType.TRUCK_BUS,
      BUS: VehicleType.TRUCK_BUS,
    };

    const vehicleType = session.vehicle?.vehicleType 
      ? vehicleTypeMap[session.vehicle.vehicleType] || VehicleType.CAR
      : VehicleType.CAR;

    return this.pricingEngine.calculateQuote({
      companyId: session.companyId,
      parkingLotId: session.parkingLotId,
      vehicleType,
      entryAt: session.entryAt,
      exitAt: session.exitAt || new Date(), // Si aún activa, usar now()
      options: {
        lostTicket: false,
        applyGrace: true,
        applyDailyMax: true,
      },
    });
  }

  // ============ Private Helpers ============

  private async logChange(
    companyId: string,
    parkingLotId: string,
    userId: string,
    entity: string,
    entityId: string,
    changeType: TariffChangeType,
    before: any,
    after: any,
  ): Promise<void> {
    const log = this.changeLogRepository.create({
      companyId,
      parkingLotId,
      actorUserId: userId,
      entity,
      entityId,
      changeType,
      before,
      after,
    });

    await this.changeLogRepository.save(log);
  }
}
