-- Insertar zonas de ejemplo si no existen
INSERT INTO parking_zone (id, company_id, parking_lot_id, name, description, allowed_vehicle_types, is_active, created_at, updated_at)
VALUES 
  ('a1b2c3d4-e5f6-4789-a012-345678901234', '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'Zona A', 'Zona principal para autos', ARRAY['CAR'], true, NOW(), NOW()),
  ('b2c3d4e5-f6a7-4890-b123-456789012345', '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'Zona B', 'Zona para motos', ARRAY['MOTORCYCLE'], true, NOW(), NOW()),
  ('c3d4e5f6-a7b8-4901-c234-567890123456', '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'Zona C', 'Zona mixta', ARRAY['CAR','MOTORCYCLE'], true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insertar puestos de ejemplo
INSERT INTO parking_spot (id, company_id, parking_lot_id, zone_id, code, spot_type, status, priority, notes, created_at, updated_at)
VALUES
  -- Zona A - Autos
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-01', 'CAR', 'FREE', 1, 'Cerca de la entrada', NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-02', 'CAR', 'FREE', 1, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-03', 'CAR', 'OCCUPIED', 1, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-04', 'CAR', 'FREE', 1, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-05', 'CAR', 'FREE', 1, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-06', 'CAR', 'RESERVED', 1, 'Reservado VIP', NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-07', 'CAR', 'FREE', 1, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-08', 'CAR', 'FREE', 1, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-09', 'CAR', 'OUT_OF_SERVICE', 1, 'En mantenimiento', NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'A-10', 'CAR', 'FREE', 1, NULL, NOW(), NOW()),
  -- Zona B - Motos
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'b2c3d4e5-f6a7-4890-b123-456789012345', 'B-01', 'MOTORCYCLE', 'FREE', 2, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'b2c3d4e5-f6a7-4890-b123-456789012345', 'B-02', 'MOTORCYCLE', 'OCCUPIED', 2, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'b2c3d4e5-f6a7-4890-b123-456789012345', 'B-03', 'MOTORCYCLE', 'FREE', 2, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'b2c3d4e5-f6a7-4890-b123-456789012345', 'B-04', 'MOTORCYCLE', 'FREE', 2, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'b2c3d4e5-f6a7-4890-b123-456789012345', 'B-05', 'MOTORCYCLE', 'FREE', 2, NULL, NOW(), NOW()),
  -- Zona C - Mixta
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'c3d4e5f6-a7b8-4901-c234-567890123456', 'C-01', 'CAR', 'FREE', 3, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'c3d4e5f6-a7b8-4901-c234-567890123456', 'C-02', 'CAR', 'OCCUPIED', 3, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'c3d4e5f6-a7b8-4901-c234-567890123456', 'C-03', 'MOTORCYCLE', 'FREE', 3, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'c3d4e5f6-a7b8-4901-c234-567890123456', 'C-04', 'CAR', 'FREE', 3, NULL, NOW(), NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'b04f6eec-264b-4143-9b71-814b05d4ffc4', 'c3d4e5f6-a7b8-4901-c234-567890123456', 'C-05', 'MOTORCYCLE', 'FREE', 3, NULL, NOW(), NOW());
