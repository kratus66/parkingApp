import { DataSource } from 'typeorm';
import { TariffPlan } from '../../entities/tariff-plan.entity';
import { TariffRule, VehicleType, DayType, PeriodType, BillingUnit, RoundingType } from '../../entities/tariff-rule.entity';
import { PricingConfig } from '../../entities/pricing-config.entity';
import { Holiday } from '../../entities/holiday.entity';

export class SeedPricing1737476500000 {
  public async up(dataSource: DataSource): Promise<void> {
    // Obtener repositorios
    const tariffPlanRepo = dataSource.getRepository(TariffPlan);
    const tariffRuleRepo = dataSource.getRepository(TariffRule);
    const pricingConfigRepo = dataSource.getRepository(PricingConfig);
    const holidayRepo = dataSource.getRepository(Holiday);

    // Obtener companyId y parkingLotId existentes
    const company = await dataSource.query(`SELECT id FROM companies LIMIT 1`);
    const parkingLot = await dataSource.query(`SELECT id FROM parking_lots LIMIT 1`);

    if (!company[0] || !parkingLot[0]) {
      console.log('⚠️  No hay company o parkingLot, saltando seed de pricing');
      return;
    }

    const companyId = company[0].id;
    const parkingLotId = parkingLot[0].id;

    // 1. Crear PricingConfig
    const config = pricingConfigRepo.create({
      companyId,
      parkingLotId,
      defaultGraceMinutes: 15,
      defaultDailyMax: 50000, // COP
      lostTicketFee: 20000, // COP
      enableDynamicPricing: false,
    });
    await pricingConfigRepo.save(config);
    console.log('✅ PricingConfig creado');

    // 2. Crear TariffPlan
    const plan = tariffPlanRepo.create({
      companyId,
      parkingLotId,
      name: 'Tarifa Base 2026',
      isActive: true,
      timezone: 'America/Bogota',
    });
    const savedPlan = await tariffPlanRepo.save(plan);
    console.log('✅ TariffPlan creado');

    // 3. Crear TariffRules (4 vehículos x 6 combinaciones = 24 reglas)
    const vehicleTypes = [VehicleType.BICYCLE, VehicleType.MOTORCYCLE, VehicleType.CAR, VehicleType.TRUCK_BUS];
    const combinations = [
      { dayType: DayType.WEEKDAY, period: PeriodType.DAY, start: '06:00', end: '18:59' },
      { dayType: DayType.WEEKDAY, period: PeriodType.NIGHT, start: '19:00', end: '05:59' },
      { dayType: DayType.WEEKEND, period: PeriodType.DAY, start: '06:00', end: '18:59' },
      { dayType: DayType.WEEKEND, period: PeriodType.NIGHT, start: '19:00', end: '05:59' },
      { dayType: DayType.HOLIDAY, period: PeriodType.DAY, start: '06:00', end: '18:59' },
      { dayType: DayType.HOLIDAY, period: PeriodType.NIGHT, start: '19:00', end: '05:59' },
    ];

    // Precios base por vehículo (por hora)
    const basePrices = {
      [VehicleType.BICYCLE]: 1000,
      [VehicleType.MOTORCYCLE]: 2000,
      [VehicleType.CAR]: 3000,
      [VehicleType.TRUCK_BUS]: 5000,
    };

    const rules: any[] = [];

    for (const vType of vehicleTypes) {
      for (const combo of combinations) {
        const basePrice = basePrices[vType];
        
        // Incremento de 20% para noche y 30% para festivos
        let unitPrice = basePrice;
        if (combo.period === PeriodType.NIGHT) {
          unitPrice = Math.floor(basePrice * 1.2);
        }
        if (combo.dayType === DayType.HOLIDAY) {
          unitPrice = Math.floor(basePrice * 1.3);
        }

        rules.push({
          companyId,
          parkingLotId,
          tariffPlanId: savedPlan.id,
          vehicleType: vType,
          dayType: combo.dayType,
          period: combo.period,
          startTime: combo.start,
          endTime: combo.end,
          billingUnit: BillingUnit.HOUR,
          unitPrice,
          minimumCharge: Math.floor(unitPrice * 0.5), // Mínimo: 30 min
          dailyMax: null, // Usar config global
          graceMinutes: null, // Usar config global
          rounding: RoundingType.CEIL,
          isActive: true,
        });
      }
    }

    await tariffRuleRepo.save(rules);
    console.log(`✅ ${rules.length} TariffRules creados`);

    // 4. Crear Holidays (Festivos Colombia 2026)
    const holidays2026 = [
      { date: '2026-01-01', name: 'Año Nuevo' },
      { date: '2026-01-12', name: 'Día de los Reyes Magos' },
      { date: '2026-03-23', name: 'Día de San José' },
      { date: '2026-04-09', name: 'Jueves Santo' },
      { date: '2026-04-10', name: 'Viernes Santo' },
      { date: '2026-05-01', name: 'Día del Trabajo' },
      { date: '2026-05-25', name: 'Ascensión del Señor' },
      { date: '2026-06-15', name: 'Corpus Christi' },
      { date: '2026-06-22', name: 'Sagrado Corazón de Jesús' },
      { date: '2026-06-29', name: 'San Pedro y San Pablo' },
      { date: '2026-07-20', name: 'Día de la Independencia' },
      { date: '2026-08-07', name: 'Batalla de Boyacá' },
      { date: '2026-08-17', name: 'Asunción de la Virgen' },
      { date: '2026-10-12', name: 'Día de la Raza' },
      { date: '2026-11-02', name: 'Día de Todos los Santos' },
      { date: '2026-11-16', name: 'Independencia de Cartagena' },
      { date: '2026-12-08', name: 'Inmaculada Concepción' },
      { date: '2026-12-25', name: 'Navidad' },
    ];

    const holidayEntities = holidays2026.map((h) =>
      holidayRepo.create({
        country: 'CO',
        date: h.date,
        name: h.name,
      }),
    );

    await holidayRepo.save(holidayEntities);
    console.log(`✅ ${holidayEntities.length} Holidays creados`);

    console.log('🎉 Seed de Pricing completado');
  }

  public async down(dataSource: DataSource): Promise<void> {
    await dataSource.query(`DELETE FROM tariff_rules`);
    await dataSource.query(`DELETE FROM tariff_plans`);
    await dataSource.query(`DELETE FROM pricing_config`);
    await dataSource.query(`DELETE FROM holidays WHERE country = 'CO'`);
  }
}
