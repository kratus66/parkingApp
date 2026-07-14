# Lógica de Negocio — Sistema de Gestión de Parqueaderos

> **Documento canónico.** Describe la lógica de negocio **tal como está implementada** en el código
> (`apps/api/src` y `apps/web/src`), de punta a punta. Cuando el comportamiento actual es
> discutible o inconsistente, se marca con ⚠️ y se detalla en la sección
> [Hallazgos y decisiones abiertas](#10-hallazgos-y-decisiones-abiertas).
>
> Última actualización: 2026-07-14 (generado a partir de revisión completa del código).

---

## Índice

1. [Visión y modelo de dominio](#1-visión-y-modelo-de-dominio)
2. [Actores y permisos (RBAC)](#2-actores-y-permisos-rbac)
3. [Datos maestros y sus reglas](#3-datos-maestros-y-sus-reglas)
4. [Flujo operativo de punta a punta](#4-flujo-operativo-de-punta-a-punta)
5. [Motor de tarifas en detalle](#5-motor-de-tarifas-en-detalle)
6. [Gestión de caja](#6-gestión-de-caja)
7. [Máquinas de estado](#7-máquinas-de-estado)
8. [Invariantes del negocio](#8-invariantes-del-negocio)
9. [Módulos legacy y rutas duplicadas](#9-módulos-legacy-y-rutas-duplicadas)
10. [Hallazgos y decisiones abiertas](#10-hallazgos-y-decisiones-abiertas)

---

## 1. Visión y modelo de dominio

Sistema **SaaS multiempresa** para operar parqueaderos: registra entradas y salidas de
vehículos, cobra según un motor de tarifas configurable, emite facturas, y controla la caja
de los cajeros por turnos, con auditoría de todas las operaciones críticas.

### Jerarquía multi-tenant

```
Company (empresa)
 └── ParkingLot (parqueadero)            ← 1 empresa puede tener N parqueaderos
      ├── ParkingZone (zona)             ← agrupa puestos; define tipos de vehículo permitidos
      │    └── ParkingSpot (puesto)      ← unidad ocupable: código único por parqueadero
      ├── TariffPlan / TariffRule        ← tarifas por parqueadero
      ├── PricingConfig                  ← gracia, tope diario, multa tiquete perdido
      ├── CashPolicy                     ← reglas de turnos de caja
      └── Counters (ticket / factura)    ← consecutivos por parqueadero

Company
 ├── User (ADMIN | SUPERVISOR | CASHIER) ← opcionalmente asignado a un ParkingLot
 ├── Customer (cliente)                  ← documento único por empresa
 │    ├── Vehicle v2                     ← placa/código único por empresa; pertenece al cliente
 │    └── Consent                        ← historial de consentimientos WhatsApp/Email
 └── Agreement (convenio de descuento)   ← por empresa, opcionalmente restringido a un lot
```

**Aislamiento**: el `companyId` viaja en el JWT y todos los servicios filtran por él.
El `parkingLotId` "activo" lo elige el operador en la UI (selector del TopBar) o viene del
perfil del usuario. ⚠️ Hay 3 endpoints que no respetan el scoping por empresa (ver hallazgo H4).

**Entidades transversales**: `AuditLog` (toda operación crítica), `Holiday` (festivos por país,
globales — no por empresa), `NotificationLog` (envíos WhatsApp/Email — hoy con proveedor mock).

---

## 2. Actores y permisos (RBAC)

Tres roles definidos en `UserRole` (`apps/api/src/modules/users/enums/user-role.enum.ts`).
Los guards `JwtAuthGuard` + `RolesGuard` aplican la matriz por endpoint (`@Roles(...)`).

| Capacidad | CASHIER | SUPERVISOR | ADMIN |
|---|---|---|---|
| Login / ver parqueaderos de su empresa | ✅ | ✅ | ✅ |
| Identificar cliente (`/ops/identify`), dashboard | ✅ | ✅ | ✅ |
| Crear/editar clientes | ✅ (sin cambiar documento) | ✅ | ✅ |
| Crear vehículos (v2) | ✅ | ✅ | ✅ |
| Editar vehículos (v2) | solo `color` y `notes` | ✅ | ✅ |
| Check-in / reimpresión de ticket | ✅ | ✅ | ✅ |
| Cancelar sesión activa | ❌ | ✅ | ✅ |
| Checkout (preview + confirm) | ✅ | ✅ | ✅ |
| Ver facturas / pagos / HTML imprimible | ✅ | ✅ | ✅ |
| **Anular** pago o factura (con motivo) | ❌ | ✅ | ✅ |
| Abrir/cerrar **su** turno de caja, movimientos, arqueo | ✅ | ✅ | ✅ |
| Eliminar movimiento de caja (turno abierto) | ❌ | ✅ | ✅ |
| Editar política de caja | ❌ | ✅ | ✅ |
| Ver ocupación / asignar / liberar puestos | ✅ | ✅ | ✅ |
| Crear/editar zonas y puestos | ❌ | ✅ | ✅ |
| Configurar tarifas (planes, reglas, config) | ❌ (solo consulta/simula) | ✅ | ✅ |
| Convenios: consultar | ✅ | ✅ | ✅ |
| Convenios: crear/editar | ❌ | ✅ | ✅ |
| Convenios: eliminar | ❌ | ❌ | ✅ |
| Festivos: crear/eliminar | ❌ | ❌ | ✅ |
| Usuarios: listar/ver | ❌ | ✅ | ✅ |
| Empresas: listar | ❌ | ❌ | ✅ |
| Logs de auditoría | ❌ | ❌ | ✅ |
| Logs de notificaciones | ❌ | ✅ | ✅ |

Reglas de fila específicas (además del rol):

- Un cajero **solo puede cerrar su propio turno** y solo puede registrar movimientos/arqueos
  en su propio turno abierto.
- `CASHIER` no puede modificar `documentType`/`documentNumber` de un cliente
  (regla en `customers.service.update`).

---

## 3. Datos maestros y sus reglas

### 3.1 Clientes (`customers`)

- Identificados por `documentType` (CC, CE, PASSPORT, PPT, OTHER) + `documentNumber`.
- **Unicidad**: `(companyId, documentType, documentNumber)`. El número se normaliza
  (trim + mayúsculas) al crear/buscar.
- Campos de contacto (`phone`, `email`) alimentan notificaciones; `agreementId` opcional
  vincula un convenio de descuento que se aplica automáticamente en el checkout.

### 3.2 Vehículos vigentes (`vehicles_v2`)

- **Siempre pertenecen a un cliente** (`customerId` obligatorio y validado contra la empresa).
- Tipos: `CAR`, `MOTORCYCLE`, `BICYCLE`, `TRUCK_BUS`.
- Regla de identificador:
  - `BICYCLE` → requiere `bicycleCode` y **no** puede tener placa.
  - Los demás tipos → requieren `plate` y **no** pueden tener `bicycleCode`.
- **Normalización de placa**: mayúsculas, sin espacios ni guiones (`ABC-123` ≡ `abc 123`).
- **Unicidad por empresa**: placa y código de bicicleta.

> ⚠️ Existe además un módulo **legacy** `/vehicles` (tabla `vehicles`, campo `licensePlate`,
> sin cliente, con lista negra). El flujo operativo **no lo usa**: un vehículo creado ahí
> no puede hacer check-in. Ver [sección 9](#9-módulos-legacy-y-rutas-duplicadas).

### 3.3 Zonas y puestos (`parking_zones`, `parking_spots`)

- Zona: pertenece a un parqueadero; define `allowedVehicleTypes` (usado por el dashboard para
  capacidad por tipo).
- Puesto: `code` **único por parqueadero**, `spotType` (un tipo de vehículo), `status`
  (`FREE`, `OCCUPIED`, `RESERVED`, `OUT_OF_SERVICE`), `priority` (número; a mayor prioridad,
  primero se asigna) y `sessionId` (sesión que lo ocupa).
- Asignación automática: primer puesto `FREE` del tipo del vehículo, ordenado por
  `priority DESC, code ASC`.
- Cambios de estado manuales (supervisor) quedan en `spot_status_history`.

### 3.4 Convenios (`agreements`)

- Por empresa; `parkingLotId` opcional (null = aplica a toda la empresa).
- `discountType`: `PERCENT` (0–100) o `FIXED` (monto en COP). Vigencia opcional
  `validFrom`/`validUntil` (se valida contra la fecha de salida).
- **Se aplican en el checkout** sobre el **servicio de parqueo** (no sobre la multa de tiquete
  perdido). El descuento nunca excede el subtotal ni es negativo.
- Resolución: el convenio indicado explícitamente en el checkout **o**, en su defecto, el
  convenio del cliente (`customer.agreementId`).
- Unicidad: nombre por empresa.

### 3.5 Festivos (`holidays`)

- Globales por país (default `CO`), fecha única. El motor de tarifas los consulta para
  clasificar el día como `HOLIDAY`. El seed carga los festivos de Colombia 2026.

### 3.6 Tarifas (`tariff_plans`, `tariff_rules`, `pricing_config`)

- **TariffPlan**: agrupa reglas por parqueadero; `isActive`; `timezone` (default
  `America/Bogota`; ⚠️ hoy el motor no la usa — usa la hora del servidor).
- **TariffRule**: la unidad de cobro. Clave lógica:
  `(parqueadero, tipo de vehículo, tipo de día, periodo)` con:
  - `dayType`: `WEEKDAY` | `WEEKEND` | `HOLIDAY`
  - `period`: `DAY` (06:00–18:59) | `NIGHT` (19:00–05:59) — cortes fijos en el motor
  - `billingUnit`: `MINUTE` | `BLOCK_15` | `BLOCK_30` | `HOUR` | `DAY`
  - `rounding`: `CEIL` (default) | `FLOOR` | `NEAREST`
  - `unitPrice` (COP), `minimumCharge` opcional (por segmento)
  - ⚠️ `startTime`/`endTime`, `graceMinutes` y `dailyMax` **a nivel de regla existen en la
    tabla pero el motor los ignora** (usa cortes fijos y la config del parqueadero).
- **PricingConfig** (una por parqueadero): `defaultGraceMinutes` (gracia),
  `defaultDailyMax` (tope), `lostTicketFee` (multa tiquete perdido),
  `enableDynamicPricing` (sin uso).
- Todo cambio de tarifas queda en `tariff_change_log` (before/after + usuario).

Seed demo: plan "Tarifa Base 2026" con 24 reglas (4 tipos × 6 combinaciones día/periodo),
unidad `HOUR`, redondeo `CEIL`, precios base 1.000/2.000/3.000/5.000 COP/h
(bici/moto/auto/camión), multiplicador ×1.2 nocturno y ×1.3 festivo, cargo mínimo 50 % de la
unidad; config: gracia 15 min, multa tiquete perdido $20.000.

### 3.7 Política de caja (`cash_policies`)

Una por parqueadero. Valores por defecto al crearla:

| Campo | Default | Efecto |
|---|---|---|
| `requireOpenShiftForCheckout` | `true` | Exige turno de caja abierto del operador para **check-in y checkout** ⚠️ (el nombre sugiere solo checkout, pero también bloquea el check-in) |
| `defaultShiftHours` | 8 | Informativo |
| `allowMultipleOpenShiftsPerCashier` | `false` | Un cajero no puede tener 2 turnos abiertos en el mismo lot |
| `allowMultipleOpenShiftsPerParkingLot` | `true` | Varios cajeros pueden tener turno abierto a la vez |

---

## 4. Flujo operativo de punta a punta

Este es el **camino del dinero** tal como lo ejecuta la UI (`apps/web`):

```
(0) Abrir turno de caja  →  (1) Identificar  →  (2) Registrar cliente/vehículo (si no existen)
 →  (3) Check-in (ticket)  →  (4) Estancia  →  (5) Checkout preview → confirm (pago + factura)
 →  (6) Cierre de turno (arqueo)
```

### Paso 0 — Turno de caja (prerrequisito)

Si la política del parqueadero tiene `requireOpenShiftForCheckout = true` (default), el
operador debe abrir turno (`POST /cash/shifts/open`, con base inicial `openingFloat`) antes de
poder registrar entradas o cobrar salidas. Ver [sección 6](#6-gestión-de-caja).

### Paso 1 — Identificación (`POST /ops/identify`)

Búsqueda rápida de taquilla por **placa**, **código de bicicleta** o **documento** (en ese
orden de precedencia). Devuelve:

- `found: true` + cliente + todos sus vehículos + estado vigente de consentimientos
  (WhatsApp/Email), o
- `found: false` + sugerencias ("Crear nuevo cliente y registrar vehículo").

### Paso 2 — Registro (solo la primera vez)

1. `POST /customers` — valida documento único por empresa.
2. `POST /vehicles-v2` — valida cliente existente, regla placa/bicycleCode y unicidad.

El modal de check-in de la UI encadena estos dos pasos automáticamente cuando el vehículo no
existe. **Un vehículo debe estar registrado (v2) para poder parquear**: el check-in no crea
vehículos implícitamente.

### Paso 3 — Check-in (`POST /parking-sessions/check-in`)

Transaccional. Reglas en orden:

1. Placa obligatoria; el vehículo **debe existir** en `vehicles_v2` (por placa normalizada,
   dentro de la empresa). Si no → 400 "regístrelo primero".
2. **Anti-duplicado**: si el vehículo ya tiene una sesión `ACTIVE` en ese parqueadero → 400
   con el número de ticket y puesto de la sesión existente.
3. **Política de caja**: si aplica, exige turno `OPEN` del operador en ese lot.
4. **Asignación de puesto**:
   - Con `parkingSpotId` explícito: debe existir, estar `FREE` y su `spotType` debe coincidir
     con el tipo del vehículo.
   - Sin puesto explícito: asignación automática (`FREE` del tipo, `priority DESC, code ASC`).
     Si no hay → 400 "No hay espacios disponibles para ese tipo".
5. **Número de ticket**: consecutivo por parqueadero (`parking_lot_counters`), formateado
   `YYYYMMDD-####`. ⚠️ El consecutivo **no se reinicia por día** (el prefijo de fecha es solo
   cosmético) y el contador se incrementa sin lock (riesgo de duplicado bajo concurrencia).
6. Crea `ParkingSession` (`ACTIVE`, `entryAt = now`, operador como `createdByUserId`,
   `customerId` heredado del vehículo).
7. Ocupa el puesto (`status = OCCUPIED`, `sessionId`, `lastStatusChange`).
8. Registra la impresión en `ticket_print_logs` (acción `PRINT`).
9. Post-commit: notificación de check-in (hoy no-op con proveedor mock), consentimientos
   otorgados en el modal (`WHATSAPP`/`EMAIL` → `GRANTED`), y `AuditLog`
   (`PARKING_SESSION_CREATED`).
10. Devuelve el paquete completo para el **ticket térmico** (número, puesto, vehículo,
    cliente, parqueadero).

### Paso 4 — Estancia

- **Vehículos activos**: `GET /parking-sessions/active?parkingLotId=` (con vehículo, cliente,
  puesto y zona).
- **Cotización en vivo**: `GET /pricing/session/:id/quote` — cuánto pagaría si saliera ahora
  (componente `LiveQuote`).
- **Reimpresión de ticket** (`POST /parking-sessions/reprint-ticket`): solo sesiones activas;
  incrementa `ticketReprintedCount`, registra en `ticket_print_logs` (acción `REPRINT`, con
  motivo) y en auditoría.
- **Cancelación** (`POST /parking-sessions/cancel`, SUPERVISOR/ADMIN): marca `CANCELED` con
  motivo y usuario, **libera el puesto sin cobro**. Uso: errores de registro, evacuaciones.

### Paso 5 — Salida y cobro (módulo `checkout` — el flujo vigente)

**5a. Preview** (`POST /checkout/preview`): calcula sin efectos secundarios.

```
baseTotal      = PricingEngine(entryAt → now)                 [sección 5]
lostTicketFee  = lostTicket ? max(5000, 20% × baseTotal) : 0  ⚠️ regla distinta a config.lostTicketFee
discount       = convenio (explícito o del cliente), solo sobre baseTotal, tope baseTotal
total          = baseTotal + lostTicketFee − discount
```

**5b. Confirm** (`POST /checkout/confirm`): transacción única que:

1. Revalida sesión `ACTIVE` (de la empresa y parqueadero del operador).
2. Exige turno abierto según política (y asocia el pago al turno si existe).
3. **Recalcula el total en el servidor** (nunca confía en el monto del cliente).
4. Valida los medios de pago:
   - `paymentItems` (métodos: `CASH`, `CARD`, `TRANSFER`, `QR`, `OTHER`) deben sumar
     **exactamente** el total. ⚠️ Si el total cruzó un límite de facturación entre preview y
     confirm (p. ej. pasó una hora), el confirm se rechaza y hay que repetir el preview.
   - Efectivo con monto > 0: `receivedAmount ≥ amount`; el cambio se calcula y persiste.
   - **Salida en gracia (total $0)**: permitida sin exigir monto recibido.
5. Persiste, en orden: `PricingSnapshot` (quote completo congelado — trazabilidad del precio),
   `Payment` (`PAID`, vinculado al turno de caja) + `PaymentItem` por método,
   `CustomerInvoice` (`ISSUED`, consecutivo `INV-########` por parqueadero) + ítem
   "Servicio de parqueo".
6. Cierra la sesión (`CLOSED`, `exitAt`, `closedByUserId`) y libera el puesto
   (⚠️ pone `FREE` directo: no limpia `sessionId` ni escribe `spot_status_history`).
7. Escribe 4 `AuditLog` (checkout, liberación, pago, factura).
8. Post-commit: HTML imprimible de la factura (`printableInvoiceHtml`) y notificación de
   salida (pendiente — código comentado).

**Consultas posteriores**: `GET /checkout/invoices` (búsqueda por número, cliente, placa),
`GET /checkout/invoices/:id/html` (reimpresión), `POST /checkout/invoices/:id/print`
(deja constancia en auditoría), `GET /payments`, `GET /payments/stats` (por método).

**Anulaciones** (SUPERVISOR/ADMIN, motivo obligatorio): `POST /payments/:id/void` y
`POST /checkout/invoices/:id/void` marcan `VOIDED` + auditoría.
⚠️ La anulación es solo contable-documental: no reabre la sesión, no recalcula la caja y no
genera devolución (la entidad `Refund` existe pero no se usa).

> ⚠️ **Existe una segunda ruta de salida legacy** (`POST /parking-sessions/:id/check-out`,
> usada por el modal rápido del dashboard) con **tarifas fijas en código** (auto $3.000/h,
> moto $2.000, bici $1.000, camión $5.000), sin gracia, sin convenios, **sin factura, sin
> pago y sin caja**. Es el hallazgo más grave: ver H1 en la
> [sección 10](#10-hallazgos-y-decisiones-abiertas).

### Paso 6 — Consentimientos y notificaciones

- `Consent` es un **historial append-only** por (cliente, canal): cada registro es `GRANTED`
  o `REVOKED` con fuente (`WEB`, `IN_PERSON`, `CALLCENTER`…) y evidencia textual; el vigente
  es el más reciente. Se capturan en el check-in (checkboxes del modal) o por
  `POST /consents`.
- `NotificationLog` registra los envíos. **Hoy el proveedor es un mock** (no envía nada real)
  y el módulo tiene la entidad desincronizada de la tabla (ver H3): los endpoints de consulta
  devuelven 500.

### Paso 7 — Auditoría

`AuditLog` registra: login (con IP/user-agent), CRUD de clientes/vehículos/consentimientos,
check-in, reimpresión (con motivo), cancelación, checkout, liberación de puesto, pago,
factura, anulaciones, apertura/cierre de turno, movimientos y arqueos de caja, y cambios de
tarifas (además del `tariff_change_log` propio). Consulta: `GET /audit` (solo ADMIN).

---

## 5. Motor de tarifas en detalle

Implementado en `pricing-engine.service.ts`. Entrada: parqueadero, tipo de vehículo,
`entryAt`, `exitAt`, opciones. Salida: total + desglose (`breakdown`) con segmentos y reglas
usadas.

### Algoritmo

1. **Minutos totales** = `floor((exitAt − entryAt) / 60s)`.
2. **Gracia** (`PricingConfig.defaultGraceMinutes`, seed: 15):
   - Si `totalMinutes ≤ grace` → **total $0** (salida libre). Fin.
   - Si `totalMinutes > grace` → ⚠️ se cobra la estancia **completa** (la gracia no descuenta
     minutos del cobro; el `billableMinutes` del breakdown es solo informativo).
3. **Segmentación** del rango entrada→salida cortando en: medianoche, 06:00 y 19:00.
   Cada segmento se clasifica:
   - `dayType`: `HOLIDAY` (si la fecha está en `holidays`) > `WEEKEND` (sáb/dom) > `WEEKDAY`.
   - `period`: `DAY` (06:00–18:59) o `NIGHT` (19:00–05:59).
4. **Regla aplicable** por segmento: `TariffRule` activa que coincida en
   (lot, empresa, tipo vehículo, dayType, period). ⚠️ No se filtra por plan activo: si dos
   planes tienen reglas activas para la misma combinación, se usa la primera que devuelva la
   BD. Si **ningún** segmento tiene regla → 422 "No tariff rules configured".
   Segmentos individuales sin regla se omiten silenciosamente (no se cobran).
5. **Cobro por segmento** = `max(unidades × unitPrice, minimumCharge)`, donde
   `unidades = redondeo(minutos / tamañoUnidad)` según `billingUnit` y `rounding`.
   ⚠️ El redondeo es **por segmento**: una estancia que cruza las 19:00 con unidad `HOUR` y
   `CEIL` paga el techo de cada tramo por separado (p. ej. 18:30→19:20 = 1h DAY + 1h NIGHT).
6. **Tope diario** (`defaultDailyMax`): si el subtotal lo supera, se recorta.
   ⚠️ Se aplica **una sola vez a toda la estancia**, no por cada día (una estancia de 3 días
   queda topada como si fuera 1).
7. **Tiquete perdido** (solo en `/pricing/quote` con `lostTicket: true`): suma
   `config.lostTicketFee`. ⚠️ El checkout **no usa esta vía**: aplica su propia fórmula
   `max(5000, 20 %)` (ver H10).

### Ejemplo con datos del seed (auto, martes 10:00 → 13:30)

- 210 min > 15 de gracia → se cobra completo.
- Un solo segmento WEEKDAY/DAY, unidad HOUR, CEIL → 4 unidades × $3.000 = **$12.000**.
- Cliente con convenio 10 % → descuento $1.200 → total **$10.800**.

### Zona horaria

⚠️ Todos los cálculos usan la hora **local del proceso Node** y las columnas son
`timestamp without time zone`. Funciona mientras servidor y negocio estén en
`America/Bogota`; el `timezone` del plan no se consulta.

---

## 6. Gestión de caja

### Turnos (`cash_shifts`)

- **Abrir** (`POST /cash/shifts/open`): requiere base inicial (`openingFloat`) y respeta la
  política (¿turno ya abierto del cajero?, ¿se permite más de un turno en el lot?).
- Durante el turno, cada `Payment` del checkout confirmado por ese cajero queda vinculado al
  turno (`cashShiftId`).
- **Movimientos** (`POST /cash/movements`): `INCOME` o `EXPENSE` con concepto — solo en el
  turno propio y abierto. Eliminables solo con el turno abierto (SUPERVISOR/ADMIN) y queda
  auditado.
- **Arqueo** (`POST /cash/counts`): conteo por método (`CASH` con detalle de denominaciones
  y monedas — la suma declarada debe cuadrar con `countedAmount` — más conteos para otros
  métodos). Upsert por (turno, método), editable mientras el turno no esté cerrado.
- **Cerrar** (`POST /cash/shifts/:id/close`): solo el cajero dueño. Congela:

```
expectedTotal = openingFloat + Σ pagos PAID del turno + Σ INCOME − Σ EXPENSE
countedTotal  = Σ arqueos
difference    = countedTotal − expectedTotal     (sobrante > 0, faltante < 0)
```

> ⚠️ `expectedTotal` suma el **total** de cada pago sin discriminar método: una venta pagada
> con tarjeta o el cambio entregado en efectivo no deberían contar como efectivo esperado en
> el cajón. El "esperado en efectivo" correcto sería
> `base + Σ items CASH (recibido − cambio) + ingresos − egresos`. Ver H5.

- **Resumen** (`GET /cash/shifts/:id/summary`): totales de pagos, movimientos, arqueos y
  diferencia — es el reporte de cierre del cajero.

### Anulaciones vs. caja

Anular un pago (`VOIDED`) lo excluye del esperado si el turno **aún no se cierra** (el
cálculo solo suma `PAID`). Si el turno ya está cerrado, los totales congelados no se
recalculan.

---

## 7. Máquinas de estado

```
ParkingSession:  ACTIVE ──(checkout confirm)──▶ CLOSED
                 ACTIVE ──(cancel, sup/admin)──▶ CANCELED
                 (no hay reapertura)

ParkingSpot:     FREE ──(check-in)──▶ OCCUPIED ──(checkout/cancel)──▶ FREE
                 FREE ⇄ RESERVED / OUT_OF_SERVICE   (manual, supervisor)

Payment:         PAID ──(void + motivo, sup/admin)──▶ VOIDED
CustomerInvoice: ISSUED ──(void + motivo, sup/admin)──▶ VOIDED
CashShift:       OPEN ──(close, solo el dueño)──▶ CLOSED   (sin reapertura)
Consent:         historial GRANTED/REVOKED; el más reciente por canal es el vigente
```

---

## 8. Invariantes del negocio

1. Toda entidad de negocio pertenece a una empresa; las consultas filtran por el `companyId`
   del JWT (⚠️ excepciones en H4).
2. Documento de cliente único por empresa (normalizado).
3. Placa / código de bicicleta únicos por empresa (normalizados); bicicletas sin placa,
   vehículos motorizados sin bicycleCode.
4. Un vehículo tiene **como máximo una sesión ACTIVE por parqueadero**.
5. Solo se parquean vehículos registrados (v2) y en puestos `FREE` de su tipo.
6. Números de ticket y de factura son consecutivos **por parqueadero**.
7. El precio siempre se calcula en el servidor al momento del confirm, y queda congelado en
   `PricingSnapshot` junto a la factura.
8. La suma de los medios de pago debe igualar exactamente el total; el efectivo exige
   `recibido ≥ a pagar` y el cambio queda registrado (excepto total $0 por gracia).
9. Anular pagos/facturas exige rol SUPERVISOR/ADMIN y motivo; nada se borra físicamente
   (estados `VOIDED` + auditoría).
10. Los movimientos y arqueos de caja solo se registran en turnos propios y abiertos; el
    cierre congela esperado/contado/diferencia.
11. Toda operación crítica deja `AuditLog` (y las tarifas, además, `tariff_change_log`).

---

## 9. Módulos legacy y rutas duplicadas

El repo contiene **dos generaciones** de módulos conviviendo. Solo la columna "Vigente" está
integrada al flujo operativo:

| Dominio | Vigente (usar) | Legacy (no usar / retirar) |
|---|---|---|
| Vehículos | `vehicles-v2` (tabla `vehicles_v2`, campo `plate`, requiere cliente) | `vehicles` (tabla `vehicles`, campo `licensePlate`, sin cliente, con blacklist que **nadie consulta en el check-in**) |
| Entrada/estancia | `parking-sessions` (check-in, activos, reimpresión, cancelación) | `tickets` (tabla `tickets`, tarifa fija $3.000/h en código) |
| Salida/cobro | `checkout` (preview/confirm + motor de tarifas + factura + pago + caja) | `POST /parking-sessions/:id/check-out` (tarifas fijas en código, sin factura ni pago) — lo usa el `CheckOutModal` del dashboard ⚠️ |
| Ingresos del dashboard | *(pendiente)* debería leer `payments`/`customer_invoices` | `ops.getDashboardStats` suma `tickets.amount` (siempre $0 con el flujo actual) ⚠️ |

**Riesgo de negocio**: mientras ambas rutas de salida existan, dos cajeros pueden cobrar
montos distintos por la misma estancia según la pantalla que usen, y la vía legacy no deja
rastro contable (ni factura, ni pago, ni caja).

---

## 10. Hallazgos y decisiones abiertas

Resumen priorizado de lo que el código hace hoy y requiere corrección o decisión de negocio.
(Referencias: servicio y línea aproximada.)

### Críticos (dinero / integridad)

| # | Hallazgo | Dónde |
|---|---|---|
| H1 | **Doble ruta de salida**: el `CheckOutModal` usa el check-out legacy con tarifas hardcodeadas y sin factura/pago/caja; `/ops/checkout` es el flujo correcto. Decidir: eliminar el endpoint legacy o redirigirlo al checkout formal. | `parking-sessions.service.ts:456`, `apps/web/.../CheckOutModal.tsx` |
| H2 | **`dailyRevenue` del dashboard lee la tabla legacy `tickets`** → siempre $0. Debe sumar `payments` `PAID` (o facturas `ISSUED`) del día. | `ops.service.ts:212` |
| H3 | **Módulo notificaciones roto**: hay dos clases `NotificationLog` mapeando la misma tabla con columnas distintas (`session_id`/`sent_at` vs `parking_session_id`/`created_at`); los GET devuelven 500. Unificar en una sola entidad alineada con la migración. | `modules/notifications/entities/` vs `entities/notification-log.entity.ts` |
| H4 | **Fugas multi-tenant**: `GET /checkout/invoices/:id/html` no filtra por empresa (cualquier usuario autenticado de otra empresa puede leer la factura por UUID); `GET /parking-sessions/by-ticket/:n` y `by-plate` tampoco scopean por empresa. | `invoice.service.ts:142`, `parking-sessions.service.ts:611-641` |
| H5 | **Cierre de caja mezcla métodos**: `expectedTotal` suma pagos con tarjeta/transferencia como si fueran efectivo del cajón → diferencias falsas en el arqueo. Separar esperado por método. | `shifts.service.ts:200` |
| H6 | **Concurrencia**: contadores de ticket/factura se incrementan con read-modify-write sin lock (duplicados posibles); el check-in asigna puesto sin lock pesimista (doble asignación posible — `assignSpot` sí lo hace bien, pero el check-in no lo usa). | `parking-sessions.service.ts:715`, `checkout.service.ts:428`, `occupancy.service.ts:289-329` |

### Medios (consistencia / reglas)

| # | Hallazgo | Dónde |
|---|---|---|
| H7 | La **gracia no descuenta** minutos cuando se supera (¿negocio lo quiere así? documentar la decisión); `billableMinutes` del breakdown es engañoso. | `pricing-engine.service.ts:49-77` |
| H8 | **`dailyMax` capa toda la estancia una sola vez**, no por día (estancias multi-día quedan casi gratis). | `pricing-engine.service.ts:114` |
| H9 | El motor **ignora el plan activo**: reglas activas de planes desactivados siguen cobrando; activar un plan no desactiva las reglas del anterior. | `pricing-engine.service.ts:255`, `pricing.service.ts:98` |
| H10 | **Multa por tiquete perdido duplicada e inconsistente**: checkout usa `max($5.000, 20 %)`; la config del parqueadero (`lostTicketFee`, seed $20.000) solo la usa el simulador. Unificar. | `checkout.service.ts:92,203` |
| H11 | `checkout.confirm` libera el puesto **sin limpiar `sessionId` ni escribir `spot_status_history`** (dato obsoleto + historial incompleto). Usar `releaseSpotSimple`/`releaseSpot`. | `checkout.service.ts:322-327` |
| H12 | `findActiveByPlate`: sin filtro de empresa y, si hay más de un vehículo con la placa, el `vehicleId` queda `undefined` y devuelve **cualquier** sesión activa del lot. | `parking-sessions.service.ts:611` |
| H13 | `requireOpenShiftForCheckout` también bloquea el **check-in** (nombre engañoso; ¿es la regla deseada?). | `parking-sessions.service.ts:90-109` |
| H14 | Columnas `timestamp` sin zona horaria + `plan.timezone` ignorado: el cobro depende de la TZ del servidor. Migrar a `timestamptz`. | entidades / motor |
| H15 | Errores de BD sin mapear: violaciones de unique (festivo duplicado) y UUID malformado en path params devuelven **500** en vez de 409/400 (falta `ParseUUIDPipe` y catch de constraints). | `holidays.service.ts:14`, controllers con `:id` |
| H16 | Frontend: URLs **hardcodeadas a `localhost:3002`** en pricing, simulador y `LiveQuote` (ignoran `NEXT_PUBLIC_API_URL`); CORS del backend hardcodeado a 3000/3003/3005 (ignora `CORS_ORIGIN`). | `apps/web/.../pricing/*.tsx`, `LiveQuote.tsx`, `apps/api/src/main.ts:22` |

### Menores / deuda

- Ticket `YYYYMMDD-####` con consecutivo que no se reinicia por día (o reiniciar por día o
  quitar la fecha del formato).
- Entidad `Refund` sin uso; las anulaciones no generan contramovimiento de caja.
- La blacklist de vehículos (legacy v1) no se consulta en el check-in.
- `console.log` con datos personales de clientes en servicios de producción (PII en logs).
- Campos de `TariffRule` que el motor ignora (`startTime`/`endTime`/`graceMinutes`/`dailyMax`)
  — retirar de la tabla o implementar.
- Respuestas con doble envoltura `{ data: { data, meta } }` por el `TransformInterceptor`
  (el front lo mitiga defensivamente).
- JWT de 7 días en `localStorage`, sin refresh tokens.
- El gateway realtime (WebSocket) es un stub: la ocupación "en vivo" se actualiza por polling.