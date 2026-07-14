# CLAUDE.md — Contexto del proyecto

Sistema SaaS de gestión de parqueaderos. Monorepo npm workspaces:
`apps/api` (NestJS 10 + TypeORM + PostgreSQL) y `apps/web` (Next.js 14 App Router).

## Documentación — dónde está la verdad

| Doc | Rol |
|---|---|
| `docs/BUSINESS_LOGIC.md` | **Canónico**: lógica de negocio end-to-end, RBAC, motor de tarifas, caja, invariantes, hallazgos **H1–H16** (referirse a ellos por código, p. ej. "fix H4") |
| `docs/ROADMAP.md` | Plan priorizado: **Sprint D** (correcciones críticas D1–D7), **Sprint E** (decisiones de negocio E1–E7), **Sprint F** (endurecimiento F1–F9) |
| `docs/ARCHITECTURE.md` | Módulos (23), entidades, seguridad, envs |
| `SPRINT_*.md` (raíz) | Bitácora histórica. Sprints A (flujo operativo), B (convenios) y C (facturación DIAN) COMPLETADOS. Ante conflicto manda BUSINESS_LOGIC.md |

**Al terminar trabajo significativo**: actualizar BUSINESS_LOGIC.md (si cambian reglas),
marcar el ítem en ROADMAP.md y dejar un `SPRINT_X_*.md` breve como bitácora.

## Arranque y puertos (este clon)

```bash
docker compose -f infra/docker-compose.yml up -d   # Postgres 15 en host 5433, pgAdmin 5051
cd apps/api && npm run migration:run && npm run seed && npm run start:dev   # API :3001
cd apps/web && npx next dev -p 3003                                         # Web :3003
```

- **CORS hardcodeado** en `apps/api/src/main.ts` a 3000/3003/3005 (ignora `CORS_ORIGIN`).
  La web DEBE correr en uno de esos puertos. Aquí se usa **3003** (el 3000 lo ocupa otro
  proyecto de la máquina).
- `apps/api/.env`: `DB_PORT=5433` (el compose no publica en 5432).
- Login demo: `admin@demo.com` / `Admin123*` (también `supervisor@…/Super123*`,
  `cajero@…/Cajero123*`). El seed crea 4 zonas / 50 puestos, tarifas "Tarifa Base 2026",
  resolución DIAN demo (prefijo FE) y festivos CO 2026.
- Tests: `cd apps/api && npm test`. Builds: `npm run api:build` / `npm run web:build`.

## Reglas del dominio que no hay que romper

- **Flujo vigente**: cliente → vehículo **v2** (`/vehicles-v2`) → `POST
  /parking-sessions/check-in` → `/checkout/preview` → `/checkout/confirm`.
  **NO usar** los legacy: `/vehicles` (v1), `/tickets`, ni
  `POST /parking-sessions/:id/check-out` (tarifas hardcodeadas, sin factura/caja — H1).
- El precio SIEMPRE lo calcula el servidor en el confirm (motor de tarifas + convenio) y
  queda congelado en `PricingSnapshot`. Los medios de pago deben sumar exacto el total.
- Precio **incluye IVA 19 %**; `FiscalService` extrae base/IVA y calcula CUFE; numeración de
  factura por `BillingResolution` (lock pesimista) con fallback `INV-########`.
- Todo se scopea por `companyId` del JWT (excepciones conocidas = H4, pendientes de fix).
- La política de caja por defecto exige turno abierto para check-in y checkout; abrir turno
  con el usuario cajero antes de probar flujos.
- Operaciones críticas escriben `AuditLog`; anulaciones exigen SUPERVISOR/ADMIN + motivo.

## Trampas conocidas

- Migraciones: orden por timestamp; `Sprint4-ParkingSessions` fue renumerada a
  `1705400000000` para correr antes que las de checkout. No renumerar hacia atrás.
- `TransformInterceptor` global envuelve en `{data, meta}` → endpoints paginados quedan con
  doble envoltura; el front lee `obj?.data?.id ?? obj?.id`.
- Hay entidades en `src/entities/` (mayoría) y en `src/modules/*/entities/` (User, Company,
  ParkingLot, AuditLog y una `NotificationLog` **duplicada/rota** — H3).
- Pantallas de pricing/simulador/LiveQuote tienen la URL del API hardcodeada a
  `localhost:3002` (H16): fallan aunque el resto funcione.
- Columnas `timestamp` sin zona horaria: no cambiar la TZ del servidor ni hacer SQL directo
  con fechas sin considerar H14.
