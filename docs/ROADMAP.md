# Roadmap de correcciones y evolución

> Plan de trabajo priorizado a partir de la revisión completa de lógica de negocio
> (2026-07-14). Los códigos **H#** refieren a los hallazgos de
> [BUSINESS_LOGIC.md §10](BUSINESS_LOGIC.md#10-hallazgos-y-decisiones-abiertas) — usar esa
> numeración en commits y conversaciones ("fix H4") para trazabilidad.
>
> **Estado de sprints previos**: Sprint A (flujo operativo) ✅ · Sprint B (convenios) ✅ ·
> Sprint C (facturación DIAN-ready) ✅. Este roadmap define los sprints D, E y F.

---

## Sprint D — Correcciones críticas (dinero e integridad) ✅ COMPLETADO

> **Estado: COMPLETADO (2026-07-15)** en la rama `sprint-d-correcciones-criticas`.
> D1–D7 implementados; `npm run build` (api y web) y `npm test` (34/34) en verde.
> Resumen de lo hecho al final de cada ítem.

Objetivo: que no exista forma de cobrar mal, perder dinero de vista, ni filtrar datos entre
empresas. Todo es corrección de código sin decisiones de negocio pendientes.

### D1. Eliminar la doble ruta de salida (H1) — el más importante

- **Problema**: `CheckOutModal` (dashboard) llama `POST /parking-sessions/:id/check-out`
  ([parking-sessions.service.ts:456](../apps/api/src/modules/parking-sessions/parking-sessions.service.ts))
  que cobra con tarifas fijas en código ($3.000/h auto, etc.), sin motor de tarifas, sin
  IVA/factura, sin `Payment` y sin caja. Dos cajeros pueden cobrar distinto por la misma
  estancia y la vía rápida no deja rastro contable.
- **Fix propuesto**:
  1. Frontend: que `CheckOutModal` navegue a `/ops/checkout?sessionId=...` (o embeba el
     mismo flujo preview→confirm de `checkoutApi`).
  2. Backend: eliminar el endpoint legacy (o dejarlo devolviendo 410 con mensaje "use
     /checkout/confirm"). No dejarlo silenciosamente activo.
- **Aceptación**: no queda ningún camino en la UI ni endpoint activo que cierre una sesión
  con cobro sin pasar por `checkout.confirm`. Toda salida genera factura + pago + snapshot.

### D2. Recaudo del dashboard (H2)

- **Problema**: `dailyRevenue` suma la tabla legacy `tickets`
  ([ops.service.ts:212](../apps/api/src/modules/ops/ops.service.ts)) → siempre $0.
- **Fix**: sumar `payments` con `status = PAID` del día (por `parkingLotId`), excluyendo
  anulados. Opcional: desglose por método reutilizando `payments/stats`.
- **Aceptación**: tras un checkout de prueba, el KPI "Recaudo del día" del dashboard refleja
  el monto cobrado.

### D3. Fugas multi-tenant (H4)

- **Problema**: `GET /checkout/invoices/:id/html` no filtra por empresa
  ([invoice.service.ts:142](../apps/api/src/modules/checkout/invoice.service.ts));
  `GET /parking-sessions/by-ticket/:n` y `by-plate` tampoco.
- **Fix**: pasar `companyId` del JWT a `generateInvoiceHtml` y a las búsquedas de sesiones;
  filtrar en el `where`.
- **Aceptación**: un usuario de la empresa B recibe 404 al pedir la factura/sesión de la
  empresa A (probar con dos empresas seed o test e2e).

### D4. Arqueo de caja por método (H5)

- **Problema**: `expectedTotal` del cierre suma el total de **todos** los pagos
  ([shifts.service.ts:200](../apps/api/src/modules/cash/services/shifts.service.ts)),
  tratando tarjeta/transferencia como efectivo del cajón → diferencias falsas.
- **Fix**: calcular esperado **por método** desde `payment_items`:
  - Efectivo esperado = `openingFloat + Σ CASH(amount) + Σ INCOME − Σ EXPENSE`
    (el cambio ya está descontado porque `amount` es lo cobrado, no lo recibido).
  - Para CARD/TRANSFER/QR: esperado = Σ items de ese método (se compara contra el arqueo
    del mismo método, que la UI ya captura).
  - `difference` total = Σ (contado − esperado) por método; exponer el desglose en
    `getShiftSummary`.
- **Aceptación**: turno con 1 pago efectivo + 1 pago tarjeta cierra con diferencia $0 si el
  arqueo registra cada método por separado.

### D5. Notificaciones: entidad duplicada (H3)

- **Problema**: dos clases `@Entity('notification_logs')` con columnas distintas
  (`modules/notifications/entities/` vs `entities/notification-log.entity.ts`); los GET del
  módulo devuelven 500.
- **Fix**: dejar **una sola** entidad alineada con la migración real (la de
  `entities/notification-log.entity.ts`: `parking_session_id`, `channel`, `template`,
  `provider`, `payload`, `created_at`), actualizar `notifications.service` y borrar la
  duplicada.
- **Aceptación**: `GET /notifications/logs` y `/notifications/failed` responden 200.

### D6. Concurrencia en contadores y asignación de puesto (H6)

- **Problema**: contador de tickets (`getNextTicketNumber`) y contador de facturas de
  respaldo (`getNextInvoiceNumber`) hacen read-modify-write sin lock; el check-in asigna
  puesto sin lock pesimista (dos check-ins simultáneos pueden tomar el mismo puesto).
- **Fix**:
  - Contadores: `SELECT ... FOR UPDATE` (como ya hace `BillingService.nextNumber`) o
    `UPDATE ... SET n = n + 1 RETURNING n`.
  - Check-in: reutilizar el patrón de `occupancy.assignSpot` (lock pesimista dentro de la
    transacción) en vez de `findAvailableSpot` + `occupySpot`.
- **Aceptación**: script de 10 check-ins concurrentes no produce tickets duplicados ni
  puestos doblemente asignados.

### D7. Errores 500 evitables (H15 — arrastrado de la validación E2E)

- **Fix**: `ParseUUIDPipe` en todos los `@Param('id')`; capturar violaciones de unique
  (p. ej. festivo duplicado) → 409.
- **Aceptación**: `GET /checkout/invoices/no-es-uuid` → 400; crear festivo duplicado → 409.

---

## Sprint E — Reglas de negocio del motor ✅ COMPLETADO

> **Estado: COMPLETADO (2026-07-15)** en la rama `sprint-e-reglas-negocio`.
> Decisiones tomadas por el usuario; build api+web OK, tests 34/34.
> (E7 ya se había resuelto en el Sprint D junto con H12.)

| Ítem | Decisión aplicada | Dónde |
|---|---|---|
| E1. Gracia (H7) ✅ | Se **cobra la estancia completa** al superar los 15 min (estándar del sector); se corrigió el `billableMinutes`/`graceAppliedMinutes` del desglose para que no engañen. | `pricing-engine.service.ts` |
| E2. Tope diario (H8) ✅ | El `dailyMax` se aplica **por cada día calendario** (los segmentos ya se cortan a medianoche); una estancia multi-día ya no queda casi gratis. | `pricing-engine.service.ts` |
| E3. Planes tarifarios (H9) ✅ | `findApplicableRule` hace `innerJoin` con `tariffPlan` y exige `plan.isActive = true`: las reglas de planes desactivados dejan de cobrar. | `pricing-engine.service.ts` |
| E4. Tiquete perdido (H10) ✅ | **Eliminada la multa** por completo: si el cliente pierde el tiquete se reimprime gratis (búsqueda por placa, ya existente) y se cobra la estancia normal. Se quitó el campo `lostTicket` del DTO/servicio y el toggle de la UI. | `checkout.service.ts`, `checkout.dto.ts`, `ops/checkout/page.tsx` |
| E5. Anulaciones ✅ | Anular un pago con turno **abierto** genera un `CashMovement EXPENSE` automático por la **porción en efectivo** (devolución del cajón); tarjeta/transferencia/QR no lo afectan; la sesión **no** se reabre. Auditado. | `payments.service.ts` |
| E6. Política de caja (H13) ✅ | Separado en dos flags: `requireOpenShiftForCheckIn` y `requireOpenShiftForCheckout`, ambos `true` por defecto (migración `1768900000000`). El check-in usa su propio flag. | `cash-policy.entity.ts`, `parking-sessions.service.ts`, migración |
| E7. Búsqueda por placa (H12) ✅ | *(Ya resuelto en Sprint D.)* | — |

> **Nota sobre `PricingConfig.lostTicketFee`**: con E4 el checkout ya no aplica ninguna multa,
> por lo que ese campo de configuración queda **sin efecto en el cobro** (solo lo usa el
> simulador como escenario "qué pasaría si"). Se puede retirar en un futuro sprint de limpieza.

---

## Sprint F — Endurecimiento y limpieza (parcial)

> **Estado (2026-07-15)**: **F2, F3, F5, F6 COMPLETADOS** en la rama
> `sprint-f-endurecimiento` (build api+web OK, tests 34/34). **F1, F4, F7, F8 y F9
> DIFERIDOS** por riesgo/decisión (ver notas). Los completados van con ✅.

- **F1 (H14)** — *diferido*: migrar columnas de fecha a `timestamptz` y hacer que el motor use
  el `timezone` del plan. Es una migración de datos + rework del motor (hoy usa la hora local
  del proceso vía `getHours()`, sin librería TZ-aware). Merece su propio sprint enfocado;
  hacerlo a medias arriesga romper el cobro. Crítico antes de desplegar fuera de
  America/Bogota o transmitir facturas reales a la DIAN.
- **F2 (H16) ✅**: `main.ts` lee `CORS_ORIGIN` (lista separada por comas, con fallback a
  3000/3003/3005); se corrigieron `.env`/`.env.example`. Se eliminaron las URLs hardcodeadas
  `localhost:3002` en `pricing`, `simulator` y `LiveQuote` (ahora `NEXT_PUBLIC_API_URL`), y se
  corrigieron los fallbacks de `lib/api.ts` y `services/checkout.service.ts` (3002→3001).
- **F3 ✅**: retirados el flujo legacy `tickets` (`TicketsController`/`TicketsService`, que
  cobraba con tarifas fijas y usaba vehicles v1) y **todo** el módulo `vehicles` (v1). Se
  conservó `TicketTemplatesService` (lo usa parking-sessions para el contenido del ticket).
  Las **entidades** `Ticket` y `Vehicle` (v1) se mantienen porque `parking-lot.entity` y
  `notification-log.entity` las referencian; retirar sus tablas queda para una limpieza de
  esquema. La blacklist de v1 no se portó (no estaba en uso).
- **F4** — *diferido*: unificar el contrato de respuesta (doble envoltura
  `{data:{data,meta}}` del `TransformInterceptor`) y tipar `ApiResponse<T>`. Toca muchos
  consumidores del front (hoy lo manejan defensivamente); hacerlo mal rompe la UI.
- **F5 ✅**: eliminados los `console.log` que volcaban PII (nombre/documento/teléfono/email de
  clientes, placas) en `ops`, `parking-sessions` y `occupancy` (incluido el
  `JSON.stringify(ticketResponse)` del check-in).
- **F6 (H11) ✅**: `checkout.confirm` libera el puesto limpiando `sessionId` +
  `lastStatusChange` y escribiendo `spot_status_history`, en vez de solo mutar el estado.
- **F7** — *diferido (menor)*: ticket `YYYYMMDD-####` con consecutivo que no reinicia por día.
  ROI bajo (requiere columna de fecha + migración); la fecha del prefijo es cosmética.
- **F8** — *diferido*: seguridad de sesión (expiración corta + refresh token, token en cookie
  httpOnly en vez de `localStorage`). Refactor de seguridad front+back; su propio esfuerzo.
- **F9** — *diferido*: el gateway realtime es un stub (100% comentado, no cableado). Decidir
  entre **implementarlo** (live occupancy) o **eliminarlo** y estandarizar polling. Requiere
  tu confirmación explícita para borrar el módulo.

## Backlog funcional (post-estabilización)

- Transmisión real a la DIAN vía proveedor tecnológico (el módulo `billing` ya deja CUFE,
  resolución y campos fiscales listos).
- Notificaciones reales (WhatsApp/Email) sobre el registro de consentimientos ya existente.
- Reportes: recaudo por periodo/método/cajero, ocupación histórica, exportes.
- Mensualidades / planes para clientes frecuentes (los convenios ya cubren descuentos).
- Reservas de puestos (el estado `RESERVED` existe pero no tiene flujo).

---

## Cómo verificar cada sprint

1. **Unit**: `cd apps/api && npm test` (los 19 existentes + los que agregue cada fix).
2. **E2E manual del camino del dinero** (guía en [QUICKSTART.md](../QUICKSTART.md) paso 8):
   abrir turno → check-in → checkout (efectivo, mixto, gracia $0, tiquete perdido,
   convenio) → arqueo → cierre. El recaudo del dashboard debe cuadrar con el cierre de caja.
3. **Multi-tenant**: crear segunda empresa y verificar 404 cruzados (D3).
4. **Builds**: `npm run api:build` y `npm run web:build` en verde.