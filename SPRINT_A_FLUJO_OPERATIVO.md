# ✅ Sprint A — Estabilización del flujo operativo (COMPLETADO)

**Fecha:** 11 de julio de 2026
**Objetivo:** que el flujo **entrada → salida → cobro** funcione de forma confiable con contexto multi-parqueadero, y cerrar los bugs de integración detectados en el Sprint 0.

---

## Verificación end-to-end (contra backend real, Docker + Postgres)

Se ejecutó el **camino del dinero completo** vía los mismos endpoints que usa la UI:

| Escenario | Resultado |
|-----------|-----------|
| Check-in (crea cliente → vehículo → sesión, asigna puesto, genera ticket) | ✅ ticket `20260711-0002`, puesto asignado |
| Cobro **efectivo** (180 min → 3h × $3.000) | ✅ factura `INV-00000001`, total **$9.000**, cambio $1.000, sesión `CLOSED` |
| Cobro **mixto** (efectivo + tarjeta, 300 min → $15.000) | ✅ factura `INV-00000003`, items `CASH:7500, CARD:7500` |
| Salida en **periodo de gracia** (total $0) | ✅ factura `INV-00000002`, sesión cerrada sin cobro |

> El motor de tarifas calcula correctamente por hora, el snapshot de precio se guarda, la factura se emite con consecutivo, el puesto se libera y la sesión se cierra en una transacción.

**Build final:** API `nest build` ✅ · Web `next build` ✅ · Tests `19/19` ✅

---

## Cambios realizados

### 🐛 Bugs de integración corregidos
1. **FK equivocada (crítico):** `parking_sessions.vehicle_id` referenciaba la tabla legacy `vehicles`, pero la app inserta ids de `vehicles_v2` → el check-in fallaba con `QueryFailedError` (violación de FK).
   - Corregido en la migración fuente `1705400000000-Sprint4-ParkingSessions.ts` (`REFERENCES vehicles_v2`).
   - Nueva migración `1768600000000-FixParkingSessionVehicleFk.ts` para bases existentes.
   - Aplicado también a la DB en ejecución.
2. **Auth rota en `parking-sessions.service.ts`:** usaba `fetch` con cookies y **sin** header Authorization. Reescrito para usar el cliente `api` (axios) que inyecta el Bearer token.
3. **Query con columnas inexistentes** en `invoice.service.ts` (`vehicle.licensePlate`/`bikeCode`) → corregido a `plate`/`bicycleCode` (el listado de facturas con búsqueda fallaba en runtime).
4. **CheckInModal resiliente al envelope:** `customerId`/`vehicleId` se leían como `obj.id` cuando los servicios devuelven `{ data, meta }`. Ahora `obj?.data?.id ?? obj?.id` (funciona con o sin envoltura).
5. **Checkout en periodo de gracia (total $0):** la validación de efectivo rechazaba `receivedAmount = 0` (porque `!0` es truthy). Ahora solo se exige monto recibido cuando `amount > 0`, permitiendo la salida sin cobro.

### 🏢 Contexto multi-parqueadero (elimina hardcodes)
6. **`lib/parkingContext.ts`** (nuevo): helper + hook `useActiveParkingLotId()` que resuelve el parqueadero activo desde el selector o el perfil del usuario, y reacciona a cambios.
7. **`components/ParkingLotSelector.tsx`** (nuevo): selector en el `TopBar` que lista los parqueaderos de la empresa (`GET /parking-lots`) y permite cambiar el activo (se oculta/colapsa con 0-1 lotes).
8. Reemplazados los **5 UUID hardcodeados** (`b04f6eec-…`, que además era incorrecto) en `occupancy`, `spots`, `zones`, `tickets`, `tickets/active` y el fallback del `dashboard`, por el contexto. Los efectos ahora dependen de `parkingLotId` y se guardan contra valor vacío.

---

## 🔎 Hallazgos nuevos (para próximos sprints / endurecimiento)

1. **Timestamps sin zona horaria (`timestamp without time zone`)** en `parking_sessions` (`entry_at`, `exit_at`) y probablemente otras tablas. La app es consistente *solo* porque inserta y lee vía Node en la misma TZ (America/Bogota). Cualquier SQL directo, reporte o cambio de TZ del servidor **rompe el cálculo de cobro**. Recomendado migrar a `timestamptz`. → *Sprint F (endurecimiento).*
2. **El seed no crea zonas/puestos ni configura ocupación** para el parqueadero demo (capacidad 0 en todos los tipos). Debe ampliarse el seed para un arranque demostrable. → *Sprint 0/E.*
3. **Contrato de API con doble envoltura** `{ data: { data, meta }, meta }` en endpoints paginados: se mitigó de forma defensiva, pero la unificación formal (tipo `ApiResponse<T>` único) sigue pendiente. → *deuda transversal.*
4. **Validación de suma de pagos estricta** (`paymentTotal !== total`): correcta, pero si entre el *preview* y el *confirm* se cruza un límite de facturación (p. ej. una hora), el total recalculado cambia y se rechaza. Aceptable por ahora; considerar una confirmación de total.

---

## Estado de servicios (para probar en la UI)
- Postgres + pgAdmin: contenedores Docker activos (`npm run docker:up`).
- API: `http://localhost:3001/api/v1` (Swagger en `/docs`).
- Web: `npm run web:dev` → `http://localhost:3000`.
- Login demo: `admin@demo.com` / `Admin123*` (tiene parqueadero **Parqueadero Centro** asignado).

> Nota: para una demo visual completa falta poblar zonas/puestos del parqueadero (hallazgo #2). El flujo ya fue verificado creando esa data vía API.

---

## Definition of Done — cumplida
- [x] Check-in y check-out funcionan sin errores contra el backend real.
- [x] Cobro en efectivo, mixto y salida en gracia verificados.
- [x] Factura generada con consecutivo; puesto liberado; sesión cerrada.
- [x] Contexto de parqueadero seleccionable (sin UUID hardcodeado).
- [x] Bugs de integración del Sprint 0 cerrados.
- [x] Builds y tests en verde.
