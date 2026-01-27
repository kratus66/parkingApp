-- ================================================
-- LIMPIEZA DE TURNOS HUÉRFANOS
-- ================================================
-- Este script identifica y cierra turnos de caja 
-- que quedaron abiertos con datos inválidos
-- ================================================

-- 1. VER TURNOS ABIERTOS ACTUALMENTE
SELECT 
  id,
  cashier_user_id,
  parking_lot_id,
  opening_float,
  expected_total,
  TO_CHAR(opened_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_apertura,
  status
FROM cash_shifts 
WHERE status = 'OPEN'
ORDER BY opened_at DESC;

-- 2. IDENTIFICAR TURNOS CON DATOS INVÁLIDOS
SELECT 
  id,
  cashier_user_id,
  opening_float,
  'Turno huérfano - monto inicial inválido' as problema
FROM cash_shifts 
WHERE status = 'OPEN' 
  AND (opening_float IS NULL OR opening_float = 0);

-- 3. CERRAR TURNOS HUÉRFANOS
-- ADVERTENCIA: Esto cerrará los turnos automáticamente
-- Descomenta las siguientes líneas para ejecutar:

/*
UPDATE cash_shifts 
SET 
  status = 'CLOSED', 
  closed_at = NOW(),
  closing_notes = 'Cerrado automáticamente - turno huérfano detectado durante limpieza de sistema',
  expected_total = COALESCE(expected_total, 0),
  counted_total = 0,
  difference = 0 - COALESCE(expected_total, 0)
WHERE status = 'OPEN' 
  AND id IN (
    SELECT id FROM cash_shifts 
    WHERE status = 'OPEN' 
      AND (opening_float IS NULL OR opening_float = 0)
  )
RETURNING 
  id, 
  cashier_user_id, 
  TO_CHAR(opened_at, 'YYYY-MM-DD HH24:MI:SS') as fue_abierto,
  TO_CHAR(closed_at, 'YYYY-MM-DD HH24:MI:SS') as cerrado_ahora;
*/

-- 4. VERIFICAR RESULTADO
SELECT 
  COUNT(*) as turnos_abiertos_validos,
  SUM(CASE WHEN opening_float > 0 THEN 1 ELSE 0 END) as con_monto_valido
FROM cash_shifts 
WHERE status = 'OPEN';

-- 5. VER ÚLTIMOS TURNOS CERRADOS
SELECT 
  id,
  cashier_user_id,
  opening_float,
  expected_total,
  TO_CHAR(closed_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_cierre,
  closing_notes
FROM cash_shifts 
WHERE status = 'CLOSED'
ORDER BY closed_at DESC
LIMIT 5;
