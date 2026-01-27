#!/bin/bash

# Script para limpiar turnos de caja huérfanos
# Uso: ./clean-orphan-shifts.sh

echo "=== Verificando turnos abiertos ==="

# Conectar a PostgreSQL (ajusta las credenciales según tu configuración)
PGPASSWORD=postgres psql -U postgres -d parking_system << EOF

-- Mostrar turnos abiertos actuales
SELECT 
  id,
  cashier_user_id,
  parking_lot_id,
  opening_float,
  expected_total,
  TO_CHAR(opened_at, 'YYYY-MM-DD HH24:MI:SS') as opened_at,
  status
FROM cash_shifts 
WHERE status = 'OPEN'
ORDER BY opened_at DESC;

-- Contar turnos con datos inválidos
SELECT COUNT(*) as turnos_invalidos
FROM cash_shifts 
WHERE status = 'OPEN' 
  AND (opening_float IS NULL OR opening_float = 0 OR opening_float < 0);

-- Cerrar turnos con datos inválidos
UPDATE cash_shifts 
SET 
  status = 'CLOSED', 
  closed_at = NOW(),
  closing_notes = 'Cerrado automáticamente - turno huérfano sin datos válidos',
  expected_total = COALESCE(expected_total, 0),
  counted_total = 0,
  difference = 0 - COALESCE(expected_total, 0)
WHERE status = 'OPEN' 
  AND (opening_float IS NULL OR opening_float = 0 OR opening_float < 0)
RETURNING id, cashier_user_id, closing_notes;

-- Mostrar turnos abiertos después de la limpieza
SELECT 
  id,
  cashier_user_id,
  parking_lot_id,
  opening_float,
  expected_total,
  status
FROM cash_shifts 
WHERE status = 'OPEN';

EOF

echo ""
echo "=== Limpieza completada ==="
echo "Reinicia el frontend y vuelve a intentar."
