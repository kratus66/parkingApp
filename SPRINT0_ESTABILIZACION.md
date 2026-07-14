# ✅ Sprint 0 — Estabilización (COMPLETADO)

**Fecha:** 11 de julio de 2026
**Objetivo:** dejar el proyecto **instalable, compilable y con la suite de tests en verde**, como base para poder verificar el resto de sprints.

---

## Resultado

| Verificación | Estado |
|--------------|--------|
| Instalación de dependencias (workspaces) | ✅ `npm install` en la raíz |
| Backend compila (`nest build`) | ✅ EXIT 0 |
| Frontend compila (`next build`) | ✅ EXIT 0, todas las rutas generadas |
| Módulo nativo `bcrypt` (login) | ✅ funciona (binario precompilado) |
| Tests backend (`jest`) | ✅ **19/19 en 3 suites** (antes: 14/14 fallaban) |

---

## Cambios realizados

### Frontend — compilación (`apps/web`)
1. **`tsconfig.json`**: excluidas las maquetas de referencia de diseño (`design-reference/` y `src/parking-management-dashboard/`) que son proyectos Next embebidos con dependencias inexistentes (`Geist`, `@vercel/analytics`) y rompían el `next build`. No forman parte de la app.
2. **`src/app/cash/count/page.tsx`**: tipado seguro con `NonCashMethod` (el efectivo se cuenta por denominaciones; los demás métodos por monto). Elimina el error de indexación de `CashCountMethod.CASH`.
3. **`src/app/dashboard/tickets/page.tsx`**: `session.spot.zone.name` → guardado con `session.spot.zone ? …` (null-safety real).
4. **`src/services/vehicleService.ts`**: se agregó y exportó la interfaz `CreateVehicleDto` (faltaba el export que importaba `vehicles/new`), y se tiparon `create`/`update`.
5. **`src/services/parking-sessions.service.ts`**: bug real corregido — usaba `NEXT_PUBLIC_API_URL` como identificador suelto (indefinido) en 3 lugares; ahora usa la constante `API_URL`.
6. **Manejo defensivo de la doble envoltura `{ data, meta }`** en `customers/[id]`, `customers`, `tickets/active`, `vehicles` y `occupancyService` (casts a `any` documentados con nota de Sprint A). Ver hallazgo #1 abajo.

### Backend — tests (`apps/api`)
Los 3 `.spec.ts` estaban desactualizados respecto a los constructores actuales de los servicios:
7. **`invoice.service.spec.ts`**: se agregaron los providers faltantes (`CustomerInvoiceItem`, `AuditLog`, `ParkingLot`) y se corrigió el token `DataSource` (era string). Fixture actualizado (`subtotal`, `discounts`, `currency`, `issuedAt`) y campo `plate` (antes `licensePlate`).
8. **`checkout.service.spec.ts`**: se agregaron 6 repos faltantes (`ParkingSpot`, `PaymentItem`, `CustomerInvoiceItem`, `AuditLog`, `CashShift`, `CashPolicy`) y se cambiaron los tokens string por las clases reales (`PricingService`, `NotificationsService`, `InvoiceService`, `DataSource`).
9. **`shifts.service.spec.ts`**: corregida ruta de import de `AuditLog`; y corregida **fuga de mocks entre tests** (`save.mockResolvedValue` permanente que `clearAllMocks` no resetea → cambiado a `mockResolvedValueOnce`). Aserción de formato numérico ajustada a es-CO (`10.000`, no `10,000`).

> Ninguno de estos cambios toca la lógica de negocio; solo desbloquean compilación y tests.

---

## 🔎 Hallazgos para el Sprint A (deuda técnica detectada)

Estos NO se corrigieron aquí (exceden el alcance de "estabilizar"), pero quedan documentados:

1. **Contrato de API inconsistente (doble envoltura).** El backend envuelve **toda** respuesta en `{ data, meta }` vía `TransformInterceptor` global, pero los servicios del frontend están tipados como si devolvieran la entidad directa, y conviven dos convenciones de desenvoltura. Debe unificarse (tipar el wrapper una sola vez en `api.ts` o en un tipo `ApiResponse<T>`).
2. **Auth por cookies vs. JWT en localStorage.** `parking-sessions.service.ts` usa `fetch` con `credentials: 'include'` y **sin header Authorization**; el resto usa axios con Bearer token desde localStorage. Estas llamadas fallarán autenticación.
3. **Query con nombres de columna equivocados.** En `invoice.service.ts` la búsqueda usa `vehicle.licensePlate` y `vehicle.bikeCode`, pero la entidad define `plate` y `bicycleCode` → la query de listado de facturas fallará en runtime.
4. **Fallback de URL de API inconsistente** (`localhost:3002` en código vs. `3001` real). Mitigado por `.env.local`, pero conviene unificar el default.
5. **Tabla de vehículos duplicada** (`vehicles` vs `vehicles-v2`) — ya listado en el informe principal.

---

## ▶️ Arranque reproducible (llave en mano)

**Requisitos:** Node 20+, Docker Desktop.

```bash
# 1. Dependencias (desde la raíz del monorepo)
cd parkingApp
npm install

# 2. Base de datos (PostgreSQL 15 en el puerto host 5433 + pgAdmin)
npm run docker:up

# 3. Migraciones y datos demo
cd apps/api
npm run migration:run
npm run seed

# 4. Backend  → http://localhost:3001/api/v1  (Swagger en /docs)
npm run start:dev

# 5. Frontend (otra terminal) → http://localhost:3000
cd ../web
npm run dev
```

**Verificaciones rápidas:**
```bash
# Backend compila y tests en verde
cd apps/api && npx nest build && npx jest

# Frontend compila
cd apps/web && npx next build
```

**Usuarios demo (tras el seed):** admin@demo.com / Admin123* · supervisor@demo.com / Super123* · cajero@demo.com / Cajero123*

**Config relevante:** DB en `localhost:5433` (`.env` de api) · API en `:3001` · Frontend en `:3000` (`.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`).

---

## Pendiente para cerrar el Sprint 0 al 100% (opcional, recomendado)
- [ ] **CI** (GitHub Actions): job que corra `npm ci` + `nest build` + `jest` + `next build` en cada push/PR.
- [ ] Un único script raíz de arranque (`setup` ya existe en `setup.sh`/`setup.bat`; verificar que cubre migraciones + seed).
- [ ] Resolver las 52 vulnerabilidades reportadas por `npm audit` (revisar cuáles son de dependencias de build).

Con esto, la base queda lista para arrancar el **Sprint A** (estabilización del flujo operativo + contrato de API + selector de parqueadero).
