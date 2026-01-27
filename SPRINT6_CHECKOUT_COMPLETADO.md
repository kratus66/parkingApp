# Sprint 6: Checkout, Pagos y Facturación ✅

## Resumen Ejecutivo

El Sprint 6 implementa el **flujo completo de salida (check-out)** para el sistema de parqueaderos, incluyendo:

- ✅ Cálculo automático de tarifas usando PricingEngine
- ✅ Registro de pagos con soporte para **pago mixto** (múltiples métodos)
- ✅ Generación de facturas/comprobantes con consecutivo
- ✅ Notificaciones de salida por WhatsApp/Email
- ✅ Liberación de puestos en tiempo real (WebSocket)
- ✅ Anulaciones con auditoría completa
- ✅ UI completa de taquilla para salida y cobro

---

## 🎯 Objetivos Alcanzados

1. **Checkout Preview**: Cálculo de tarifa sin modificar datos
2. **Checkout Confirm**: Flujo completo transaccional
3. **Pago Mixto**: Soporta múltiples métodos de pago en una transacción
4. **Facturación**: Generación de comprobantes HTML imprimibles
5. **Auditoría**: Registro completo de todas las operaciones críticas
6. **Anulaciones**: Con permisos y razón obligatoria
7. **WebSocket**: Actualización en tiempo real de ocupación

---

## 📊 Entidades Principales

### Payment
Registro del pago total de una sesión.

**Campos clave**:
- `totalAmount`: Monto total en COP
- `status`: PAID | VOIDED | REFUNDED | PARTIAL
- `createdByUserId`: Cajero que registró el pago
- `voidedByUserId`: Supervisor que anuló (si aplica)
- `voidReason`: Motivo de anulación

### PaymentItem
Items individuales de un pago (para pago mixto).

**Campos clave**:
- `method`: CASH | CARD | TRANSFER | QR | OTHER
- `amount`: Monto de este método
- `receivedAmount`: Solo para CASH - monto entregado por cliente
- `changeAmount`: Solo para CASH - cambio devuelto

**Validación**: `sum(PaymentItem.amount) == Payment.totalAmount`

### CustomerInvoice
Factura/comprobante del servicio de parqueo.

**Campos clave**:
- `invoiceNumber`: Consecutivo único (ej: INV-00000001)
- `subtotal`, `discounts`, `total`: Desglose financiero
- `status`: ISSUED | VOIDED

### PricingSnapshot
Registro del cálculo de tarifa usado en el checkout.

**Campos clave**:
- `quote`: Breakdown completo del PricingEngine (JSONB)
- `totalMinutes`: Tiempo total de estadía
- `total`: Monto final calculado

---

## 🔄 Flujo de Checkout

```
1. Usuario busca sesión activa
   ↓
2. Sistema muestra preview con cálculo
   ↓
3. Usuario registra pago(s)
   ↓
4. Sistema valida sumas
   ↓
5. Confirma checkout:
   - Crea PricingSnapshot
   - Crea Payment + PaymentItems
   - Genera CustomerInvoice
   - Cierra ParkingSession
   - Libera ParkingSpot
   - Emite eventos WebSocket
   - Envía notificaciones
   - Registra AuditLog
   ↓
6. Muestra factura imprimible
```

---

## 🔐 Permisos por Rol

| Acción | CASHIER | SUPERVISOR | ADMIN |
|--------|---------|------------|-------|
| Preview checkout | ✅ | ✅ | ✅ |
| Confirmar checkout | ✅ | ✅ | ✅ |
| Ver facturas | ✅ | ✅ | ✅ |
| Ver pagos | ✅ | ✅ | ✅ |
| Anular factura | ❌ | ✅ | ✅ |
| Anular pago | ❌ | ✅ | ✅ |
| Estadísticas pagos | ❌ | ✅ | ✅ |

---

## 💰 Pago Mixto

Permite al cliente pagar con múltiples métodos en una sola transacción.

**Ejemplo**:
```json
{
  "sessionId": "abc123",
  "paymentItems": [
    {
      "method": "CASH",
      "amount": 5000,
      "receivedAmount": 10000
    },
    {
      "method": "CARD",
      "amount": 5000,
      "reference": "VOUCHER-12345"
    }
  ]
}
```

**Validaciones**:
- ✅ Suma total debe coincidir con el monto calculado
- ✅ Para CASH: `receivedAmount >= amount`
- ✅ Cambio calculado automáticamente: `receivedAmount - amount`

---

## 🧾 Factura/Comprobante

Generada en HTML imprimible con:

- Datos del parqueadero (legal)
- Número consecutivo por parkingLot
- Cliente y vehículo
- Tiempos (entrada, salida, total)
- Desglose de cobro
- Métodos de pago utilizados
- Botón de impresión integrado

**Consecutivo**: Cada parkingLot tiene su propio contador (ej: INV-00000001, INV-00000002...)

---

## 🔌 API Endpoints

### Checkout

#### POST /checkout/preview
Calcula el monto sin realizar cambios.

**Request**:
```json
{
  "sessionId": "uuid",
  "lostTicket": false
}
```

**Response**:
```json
{
  "sessionId": "uuid",
  "ticketNumber": "TICKET-001",
  "entryAt": "2024-01-15T10:00:00Z",
  "exitAt": "2024-01-15T12:00:00Z",
  "totalMinutes": 120,
  "vehicleType": "CAR",
  "quote": { "breakdown": {...}, "total": 10000 },
  "total": 10000,
  "vehicle": {...},
  "customer": {...}
}
```

#### POST /checkout/confirm
Ejecuta el checkout completo.

**Request**:
```json
{
  "sessionId": "uuid",
  "lostTicket": false,
  "paymentItems": [
    {
      "method": "CASH",
      "amount": 10000,
      "receivedAmount": 15000
    }
  ]
}
```

**Response**:
```json
{
  "session": {...},
  "payment": {...},
  "invoice": {...},
  "snapshot": {...},
  "printableInvoiceHtml": "<html>...</html>"
}
```

### Invoices

#### GET /checkout/invoices
Lista facturas con filtros.

**Query Params**:
- `parkingLotId` (opcional)
- `from`, `to` (fechas, opcional)
- `status` (ISSUED | VOIDED, opcional)
- `search` (número, placa, documento, opcional)

#### GET /checkout/invoices/:id
Detalle completo de factura.

#### POST /checkout/invoices/:id/void
Anula factura (requiere SUPERVISOR/ADMIN).

**Request**:
```json
{
  "reason": "Error en el cobro, cliente no conforme"
}
```

#### GET /checkout/invoices/:id/html
Retorna HTML imprimible.

#### POST /checkout/invoices/:id/print
Registra log de impresión.

### Payments

#### GET /payments
Lista pagos con filtros.

#### GET /payments/:id
Detalle de pago.

#### POST /payments/:id/void
Anula pago (requiere SUPERVISOR/ADMIN).

#### GET /payments/stats
Estadísticas por método de pago.

**Response**:
```json
[
  {
    "method": "CASH",
    "count": 45,
    "total": 450000
  },
  {
    "method": "CARD",
    "count": 30,
    "total": 300000
  }
]
```

---

## 🎨 Frontend

### Página: /ops/checkout

**Funcionalidades**:
1. **Búsqueda rápida**: Por placa, ticket, documento o código bici
2. **Preview automático**: Muestra cálculo al seleccionar sesión
3. **Registro de pago**:
   - Selector de método
   - Soporte para múltiples items (pago mixto)
   - Cálculo automático de cambio para CASH
   - Validación en tiempo real
4. **Confirmación**: Ejecuta checkout completo
5. **Resultado**: Muestra factura con opción de imprimir

### Página: /ops/invoices

**Funcionalidades**:
- Lista paginada de facturas
- Filtros: estado, fecha, búsqueda
- Acciones: Ver, Imprimir, Anular

### Página: /ops/invoices/[id]

**Funcionalidades**:
- Detalle completo de factura
- Información de cliente, vehículo, tiempos
- Marca visual si está anulada
- Botones: Imprimir, Anular

### Página: /ops/payments

**Funcionalidades**:
- Estadísticas por método
- Total recaudado
- Lista de pagos con filtros
- Detalle de cada pago

---

## 🧪 Testing

### Tests Implementados

**checkout.service.spec.ts**:
- ✅ Preview calcula correctamente
- ✅ Lost ticket fee aplicado (20% o mín $5,000)
- ✅ Error si sesión no existe
- ✅ Error si sesión no activa
- ✅ Validación de sumas de pago

**invoice.service.spec.ts**:
- ✅ Genera HTML válido
- ✅ Incluye todos los datos requeridos
- ✅ Marca VOIDED en facturas anuladas
- ✅ Calcula tiempo correctamente
- ✅ Error si factura no existe

### Pruebas Manuales Recomendadas

1. **Checkout normal**:
   - Crear sesión activa
   - Hacer checkout con CASH
   - Verificar cambio calculado correctamente
   - Verificar factura generada
   - Verificar spot liberado

2. **Pago mixto**:
   - Checkout con $5000 CASH + $5000 CARD
   - Verificar 2 PaymentItems creados
   - Verificar suma correcta

3. **Lost ticket**:
   - Checkout con lostTicket=true
   - Verificar cargo adicional
   - Verificar en PricingSnapshot

4. **Anulación**:
   - Como SUPERVISOR, anular factura
   - Verificar motivo requerido
   - Verificar AuditLog

5. **Permisos**:
   - Como CASHIER, intentar anular (debe fallar)
   - Como SUPERVISOR, anular (debe funcionar)

---

## 📦 Migraciones

### 1737471600000-CreateCheckoutTables.ts

Crea:
- `payments`
- `payment_items`
- `customer_invoices`
- `customer_invoice_items`
- `pricing_snapshots`
- `invoice_counters`
- `refunds`

Con índices optimizados y foreign keys.

### Seed: 1737472000000-SeedCheckoutData.ts

- Inicializa `invoice_counters` para todos los parkingLots
- Crea 2 sesiones activas de prueba

---

## 🔍 Auditoría

Todas las acciones críticas registran en `audit_logs`:

| Acción | entityType | before | after |
|--------|------------|--------|-------|
| CHECKOUT_CONFIRM | ParkingSession | session antigua | session cerrada |
| SPOT_RELEASED | ParkingSpot | spot ocupado | spot libre |
| PAYMENT_CREATED | Payment | null | payment creado |
| INVOICE_ISSUED | CustomerInvoice | null | invoice creada |
| PAYMENT_VOIDED | Payment | payment original | payment anulado |
| INVOICE_VOIDED | CustomerInvoice | invoice original | invoice anulada |
| INVOICE_PRINTED | CustomerInvoice | null | {invoiceNumber, printedAt} |

---

## 🚀 Instalación y Uso

### 1. Correr Migraciones

```bash
cd apps/api
npm run migration:run
```

### 2. Correr Seeds

```bash
npm run seed:run
```

### 3. Iniciar Backend

```bash
npm run start:dev
```

### 4. Iniciar Frontend

```bash
cd apps/web
npm run dev
```

### 5. Acceder a Checkout

```
http://localhost:3000/ops/checkout
```

### 6. Swagger Docs

```
http://localhost:3001/api
```

---

## 🐛 Troubleshooting

### Error: "La suma de pagos no coincide"
- Verificar que `sum(paymentItems.amount) == total calculado`
- Revisar consola del navegador

### Error: "Monto recibido debe ser mayor"
- Para CASH, `receivedAmount >= amount`
- Asegurar que el campo esté lleno

### Factura no se genera
- Verificar que `InvoiceCounter` existe para el parkingLot
- Correr seed si es necesario

### Spot no se libera
- Verificar que el WebSocket esté conectado
- Revisar logs del OccupancyGateway

---

## 📈 Próximos Pasos (Sprint 7)

- Reportes financieros avanzados
- Dashboard de ingresos (diario, semanal, mensual)
- Exportación a Excel/PDF
- Gráficos de métodos de pago
- Flujos de caja y conciliación
- Integración con pasarelas de pago reales

---

## 📝 Notas Técnicas

### Dinero en COP
Todos los montos se manejan como **enteros** representando pesos colombianos (no centavos).

**Ejemplo**: `10000` = $10,000 COP

### Multi-tenant
Todo filtrado por `companyId` + `parkingLotId` para asegurar aislamiento de datos.

### Transacciones
El método `confirm` usa transacción de TypeORM para garantizar atomicidad (todo o nada).

### Lost Ticket Fee
Cargo adicional = `max(5000, total * 0.20)`

### Consecutivo de Facturas
Formato: `{prefix}-{counter}` (ej: INV-00000001)

Incrementa automáticamente por parkingLot.

---

## ✅ Checklist de Verificación

- [x] Migraciones ejecutadas correctamente
- [x] Seeds cargados (invoice_counters + sesiones de prueba)
- [x] Módulos registrados en AppModule
- [x] Endpoints documentados en Swagger
- [x] Frontend compilando sin errores
- [x] Tests pasando
- [x] Permisos funcionando por rol
- [x] WebSocket actualizando ocupación
- [x] Notificaciones registradas en logs
- [x] AuditLog registrando todas las acciones
- [x] HTML de factura imprimible funcionando

---

**Desarrollado por**: Sistema de Parqueaderos - Sprint 6  
**Fecha**: Enero 2026  
**Estado**: ✅ **COMPLETADO**
