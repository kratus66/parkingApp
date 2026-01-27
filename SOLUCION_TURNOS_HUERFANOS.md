# Solución a Turnos Huérfanos

## Problema Detectado

Existe un turno en la base de datos con:
- `status = 'OPEN'`
- `openingFloat = 0` o `null`
- `expectedTotal = 0` o `null`

Esto causa que la UI muestre "Turno Actual" pero sin datos válidos.

## Solución Temporal (Manual)

Ejecuta este comando SQL para cerrar turnos huérfanos:

```sql
-- Ver turnos abiertos
SELECT id, cashier_user_id, parking_lot_id, opening_float, expected_total, opened_at, status 
FROM cash_shifts 
WHERE status = 'OPEN';

-- Cerrar turnos con datos inválidos
UPDATE cash_shifts 
SET status = 'CLOSED', 
    closed_at = NOW(),
    closing_notes = 'Cerrado automáticamente - datos inválidos'
WHERE status = 'OPEN' 
  AND (opening_float IS NULL OR opening_float = 0);
```

## Solución Permanente

### 1. Validación en Apertura de Turno

El backend ya valida que no se puedan abrir múltiples turnos según la política.

### 2. Limpieza Automática al Login

Agregar un endpoint que cierre turnos huérfanos cuando un cajero inicia sesión.

## Cómo Probar

1. **Abre la consola del navegador** (F12)
2. **Recarga la página `/cash`**
3. **Revisa el log** que dice: `Current shift loaded: {...}`
4. **Si el turno tiene datos nulos**, verás: `No valid shift found`

## Próximos Pasos

1. Ejecutar el SQL para cerrar el turno huérfano actual
2. Reiniciar el frontend (npm run dev)
3. Iniciar sesión nuevamente
4. El dashboard debería mostrar "No hay turno abierto"
5. Hacer clic en "Abrir Turno de Caja"
6. Ingresar un monto válido (ej: 50000)
7. Ahora sí debería funcionar correctamente
