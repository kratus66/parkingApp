# 🚀 Guía Rápida - Prueba del Sprint 6

## ⚡ Setup Rápido (5 minutos)

### 1. Base de Datos
```bash
cd apps/api

# Ejecutar migración
npm run migration:run

# Cargar seeds (invoice counters + sesiones de prueba)
npm run seed:run
```

### 2. Iniciar Servicios
```bash
# Terminal 1 - Backend
cd apps/api
npm run start:dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

### 3. Acceder
- Frontend: http://localhost:3000
- Swagger: http://localhost:3001/api
- Login: Usar credenciales de seeds previos

---

## 🧪 Escenarios de Prueba

### ✅ Escenario 1: Checkout Normal con Efectivo

**Objetivo**: Verificar flujo básico de salida

1. **Login** como CASHIER o ADMIN
2. Ir a `/ops/checkout`
3. En el buscador, ingresar: `TEST-CHECKOUT-001` (ticket de seed)
4. Click en "Buscar"
5. Seleccionar la sesión que aparece
6. Verificar que se muestra:
   - ✅ Datos del vehículo
   - ✅ Entrada (hace ~2 horas)
   - ✅ Salida (ahora)
   - ✅ Tiempo total
   - ✅ Total a cobrar
7. En "Registro de Pago":
   - Método: CASH
   - Monto: [copiar el total mostrado]
   - Recibido: [total + 5000] (para probar cambio)
8. Click en "Agregar Pago"
9. Verificar:
   - ✅ Item agregado a la lista
   - ✅ Cambio calculado correctamente
   - ✅ Botón "Confirmar Salida" habilitado
10. Click en "Confirmar Salida"
11. Debe mostrar:
    - ✅ Mensaje "Salida Registrada"
    - ✅ Factura HTML con todos los datos
    - ✅ Botón "Imprimir Factura"
12. Click en "Imprimir Factura"
    - ✅ Abre nueva ventana con HTML imprimible
    - ✅ Datos correctos
    - ✅ Número de factura (INV-00000001 o siguiente)

**Resultado esperado**: ✅ Checkout exitoso, factura generada, spot liberado

---

### ✅ Escenario 2: Pago Mixto (Efectivo + Tarjeta)

**Objetivo**: Verificar soporte para múltiples métodos de pago

1. Buscar sesión: `TEST-CHECKOUT-002`
2. Seleccionar sesión
3. Anotar el total a cobrar (ej: $10,000)
4. Agregar primer pago:
   - Método: CASH
   - Monto: 5000
   - Recibido: 10000
   - Click "Agregar Pago"
5. Agregar segundo pago:
   - Método: CARD
   - Monto: 5000
   - Referencia: VOUCHER-TEST-123
   - Click "Agregar Pago"
6. Verificar:
   - ✅ 2 items en la lista
   - ✅ Total pagado = Total a cobrar
   - ✅ Cambio mostrado ($5,000)
7. Click "Confirmar Salida"
8. Verificar en la factura:
   - ✅ Métodos de pago mostrados
   - ✅ Total correcto

**Resultado esperado**: ✅ Pago mixto exitoso

---

### ✅ Escenario 3: Ticket Perdido

**Objetivo**: Verificar cargo adicional

1. Crear una nueva sesión activa manualmente o usar la UI de check-in
2. Ir a `/ops/checkout`
3. Buscar la sesión
4. Antes de agregar pago:
   - ✅ Marcar checkbox "Ticket perdido"
5. Verificar:
   - ✅ Total aumenta (20% o mín $5,000)
   - ✅ Se muestra el cargo adicional
6. Completar checkout normalmente
7. Verificar en PricingSnapshot (vía Swagger o DB):
   - ✅ quote.breakdown.lostTicketFee existe

**Resultado esperado**: ✅ Cargo aplicado correctamente

---

### ✅ Escenario 4: Anulación de Factura

**Objetivo**: Verificar permisos y auditoría

1. **Login como CASHIER**
2. Ir a `/ops/invoices`
3. Seleccionar una factura ISSUED
4. Intentar anular (botón rojo)
5. Verificar:
   - ❌ Debe fallar (403 Forbidden) o botón no visible

6. **Logout y login como SUPERVISOR**
7. Ir a `/ops/invoices`
8. Seleccionar misma factura
9. Click botón "Anular"
10. Ingresar motivo: "Error en el cobro - prueba"
11. Click OK
12. Verificar:
    - ✅ Factura cambia a estado VOIDED
    - ✅ Marca roja "Anulada"
    - ✅ Motivo visible
13. Ir a Swagger → GET `/audit-logs`
14. Buscar acción: INVOICE_VOIDED
15. Verificar:
    - ✅ Registro existe
    - ✅ before y after completos
    - ✅ userId del supervisor

**Resultado esperado**: ✅ Anulación exitosa con auditoría

---

### ✅ Escenario 5: Estadísticas de Pagos

**Objetivo**: Verificar agregación de datos

1. Login como SUPERVISOR o ADMIN
2. Ir a `/ops/payments`
3. Verificar:
   - ✅ Total recaudado (suma de todos PAID)
   - ✅ Número de transacciones
   - ✅ Estadísticas por método (CASH, CARD, etc.)
4. Aplicar filtros:
   - Desde: [fecha de ayer]
   - Hasta: [fecha de hoy]
   - Estado: PAID
5. Click filtrar
6. Verificar:
   - ✅ Lista actualizada
   - ✅ Solo pagos en rango
   - ✅ Stats recalculadas
7. Via Swagger → GET `/payments/stats`
8. Verificar respuesta JSON:
   ```json
   [
     {
       "method": "CASH",
       "count": 2,
       "total": 20000
     },
     ...
   ]
   ```

**Resultado esperado**: ✅ Estadísticas correctas

---

### ✅ Escenario 6: Validación de Sumas

**Objetivo**: Verificar validaciones de negocio

1. Buscar sesión activa
2. Total a cobrar: $10,000
3. Agregar pago:
   - CASH: $8,000
4. Intentar confirmar
5. Verificar:
   - ❌ Botón deshabilitado
   - ✅ Diferencia mostrada en rojo: $2,000
6. Agregar otro pago:
   - CARD: $3,000
7. Total pagado: $11,000
8. Verificar:
   - ❌ Botón deshabilitado
   - ✅ Diferencia mostrada: $1,000 (exceso)
9. Remover pago CARD
10. Agregar pago correcto:
    - CARD: $2,000
11. Total pagado: $10,000
12. Verificar:
    - ✅ Botón habilitado
    - ✅ Diferencia = $0
13. Confirmar checkout
    - ✅ Debe funcionar

**Resultado esperado**: ✅ Validaciones funcionando

---

### ✅ Escenario 7: Cambio en Efectivo

**Objetivo**: Verificar cálculo automático

1. Buscar sesión
2. Total: $8,500
3. Agregar pago CASH:
   - Monto: 8500
   - Recibido: 10000
4. Verificar:
   - ✅ Cambio mostrado: $1,500
5. Confirmar checkout
6. En la factura, verificar:
   - ✅ Cambio registrado
7. Via Swagger → GET `/payments/{id}`
8. Verificar en items[0]:
   ```json
   {
     "method": "CASH",
     "amount": 8500,
     "receivedAmount": 10000,
     "changeAmount": 1500
   }
   ```

**Resultado esperado**: ✅ Cambio calculado y guardado

---

### ✅ Escenario 8: Tiempo Real (WebSocket)

**Objetivo**: Verificar actualización de ocupación

1. Abrir 2 pestañas del navegador
2. Pestaña 1: `/ops/checkout`
3. Pestaña 2: `/ops/occupancy` (o dashboard con ocupación)
4. En Pestaña 1:
   - Hacer checkout de una sesión
5. En Pestaña 2:
   - Verificar:
     - ✅ Ocupación disminuye automáticamente
     - ✅ Spot cambia a FREE
     - ✅ Sin refrescar página

**Resultado esperado**: ✅ WebSocket funcionando

---

### ✅ Escenario 9: HTML Imprimible

**Objetivo**: Verificar factura imprimible

1. Ir a `/ops/invoices`
2. Seleccionar cualquier factura
3. Click en icono de impresora
4. Verificar nueva ventana con:
   - ✅ Datos del parqueadero (legal)
   - ✅ Número de factura
   - ✅ Cliente y vehículo
   - ✅ Tiempos (entrada, salida, total)
   - ✅ Desglose de cobro
   - ✅ Total en grande
   - ✅ Métodos de pago
   - ✅ Botón "Imprimir" (funcional)
5. Click en botón "Imprimir"
   - ✅ Abre diálogo de impresión del navegador
   - ✅ Preview correcto
6. Cancelar impresión
7. Via Swagger → POST `/checkout/invoices/{id}/print`
8. Verificar AuditLog:
   - ✅ Acción: INVOICE_PRINTED

**Resultado esperado**: ✅ HTML imprimible funcionando

---

### ✅ Escenario 10: Búsqueda de Sesiones

**Objetivo**: Verificar búsqueda flexible

1. Ir a `/ops/checkout`
2. Probar búsquedas:
   - Por placa: `ABC123`
   - Por ticket: `TEST-CHECKOUT-001`
   - Por documento: `12345678` (si existe)
   - Por código bici: `BIKE001` (si existe)
3. Verificar:
   - ✅ Encuentra sesiones activas
   - ✅ Si hay varias, muestra lista
   - ✅ Si hay una, selecciona automáticamente
   - ✅ Si no hay, muestra "No encontrado"

**Resultado esperado**: ✅ Búsqueda flexible funcionando

---

## 🔍 Verificaciones en Base de Datos

### Después de un Checkout Exitoso

```sql
-- 1. Sesión cerrada
SELECT * FROM parking_sessions WHERE ticket_number = 'TEST-CHECKOUT-001';
-- status = 'CLOSED', exit_at NOT NULL, closed_by_user_id NOT NULL

-- 2. Spot liberado
SELECT * FROM parking_spots WHERE id = (
  SELECT spot_id FROM parking_sessions WHERE ticket_number = 'TEST-CHECKOUT-001'
);
-- status = 'FREE', current_session_id = NULL

-- 3. Payment creado
SELECT * FROM payments WHERE parking_session_id = (
  SELECT id FROM parking_sessions WHERE ticket_number = 'TEST-CHECKOUT-001'
);
-- total_amount > 0, status = 'PAID'

-- 4. Payment Items
SELECT * FROM payment_items WHERE payment_id = '[payment_id del query anterior]';
-- Debe haber 1 o más items, suma(amount) = payment.total_amount

-- 5. Invoice creada
SELECT * FROM customer_invoices WHERE parking_session_id = (
  SELECT id FROM parking_sessions WHERE ticket_number = 'TEST-CHECKOUT-001'
);
-- invoice_number NOT NULL, status = 'ISSUED', total > 0

-- 6. Invoice Items
SELECT * FROM customer_invoice_items WHERE customer_invoice_id = '[invoice_id]';
-- Al menos 1 item

-- 7. Pricing Snapshot
SELECT * FROM pricing_snapshots WHERE parking_session_id = (
  SELECT id FROM parking_sessions WHERE ticket_number = 'TEST-CHECKOUT-001'
);
-- quote (JSONB) con breakdown completo

-- 8. Audit Logs
SELECT * FROM audit_logs 
WHERE entity_id = (SELECT id FROM parking_sessions WHERE ticket_number = 'TEST-CHECKOUT-001')
ORDER BY created_at DESC;
-- Múltiples entradas: CHECKOUT_CONFIRM, SPOT_RELEASED, PAYMENT_CREATED, INVOICE_ISSUED
```

---

## 🐛 Problemas Comunes y Soluciones

### "Sesión no encontrada"
- Verificar que existan sesiones activas: `SELECT * FROM parking_sessions WHERE status = 'ACTIVE'`
- Correr seed: `npm run seed:run`
- Crear sesión manualmente vía check-in UI

### "InvoiceCounter not found"
- Correr seed: `npm run seed:run`
- O insertar manualmente:
  ```sql
  INSERT INTO invoice_counters (parking_lot_id, counter, prefix)
  SELECT id, 0, 'INV' FROM parking_lots;
  ```

### "La suma de pagos no coincide"
- Verificar que `sum(paymentItems.amount) == total`
- Revisar consola del navegador para ver el cálculo

### WebSocket no actualiza
- Verificar que el gateway esté corriendo
- Revisar conexión WebSocket en DevTools → Network → WS
- Refrescar la página

### Botón "Confirmar" deshabilitado
- Verificar que `totalPaid == total`
- Verificar que haya al menos 1 payment item
- Para CASH, verificar que `receivedAmount >= amount`

---

## 📊 Métricas de Éxito

Después de completar todos los escenarios:

- [ ] ✅ 10/10 escenarios pasados
- [ ] ✅ 0 errores en consola del navegador
- [ ] ✅ 0 errores en logs del backend
- [ ] ✅ Base de datos consistente
- [ ] ✅ AuditLog completo
- [ ] ✅ WebSocket funcionando
- [ ] ✅ HTML imprimible correcto
- [ ] ✅ Permisos funcionando por rol

---

## 🚀 Siguiente Paso

Una vez verificado todo:

1. Commit de los cambios
2. Push al repositorio
3. Documentar cualquier issue encontrado
4. Preparar demo para stakeholders
5. Iniciar Sprint 7 (Reportes Financieros)

---

**¡Sprint 6 completado y probado! 🎉**
