# Arquitectura del Sistema 🏗️

> Refleja el estado real del código a 2026-07-14. Para las **reglas de negocio** (flujos,
> tarifas, caja, invariantes), ver [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md) — ese es el
> documento canónico de negocio; este cubre la estructura técnica.

## Visión General

Monorepo (npm workspaces) con backend y frontend separados:

```
parkingApp/
├── apps/api   → NestJS 10 + TypeORM + PostgreSQL (REST, JWT, Swagger en /docs)
├── apps/web   → Next.js 14 (App Router) + TailwindCSS + Axios + React Query
├── infra/     → docker-compose (PostgreSQL 15-alpine + pgAdmin)
└── docs/      → documentación
```

## Stack Tecnológico

### Backend (NestJS)
- **Framework**: NestJS v10, TypeScript
- **ORM**: TypeORM (migraciones manuales, `synchronize: false`)
- **Base de Datos**: PostgreSQL (imagen `postgres:15-alpine` en `infra/docker-compose.yml`)
- **Autenticación**: JWT (passport-jwt) — payload: `sub`, `email`, `role`, `companyId`, `parkingLotId`
- **Validación**: class-validator + ValidationPipe global (`whitelist` + `forbidNonWhitelisted`)
- **Documentación**: Swagger/OpenAPI en `/docs`
- **Seguridad**: Helmet, bcrypt (10 rounds), guards `JwtAuthGuard` + `RolesGuard`

### Frontend (Next.js)
- Next.js v14 App Router, TypeScript, TailwindCSS
- HTTP: Axios (`src/lib/api.ts`, inyecta el Bearer token desde `localStorage`, redirige a
  `/login` ante 401)
- Data fetching: TanStack Query + servicios en `src/services/` y `src/lib/`
- Formularios: React Hook Form + Zod

## Módulos del Backend

22 módulos de negocio en `apps/api/src/modules/` (más `realtime`, un stub sin cablear).
Tras el Sprint F se retiró el módulo `vehicles` v1. Agrupados por dominio:

### Núcleo / plataforma
| Módulo | Responsabilidad |
|---|---|
| `auth` | Login (`POST /auth/login`), emisión y validación de JWT, auditoría de logins |
| `users` | Usuarios (roles `ADMIN`/`SUPERVISOR`/`CASHIER`); listar/ver (ADMIN, SUPERVISOR) |
| `companies` | Empresas (multi-tenant); listar (ADMIN) |
| `parking-lots` | Parqueaderos de la empresa (incluye `ticketHeader` para el ticket térmico) |
| `audit` | `AuditLog` de toda operación crítica (before/after, IP, user-agent); consulta solo ADMIN |

### Maestros de operación
| Módulo | Responsabilidad |
|---|---|
| `customers` | Clientes: documento único por empresa, búsqueda paginada, restricción de edición de documento para CASHIER |
| `vehicles-v2` | **Vehículos vigentes** (`vehicles_v2`): pertenecen a un cliente, placa/bicycleCode normalizados y únicos por empresa |
| `consents` | Historial de consentimientos WhatsApp/Email por cliente (GRANTED/REVOKED, append-only) |
| `parking-zones` / `parking-spots` | Zonas (tipos de vehículo permitidos) y puestos (código único por lot, estado, prioridad, historial de cambios) |
| `agreements` | Convenios de descuento (PERCENT/FIXED, vigencia) aplicados en el checkout |
| `holidays` | Festivos por país (globales) usados por el motor de tarifas |

### Operación (camino del dinero)
| Módulo | Responsabilidad |
|---|---|
| `ops` | Identificación rápida de taquilla (`/ops/identify`) y estadísticas del dashboard |
| `parking-sessions` | Check-in transaccional, sesiones activas, reimpresión, cancelación, historial, contador de tickets por lot |
| `occupancy` | Resumen de ocupación, asignación/liberación de puestos (con lock pesimista en `assignSpot`) |
| `pricing` | CRUD de planes/reglas/config + `pricing-engine` (cálculo por segmentos día/noche/festivo) + simulador |
| `checkout` | **Salida vigente**: preview/confirm, snapshot de precio, pago multi-método, factura con desglose de IVA 19 % + CUFE + HTML imprimible |
| `billing` | Facturación fiscal (Sprint C): `BillingResolution` por parqueadero (numeración DIAN con lock), `FiscalService` (IVA incluido, CUFE SHA-384). Sin transmisión real a la DIAN |
| `payments` | Consulta de pagos, estadísticas por método, anulación (SUPERVISOR/ADMIN) |
| `cash` | Turnos de caja (abrir/cerrar), movimientos INCOME/EXPENSE, arqueos por denominación, política por parqueadero |
| `notifications` | Registro de notificaciones (proveedor **mock**; entidad hoy desincronizada de la tabla — ver BUSINESS_LOGIC H3) |
| `realtime` | Stub de gateway WebSocket (sin uso; la UI usa polling) |

### Legacy retirado (Sprint F / F3)
| Módulo | Estado |
|---|---|
| `vehicles` (v1) | **Módulo eliminado.** La entidad/tabla `vehicles` permanece (referenciada por `parking-lot` y `notification-log`) |
| `tickets` (flujo) | `TicketsController`/`TicketsService` (tarifa fija) **eliminados**. El módulo `tickets` conserva solo `TicketTemplatesService` (plantillas de ticket, usado por parking-sessions) |

## Entidades y ubicación

Las entidades viven en dos lugares (histórico del proyecto):

- `apps/api/src/entities/` — la mayoría (sesiones, spots, zonas, customer, vehicle-v2,
  tarifas, pagos, facturas, caja, convenios, festivos, consentimientos…).
- `apps/api/src/modules/<m>/entities/` — `User`, `Company`, `ParkingLot`, `AuditLog` y una
  **segunda** `NotificationLog` (duplicada — ver BUSINESS_LOGIC H3).

### Relaciones principales

```
Company 1─N ParkingLot 1─N ParkingZone 1─N ParkingSpot
Company 1─N User (rol; parkingLot opcional)
Company 1─N Customer 1─N VehicleV2
Customer 1─N Consent            Customer N─1 Agreement (opcional)
ParkingSession N─1 VehicleV2 / ParkingSpot / Customer / ParkingLot
ParkingSession 1─N CustomerInvoice (1─1 en la práctica) / 1─1 PricingSnapshot
Payment N─1 ParkingSession, 1─N PaymentItem, N─1 CashShift (opcional)
CashShift 1─N CashMovement / CashCount;  CashPolicy 1─1 ParkingLot
TariffPlan 1─N TariffRule;  PricingConfig 1─1 ParkingLot
BillingResolution 1─1 ParkingLot (numeración fiscal DIAN)
ParkingLotCounter / InvoiceCounter: consecutivos por parqueadero (InvoiceCounter es el respaldo cuando no hay resolución)
```

## Seguridad

1. **Autenticación**: JWT (expiración `JWT_EXPIRATION`, default 7d). Sin refresh tokens.
   El frontend guarda el token en `localStorage` (pendiente migrar a cookie httpOnly).
2. **Autorización**: `@Roles(...)` por endpoint (matriz completa en BUSINESS_LOGIC §2)
   + scoping por `companyId` del JWT en los servicios.
   ⚠️ Excepciones conocidas sin scoping: `GET /checkout/invoices/:id/html`,
   `GET /parking-sessions/by-ticket/:n`, `by-plate` (BUSINESS_LOGIC H4).
3. **Validación**: DTOs con class-validator; falta `ParseUUIDPipe` en varios `:id`
   (UUID malformado → 500, BUSINESS_LOGIC H15).
4. **Headers**: Helmet. **CORS**: ⚠️ hardcodeado en `main.ts` a
   `localhost:3000/3003/3005` — la variable `CORS_ORIGIN` **se ignora**.
5. **Passwords**: bcrypt 10 rounds, `@Exclude()` en respuestas.

## Convenciones de respuesta

`TransformInterceptor` global envuelve todo en `{ data, meta }`. Los endpoints paginados que
ya devuelven `{ data, meta }` quedan con **doble envoltura** `{ data: { data, meta } }`; el
frontend lo maneja defensivamente (`obj?.data?.id ?? obj?.id`). Deuda transversal conocida.

## Base de datos

- Migraciones: `src/database/migrations/` (orden por timestamp; la de Sprint 4 fue
  renumerada a `1705400000000` para correr antes que las de checkout).
- Seeds (`npm run seed`): 1 empresa, 1 parqueadero ("Parqueadero Centro"), 3 usuarios demo,
  4 zonas / 50 puestos (20 autos, 15 motos, 5 camiones, 10 bicis), 2 clientes con vehículos y
  consentimientos, plan "Tarifa Base 2026" (24 reglas), config de pricing (gracia 15 min,
  multa $20.000), resolución de facturación demo (prefijo FE, rango 1000–5000, ambiente
  pruebas) y festivos CO 2026.
- ⚠️ Columnas de fecha como `timestamp` **sin** zona horaria; el cálculo de tarifas depende
  de la TZ del servidor (BUSINESS_LOGIC H14).

## Variables de Entorno

### Backend (`apps/api/.env`)

```env
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

DB_HOST=localhost
DB_PORT=5433            # el compose de este repo publica Postgres en 5433
DB_USERNAME=parking_user
DB_PASSWORD=parking_pass_2026
DB_DATABASE=parking_system

JWT_SECRET=...
JWT_EXPIRATION=7d

CORS_ORIGIN=...         # ⚠️ actualmente ignorada (CORS hardcodeado en main.ts)
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

⚠️ Algunas pantallas (pricing, simulador, LiveQuote) tienen la URL del API **hardcodeada a
`localhost:3002`** y no leen esta variable (BUSINESS_LOGIC H16).

## Frontend — mapa de rutas

| Ruta | Pantalla |
|---|---|
| `/login` | Autenticación |
| `/dashboard` | KPIs, ocupación, alertas, acciones rápidas (check-in/checkout modales) |
| `/dashboard/{customers,vehicles,zones,spots,occupancy,pricing,tickets}` | Administración y monitoreo |
| `/ops/checkout` | **Cobro de salida vigente** (preview → medios de pago → confirm → factura) |
| `/ops/invoices`, `/ops/payments` | Consulta y anulación de facturas/pagos |
| `/cash/{open,movements,count,close,history,shifts}` | Ciclo completo del turno de caja |

## Testing y calidad

- Unit tests del backend: `npm test` en `apps/api` (19 tests; cubren motor de tarifas y turnos).
- Scripts E2E manuales en la raíz (`test-checkout-flow.js`, `test-sprint*.sh`) — históricos.
- Lint/format: ESLint + Prettier; hooks con husky + lint-staged.

---

**Última actualización**: 2026-07-14 — sincronizado con el código real.