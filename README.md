# Sistema de Gestión de Parqueaderos 🚗

Sistema SaaS multi-empresa para la gestión integral de parqueaderos, construido con **NestJS**,
**Next.js**, **PostgreSQL** y **TypeScript**.

## 📚 Documentación

| Documento | Contenido |
|---|---|
| **[docs/BUSINESS_LOGIC.md](docs/BUSINESS_LOGIC.md)** | **Lógica de negocio de punta a punta** (flujos, tarifas, caja, invariantes, hallazgos). Documento canónico. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura técnica: módulos, entidades, seguridad, variables de entorno |
| [QUICKSTART.md](QUICKSTART.md) | Puesta en marcha paso a paso |
| `SPRINT*.md`, `INFORME_*.md`, etc. (raíz) | **Históricos por sprint** — útiles como bitácora, pueden estar desactualizados; ante conflicto manda BUSINESS_LOGIC.md |

## ✨ Qué hace hoy

- ✅ **Multi-empresa / multi-parqueadero** con aislamiento por empresa (JWT) y selector de
  parqueadero activo en la UI
- ✅ **Roles** ADMIN / SUPERVISOR / CAJERO con permisos por endpoint
- ✅ **Registro de clientes y vehículos** (documento y placa únicos por empresa,
  bicicletas por código)
- ✅ **Check-in** con asignación de puesto (automática o manual), ticket térmico consecutivo
  por parqueadero, reimpresión con motivo y cancelación supervisada
- ✅ **Motor de tarifas** configurable: reglas por tipo de vehículo × día
  (hábil/fin de semana/festivo) × periodo (día/noche), unidades minuto/bloques/hora/día,
  redondeo, cargo mínimo, gracia, tope diario y simulador
- ✅ **Checkout** con preview, pago multi-método (efectivo con cambio, tarjeta,
  transferencia, QR), convenios de descuento y snapshot del cálculo
- ✅ **Facturación formal (DIAN-ready)**: desglose de **IVA 19%** (precio incluido),
  **numeración por resolución** DIAN (prefijo + rango consecutivo con bloqueo),
  **CUFE** (algoritmo SHA-384) y factura imprimible con datos legales, descuento, IVA,
  CUFE y **QR**. *(No incluye transmisión/firma electrónica real — requiere proveedor DIAN.)*
- ✅ **Caja por turnos**: base inicial, movimientos ingreso/egreso, arqueo por
  denominaciones, cierre con esperado vs. contado y diferencia
- ✅ **Anulación** de pagos y facturas (supervisor/admin, con motivo, auditada)
- ✅ **Ocupación** por zonas/puestos con dashboard de KPIs y alertas de capacidad
- ✅ **Consentimientos** WhatsApp/Email por cliente (historial auditable)
- ✅ **Auditoría completa** de operaciones críticas
- ✅ **API REST documentada** con Swagger (`/docs`)

> ⚠️ **Módulos legacy**: `/vehicles` (v1) y `/tickets`, más el endpoint
> `POST /parking-sessions/:id/check-out`, son de generaciones anteriores y **no** deben
> usarse (tarifas fijas en código, sin factura ni caja). El flujo vigente es
> `vehicles-v2` + `parking-sessions/check-in` + `checkout`. Detalle en
> [BUSINESS_LOGIC.md §9](docs/BUSINESS_LOGIC.md#9-módulos-legacy-y-rutas-duplicadas).

## 🔧 Requisitos Previos

- **Node.js** v18+ y **npm** v9+
- **Docker** y **Docker Compose**
- **Git**

## 📁 Estructura del Proyecto

```
parkingApp/
├── apps/
│   ├── api/              # Backend NestJS
│   │   └── src/
│   │       ├── modules/  # 22 módulos de negocio (ver docs/ARCHITECTURE.md)
│   │       ├── entities/ # Entidades TypeORM compartidas
│   │       ├── common/   # Guards, decorators, filters, interceptors
│   │       ├── database/ # Data source, migraciones, seeds
│   │       └── main.ts
│   └── web/              # Frontend Next.js (App Router)
│       └── src/
│           ├── app/      # /login, /dashboard, /ops, /cash
│           ├── components/
│           ├── services/ # Clientes de API por dominio
│           └── lib/      # api.ts (axios), contexto de parqueadero
├── infra/docker-compose.yml   # PostgreSQL 15 + pgAdmin
├── docs/                      # BUSINESS_LOGIC.md, ARCHITECTURE.md
└── package.json               # Workspace raíz
```

## 🚀 Instalación y arranque

> Guía detallada en [QUICKSTART.md](QUICKSTART.md). Resumen:

```bash
npm install                                   # raíz (workspaces)

# 1. Base de datos (Postgres en host 5433, pgAdmin en 5051)
docker compose -f infra/docker-compose.yml up -d

# 2. Backend
cd apps/api
cp .env.example .env                          # ajusta DB_PORT=5433
npm run migration:run
npm run seed
npm run start:dev                             # http://localhost:3001/api/v1 — Swagger en /docs

# 3. Frontend (en otra terminal)
cd apps/web
cp .env.example .env.local                    # NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
npx next dev -p 3003                          # http://localhost:3003
```

### ⚠️ Puertos (importante)

| Servicio | Puerto | Nota |
|---|---|---|
| API | **3001** | `PORT` en `apps/api/.env` |
| Web | **3003** (o 3000/3005) | El CORS del backend está **hardcodeado** en `main.ts` a 3000/3003/3005 — la variable `CORS_ORIGIN` se ignora. Otros puertos fallarán por CORS. |
| PostgreSQL | **5433** (host) | Mapeado en `infra/docker-compose.yml`; por eso `DB_PORT=5433` |
| pgAdmin | **5051** | `admin@parking.com` / `admin123` |

**Credenciales demo** (tras `npm run seed`):

- **Admin**: `admin@demo.com` / `Admin123*`
- **Supervisor**: `supervisor@demo.com` / `Super123*`
- **Cajero**: `cajero@demo.com` / `Cajero123*`

El seed crea además: 1 empresa, el parqueadero "Parqueadero Centro" con 4 zonas y 50 puestos,
2 clientes con vehículos, el plan tarifario "Tarifa Base 2026" (24 reglas) y los festivos de
Colombia 2026.

## 🧪 Probar el flujo completo

1. Entra a `http://localhost:3003/login` con `cajero@demo.com`.
2. **Caja → Abrir turno** (la política por defecto lo exige para operar).
3. **Dashboard → Registrar entrada**: placa nueva → crea cliente + vehículo → ticket.
4. **Operaciones → Checkout**: busca la sesión, revisa el preview (motor de tarifas),
   cobra en efectivo y obtén la factura imprimible.
5. **Caja → Arqueo y cierre**: cuenta el efectivo y cierra el turno (diferencia esperado vs.
   contado).

## 🛠️ Tecnologías

**Backend**: NestJS 10 · TypeORM · PostgreSQL 15 · Passport JWT · Swagger · Bcrypt ·
class-validator
**Frontend**: Next.js 14 · React 18 · TypeScript · TailwindCSS · Axios · React Hook Form +
Zod · TanStack Query
**Infra**: Docker Compose (PostgreSQL + pgAdmin) · husky + lint-staged

## 📝 Scripts útiles

### Raíz
```bash
npm run api:dev / api:build       # backend
npm run web:dev / web:build       # frontend (web:dev usa el puerto 3000 por defecto)
npm run docker:up / docker:down   # base de datos
npm run lint / format
```

### Backend (`apps/api`)
```bash
npm run start:dev                 # hot-reload
npm run migration:run / migration:revert
npm run seed
npm run test                      # unit tests (motor de tarifas, turnos)
```

## 🔐 Seguridad

- Contraseñas con bcrypt (10 rounds); JWT con expiración configurable
- Guards de autenticación y roles por endpoint + scoping por empresa
- Helmet y validación global de DTOs (whitelist)
- Limitaciones conocidas (ver [BUSINESS_LOGIC.md §10](docs/BUSINESS_LOGIC.md#10-hallazgos-y-decisiones-abiertas)):
  token en localStorage sin refresh, CORS hardcodeado, y 3 endpoints sin scoping por empresa

## 📄 Licencia

MIT