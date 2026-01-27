-- Sprint 5: Motor de Tarifas - Seed Data
-- Este script inserta datos iniciales de pricing en la base de datos

DO $$ 
DECLARE
  v_company_id UUID;
  v_parking_lot_id UUID;
  v_tariff_plan_id UUID;
  v_pricing_config_id UUID;
BEGIN
  -- Obtener IDs existentes
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  SELECT id INTO v_parking_lot_id FROM parking_lots LIMIT 1;

  -- 1. Crear configuración de pricing
  INSERT INTO pricing_config (company_id, parking_lot_id, default_grace_minutes, default_daily_max, lost_ticket_fee, enable_dynamic_pricing)
  VALUES (v_company_id, v_parking_lot_id, 15, 50000, 20000, false)
  ON CONFLICT (parking_lot_id) DO NOTHING
  RETURNING id INTO v_pricing_config_id;

  RAISE NOTICE '✅ Pricing config created';

  -- 2. Crear plan de tarifas
  INSERT INTO tariff_plans (company_id, parking_lot_id, name, is_active, timezone)
  VALUES (v_company_id, v_parking_lot_id, 'Tarifa Base 2026', true, 'America/Bogota')
  RETURNING id INTO v_tariff_plan_id;

  RAISE NOTICE '✅ Tariff plan created: %', v_tariff_plan_id;

  -- 3. Crear reglas de tarifas (24 combinaciones)
  -- BICYCLE - WEEKDAY DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'BICYCLE', 'WEEKDAY', 'DAY', '06:00', '19:00', 'HOUR', 1000, 500, 50000, 15, 'CEIL', true);

  -- BICYCLE - WEEKDAY NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'BICYCLE', 'WEEKDAY', 'NIGHT', '19:00', '06:00', 'HOUR', 1200, 600, 50000, 15, 'CEIL', true);

  -- BICYCLE - WEEKEND DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'BICYCLE', 'WEEKEND', 'DAY', '06:00', '19:00', 'HOUR', 1000, 500, 50000, 15, 'CEIL', true);

  -- BICYCLE - WEEKEND NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'BICYCLE', 'WEEKEND', 'NIGHT', '19:00', '06:00', 'HOUR', 1200, 600, 50000, 15, 'CEIL', true);

  -- BICYCLE - HOLIDAY DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'BICYCLE', 'HOLIDAY', 'DAY', '06:00', '19:00', 'HOUR', 1300, 650, 50000, 15, 'CEIL', true);

  -- BICYCLE - HOLIDAY NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'BICYCLE', 'HOLIDAY', 'NIGHT', '19:00', '06:00', 'HOUR', 1300, 650, 50000, 15, 'CEIL', true);

  -- MOTORCYCLE - WEEKDAY DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'MOTORCYCLE', 'WEEKDAY', 'DAY', '06:00', '19:00', 'HOUR', 2000, 1000, 50000, 15, 'CEIL', true);

  -- MOTORCYCLE - WEEKDAY NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'MOTORCYCLE', 'WEEKDAY', 'NIGHT', '19:00', '06:00', 'HOUR', 2400, 1200, 50000, 15, 'CEIL', true);

  -- MOTORCYCLE - WEEKEND DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'MOTORCYCLE', 'WEEKEND', 'DAY', '06:00', '19:00', 'HOUR', 2000, 1000, 50000, 15, 'CEIL', true);

  -- MOTORCYCLE - WEEKEND NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'MOTORCYCLE', 'WEEKEND', 'NIGHT', '19:00', '06:00', 'HOUR', 2400, 1200, 50000, 15, 'CEIL', true);

  -- MOTORCYCLE - HOLIDAY DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'MOTORCYCLE', 'HOLIDAY', 'DAY', '06:00', '19:00', 'HOUR', 2600, 1300, 50000, 15, 'CEIL', true);

  -- MOTORCYCLE - HOLIDAY NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'MOTORCYCLE', 'HOLIDAY', 'NIGHT', '19:00', '06:00', 'HOUR', 2600, 1300, 50000, 15, 'CEIL', true);

  -- CAR - WEEKDAY DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'CAR', 'WEEKDAY', 'DAY', '06:00', '19:00', 'HOUR', 3000, 1500, 50000, 15, 'CEIL', true);

  -- CAR - WEEKDAY NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'CAR', 'WEEKDAY', 'NIGHT', '19:00', '06:00', 'HOUR', 3600, 1800, 50000, 15, 'CEIL', true);

  -- CAR - WEEKEND DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'CAR', 'WEEKEND', 'DAY', '06:00', '19:00', 'HOUR', 3000, 1500, 50000, 15, 'CEIL', true);

  -- CAR - WEEKEND NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'CAR', 'WEEKEND', 'NIGHT', '19:00', '06:00', 'HOUR', 3600, 1800, 50000, 15, 'CEIL', true);

  -- CAR - HOLIDAY DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'CAR', 'HOLIDAY', 'DAY', '06:00', '19:00', 'HOUR', 3900, 1950, 50000, 15, 'CEIL', true);

  -- CAR - HOLIDAY NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'CAR', 'HOLIDAY', 'NIGHT', '19:00', '06:00', 'HOUR', 3900, 1950, 50000, 15, 'CEIL', true);

  -- TRUCK_BUS - WEEKDAY DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'TRUCK_BUS', 'WEEKDAY', 'DAY', '06:00', '19:00', 'HOUR', 5000, 2500, 50000, 15, 'CEIL', true);

  -- TRUCK_BUS - WEEKDAY NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'TRUCK_BUS', 'WEEKDAY', 'NIGHT', '19:00', '06:00', 'HOUR', 6000, 3000, 50000, 15, 'CEIL', true);

  -- TRUCK_BUS - WEEKEND DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'TRUCK_BUS', 'WEEKEND', 'DAY', '06:00', '19:00', 'HOUR', 5000, 2500, 50000, 15, 'CEIL', true);

  -- TRUCK_BUS - WEEKEND NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'TRUCK_BUS', 'WEEKEND', 'NIGHT', '19:00', '06:00', 'HOUR', 6000, 3000, 50000, 15, 'CEIL', true);

  -- TRUCK_BUS - HOLIDAY DAY
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'TRUCK_BUS', 'HOLIDAY', 'DAY', '06:00', '19:00', 'HOUR', 6500, 3250, 50000, 15, 'CEIL', true);

  -- TRUCK_BUS - HOLIDAY NIGHT
  INSERT INTO tariff_rules (company_id, parking_lot_id, tariff_plan_id, vehicle_type, day_type, period, start_time, end_time, billing_unit, unit_price, minimum_charge, daily_max, grace_minutes, rounding, is_active)
  VALUES (v_company_id, v_parking_lot_id, v_tariff_plan_id, 'TRUCK_BUS', 'HOLIDAY', 'NIGHT', '19:00', '06:00', 'HOUR', 6500, 3250, 50000, 15, 'CEIL', true);

  RAISE NOTICE '✅ Created 24 tariff rules';

  -- 4. Insertar festivos de Colombia 2026
  INSERT INTO holidays (country, date, name) VALUES
    ('CO', '2026-01-01', 'Año Nuevo'),
    ('CO', '2026-01-12', 'Día de los Reyes Magos'),
    ('CO', '2026-03-23', 'Día de San José'),
    ('CO', '2026-04-02', 'Jueves Santo'),
    ('CO', '2026-04-03', 'Viernes Santo'),
    ('CO', '2026-05-01', 'Día del Trabajo'),
    ('CO', '2026-05-18', 'Ascensión del Señor'),
    ('CO', '2026-06-08', 'Corpus Christi'),
    ('CO', '2026-06-15', 'Sagrado Corazón de Jesús'),
    ('CO', '2026-06-29', 'San Pedro y San Pablo'),
    ('CO', '2026-07-20', 'Día de la Independencia'),
    ('CO', '2026-08-07', 'Batalla de Boyacá'),
    ('CO', '2026-08-17', 'Asunción de la Virgen'),
    ('CO', '2026-10-12', 'Día de la Raza'),
    ('CO', '2026-11-02', 'Día de Todos los Santos'),
    ('CO', '2026-11-16', 'Independencia de Cartagena'),
    ('CO', '2026-12-08', 'Inmaculada Concepción'),
    ('CO', '2026-12-25', 'Navidad')
  ON CONFLICT (country, date) DO NOTHING;

  RAISE NOTICE '✅ Created 18 holidays for Colombia 2026';
  RAISE NOTICE '🎉 Sprint 5 seed completed successfully!';

END $$;
