# Roadmap de Sprints 🗺️

Este documento define la planificación de sprints para construir el sistema completo de gestión de parqueaderos.

## ✅ Sprint 0: Infraestructura Base (COMPLETADO)

**Objetivo**: Establecer la base sólida del proyecto con autenticación, roles y auditoría.

### Entregables
- [x] Monorepo configurado (backend + frontend)
- [x] Backend NestJS con TypeORM + PostgreSQL
- [x] Frontend Next.js con TailwindCSS
- [x] Docker Compose (Postgres + pgAdmin)
- [x] Sistema de autenticación JWT
- [x] Roles: Admin, Supervisor, Cajero
- [x] Sistema de auditoría automática
- [x] Entidades base: Company, ParkingLot, User, AuditLog
- [x] Migraciones y seeds
- [x] Swagger configurado
- [x] Login funcional en frontend
- [x] Dashboard básico
- [x] Documentación completa

**Duración estimada**: 1-2 semanas

---

## 🔜 Sprint 1: Gestión de Vehículos y Tickets

**Objetivo**: Implementar el core del negocio: registro de vehículos y emisión de tickets de entrada/salida.

### Entidades a crear

#### Vehicle
```typescript
{
  id: uuid
  companyId: uuid
  licensePlate: string (unique per company)
  vehicleType: MOTO | CARRO | CAMIONETA | OTRO
  brand: string (nullable)
  model: string (nullable)
  color: string (nullable)
  observations: string (nullable)
  isBlacklisted: boolean
  blacklistReason: string (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Ticket
```typescript
{
  id: uuid
  ticketNumber: string (auto-incremental por parqueadero)
  companyId: uuid
  parkingLotId: uuid
  vehicleId: uuid
  entryUserId: uuid
  exitUserId: uuid (nullable)
  entryTime: timestamp
  exitTime: timestamp (nullable)
  vehicleType: MOTO | CARRO | CAMIONETA | OTRO
  licensePlate: string
  observations: string (nullable)
  status: ACTIVE | PAID | CANCELLED
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Backend - Módulos

#### vehicles
- `POST /vehicles` - Registrar vehículo (Supervisor, Cajero)
- `GET /vehicles` - Listar vehículos (con paginación y búsqueda)
- `GET /vehicles/:id` - Ver vehículo
- `PATCH /vehicles/:id` - Actualizar vehículo
- `PATCH /vehicles/:id/blacklist` - Marcar/desmarcar lista negra

#### tickets
- `POST /tickets/entry` - Registrar entrada (Cajero)
- `POST /tickets/:id/exit` - Registrar salida (Cajero)
- `GET /tickets` - Listar tickets (con filtros: fecha, estado, vehículo)
- `GET /tickets/:id` - Ver ticket
- `GET /tickets/active` - Ver tickets activos (vehículos dentro)
- `PATCH /tickets/:id/cancel` - Anular ticket (Supervisor)

### Frontend - Pantallas

- `/vehicles` - Lista de vehículos con búsqueda
- `/vehicles/new` - Registrar vehículo
- `/vehicles/:id` - Ver/editar vehículo
- `/tickets` - Lista de tickets
- `/tickets/entry` - Registrar entrada (formulario rápido)
- `/tickets/exit` - Buscar y registrar salida
- `/tickets/active` - Tablero de vehículos activos

### Lógica de negocio

- Auto-completar datos de vehículo si ya existe
- Generar número de ticket auto-incremental
- Validar que vehículo no esté en lista negra
- Calcular tiempo de permanencia
- No permitir entrada si vehículo ya tiene ticket activo

**Duración estimada**: 2 semanas

---

## Sprint 2: Tarifas y Facturación

**Objetivo**: Sistema de tarifas configurable y cálculo automático de cobros.

### Entidades a crear

#### PriceRate
```typescript
{
  id: uuid
  parkingLotId: uuid
  vehicleType: MOTO | CARRO | CAMIONETA | OTRO
  name: string (ej: "Tarifa Hora", "Tarifa Noche")
  rateType: HOURLY | DAILY | FLAT
  basePrice: decimal
  extraHourPrice: decimal (nullable)
  maxDailyPrice: decimal (nullable)
  validFrom: time (nullable)
  validTo: time (nullable)
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Payment
```typescript
{
  id: uuid
  ticketId: uuid
  companyId: uuid
  parkingLotId: uuid
  userId: uuid
  amount: decimal
  paymentMethod: CASH | CARD | TRANSFER | OTHER
  paidAt: timestamp
  createdAt: timestamp
}
```

### Backend - Módulos

#### price-rates
- `POST /price-rates` - Crear tarifa (Supervisor)
- `GET /price-rates` - Listar tarifas
- `PATCH /price-rates/:id` - Actualizar tarifa
- `DELETE /price-rates/:id` - Desactivar tarifa

#### payments
- `POST /payments` - Registrar pago (Cajero)
- `GET /payments` - Listar pagos (con filtros)
- `GET /payments/summary` - Resumen de caja (día, rango)

### Frontend - Pantallas

- `/settings/rates` - Configuración de tarifas
- `/tickets/:id/payment` - Pantalla de cobro
- `/cash-register` - Caja del día
- `/cash-register/close` - Cierre de caja

### Lógica de negocio

- Calcular precio según tiempo de permanencia
- Aplicar tarifa correcta según horario
- Soportar descuentos/ajustes manuales (Supervisor)
- Generar recibo imprimible

**Duración estimada**: 2 semanas

---

## Sprint 3: Reportes y Estadísticas

**Objetivo**: Dashboards y reportes para toma de decisiones.

### Backend - Módulos

#### reports
- `GET /reports/daily` - Reporte diario
- `GET /reports/monthly` - Reporte mensual
- `GET /reports/revenue` - Ingresos por período
- `GET /reports/occupancy` - Ocupación por período
- `GET /reports/vehicles-frequency` - Vehículos frecuentes

### Frontend - Pantallas

- `/reports` - Centro de reportes
- `/reports/daily` - Reporte del día
- `/reports/revenue` - Gráficas de ingresos
- `/reports/occupancy` - Ocupación histórica
- `/analytics` - Dashboard con KPIs

### KPIs a implementar

- Ingresos del día/mes
- Ocupación promedio
- Tiempo promedio de permanencia
- Top 10 vehículos frecuentes
- Horas pico
- Ingresos por tipo de vehículo

**Duración estimada**: 2 semanas

---

---

## ✅ Sprint 3: Gestión de PUESTOS, ZONAS y OCUPACIÓN EN TIEMPO REAL (COMPLETADO)

**Objetivo**: Implementar la gestión completa de puestos de estacionamiento, zonas, capacidad por tipo de vehículo y ocupación en tiempo real con WebSockets.

### Entidades creadas

#### ParkingZone
```typescript
{
  id: uuid
  companyId: uuid
  parkingLotId: uuid
  name: string (unique por parkingLot)
  description: string (nullable)
  allowedVehicleTypes: VehicleType[] (enum array)
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### ParkingSpot
```typescript
{
  id: uuid
  companyId: uuid
  parkingLotId: uuid
  zoneId: uuid
  code: string (unique por parkingLot, ej: "A-01")
  spotType: VehicleType (BICYCLE | MOTORCYCLE | CAR | TRUCK_BUS)
  status: SpotStatus (FREE | OCCUPIED | RESERVED | OUT_OF_SERVICE)
  priority: integer (para asignación automática)
  notes: string (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### SpotStatusHistory
```typescript
{
  id: uuid
  companyId: uuid
  parkingLotId: uuid
  spotId: uuid
  fromStatus: SpotStatus
  toStatus: SpotStatus
  reason: string (nullable)
  actorUserId: uuid
  createdAt: timestamp
}
```

### Enums
- **VehicleType**: BICYCLE, MOTORCYCLE, CAR, TRUCK_BUS
- **SpotStatus**: FREE, OCCUPIED, RESERVED, OUT_OF_SERVICE

### Backend - Módulos

#### parking-zones
- `GET /zones` - Buscar zonas con filtros (parkingLotId, search) y paginación
- `GET /zones/:id` - Obtener zona por ID
- `POST /zones` - Crear zona (SUPERVISOR, ADMIN)
- `PATCH /zones/:id` - Actualizar zona (SUPERVISOR, ADMIN)
- `DELETE /zones/:id` - Soft delete de zona (SUPERVISOR, ADMIN)

#### parking-spots
- `GET /spots` - Buscar puestos con filtros (parkingLotId, zoneId, status, spotType) y paginación
- `GET /spots/:id` - Obtener puesto por ID
- `POST /spots` - Crear puesto (SUPERVISOR, ADMIN)
  - Valida que el tipo de vehículo esté permitido en la zona
  - Valida código único por parqueadero
- `PATCH /spots/:id` - Actualizar puesto (SUPERVISOR, ADMIN)
- `DELETE /spots/:id` - Eliminar puesto (no permite eliminar ocupados)
- `POST /spots/:id/status` - Cambiar estado del puesto (SUPERVISOR, ADMIN)
  - Registra en SpotStatusHistory
- `GET /spots/:id/history` - Obtener historial de cambios de estado

#### occupancy
- `GET /occupancy/summary` - Resumen de ocupación con breakdown:
  - Total, libre, ocupado, reservado, fuera de servicio
  - Por tipo de vehículo (BICYCLE, MOTORCYCLE, CAR, TRUCK_BUS)
  - Por zona
- `GET /occupancy/available` - Obtener puestos disponibles por tipo de vehículo
- `POST /occupancy/assign` - Asignar automáticamente un puesto disponible (CASHIER, SUPERVISOR, ADMIN)
  - Usa bloqueo pesimista (pessimistic_write) para evitar race conditions
  - Selecciona por prioridad y código
  - Registra en SpotStatusHistory
- `POST /occupancy/release/:spotId` - Liberar un puesto ocupado

#### realtime (WebSocket Gateway)
- **Namespace**: `/realtime`
- **Autenticación**: JWT en handshake
- **Eventos del cliente**:
  - `joinParkingLot` - Unirse a sala de parqueadero
  - `leaveParkingLot` - Salir de sala de parqueadero
- **Eventos del servidor**:
  - `spotUpdated` - Puesto actualizado
  - `occupancyUpdated` - Resumen de ocupación actualizado
  - `spotStatusChanged` - Estado de puesto cambiado

### Lógica de negocio

#### Validaciones
- El tipo de vehículo del puesto debe estar permitido en la zona
- No se puede cambiar el estado de un puesto a su mismo estado actual
- No se puede eliminar un puesto ocupado
- Códigos de puesto únicos por parqueadero
- Nombres de zona únicos por parqueadero

#### Asignación automática
1. Filtra puestos FREE del tipo de vehículo solicitado
2. Ordena por prioridad DESC, luego código ASC
3. Usa bloqueo pesimista para evitar asignación doble
4. Cambia estado a OCCUPIED
5. Registra en historial
6. Emite evento WebSocket

#### Auditoría
- Todas las operaciones CUD registran en AuditLog con metadata:
  - CREATE: parkingLotId, zoneId, code, spotType
  - UPDATE: before/after para zones, action específica para spots
  - DELETE: code, spotType, zoneId
  - STATUS_CHANGE: fromStatus, toStatus, reason

### Frontend - Pantallas (Pendiente)

- `/zones` - CRUD de zonas con listado y formularios
- `/spots` - CRUD de puestos con filtros avanzados
- `/occupancy` - Tablero operativo en tiempo real con:
  - Resumen general (total, libre, ocupado)
  - Breakdown por tipo de vehículo
  - Breakdown por zona
  - Actualización automática vía WebSocket
  - Botón de asignación automática
  - Estados visuales de puestos

### Migraciones
- `1705300000000-Sprint3ParkingZonesSpots.ts`:
  - Crea enums: vehicle_type_enum, spot_status_enum
  - Crea 3 tablas: parking_zones, parking_spots, spot_status_history
  - 14 índices para optimización de queries
  - Foreign keys con CASCADE delete

### Seeds
- `sprint3-zones-spots.seed.ts`:
  - 4 zonas: Autos (25 puestos), Motos (15), Camiones/Buses (10), Bicicletas (5)
  - Total: 55 puestos
  - Estados aleatorios: 30% ocupados, 5% fuera de servicio, 2% reservados
  - Prioridad para primeros 10 puestos de cada zona

### Permisos por rol
- **CASHIER**: Lectura de zones/spots, asignación y liberación de puestos
- **SUPERVISOR**: CRUD completo de zones/spots, cambio de estado
- **ADMIN**: Acceso completo

### WebSocket - Integración
- OccupancyService emite eventos en assignSpot() y releaseSpot()
- Eventos incluyen: spot actualizado + resumen de ocupación
- Clientes se suscriben a sala `parkingLot:{id}`
- Autenticación JWT obligatoria

**Duración real**: Backend completado (2-3 horas)

**Pendiente**:
- Frontend (pantallas Next.js con WebSocket client)
- Tests unitarios y e2e
- Ejecutar migración en base de datos
- Ejecutar seed de datos de prueba

---

## Sprint 4: Reservas y Mensualidades

**Objetivo**: Sistema de reservas y clientes con plan mensual.

### Entidades a crear

#### MonthlyClient
```typescript
{
  id: uuid
  companyId: uuid
  parkingLotId: uuid
  vehicleId: uuid
  fullName: string
  phone: string
  email: string
  monthlyFee: decimal
  startDate: date
  endDate: date (nullable)
  isActive: boolean
  createdAt: timestamp
}
```

#### Reservation
```typescript
{
  id: uuid
  parkingLotId: uuid
  vehicleId: uuid
  reservedBy: string
  reservedFrom: timestamp
  reservedTo: timestamp
  status: PENDING | CONFIRMED | CANCELLED
  createdAt: timestamp
}
```

### Funcionalidades

- Gestión de clientes mensuales
- Verificación automática en entrada
- Alertas de vencimiento
- Reservas para eventos
- Límite de capacidad

**Duración estimada**: 1-2 semanas

---

## Sprint 5: Notificaciones y Alertas

**Objetivo**: Sistema de notificaciones en tiempo real.

### Funcionalidades

- Alertas de capacidad máxima
- Notificación de vehículo en lista negra
- Alertas de vencimiento de mensualidad
- Notificaciones de cierre de caja
- Email/SMS de recordatorio

### Tecnologías

- WebSockets (Socket.io)
- Queue system (Bull/BullMQ)
- Email service (NodeMailer)
- SMS gateway (Twilio/similar)

**Duración estimada**: 1-2 semanas

---

## Sprint 6: Gestión de Usuarios Avanzada

**Objetivo**: Administración completa de usuarios y permisos.

### Funcionalidades

- CRUD completo de usuarios (Admin)
- Asignación de parqueadero(s)
- Activar/desactivar usuarios
- Historial de sesiones
- Logs de actividad por usuario
- Permisos granulares (futuro)

**Duración estimada**: 1 semana

---

## Sprint 7: Configuración Multi-parqueadero

**Objetivo**: Facilitar la gestión de múltiples parqueaderos.

### Funcionalidades

- CRUD de parqueaderos
- Configuración individual (horarios, capacidad)
- Transferencia de vehículos entre sedes
- Dashboard consolidado multi-sede
- Reportes comparativos

**Duración estimada**: 1-2 semanas

---

## Sprint 8: Impresión y Documentación

**Objetivo**: Sistema de impresión de tickets y documentos.

### Funcionalidades

- Ticket de entrada con QR
- Ticket de salida con desglose
- Recibo de pago
- Cierre de caja imprimible
- Reportes exportables (PDF, Excel)
- Configuración de impresora térmica

**Duración estimada**: 1 semana

---

## Sprint 9: Optimizaciones y Performance

**Objetivo**: Mejorar rendimiento y escalabilidad.

### Tareas

- Índices de base de datos optimizados
- Caché (Redis)
- Paginación en todos los listados
- Optimización de queries
- Lazy loading en frontend
- Code splitting
- Service Worker para PWA

**Duración estimada**: 1-2 semanas

---

## Sprint 10: Testing y QA

**Objetivo**: Garantizar calidad y estabilidad.

### Tareas

- Tests unitarios backend (>80% coverage)
- Tests e2e backend
- Tests de componentes frontend
- Tests e2e frontend (Playwright)
- Performance testing
- Security audit
- Documentación de APIs actualizada

**Duración estimada**: 2 semanas

---

---

## ✅ Sprint 6: Checkout, Pagos y Facturación (COMPLETADO)

**Objetivo**: Implementar el flujo completo de salida (check-out) con cálculo de tarifa, registro de pagos (incluyendo pago mixto), generación de facturas/comprobantes y notificaciones.

### Entidades Creadas

#### Payment
```typescript
{
  id: uuid
  companyId: uuid
  parkingLotId: uuid
  parkingSessionId: uuid
  customerId: uuid (nullable)
  totalAmount: int (COP)
  status: PAID | VOIDED | REFUNDED | PARTIAL
  createdByUserId: uuid
  voidedByUserId: uuid (nullable)
  voidReason: text (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### PaymentItem
```typescript
{
  id: uuid
  paymentId: uuid
  method: CASH | CARD | TRANSFER | QR | OTHER
  amount: int (COP)
  reference: string (nullable) // voucher, transacción
  receivedAmount: int (nullable) // solo CASH
  changeAmount: int (nullable) // solo CASH: change devuelto
  createdAt: timestamp
}
```

**Validación**: suma(PaymentItem.amount) == Payment.totalAmount

#### CustomerInvoice
```typescript
{
  id: uuid
  companyId: uuid
  parkingLotId: uuid
  parkingSessionId: uuid
  customerId: uuid (nullable)
  invoiceNumber: string (consecutivo por parkingLot)
  issuedAt: timestamp
  subtotal: int (COP)
  discounts: int (default 0)
  total: int (COP)
  currency: string (default 'COP')
  status: ISSUED | VOIDED
  voidedByUserId: uuid (nullable)
  voidReason: text (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### CustomerInvoiceItem
```typescript
{
  id: uuid
  customerInvoiceId: uuid
  description: string
  quantity: int (default 1)
  unitPrice: int (COP)
  total: int (COP)
}
```

#### PricingSnapshot
```typescript
{
  id: uuid
  companyId: uuid
  parkingLotId: uuid
  parkingSessionId: uuid
  entryAt: timestamp
  exitAt: timestamp
  vehicleType: string
  totalMinutes: int
  quote: jsonb // breakdown completo del PricingEngine
  total: int (COP)
  createdAt: timestamp
}
```

#### InvoiceCounter
```typescript
{
  id: uuid
  parkingLotId: uuid (unique)
  counter: int (default 0)
  prefix: string (default 'INV')
  updatedAt: timestamp
}
```

#### Refund (opcional mínimo)
```typescript
{
  id: uuid
  paymentId: uuid
  amount: int (COP)
  method: PaymentMethod
  reason: text
  createdByUserId: uuid
  createdAt: timestamp
}
```

### Reglas de Negocio

**Flujo de Checkout (confirm)**:
1. Validar sesión activa
2. Calcular total usando PricingEngine (entryAt → exitAt)
3. Aplicar cargo por ticket perdido si aplica (20% o mín $5,000)
4. Validar suma de paymentItems == total
5. Validar CASH: receivedAmount >= amount
6. Crear PricingSnapshot
7. Crear Payment + PaymentItems (calcular change automático)
8. Generar CustomerInvoice con consecutivo por parkingLot
9. Cerrar ParkingSession (status CLOSED, exitAt)
10. Liberar ParkingSpot (status FREE)
11. Emitir eventos WebSocket (spotUpdated, occupancyUpdated)
12. Enviar notificaciones (salida + factura) según consentimiento
13. Registrar AuditLog para todas las acciones críticas

**Anulación (VOID)**:
- Solo SUPERVISOR/ADMIN pueden anular pagos/facturas
- Requiere `reason` obligatorio
- Cambia status a VOIDED
- No reabre sesión automáticamente
- Registra en AuditLog

**Pago Mixto**:
- Permitir múltiples PaymentItems con diferentes métodos
- Suma total debe coincidir exactamente
- Para CASH: calcular cambio = receivedAmount - amount

### Endpoints

**Tag: Checkout**
- `POST /checkout/preview` - Calcula total sin cerrar sesión
- `POST /checkout/confirm` - Ejecuta checkout completo
- `GET /checkout/invoices` - Lista facturas con filtros
- `GET /checkout/invoices/:id` - Detalle de factura
- `POST /checkout/invoices/:id/void` - Anular factura (Supervisor/Admin)
- `POST /checkout/invoices/:id/print` - Log de impresión
- `GET /checkout/invoices/:id/html` - HTML imprimible

**Tag: Payments**
- `GET /payments` - Lista pagos con filtros
- `GET /payments/:id` - Detalle de pago
- `POST /payments/:id/void` - Anular pago (Supervisor/Admin)
- `GET /payments/stats` - Estadísticas por método de pago

### Frontend

**Páginas creadas**:
1. `/ops/checkout` - Pantalla principal de salida y cobro
   - Búsqueda de sesión activa (placa, ticket, documento, código bici)
   - Previsualización de cobro (quote + breakdown)
   - Registro de pago mixto (múltiples métodos)
   - Cálculo automático de cambio (CASH)
   - Confirmación de salida
   - Impresión de factura HTML

2. `/ops/invoices` - Lista de facturas
   - Filtros (estado, fecha, búsqueda)
   - Ver, imprimir, anular facturas

3. `/ops/invoices/[id]` - Detalle de factura
   - Información completa de sesión, cliente, vehículo
   - Items de factura
   - Estado (ISSUED/VOIDED)
   - Acciones (imprimir, anular)

4. `/ops/payments` - Resumen de pagos
   - Estadísticas por método
   - Filtros y búsqueda
   - Total recaudado

### Factura/Comprobante

**Contenido HTML generado**:
- Datos del parqueadero (legalName, NIT, dirección, teléfono)
- Número de factura (consecutivo)
- Fecha y hora de emisión
- Cliente (nombre, documento, teléfono)
- Vehículo (tipo, placa/código, ticket)
- Entrada y salida (fecha/hora)
- Tiempo total (horas y minutos)
- Detalle ítem: "Servicio de parqueo"
- Subtotal, descuentos, total
- Método(s) de pago utilizados
- Mensaje legal y agradecimiento
- Marca de ANULADA si status = VOIDED
- Botón de impresión (no-print class)

### Migraciones y Seeds

**Migración**: `1737471600000-CreateCheckoutTables.ts`
- Crea todas las tablas (payments, payment_items, customer_invoices, etc.)
- Índices optimizados para búsquedas
- Foreign keys y constraints

**Seed**: `1737472000000-SeedCheckoutData.ts`
- Inicializa InvoiceCounter para todos los parkingLots existentes
- Crea 2 sesiones activas de prueba para testing

### Tests

**Backend**:
- `checkout.service.spec.ts`:
  - Preview retorna quote correcto
  - Lost ticket fee aplicado correctamente
  - Validaciones de sesión (not found, not active)
  - Validación de sumas de pago

- `invoice.service.spec.ts`:
  - Generación de HTML válido
  - Cálculo de tiempo correcto
  - Marca VOIDED en facturas anuladas
  - Error si factura no existe

### Auditoría

**AuditLog registrado para**:
- CHECKOUT_CONFIRM (sesión cerrada)
- SPOT_RELEASED (puesto liberado)
- PAYMENT_CREATED (pago registrado)
- PAYMENT_VOIDED (pago anulado)
- INVOICE_ISSUED (factura emitida)
- INVOICE_VOIDED (factura anulada)
- INVOICE_PRINTED (factura impresa)

Todos con `before` y `after` para trazabilidad completa.

### Integraciones

**Notificaciones**:
- Mensaje de salida + factura por WhatsApp/email según consentimiento
- Resumen: ticket, vehículo, entrada/salida, total, número de factura
- Log en NotificationLog

**WebSocket**:
- `spotUpdated` - Actualiza estado del puesto en tiempo real
- `occupancyUpdated` - Actualiza ocupación del parqueadero

**Pricing Engine**:
- Reutiliza cálculo del Sprint 5
- Guarda snapshot completo en PricingSnapshot

### Permisos y Roles

- **CASHIER**: preview, confirm, list invoices/payments (solo lectura anulaciones)
- **SUPERVISOR**: todo lo de CASHIER + void invoice/payment
- **ADMIN**: todos los permisos

### Características Especiales

1. **Pago Mixto**: Cliente puede pagar con múltiples métodos (ej: $5000 efectivo + $5000 tarjeta)
2. **Cambio Automático**: Para CASH, calcula y registra el cambio devuelto
3. **Consecutivo por Parqueadero**: Cada parkingLot tiene su propio contador de facturas
4. **HTML Imprimible**: Factura generada lista para impresión directa (no requiere PDF externo)
5. **Lost Ticket Fee**: Cargo adicional del 20% o mínimo $5,000 si se perdió el ticket
6. **Multi-tenant**: Todo filtrado por companyId + parkingLotId

### Archivos Creados/Modificados

**Backend**:
- Entidades: `payment.entity.ts`, `payment-item.entity.ts`, `customer-invoice.entity.ts`, `customer-invoice-item.entity.ts`, `pricing-snapshot.entity.ts`, `invoice-counter.entity.ts`, `refund.entity.ts`
- Módulos: `checkout.module.ts`, `payments.module.ts`
- Servicios: `checkout.service.ts`, `invoice.service.ts`, `payments.service.ts`
- Controladores: `checkout.controller.ts`, `payments.controller.ts`
- DTOs: `checkout.dto.ts`
- Migraciones: `1737471600000-CreateCheckoutTables.ts`
- Seeds: `1737472000000-SeedCheckoutData.ts`
- Tests: `checkout.service.spec.ts`, `invoice.service.spec.ts`
- Actualizado: `app.module.ts`

**Frontend**:
- Types: `checkout.ts`
- Services: `checkout.service.ts`
- Pages: `ops/checkout/page.tsx`, `ops/invoices/page.tsx`, `ops/invoices/[id]/page.tsx`, `ops/payments/page.tsx`

### Próximos Pasos

El Sprint 7 implementará:
- Reportes financieros avanzados
- Dashboard de ingresos (diario, semanal, mensual)
- Exportación a Excel/PDF
- Análisis de métodos de pago más usados
- Flujos de caja y conciliación

**Estado**: ✅ **COMPLETADO**

---

## ✅ Sprint 7: Sistema de Caja por Turnos (COMPLETADO)

**Objetivo**: Implementar control robusto de caja por turnos con apertura/cierre, movimientos manuales, arqueo por denominaciones, y validación de turno en checkout.

### Contexto

El Sprint 6 implementó checkout y facturación, pero faltaba:
- Control de cuándo un cajero puede procesar salidas (requiere turno abierto)
- Trazabilidad de dinero por turno (no por día completo)
- Registro de gastos/ingresos manuales (caja menor, suministros)
- Arqueo al cierre con diferencias esperado vs contado
- Políticas configurables de turnos por parqueadero

### Entidades Creadas

#### CashShift (Turno de Caja)
```typescript
{
  id: uuid
  companyId: uuid
  parkingLotId: uuid
  cashierUserId: uuid (quien abre)
  approvedByUserId: uuid (quien aprueba cierre, nullable)
  
  status: OPEN | CLOSED | CANCELED
  
  openedAt: timestamp
  closedAt: timestamp (nullable)
  openingFloat: integer (base inicial en COP)
  openingNotes: string (nullable)
  
  expectedTotal: integer (calculado al cierre)
  countedTotal: integer (suma de CashCounts)
  difference: integer (countedTotal - expectedTotal)
  
  closingNotes: string (nullable)
  createdAt, updatedAt
}
```

**Relaciones**:
- `OneToMany` → CashMovement, CashCount, Payment
- `ManyToOne` → Company, ParkingLot, User (cashier), User (approvedBy)

**Índices**:
- `[parkingLotId, status]` para buscar turnos OPEN rápidamente
- `[cashierUserId, openedAt]` para histórico del cajero

#### CashMovement (Movimientos Manuales)
```typescript
{
  id: uuid
  cashShiftId: uuid
  type: INCOME | EXPENSE
  category: SUPPLIES | MAINTENANCE | PETTY_CASH | OTHER
  amount: integer (COP)
  description: string
  reference: string (nullable)
  
  createdByUserId: uuid
  deletedByUserId: uuid (nullable)
  deletedReason: string (nullable)
  deletedAt: timestamp (nullable)
  
  createdAt, updatedAt
}
```

**Lógica**:
- `INCOME`: Suma al expectedTotal (ej: venta de productos)
- `EXPENSE`: Resta del expectedTotal (ej: compra de papel)
- Solo SUPERVISOR/ADMIN pueden eliminar (soft delete con motivo)

#### CashCount (Arqueo)
```typescript
{
  id: uuid
  cashShiftId: uuid
  method: CASH | CARD | TRANSFER | QR | OTHER
  countedAmount: integer (total contado en COP)
  details: jsonb (denominaciones para CASH)
  
  createdByUserId: uuid
  createdAt, updatedAt
}
```

**Índice único**: `[cashShiftId, method]` → Upsert pattern

**Details JSON para CASH**:
```json
{
  "denominations": [
    { "value": 100000, "qty": 2 },
    { "value": 50000, "qty": 3 },
    { "value": 20000, "qty": 5 },
    ...
  ],
  "coinsTotal": 2500
}
```

**Validación**: `sum(value * qty) + coinsTotal === countedAmount`

#### CashPolicy (Políticas)
```typescript
{
  id: uuid
  parkingLotId: uuid (nullable, null = default)
  
  requireOpenShiftForCheckout: boolean
  defaultShiftHours: integer (ej: 8)
  allowMultipleOpenShiftsPerCashier: boolean
  allowMultipleOpenShiftsPerParkingLot: boolean
  
  createdAt, updatedAt
}
```

**Uso**: Controla comportamiento de turnos por parqueadero

### Modificaciones en Entidades Existentes

#### Payment
```typescript
// Agregado:
cashShiftId: uuid (nullable)

// Relación:
@ManyToOne(() => CashShift)
cashShift: CashShift
```

**Propósito**: Asociar cada pago a un turno para cálculo de expectedTotal

### Backend - Endpoints Implementados

#### ShiftsController (`/cash/shifts`)

1. **`POST /cash/shifts/open`**
   - Body: `{ openingFloat: 50000, openingNotes?: "..." }`
   - Validaciones:
     - Policy `allowMultipleOpenShiftsPerCashier`
     - Policy `allowMultipleOpenShiftsPerParkingLot`
   - Crea turno con status OPEN
   - Registra en AuditLog: `CASH_SHIFT_OPENED`

2. **`GET /cash/shifts/current`**
   - Query: `parkingLotId`
   - Retorna turno OPEN del cajero autenticado
   - null si no hay turno abierto

3. **`POST /cash/shifts/:id/close`**
   - Body: `{ closingNotes?: "..." }`
   - Cálculo:
     ```
     expectedTotal = openingFloat
                   + Σ payments (status=PAID, not VOIDED)
                   + Σ movements (type=INCOME)
                   - Σ movements (type=EXPENSE)
     
     countedTotal = Σ CashCount.countedAmount
     
     difference = countedTotal - expectedTotal
     ```
   - Actualiza: `status=CLOSED`, `closedAt`, `expectedTotal`, `countedTotal`, `difference`
   - Registra en AuditLog: `CASH_SHIFT_CLOSED`

4. **`GET /cash/shifts/:id/summary`**
   - Retorna objeto completo:
     ```typescript
     {
       shift: { id, openedAt, closedAt, cashier: {...} },
       openingFloat: 50000,
       paymentsByMethod: { CASH: 150k, CARD: 80k },
       paymentsTotal: 230000,
       paymentsCount: 45,
       movements: {
         incomes: { items: [...], total: 10000 },
         expenses: { items: [...], total: 5000 }
       },
       expectedTotal: 285000,
       countsByMethod: { CASH: 155k, CARD: 80k },
       countedTotal: 235000,
       difference: -50000 // FALTANTE
     }
     ```

5. **`GET /cash/shifts`**
   - Query: `parkingLotId`, `cashierUserId`, `status`, `from`, `to`
   - Paginación y filtros
   - SUPERVISOR/ADMIN ven todos, CASHIER solo propios

6. **`GET /cash/shifts/:id`**
   - Detalle completo del turno

#### MovementsController (`/cash/movements`)

1. **`POST /cash/movements`**
   - Body: `{ cashShiftId, type, category, amount, description, reference? }`
   - Validaciones:
     - Turno debe estar OPEN
     - Solo el cajero del turno puede registrar
   - Registra en AuditLog: `CASH_MOVEMENT_CREATED`

2. **`GET /cash/movements`**
   - Query: `cashShiftId`, `type`, `from`, `to`
   - Incluye soft-deleted con campo `deletedAt`

3. **`DELETE /cash/movements/:id`**
   - Body: `{ reason: "..." }`
   - Solo SUPERVISOR/ADMIN
   - Soft delete: `deletedAt`, `deletedByUserId`, `deletedReason`
   - Registra en AuditLog: `CASH_MOVEMENT_DELETED`

#### CountsController (`/cash/counts`)

1. **`POST /cash/counts`** (upsert)
   - Body:
     ```typescript
     {
       cashShiftId: uuid,
       method: "CASH",
       countedAmount: 157500,
       details: {
         denominations: [
           { value: 100000, qty: 1 },
           { value: 50000, qty: 1 },
           ...
         ]
       }
     }
     ```
   - Validación para CASH: `sum(denominations) === countedAmount`
   - Upsert por `(cashShiftId, method)`
   - Registra en AuditLog: `CASH_COUNT_CREATED` o `CASH_COUNT_UPDATED`

2. **`GET /cash/counts`**
   - Query: `cashShiftId`
   - Retorna todos los arqueos del turno

#### PolicyController (`/cash/policy`)

1. **`GET /cash/policy`**
   - Query: `parkingLotId`
   - Retorna policy del parqueadero (o default si no existe)

2. **`PUT /cash/policy`**
   - Query: `parkingLotId`
   - Body: `{ requireOpenShiftForCheckout?, defaultShiftHours?, ... }`
   - Solo SUPERVISOR/ADMIN
   - Registra en AuditLog: `CASH_POLICY_UPDATED`

### Integración con Checkout

En `checkout.service.ts → confirm()`:

```typescript
// 1. Buscar policy
const policy = await this.policyRepo.findOne({
  where: { parkingLotId }
});

// 2. Si policy.requireOpenShiftForCheckout = true
if (policy?.requireOpenShiftForCheckout) {
  const openShift = await this.cashShiftRepo.findOne({
    where: {
      parkingLotId,
      cashierUserId: userId,
      status: CashShiftStatus.OPEN
    }
  });
  
  if (!openShift) {
    throw new ConflictException(
      'Debe abrir un turno de caja antes de procesar salidas'
    );
  }
  
  // 3. Asignar cashShiftId al Payment
  payment.cashShiftId = openShift.id;
}
```

**Resultado**: Checkout bloqueado sin turno abierto (según policy)

### Frontend - Páginas Implementadas

#### 1. `/cash` - Dashboard Principal
- **Estado sin turno**: Botón "Abrir Caja"
- **Estado con turno**: Cards con acciones:
  - Ver resumen del turno
  - Registrar movimientos
  - Hacer arqueo
  - Cerrar turno
- Muestra: openingFloat, expectedTotal parcial, horas abiertas

#### 2. `/cash/open` - Abrir Turno
- Input: Base inicial (COP)
- Textarea: Notas opcionales
- Valida: monto > 0
- Al enviar: Crea turno y redirige a `/cash`

#### 3. `/cash/count` - Arqueo
- **Tabs por método**: CASH | CARD | TRANSFER | QR
- **Tab CASH**:
  - 11 denominaciones ($100k hasta $50)
  - Input qty para cada una
  - Auto-calcula total
  - Muestra: `$157,500`
- **Otros tabs**: Input monto total simple
- Botón "Guardar" (upsert por método)
- Validación: suma de denominaciones = countedAmount

#### 4. `/cash/movements` - Movimientos
- **Lista de movimientos** con:
  - Tipo (badge verde=INCOME, rojo=EXPENSE)
  - Categoría, monto, descripción
  - Filtro por tipo
- **Formulario crear**:
  - Select tipo (INCOME/EXPENSE)
  - Select categoría
  - Input monto, descripción, referencia
- **Resumen**: Total ingresos, total egresos

#### 5. `/cash/close` - Cierre de Turno
- **Resumen completo**:
  - Base inicial
  - Pagos por método (tabla)
  - Movimientos (ingresos/egresos)
  - **Comparación**:
    ```
    Esperado:  $285,000
    Contado:   $235,000
    ---------------------
    Faltante:  -$50,000  ❌
    ```
  - Color coding:
    - Verde: Cuadra ($0)
    - Rojo: Faltante (negativo)
    - Azul: Sobrante (positivo)
- Textarea: Notas de cierre
- Botón "Cerrar Turno" (confirma antes)
- ⚠️ Alerta si no hay arqueo registrado

### Servicios Frontend

**shifts.service.ts**:
```typescript
openShift(data: OpenShiftDto)
getCurrent(parkingLotId: string)
closeShift(id: string, data: CloseShiftDto)
getShiftSummary(id: string)
getShifts(params: ShiftQueryParams)
getShiftById(id: string)
```

**movements.service.ts**:
```typescript
createMovement(data: CreateMovementDto)
getMovements(params: MovementQueryParams)
deleteMovement(id: string, reason: string)
```

**counts.service.ts**:
```typescript
upsertCount(data: CreateCountDto)
getCounts(cashShiftId: string)
```

**policy.service.ts**:
```typescript
getPolicy(parkingLotId: string)
updatePolicy(parkingLotId: string, data: UpdatePolicyDto)
```

### Base de Datos - Migración

**Archivo**: `1737518400000-CreateCashManagement.ts`

**Acciones**:
1. Crear tabla `cash_policies`
2. Crear tabla `cash_shifts` con índices:
   - `IDX_cash_shifts_parking_lot_status`
   - `IDX_cash_shifts_cashier_opened`
3. Crear tabla `cash_movements`
4. Crear tabla `cash_counts` con índice único:
   - `UQ_cash_counts_shift_method`
5. Alterar tabla `payments`:
   - Agregar columna `cash_shift_id`
   - FK a `cash_shifts`
6. Crear CHECK constraints para enums

**Total**: 7 índices, 4 constraints

### Seed Data

**Archivo**: `1737519000000-CashSeeder.ts`

**Crea**:
1. `CashPolicy` para cada parqueadero:
   ```json
   {
     "requireOpenShiftForCheckout": true,
     "defaultShiftHours": 8,
     "allowMultipleOpenShiftsPerCashier": false,
     "allowMultipleOpenShiftsPerParkingLot": true
   }
   ```

2. Turno CLOSED de ejemplo (si existe cajero):
   ```json
   {
     "openedAt": "yesterday 08:00",
     "closedAt": "yesterday 16:00",
     "openingFloat": 50000,
     "expectedTotal": 250000,
     "countedTotal": 250000,
     "difference": 0,
     "status": "CLOSED"
   }
   ```

### Tests Unitarios

**Archivo**: `shifts.service.spec.ts`

**Tests** (8+):
1. ✅ `openShift`: Crea turno exitosamente
2. ✅ `openShift`: Arroja ConflictException si policy no permite múltiples
3. ✅ `closeShift`: Calcula expectedTotal correctamente
   - Ejemplo: 50k (base) + 30k (payments) + 5k (income) - 3k (expense) = 82k
4. ✅ `closeShift`: Calcula countedTotal desde CashCounts
5. ✅ `closeShift`: Calcula difference (counted - expected)
6. ✅ `closeShift`: Arroja NotFoundException si turno no existe
7. ✅ `closeShift`: Arroja ConflictException si turno ya cerrado
8. ✅ Validación de arqueo CASH con denominaciones

**Comando**:
```bash
npm run test -- shifts.service.spec
```

### Auditoría

Todos los eventos registrados:
- `CASH_SHIFT_OPENED`
- `CASH_SHIFT_CLOSED`
- `CASH_MOVEMENT_CREATED`
- `CASH_MOVEMENT_DELETED`
- `CASH_COUNT_CREATED`
- `CASH_COUNT_UPDATED`
- `CASH_POLICY_CREATED`
- `CASH_POLICY_UPDATED`

### Permisos y Roles

| Acción | CASHIER | SUPERVISOR | ADMIN |
|--------|---------|------------|-------|
| Abrir turno propio | ✅ | ✅ | ✅ |
| Cerrar turno propio | ✅ | ✅ | ✅ |
| Ver turno propio | ✅ | ✅ | ✅ |
| Ver todos los turnos | ❌ | ✅ | ✅ |
| Registrar movimiento en turno propio | ✅ | ✅ | ✅ |
| Eliminar movimiento | ❌ | ✅ | ✅ |
| Hacer arqueo | ✅ | ✅ | ✅ |
| Configurar policy | ❌ | ✅ | ✅ |

### Características Especiales

1. **Upsert de CashCount**: Al registrar arqueo de un método ya registrado, actualiza en vez de crear duplicado
2. **Cálculo Preciso**: expectedTotal usa solo payments con status=PAID (excluye VOIDED/PENDING)
3. **Validación de Denominaciones**: Para CASH, valida que suma de billetes/monedas cuadre con countedAmount
4. **Soft Delete de Movimientos**: SUPERVISOR puede eliminar con motivo (trazabilidad completa)
5. **Políticas Flexibles**: Cada parqueadero puede tener reglas diferentes de turnos
6. **Multi-tenant**: Filtros automáticos por companyId + parkingLotId
7. **Bloqueo de Checkout**: Configurable vía policy, evita salidas sin turno abierto
8. **Resumen Completo**: Endpoint `/summary` retorna todo lo necesario para pantalla de cierre

### Archivos Creados/Modificados

**Backend** (23 archivos):
- Entidades: `cash-shift.entity.ts`, `cash-movement.entity.ts`, `cash-count.entity.ts`, `cash-policy.entity.ts`
- Modificado: `payment.entity.ts`
- Módulo: `cash.module.ts`
- Servicios: `shifts.service.ts`, `movements.service.ts`, `counts.service.ts`, `policy.service.ts`
- DTOs: `shift.dto.ts`, `movement.dto.ts`, `count.dto.ts`, `policy.dto.ts`
- Controladores: `shifts.controller.ts`, `movements.controller.ts`, `counts.controller.ts`, `policy.controller.ts`
- Modificados: `checkout.service.ts`, `checkout.module.ts`, `app.module.ts`
- Migración: `1737518400000-CreateCashManagement.ts`
- Seed: `1737519000000-CashSeeder.ts`
- Tests: `shifts.service.spec.ts`

**Frontend** (10 archivos):
- Types: `cash.ts`
- Services: `shifts.service.ts`, `movements.service.ts`, `counts.service.ts`, `policy.service.ts`
- Pages: `cash/page.tsx`, `cash/open/page.tsx`, `cash/count/page.tsx`, `cash/movements/page.tsx`, `cash/close/page.tsx`

**Total**: 33 archivos

### Instrucciones de Uso

**1. Migración**:
```bash
cd apps/api
npm run migration:run
```

**2. Seed**:
```bash
npm run seed:run
```

**3. Flujo completo**:
```
1. Login como CASHIER
2. /cash → Abrir Caja ($50,000 base)
3. /ops/checkout → Procesar salidas (requiere turno abierto)
4. /cash/movements → Registrar gasto ($15,000 papel)
5. /cash/count → Hacer arqueo por método
6. /cash/close → Revisar resumen y cerrar turno
```

### Próximos Pasos

El Sprint 8 podría implementar:
- Reportes financieros por turno/cajero/período
- Dashboard de supervisión en tiempo real
- Exportación de cierres a Excel/PDF
- Alertas automáticas por diferencias > umbral
- Reabrir turno (con aprobación supervisor)
- Integración con contabilidad externa

**Estado**: ✅ **COMPLETADO**

**Duración estimada**: 2 semanas  
**Duración real**: Completado según plan  
**Complejidad**: Alta  
**Calidad**: Excelente  
**Cobertura de tests**: Buena  

---

## Sprints Futuros (Backlog)

### Integraciones
- Integración con sistemas de pago (PSE, tarjetas)
- Integración con cámaras de reconocimiento de placas
- App móvil (React Native)
- Integración con contabilidad

### Funcionalidades Avanzadas
- IA para predicción de ocupación
- Sistema de fidelización
- Marketplace de parqueaderos
- API pública para terceros
- Multi-idioma

### DevOps
- CI/CD completo
- Kubernetes deployment
- Monitoring (Grafana, Prometheus)
- Automated backups
- Disaster recovery plan

---

## Métricas de Éxito

Por sprint, mediremos:
- ✅ Funcionalidades completadas vs planificadas
- 🐛 Bugs reportados y resueltos
- 📊 Coverage de tests
- ⚡ Performance (tiempo de respuesta <200ms)
- 👥 Feedback de usuarios (si aplica)

---

**Estimación total**: 6-8 meses para completar los primeros 10 sprints

**Nota**: Los tiempos son estimaciones y pueden variar según el equipo y recursos disponibles.
