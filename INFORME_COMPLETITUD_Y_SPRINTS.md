# 📋 Informe de Completitud y Plan de Sprints — Parking Management System

**Fecha:** 11 de julio de 2026
**Revisor:** Auditoría técnica sobre el código real (no sobre documentación previa)
**Objetivo:** Definir los criterios para que la aplicación sea un producto **vendible** (SaaS de parqueaderos), identificar lo que falta y organizar el desarrollo + pruebas en sprints.

> ⚠️ **Nota importante:** Los documentos previos (`ESTADO_SPRINTS_COMPLETO.md`, `PROJECT_SUMMARY.md`) están **desactualizados**. Declaran los Sprints 4+ como "0%", pero el código real ya contiene módulos de pricing, checkout, caja, pagos y facturación interna. Este informe refleja lo que **realmente está en el código**.

---

## 🚦 Estado de avance (actualizado 2026-07-14)

| Sprint | Estado | Documento |
|--------|--------|-----------|
| **Sprint 0** — Estabilización base | ✅ COMPLETADO | `SPRINT0_ESTABILIZACION.md` |
| **Sprint A** — Flujo operativo confiable | ✅ COMPLETADO | `SPRINT_A_FLUJO_OPERATIVO.md` |
| **Sprint B** — Convenios y descuentos | ✅ COMPLETADO | `SPRINT_B_CONVENIOS_DESCUENTOS.md` |
| **Sprint C** — Facturación fiscal (DIAN-ready) | ✅ COMPLETADO | `SPRINT_C_FACTURACION.md` |
| **Sprint D** — Mensualidades / Abonados | ⏳ Pendiente | — |
| **Sprint E** — Reportes y cierre financiero | ⏳ Pendiente | — |
| **Sprint F** — Endurecimiento (seguridad/despliegue) | ⏳ Pendiente | — |
| **Sprint G** — Tiempo real / hardware | ⏳ Opcional | — |

**Verificación end-to-end:** batería de 45 pruebas sobre el flujo completo (auth → caja → maestros → check-in → facturación con IVA/CUFE → anulación → cierre) en verde (**45/45**). Ver `test-e2e-flow.mjs`. Tests unitarios: **33/33**.

**Bugs corregidos en el camino:** FK `parking_sessions.vehicle_id`→`vehicles_v2`, auth por token en sesiones, columnas de búsqueda de facturas, contexto multi-parqueadero (eliminado UUID hardcodeado), checkout en periodo de gracia ($0), anulación de factura (auditoría `entityName`), actor en auditorías de checkout.

**Deuda transversal pendiente (Sprint F):** timestamps a `timestamptz`, unificar contrato de API `{data,meta}`, revisar IDOR en facturas, implementar envío/firma DIAN real (requiere proveedor tecnológico + certificados).

---

## 1. Arquitectura actual (lo que SÍ existe)

**Stack:** Monorepo (npm workspaces) · Backend NestJS + TypeORM + PostgreSQL · Frontend Next.js 14 (App Router) + TailwindCSS · Docker Compose (solo DB).

### Backend — módulos implementados
| Área | Módulo | Estado real |
|------|--------|-------------|
| Seguridad | `auth` (JWT + roles ADMIN/SUPERVISOR/CASHIER), `users` | ✅ Sólido |
| Multi-tenant | `companies`, `parking-lots` | ✅ |
| Auditoría | `audit` (audit_logs automáticos) | ✅ |
| Clientes | `customers`, `consents` (Habeas Data/GDPR) | ✅ |
| Vehículos | `vehicles` (legacy) + `vehicles-v2` | ⚠️ **Duplicado** |
| Infraestructura física | `parking-zones`, `parking-spots`, `occupancy` | ✅ |
| Tiempo real | `realtime` (WebSocket gateway) | ⚠️ Parcial / desconectado |
| Entrada | `parking-sessions`, `tickets`, `ticket-templates`, `ops` | ✅ |
| Tarifas | `pricing` + `pricing-engine`, `holidays` | ✅ Avanzado |
| Salida/Cobro | `checkout` (preview + confirm), `payments` | ✅ |
| Facturación | `invoice.service` + `invoice-counter` | ⚠️ Solo interna |
| Caja | `cash` (turnos, arqueos, movimientos, políticas) | ✅ |
| Notificaciones | `notifications` | ⚠️ Stub (TODOs sin implementar) |

### Frontend — pantallas implementadas
- `login`, `dashboard` (KPIs, gauge de ocupación, acciones rápidas)
- Check-In / Check-Out por **modales** + impresión térmica (`ThermalTicket`, `PaymentReceipt`, `InvoiceReceipt`, `LiveQuote`)
- `dashboard/customers`, `/vehicles`, `/zones`, `/spots`, `/occupancy`, `/tickets`, `/pricing` (+ simulador)
- `cash/*` (abrir, cerrar, arqueo, movimientos, historial, turnos)
- `ops/checkout`, `ops/payments`, `ops/invoices`

### El motor de tarifas (`pricing-engine.service.ts`) es el punto más fuerte
Soporta: reglas por tipo de vehículo · día (hábil/fin de semana/festivo) · periodo (día/noche) · unidad de cobro (minuto/bloque 15/bloque 30/hora/día) · redondeo (ceil/floor/nearest) · periodo de gracia · tope diario (daily max) · recargo por ticket perdido · segmentación por medianoche y cambio de periodo · integración con festivos.

---

## 2. Criterios de "COMPLETA y VENDIBLE" (Definition of Done del producto)

Para que el producto se pueda **vender y operar en producción**, debe cumplir TODOS estos criterios agrupados por dominio.

### A. Ciclo operativo completo (entrada → salida → cobro)
- [ ] Entrada: registro por placa/código/documento, asignación de puesto, impresión de ticket con QR/código de barras — **verificado end-to-end desde la UI**, no solo backend.
- [ ] Salida: búsqueda por ticket o placa, cálculo automático correcto, cobro multi-medio (efectivo, tarjeta, transferencia, mixto), cálculo de cambio.
- [ ] Manejo de **ticket perdido** con recargo configurable.
- [ ] Manejo de **cortesías / salida sin cobro** con autorización de supervisor y auditoría.
- [ ] **Anulación y reembolso** de un cobro con motivo, autorización y trazabilidad.

### B. Tarifas y precios
- [ ] Configuración de tarifas por parqueadero desde la UI (ya existe motor; validar cobertura UI).
- [ ] Simulador de cotización (existe) validado contra casos borde (cruce de medianoche, festivos, gracia, tope diario).
- [ ] Snapshot inmutable de la tarifa aplicada en cada factura (existe `pricing-snapshot`).

### C. Convenios y descuentos ← **REQUERIDO POR NEGOCIO, NO IMPLEMENTADO**
- [ ] Entidad de **Convenio** (empresa/comercio aliado) con reglas: % descuento, monto fijo, tarifa especial, horas gratis, tope.
- [ ] Validación de convenio en el check-out (por cliente, por comercio que valida, por rango de horario).
- [ ] Descuento reflejado en la factura (hoy `discounts` está **hardcodeado en 0**).
- [ ] Reporte de consumo por convenio para facturar/conciliar con el aliado.

### D. Mensualidades / abonados ← **NO IMPLEMENTADO**
- [ ] Planes de mensualidad/quincena, clientes con puesto fijo o cupo, cobro recurrente, control de vencimiento y estado (al día/vencido).
- [ ] Entrada/salida de mensualizado sin cobro por sesión (o con lógica de excedente).

### E. Facturación y cumplimiento fiscal (Colombia)
- [ ] Manejo de **impuestos (IVA)**: subtotal, IVA, total desglosados en la factura (hoy es un total plano).
- [ ] Numeración con **resolución DIAN** y consecutivos legales, o soporte POS/documento equivalente según régimen.
- [ ] **Facturación electrónica DIAN** (CUFE, XML UBL, envío al proveedor tecnológico) — o decisión explícita de alcance/integración con un tercero.
- [ ] Datos fiscales del cliente (NIT/CC, responsabilidad tributaria) en factura.

### F. Reportes y cierre financiero ← **NO EXISTE MÓDULO**
- [ ] Cierre de caja/turno con cuadre (esperado vs contado) — parcialmente en `cash`.
- [ ] Reporte de ingresos por día/rango, por medio de pago, por cajero, por tipo de vehículo.
- [ ] Reporte de ocupación histórica y rotación.
- [ ] Reporte de convenios y mensualidades.
- [ ] Exportación a Excel/PDF.

### G. Administración y multi-tenant
- [ ] Gestión de usuarios y roles desde la UI (crear cajeros, supervisores).
- [ ] **Selector de parqueadero** por contexto de usuario (hoy `parkingLotId` está **hardcodeado**).
- [ ] Onboarding de nueva empresa/parqueadero (self-service o asistido) — clave para SaaS vendible.

### H. Calidad, seguridad y operación
- [ ] Suite de **pruebas** (unitarias + e2e backend + e2e flujo crítico frontend). Hoy: **3 archivos `.spec`** ≈ cobertura mínima.
- [ ] Seguridad: refresh tokens, recuperación de contraseña, rate limiting, secretos fuera del repo, hashing verificado, CORS.
- [ ] Observabilidad: logs estructurados, manejo de errores consistente en UI.
- [ ] **Despliegue**: Dockerfile de API y Web, CI/CD, migraciones automatizadas, backups de DB.
- [ ] Documentación de usuario/operador y manual de instalación.

### I. Integración frontend-backend (bugs conocidos a cerrar)
- [ ] Creación de vehículo envía `customerId` (hoy falla con 400 en algunos flujos).
- [ ] Consolidar tablas `vehicles` vs `vehicles-v2` (eliminar la legacy).
- [ ] Conectar WebSocket real (hoy `OccupancyGateway` está comentado en checkout; ocupación usa polling).
- [ ] Implementar envío real de notificaciones (hoy `sendNotification` es un TODO comentado).

---

## 3. Informe de brechas por severidad

### 🔴 Bloqueantes para vender (imprescindibles)
1. **Convenios y descuentos** — inexistentes; `discounts` siempre 0. *(Pedido explícito del negocio.)*
2. **Impuestos/IVA y numeración fiscal** — la factura es un total plano sin desglose ni base legal.
3. **Reportes y cierre financiero** — no hay módulo de reportes; sin esto un dueño no puede operar ni auditar.
4. **Selector de parqueadero / contexto multi-tenant en UI** — `parkingLotId` hardcodeado impide vender a más de un cliente/sede.
5. **Pruebas y estabilidad del flujo entrada→salida→cobro** — cobertura casi nula; alto riesgo en producción.
6. **App no arranca "llave en mano"** — dependencias de `apps/api` y `apps/web` no instaladas; falta guía/observación de despliegue reproducible.

### 🟠 Importantes (necesarias para un producto competitivo)
7. **Mensualidades/abonados** — segmento comercial clave en parqueaderos.
8. **Anulación/reembolso y cortesías con autorización** — control operativo y anti-fraude.
9. **Facturación electrónica DIAN** — obligatoria según régimen del cliente (definir alcance).
10. **Notificaciones reales** (WhatsApp/Email) — hoy son stubs.
11. **Gestión de usuarios/roles desde UI**.
12. **Consolidación tabla de vehículos** (deuda técnica que causa bugs).

### 🟡 Deseables (mejoran valor/UX)
13. WebSocket en tiempo real conectado (reemplazar polling).
14. Integración hardware: impresora térmica, lector de código de barras/QR, cámara LPR (lectura de placa).
15. Panel de analítica avanzada (rotación, horas pico, ingreso por m²).
16. App móvil / PWA para operarios.
17. Auditoría/seguridad avanzada (2FA, IP allowlist).

---

## 4. Plan de Sprints

Cada sprint entrega **valor verificable end-to-end** e incluye sus propias pruebas. Duración sugerida: **2 semanas** por sprint. Convención: cada historia se cierra solo con criterios de aceptación + prueba automatizada o guion de prueba manual documentado.

> **Sprint 0 (transversal, en paralelo desde el inicio):** estabilización — dejar el proyecto instalable y ejecutable (install de ambos apps, `.env.example` verificados, `docker:up` + migraciones + seed en un solo comando), CI que corra lint + build + tests. **Sin esto no se puede validar nada.**

---

### 🏁 Sprint A — Estabilización y flujo operativo confiable
**Meta:** que entrada → salida → cobro funcione sin errores desde la UI, con contexto multi-parqueadero.

- Corregir integración de creación de vehículo (`customerId`) y consolidar `vehicles`/`vehicles-v2` (migración + baja de legacy).
- Selector de parqueadero en el layout; propagar `parkingLotId` por contexto (eliminar hardcode).
- Revisar y blindar `checkout.confirm` (transacción, validación de suma de pagos, turno de caja).
- Conectar envío real de notificaciones o dejarlo detrás de un feature-flag limpio.
- **Pruebas:** e2e backend de `POST /checkout/preview` y `/checkout/confirm`; guion manual de entrada→salida con efectivo, tarjeta y mixto.

**Criterios de aceptación:** un cajero completa una entrada y una salida con cobro real, factura generada y puesto liberado, sin errores en consola/red, en un parqueadero seleccionable.

---

### 💸 Sprint B — Convenios y descuentos
**Meta:** aplicar descuentos por convenio en el cobro y reflejarlos en factura. *(Pedido explícito.)*

- Entidad `Agreement`/`Convenio` (aliado, tipo de beneficio: % / monto fijo / tarifa especial / horas gratis, tope, vigencia, horarios).
- Asociación convenio ↔ cliente y/o ↔ comercio validador.
- Aplicación del descuento en `checkout.preview`/`confirm`; poblar `invoice.discounts` y desglose.
- UI: administración de convenios + selección/validación de convenio en el check-out.
- **Pruebas:** unitarias del cálculo con cada tipo de beneficio + tope; e2e de checkout con convenio; verificación de que subtotal − descuento = total en factura.

**Criterios de aceptación:** una salida con convenio muestra descuento correcto en pantalla y factura, y queda registrado para el reporte de conciliación del aliado.

---

### 🧾 Sprint C — Facturación fiscal e impuestos
**Meta:** facturas con validez fiscal básica.

- Desglose subtotal / IVA / total en factura y en los ítems.
- Configuración fiscal por empresa (NIT, resolución, régimen, prefijos y consecutivos legales).
- Datos fiscales del cliente en factura.
- Plantilla de factura/POS imprimible conforme.
- (Spike/decisión) Facturación electrónica DIAN: integración con proveedor tecnológico vs. documento POS — definir alcance y, si aplica, generar XML UBL + CUFE.
- **Pruebas:** unitarias de cálculo de impuestos; verificación de consecutivos sin saltos; render de factura contra casos reales.

**Criterios de aceptación:** cada cobro genera una factura con IVA desglosado y consecutivo legal correcto.

---

### 📅 Sprint D — Mensualidades / Abonados
**Meta:** clientes recurrentes con plan mensual.

- Entidad `Membership`/`Plan` (periodicidad, tarifa, puesto fijo/cupo, vigencia, estado).
- Cobro/registro de mensualidad y renovación; alertas de vencimiento.
- Entrada/salida de mensualizado (sin cobro por sesión o cobro de excedente).
- UI de gestión de mensualidades y estado (al día/vencido).
- **Pruebas:** e2e de alta de mensualidad, entrada/salida de mensualizado, y caso de vencido.

**Criterios de aceptación:** un abonado entra y sale sin cobro por hora mientras esté vigente; al vencer, el sistema lo bloquea/avisa.

---

### 📊 Sprint E — Reportes y cierre financiero
**Meta:** que el dueño/supervisor controle el negocio.

- Módulo de reportes: ingresos por día/rango, por medio de pago, por cajero, por tipo de vehículo.
- Cuadre de caja/turno (esperado vs contado) consolidado y exportable.
- Reportes de convenios y mensualidades.
- Reporte de ocupación histórica y rotación.
- Exportación Excel/PDF.
- **Pruebas:** validación de totales de reportes contra transacciones sembradas; e2e de cierre de turno.

**Criterios de aceptación:** el cierre de turno cuadra con los cobros del día y los reportes exportan cifras correctas.

---

### 🛡️ Sprint F — Administración, seguridad y despliegue (endurecimiento)
**Meta:** producto listo para instalar en un cliente.

- Gestión de usuarios/roles desde UI; onboarding de empresa/parqueadero.
- Anulación/reembolso y cortesías con autorización de supervisor + auditoría.
- Seguridad: refresh token, recuperación de contraseña, rate limiting, secretos gestionados, CORS.
- Despliegue: Dockerfile de API y Web, pipeline CI/CD, migraciones automatizadas, estrategia de backup.
- Manual de instalación y de usuario.
- **Pruebas:** e2e de flujos de admin; prueba de despliegue limpio en entorno nuevo; checklist de seguridad.

**Criterios de aceptación:** desde cero, se despliega el sistema, se crea una empresa, usuarios y se opera un día completo.

---

### 🔌 Sprint G — Tiempo real, hardware y pulido (opcional / valor añadido)
- Conectar WebSocket (ocupación en vivo; retirar polling).
- Integración con impresora térmica, lector de código de barras/QR y, si aplica, cámara LPR.
- PWA/optimización móvil para operarios.
- Analítica avanzada.

---

## 5. Recomendación de secuencia

**Orden sugerido:** Sprint 0 (transversal) → A → B → C → E → D → F → G.

Justificación: primero **estabilizar** (A) para poder probar; luego los diferenciadores de negocio pedidos (**convenios** B) y el cumplimiento (**fiscal** C); **reportes** (E) para dar visibilidad temprana; **mensualidades** (D); y **endurecimiento** (F) antes de la primera venta real. G es incremental.

**Ruta mínima para la primera venta (MVP vendible):** 0 + A + B + C + E + F.