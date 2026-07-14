# ✅ Sprint C — Facturación formal (DIAN-ready) (COMPLETADO)

**Fecha:** 14 de julio de 2026
**Decisiones de negocio:** Responsable de IVA, **precio ya incluye IVA 19%**. Alcance: **factura formal DIAN-ready sin transmisión** (numeración por resolución, datos legales, IVA, CUFE, QR, HTML imprimible). No incluye firma XAdES ni envío real a la DIAN (requieren proveedor tecnológico + certificados).

---

## Qué se implementó

### Cálculo fiscal (IVA incluido en el precio)
Del total neto (después de descuento) se extrae el IVA:
`base = round(total / 1.19)`, `iva = total − base`. Siempre `base + iva = total` (sin pérdida por redondeo, verificado en tests).

Ejemplo: total $9.000 → base $7.563 + IVA (19%) $1.437.

### Numeración por resolución DIAN
- Entidad `BillingResolution` por parqueadero: `prefix`, `resolutionNumber`, rango `[rangeFrom, rangeTo]`, vigencia, `technicalKey`, `environment` (2=pruebas), consecutivo `currentNumber`.
- El checkout reserva el siguiente consecutivo con **bloqueo pesimista** (evita duplicados) dentro del rango; si se agota, error claro. Si no hay resolución, cae al contador simple `INV-xxxxx`.
- Número de factura = `prefix + consecutivo` (p. ej. `FE1000`, `FE1001`).

### CUFE (Código Único de Factura Electrónica)
- `FiscalService.computeCufe`: SHA-384 sobre la concatenación oficial DIAN (NumFac, fecha/hora, base, IVA(01), INC(04)=0, ICA(03)=0, total, NIT emisor, doc adquirente, clave técnica, ambiente).
- Determinista y sensible a cambios (tests). **Nota:** para validez ante la DIAN se requiere la clave técnica real de la resolución y transmisión habilitada.

### Factura imprimible conforme (HTML + QR)
`GET /checkout/invoices/:id/html` ahora incluye: título "FACTURA ELECTRÓNICA DE VENTA", número, **resolución DIAN**, emisor (razón social + NIT + dirección), adquirente, líneas, **descuento**, **base gravable**, **IVA 19%**, total, **CUFE** y **código QR** (generado server-side con `qrcode`, embebido como data-URI).

### Campos nuevos en `customer_invoices`
`taxable_base`, `tax_rate`, `tax_amount`, `cufe`, `resolution_number` (migración `1768800000000-FiscalInvoicing.ts`).

### Administración / seed
- `GET /billing/resolutions/:parkingLotId` y `PUT /billing/resolutions` (Admin) para configurar la resolución.
- El seed crea una resolución demo (prefijo `FE`, rango 1000-5000, ambiente pruebas).

### Frontend
- Checkout `ops/checkout`: el desglose muestra **Base gravable** e **IVA (19%)** además de subtotal/descuento/total.
- Tipos `CheckoutPreview` y `CustomerInvoice` extendidos con campos fiscales.

---

## Verificación end-to-end (API real)

| Ítem | Resultado |
|------|-----------|
| Resolución configurada (rango 1000-2000) | ✅ `currentNumber` inicia en 999 |
| Total $9.000 → base/IVA | ✅ base $7.563 + IVA $1.437 = $9.000 |
| Numeración | ✅ 1ª factura `FE1000`, 2ª `FE1001` (consecutivo) |
| CUFE | ✅ SHA-384 (96 hex), determinista |
| HTML imprimible | ✅ título, número, resolución, base, IVA, CUFE, **QR**, NIT emisor |

**Tests:** 33/33 (7 nuevos de `FiscalService`: IVA sin pérdida por redondeo, CUFE determinista). API build ✅ · Web build ✅.

---

## Pendiente para "facturación electrónica real" (fuera de alcance de este sprint)
Requiere credenciales externas y no es implementable/verificable aquí sin ellas:
- Proveedor tecnológico autorizado o set de pruebas DIAN (habilitación).
- Certificado digital + firma **XAdES** del XML **UBL 2.1**.
- Transmisión y recepción de **CUFE validado**, eventos (acuse, rechazo), notas crédito/débito electrónicas.
- El modelo ya guarda CUFE, resolución y ambiente, listo para conectar un proveedor.
