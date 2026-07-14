import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { join } from 'path';

config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'parking_user',
    password: process.env.DB_PASSWORD || 'parking_pass_2026',
    database: process.env.DB_DATABASE || 'parking_system',
    entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = dataSource.createQueryRunner();

    // Check if data already exists
    const existingCompanies = await queryRunner.query('SELECT COUNT(*) FROM companies');
    if (parseInt(existingCompanies[0].count) > 0) {
      console.log('⚠️  Database already has data. Skipping seed...');
      await dataSource.destroy();
      return;
    }

    console.log('🌱 Starting seed...');

    // Create demo company
    const companyResult = await queryRunner.query(`
      INSERT INTO companies (name, nit, is_active)
      VALUES ('Parking Demo Company', '900123456-7', true)
      RETURNING id
    `);
    const companyId = companyResult[0].id;
    console.log(`✅ Company created: ${companyId}`);

    // Create demo parking lot
    const parkingLotResult = await queryRunner.query(
      `
      INSERT INTO parking_lots (company_id, name, address, legal_name, legal_nit, ticket_header, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id
    `,
      [
        companyId,
        'Parqueadero Centro',
        'Calle 100 # 10-20, Bogotá',
        'Parking Demo Company S.A.S.',
        '900123456-7',
        JSON.stringify({
          companyName: 'Parking Demo Company',
          nit: '900123456-7',
          address: 'Calle 100 # 10-20, Bogotá',
          phone: '+57 300 1234567',
          email: 'info@parkingdemo.com',
          footerText: 'Gracias por su visita',
        }),
      ],
    );
    const parkingLotId = parkingLotResult[0].id;
    console.log(`✅ Parking lot created: ${parkingLotId}`);

    // Create demo zones and spots (todos FREE, deterministas) para que el
    // parqueadero sea operable de inmediato en la UI.
    const zonesSeed: {
      name: string;
      description: string;
      types: string;
      prefix: string;
      count: number;
    }[] = [
      { name: 'Zona A - Autos', description: 'Automóviles', types: 'CAR', prefix: 'A', count: 20 },
      { name: 'Zona B - Motos', description: 'Motocicletas', types: 'MOTORCYCLE', prefix: 'B', count: 15 },
      { name: 'Zona C - Camiones/Buses', description: 'Vehículos grandes', types: 'TRUCK_BUS', prefix: 'C', count: 5 },
      { name: 'Zona D - Bicicletas', description: 'Bicicletas', types: 'BICYCLE', prefix: 'D', count: 10 },
    ];

    let totalSpots = 0;
    for (const z of zonesSeed) {
      const zoneRes = await queryRunner.query(
        `
        INSERT INTO parking_zones (company_id, parking_lot_id, name, description, allowed_vehicle_types, is_active)
        VALUES ($1, $2, $3, $4, $5::vehicle_type_enum[], true)
        RETURNING id
      `,
        [companyId, parkingLotId, z.name, z.description, `{${z.types}}`],
      );
      const zoneId = zoneRes[0].id;

      for (let i = 1; i <= z.count; i++) {
        const code = `${z.prefix}-${i.toString().padStart(2, '0')}`;
        const priority = i <= 5 ? 10 : i <= 10 ? 5 : 0;
        await queryRunner.query(
          `
          INSERT INTO parking_spots (company_id, parking_lot_id, zone_id, code, spot_type, status, priority)
          VALUES ($1, $2, $3, $4, $5::vehicle_type_enum, 'FREE'::spot_status_enum, $6)
        `,
          [companyId, parkingLotId, zoneId, code, z.types, priority],
        );
        totalSpots++;
      }
      console.log(`✅ Zona creada: ${z.name} (${z.count} puestos)`);
    }
    console.log(`✅ ${zonesSeed.length} zonas y ${totalSpots} puestos creados (todos FREE)`);

    // Resolución de facturación DIAN (demo, ambiente de pruebas)
    await queryRunner.query(
      `
      INSERT INTO billing_resolutions
        (company_id, parking_lot_id, document_type, prefix, resolution_number,
         range_from, range_to, current_number, valid_from, valid_until,
         technical_key, environment, is_active)
      VALUES ($1, $2, 'FACTURA_VENTA', 'FE', '18764003812345',
              1000, 5000, 999, '2026-01-01', '2027-01-01',
              'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c', 2, true)
    `,
      [companyId, parkingLotId],
    );
    console.log('✅ Resolución de facturación DIAN (demo) creada: prefijo FE, rango 1000-5000');

    // Hash password
    const passwordHash = await bcrypt.hash('Admin123*', 10);
    const supervisorPasswordHash = await bcrypt.hash('Super123*', 10);
    const cashierPasswordHash = await bcrypt.hash('Cajero123*', 10);

    // Create admin user
    const adminResult = await queryRunner.query(
      `
      INSERT INTO users (company_id, parking_lot_id, full_name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id
    `,
      [companyId, parkingLotId, 'Administrador Demo', 'admin@demo.com', passwordHash, 'ADMIN'],
    );
    console.log(`✅ Admin user created: admin@demo.com / Admin123*`);

    // Create supervisor user
    await queryRunner.query(
      `
      INSERT INTO users (company_id, parking_lot_id, full_name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
    `,
      [
        companyId,
        parkingLotId,
        'Supervisor Demo',
        'supervisor@demo.com',
        supervisorPasswordHash,
        'SUPERVISOR',
      ],
    );
    console.log(`✅ Supervisor user created: supervisor@demo.com / Super123*`);

    // Create cashier user
    await queryRunner.query(
      `
      INSERT INTO users (company_id, parking_lot_id, full_name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
    `,
      [
        companyId,
        parkingLotId,
        'Cajero Demo',
        'cajero@demo.com',
        cashierPasswordHash,
        'CASHIER',
      ],
    );
    console.log(`✅ Cashier user created: cajero@demo.com / Cajero123*`);

    // Create demo customers
    const customer1Result = await queryRunner.query(
      `
      INSERT INTO customers (company_id, document_type, document_number, full_name, phone, email, address, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING id
    `,
      [
        companyId,
        'CC',
        '1234567890',
        'DIEGO HERRERA',
        '+57 300 1111111',
        'diego@example.com',
        'Calle 10 # 20-30, Bogotá',
      ],
    );
    const customer1Id = customer1Result[0].id;
    console.log(`✅ Customer 1 created: DIEGO HERRERA (CC 1234567890)`);

    const customer2Result = await queryRunner.query(
      `
      INSERT INTO customers (company_id, document_type, document_number, full_name, phone, email, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id
    `,
      [
        companyId,
        'CE',
        '9876543210',
        'MARIA GONZALEZ',
        '+57 300 2222222',
        'maria@example.com',
      ],
    );
    const customer2Id = customer2Result[0].id;
    console.log(`✅ Customer 2 created: MARIA GONZALEZ (CE 9876543210)`);

    const customer3Result = await queryRunner.query(
      `
      INSERT INTO customers (company_id, document_type, document_number, full_name, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id
    `,
      [companyId, 'PASSPORT', 'AB123456', 'JOHN SMITH', '+57 300 3333333'],
    );
    const customer3Id = customer3Result[0].id;
    console.log(`✅ Customer 3 created: JOHN SMITH (PASSPORT AB123456)`);

    // Create demo vehicles
    await queryRunner.query(
      `
      INSERT INTO vehicles_v2 (company_id, customer_id, vehicle_type, plate, brand, model, color, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    `,
      [companyId, customer1Id, 'CAR', 'ABC123', 'Toyota', 'Corolla', 'Blanco'],
    );
    console.log(`✅ Vehicle created: ABC123 (CAR - Toyota Corolla) - Customer: DIEGO HERRERA`);

    await queryRunner.query(
      `
      INSERT INTO vehicles_v2 (company_id, customer_id, vehicle_type, plate, brand, model, color, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    `,
      [companyId, customer2Id, 'MOTORCYCLE', 'XYZ789', 'Yamaha', 'FZ', 'Negro'],
    );
    console.log(`✅ Vehicle created: XYZ789 (MOTORCYCLE - Yamaha FZ) - Customer: MARIA GONZALEZ`);

    await queryRunner.query(
      `
      INSERT INTO vehicles_v2 (company_id, customer_id, vehicle_type, bicycle_code, brand, color, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
    `,
      [companyId, customer3Id, 'BICYCLE', 'BICI-001', 'Trek', 'Azul'],
    );
    console.log(`✅ Vehicle created: BICI-001 (BICYCLE - Trek) - Customer: JOHN SMITH`);

    // Create demo consents
    const actorUserId = adminResult[0].id;
    const now = new Date();

    // WhatsApp consent granted for customer 1
    await queryRunner.query(
      `
      INSERT INTO consents (company_id, customer_id, channel, status, source, evidence_text, granted_at, actor_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        companyId,
        customer1Id,
        'WHATSAPP',
        'GRANTED',
        'IN_PERSON',
        'Cliente acepta recibir notificaciones por WhatsApp en taquilla',
        now,
        actorUserId,
      ],
    );
    console.log(`✅ Consent created: DIEGO HERRERA - WhatsApp GRANTED`);

    // Email consent granted for customer 1
    await queryRunner.query(
      `
      INSERT INTO consents (company_id, customer_id, channel, status, source, evidence_text, granted_at, actor_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        companyId,
        customer1Id,
        'EMAIL',
        'GRANTED',
        'IN_PERSON',
        'Cliente acepta recibir notificaciones por Email',
        now,
        actorUserId,
      ],
    );
    console.log(`✅ Consent created: DIEGO HERRERA - Email GRANTED`);

    // WhatsApp consent granted for customer 2
    await queryRunner.query(
      `
      INSERT INTO consents (company_id, customer_id, channel, status, source, evidence_text, granted_at, actor_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        companyId,
        customer2Id,
        'WHATSAPP',
        'GRANTED',
        'IN_PERSON',
        'Cliente acepta WhatsApp',
        now,
        actorUserId,
      ],
    );
    console.log(`✅ Consent created: MARIA GONZALEZ - WhatsApp GRANTED`);

    // Email consent revoked for customer 2
    await queryRunner.query(
      `
      INSERT INTO consents (company_id, customer_id, channel, status, source, evidence_text, revoked_at, actor_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        companyId,
        customer2Id,
        'EMAIL',
        'REVOKED',
        'CALLCENTER',
        'Cliente revoca consentimiento de email por teléfono',
        now,
        actorUserId,
      ],
    );
    console.log(`✅ Consent created: MARIA GONZALEZ - Email REVOKED`);

    // ========================================
    // 🎯 SPRINT 5: MOTOR DE TARIFAS
    // ========================================
    console.log('\n🌱 Seeding pricing data...');

    // 1. Create pricing config for the parking lot
    const pricingConfigResult = await queryRunner.query(
      `
      INSERT INTO pricing_config 
        (company_id, parking_lot_id, default_grace_minutes, default_daily_max, lost_ticket_fee, enable_dynamic_pricing)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
      [companyId, parkingLotId, 15, null, 20000, false],
    );
    console.log(`✅ Pricing config created: ${pricingConfigResult[0].id}`);

    // 2. Create tariff plan
    const tariffPlanResult = await queryRunner.query(
      `
      INSERT INTO tariff_plans (company_id, parking_lot_id, name, is_active, timezone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
      [companyId, parkingLotId, 'Tarifa Base 2026', true, 'America/Bogota'],
    );
    const tariffPlanId = tariffPlanResult[0].id;
    console.log(`✅ Tariff plan created: ${tariffPlanId}`);

    // 3. Create tariff rules (24 combinations)
    const vehicleTypes = [
      { type: 'BICYCLE', basePrice: 1000 },
      { type: 'MOTORCYCLE', basePrice: 2000 },
      { type: 'CAR', basePrice: 3000 },
      { type: 'TRUCK_BUS', basePrice: 5000 },
    ];

    const dayPeriods = [
      { dayType: 'WEEKDAY', period: 'DAY', startTime: '06:00', endTime: '19:00', multiplier: 1.0 },
      { dayType: 'WEEKDAY', period: 'NIGHT', startTime: '19:00', endTime: '06:00', multiplier: 1.2 },
      { dayType: 'WEEKEND', period: 'DAY', startTime: '06:00', endTime: '19:00', multiplier: 1.0 },
      { dayType: 'WEEKEND', period: 'NIGHT', startTime: '19:00', endTime: '06:00', multiplier: 1.2 },
      { dayType: 'HOLIDAY', period: 'DAY', startTime: '06:00', endTime: '19:00', multiplier: 1.3 },
      { dayType: 'HOLIDAY', period: 'NIGHT', startTime: '19:00', endTime: '06:00', multiplier: 1.3 },
    ];

    let ruleCount = 0;
    for (const vehicle of vehicleTypes) {
      for (const dayPeriod of dayPeriods) {
        const unitPrice = Math.round(vehicle.basePrice * dayPeriod.multiplier);
        const minimumCharge = Math.round(unitPrice * 0.5);

        await queryRunner.query(
          `
          INSERT INTO tariff_rules 
            (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, 
             start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, 
             grace_minutes, rounding, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `,
          [
            companyId,
            parkingLotId,
            tariffPlanId,
            vehicle.type,
            dayPeriod.dayType,
            dayPeriod.period,
            dayPeriod.startTime,
            dayPeriod.endTime,
            'HOUR',
            unitPrice,
            minimumCharge,
            50000,
            15,
            'CEIL',
            true,
          ],
        );
        ruleCount++;
      }
    }
    console.log(`✅ Created ${ruleCount} tariff rules`);

    // 4. Create Colombia holidays for 2026
    const holidays2026 = [
      { date: '2026-01-01', name: 'Año Nuevo' },
      { date: '2026-01-12', name: 'Día de los Reyes Magos' },
      { date: '2026-03-23', name: 'Día de San José' },
      { date: '2026-04-02', name: 'Jueves Santo' },
      { date: '2026-04-03', name: 'Viernes Santo' },
      { date: '2026-05-01', name: 'Día del Trabajo' },
      { date: '2026-05-18', name: 'Ascensión del Señor' },
      { date: '2026-06-08', name: 'Corpus Christi' },
      { date: '2026-06-15', name: 'Sagrado Corazón de Jesús' },
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

    for (const holiday of holidays2026) {
      await queryRunner.query(
        `INSERT INTO holidays (country, date, name) VALUES ($1, $2, $3)`,
        ['CO', holiday.date, holiday.name],
      );
    }
    console.log(`✅ Created ${holidays2026.length} holidays for Colombia 2026`);

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('📝 Demo credentials:');
    console.log('   Admin:      admin@demo.com / Admin123*');
    console.log('   Supervisor: supervisor@demo.com / Super123*');
    console.log('   Cajero:     cajero@demo.com / Cajero123*');
    console.log('\n📦 Demo data created:');
    console.log('   Customers: 3 (DIEGO HERRERA, MARIA GONZALEZ, JOHN SMITH)');
    console.log('   Vehicles: 3 (ABC123 Car, XYZ789 Motorcycle, BICI-001 Bicycle)');
    console.log('   Consents: 5 (WhatsApp/Email with different statuses)');
    console.log('   Pricing: 1 plan, 24 tariff rules, 18 holidays (Colombia 2026)\n');
  } catch (error) {
    console.error('❌ Error during seed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seed();
