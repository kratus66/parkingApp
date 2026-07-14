# ✅ Sprint B — Convenios y descuentos (COMPLETADO)

**Fecha:** 14 de julio de 2026
**Objetivo:** permitir descuentos por convenios (acuerdos con empresas/entidades) aplicados en el cobro, con gestión desde la UI.

---

## Modelo

**Entidad `Agreement` (convenio):**
- `name`, `nit` (opcional), `discountType` (`PERCENT` | `FIXED`), `discountValue`.
- Vigencia opcional (`validFrom`, `validUntil`), `isActive`.
- `parkingLotId` opcional: `null` = aplica a todos los parqueaderos de la empresa; con valor = solo ese parqueadero.
- Alcance por empresa (`companyId`), nombre único por empresa.

**Vínculo con cliente:** `Customer.agreementId` (opcional). Si el cliente tiene convenio, el descuento se **auto-aplica** en el checkout; el cajero también puede **seleccionar/forzar** un convenio en la salida.

**Reglas de cálculo** (`AgreementsService.computeDiscount`):
- PERCENT → `round(subtotal * valor / 100)`; FIXED → `valor`.
- Nunca negativo ni mayor que el subtotal.
- Respeta vigencia e `isActive` (fuera de rango o inactivo ⇒ 0).
- El descuento aplica al **servicio de parqueo**, no al recargo por ticket perdido.

---

## Backend
- Entidad `entities/agreement.entity.ts` + enum `AgreementDiscountType`.
- Migración `1768700000000-CreateAgreements.ts` (tabla `agreements` + `customers.agreement_id`).
- Módulo `modules/agreements/` (controller CRUD + service). Roles: listar/ver ADMIN/SUPERVISOR/CASHIER; crear/editar ADMIN/SUPERVISOR; eliminar ADMIN.
- Integración en checkout:
  - `CheckoutPreviewDto` / `CheckoutConfirmDto` aceptan `agreementId?`.
  - `preview` devuelve `subtotal`, `discount`, `agreement`, `total`.
  - `confirm` persiste la factura con `subtotal` (bruto), `discounts` y `total` (neto); valida que los pagos sumen el neto.
- `CreateCustomerDto` acepta `agreementId?` (link del cliente).

## Frontend
- `services/agreements.service.ts` (CRUD).
- Página **Convenios** `/dashboard/agreements` (tabla + alta/edición/eliminación) y enlace en el sidebar.
- Checkout `ops/checkout`: selector de convenio + desglose **Subtotal / Descuento / Total**; re-cotiza al cambiar convenio o "ticket perdido". Corregido además el desenvuelto del envelope en `preview`/`confirm` (antes `preview.total` quedaba `undefined`).
- Formulario de cliente `customers/new`: selector de convenio.

---

## Verificación end-to-end (API real)

| Escenario | Resultado |
|-----------|-----------|
| Descuento **explícito** en checkout (20%) | ✅ subtotal 6000, descuento 1200, total 4800 |
| Descuento **auto por cliente** (FIXED $2.500) | ✅ subtotal 6000, descuento 2500, total 3500 |
| **Sin convenio** (control) | ✅ subtotal 6000, descuento 0, total 6000 |
| **Confirm completo** (25%, 4h) | ✅ `INV-00000007` subtotal 12000, discounts 3000, total 9000, sesión CLOSED, factura coherente |

**Tests:** 26/26 (7 nuevos para `computeDiscount`: porcentaje, fijo, tope, inactivo, vigencia). API build ✅ · Web build ✅.

---

## Notas / pendientes menores
- El descuento auto se toma del `Customer.agreementId`; en el checkout el cajero puede sobreescribirlo.
- La factura HTML imprimible aún no muestra la línea de descuento por separado (usa subtotal/total); mejora cosmética para un sprint de facturación.
- Sigue pendiente (deuda transversal del Sprint A): unificación formal del contrato `{data,meta}` y migración a `timestamptz`.
