# Análisis de Funcionalidades para Vista de Cajero

## ✅ Funcionalidades Ya Implementadas en el Dashboard

1. **Visualización de Estadísticas en Tiempo Real**
   - Vehículos activos
   - Cupos disponibles
   - Recaudo del día
   - Entradas y salidas hoy
   - Ocupación total con tacómetro
   - Ocupación por tipo de vehículo

2. **Panel de Alertas**
   - Alertas críticas (ocupación >90%)
   - Advertencias (ocupación >80%)
   - Alertas informativas

3. **Búsqueda por Placa**
   - Buscador integrado en el TopBar
   - Búsqueda de sesiones activas

---

## 🚧 Funcionalidades Faltantes CRÍTICAS para un Cajero

### 1. **Gestión de Check-In (Registro de Entrada)** ⚠️ CRÍTICO
**Estado:** NO IMPLEMENTADO EN UI

El cajero necesita:
- Modal/formulario para registrar entrada de vehículos
- Campos necesarios:
  - Placa del vehículo
  - Tipo de vehículo (Auto, Moto, Camión, Bus, Bicicleta)
  - Datos del cliente (si es nuevo)
  - Código de bicicleta (si aplica)
  - Selección/asignación automática de puesto
- Generación de ticket automático
- Impresión de ticket

**Backend:** ✅ YA EXISTE
- Endpoint: `POST /parking-sessions/check-in`
- DTO: `CheckInDto`

**Acción requerida:** Crear componente `CheckInModal.tsx`

---

### 2. **Gestión de Check-Out (Registro de Salida)** ⚠️ CRÍTICO
**Estado:** NO IMPLEMENTADO EN UI

El cajero necesita:
- Modal para procesar salida de vehículos
- Búsqueda por:
  - Número de ticket
  - Placa
- Mostrar:
  - Datos de la sesión
  - Tiempo de permanencia
  - Tarifa calculada
  - Total a pagar
- Botón para confirmar pago
- Impresión de recibo

**Backend:** ✅ YA EXISTE
- Endpoint: `POST /parking-sessions/:id/check-out`
- Endpoint: `GET /parking-sessions/by-ticket/:ticketNumber`

**Acción requerida:** Crear componente `CheckOutModal.tsx`

---

### 3. **Identificación Rápida de Clientes** ⚠️ CRÍTICO
**Estado:** PARCIALMENTE IMPLEMENTADO

El cajero necesita:
- Búsqueda rápida por:
  - Placa
  - Código de bicicleta
  - Documento de identidad
- Mostrar historial del cliente
- Ver vehículos registrados
- Ver consentimientos (WhatsApp, Email)

**Backend:** ✅ YA EXISTE
- Endpoint: `POST /ops/identify`

**Acción requerida:** Crear componente `CustomerIdentifyModal.tsx`

---

### 4. **Gestión de Tickets** 🔶 IMPORTANTE

El cajero necesita:
- Reimprimir tickets
- Ver historial de tickets del día
- Buscar ticket por número
- Anular ticket (con autorización)

**Backend:** ✅ YA EXISTE
- Endpoint: `POST /parking-sessions/reprint-ticket`

**Acción requerida:** Crear componente `TicketManagement.tsx`

---

### 5. **Cancelación de Sesiones** 🔶 IMPORTANTE

El cajero necesita:
- Cancelar sesiones activas (con justificación)
- Ver motivo de cancelación
- Requiere permisos especiales

**Backend:** ✅ YA EXISTE
- Endpoint: `POST /parking-sessions/cancel`

**Acción requerida:** Crear componente `CancelSessionModal.tsx`

---

### 6. **Asignación Manual de Puestos** 🔷 DESEABLE

El cajero podría necesitar:
- Ver mapa de puestos disponibles
- Asignar manualmente un puesto específico
- Cambiar puesto de un vehículo

**Backend:** ✅ YA EXISTE
- Endpoint: `POST /occupancy/assign`
- Endpoint: `GET /occupancy/available`

**Acción requerida:** Crear componente `ParkingSpotSelector.tsx`

---

### 7. **Registro Rápido de Clientes Nuevos** ⚠️ CRÍTICO

El cajero necesita:
- Formulario rápido para crear cliente
- Campos mínimos:
  - Tipo y número de documento
  - Nombre completo
  - Teléfono (opcional)
  - Email (opcional)
- Captura de consentimientos
- Registro simultáneo de vehículo

**Backend:** VERIFICAR
- Probablemente existe en `/customers`

**Acción requerida:** Crear componente `QuickCustomerForm.tsx`

---

### 8. **Lista de Sesiones Activas** 🔶 IMPORTANTE

El cajero necesita:
- Ver todas las sesiones activas en tiempo real
- Filtros por:
  - Tipo de vehículo
  - Tiempo de estancia
  - Placa
- Acciones rápidas (salida, reimprimir)

**Backend:** FALTA IMPLEMENTAR
- Endpoint sugerido: `GET /parking-sessions/active-list`

**Acción requerida:** 
1. Crear endpoint en backend
2. Crear componente `ActiveSessionsList.tsx`

---

### 9. **Notificaciones en Tiempo Real** 🔷 DESEABLE

El cajero debería recibir:
- Notificación cuando hay nueva entrada
- Alertas de ocupación crítica
- Recordatorios de sesiones largas

**Backend:** ✅ YA EXISTE (WebSocket)
- Módulo `realtime`

**Acción requerida:** Integrar WebSocket en el dashboard

---

### 10. **Caja/Cierre de Turno** 🔶 IMPORTANTE

El cajero necesita:
- Ver resumen de su turno:
  - Total recaudado
  - Número de transacciones
  - Entradas/salidas procesadas
- Imprimir reporte de cierre
- Registrar efectivo recibido

**Backend:** FALTA IMPLEMENTAR

**Acción requerida:**
1. Crear endpoints de cierre de caja
2. Crear componente `CashierShiftSummary.tsx`

---

## 📊 Priorización Sugerida

### FASE 1 - Funcionalidad Básica (INMEDIATA)
1. ✅ Dashboard de visualización (YA COMPLETADO)
2. 🔴 Modal de Check-In (URGENTE)
3. 🔴 Modal de Check-Out (URGENTE)
4. 🔴 Identificación rápida de clientes (URGENTE)
5. 🔴 Registro rápido de clientes nuevos (URGENTE)

### FASE 2 - Gestión Avanzada (CORTO PLAZO)
6. 🟡 Lista de sesiones activas
7. 🟡 Gestión de tickets (reimprimir, buscar)
8. 🟡 Cancelación de sesiones

### FASE 3 - Optimizaciones (MEDIANO PLAZO)
9. 🟢 Asignación manual de puestos
10. 🟢 Notificaciones en tiempo real
11. 🟢 Cierre de caja/turno

---

## 🎯 Componentes UI Necesarios

```
src/components/
├── modals/
│   ├── CheckInModal.tsx          # ⚠️ CRÍTICO
│   ├── CheckOutModal.tsx         # ⚠️ CRÍTICO
│   ├── CustomerIdentifyModal.tsx # ⚠️ CRÍTICO
│   ├── QuickCustomerForm.tsx     # ⚠️ CRÍTICO
│   ├── CancelSessionModal.tsx    # 🔶 IMPORTANTE
│   ├── TicketManagement.tsx      # 🔶 IMPORTANTE
│   └── ParkingSpotSelector.tsx   # 🔷 DESEABLE
├── tables/
│   └── ActiveSessionsTable.tsx   # 🔶 IMPORTANTE
└── reports/
    └── CashierShiftSummary.tsx   # 🔶 IMPORTANTE
```

---

## 🔧 Servicios API Necesarios

```typescript
src/lib/
├── checkInService.ts      # ⚠️ CREAR
├── checkOutService.ts     # ⚠️ CREAR
├── customerService.ts     # ⚠️ CREAR
├── ticketService.ts       # 🔶 CREAR
└── sessionService.ts      # 🔶 CREAR
```

---

## 💡 Recomendaciones UX

1. **Atajos de Teclado:**
   - `Ctrl + E`: Abrir modal de entrada
   - `Ctrl + S`: Abrir modal de salida
   - `Ctrl + B`: Buscar por placa
   - `F1`: Ver sesiones activas

2. **Flujo Optimizado:**
   - Hacer el check-in en máximo 3 clicks
   - Autocompletar datos de clientes frecuentes
   - Pre-seleccionar tipo de vehículo más común

3. **Validaciones:**
   - Validar formato de placa según región
   - Alertar si placa ya tiene sesión activa
   - Verificar disponibilidad antes de asignar

4. **Feedback Visual:**
   - Toast notifications para acciones exitosas
   - Sonido al completar transacciones
   - Animaciones sutiles en cambios de estado

---

## 🚀 Implementación Recomendada

### Opción A: Dashboard + Modales (RECOMENDADA)
- Mantener dashboard actual
- Agregar botón flotante "Acciones Rápidas"
- Modales para cada operación
- Más rápido de implementar

### Opción B: Dashboard + Vista Dedicada
- Crear `/dashboard/cashier` con UI específica
- Panel lateral con sesiones activas
- Área central para operaciones
- Más completo pero toma más tiempo

---

## 📝 Conclusión

El dashboard actual es **excelente para VISUALIZAR**, pero le faltan las **herramientas de OPERACIÓN** que un cajero necesita diariamente.

**Prioridad #1:** Implementar modales de Check-In y Check-Out
**Prioridad #2:** Identificación y registro rápido de clientes
**Prioridad #3:** Lista de sesiones activas

¿Quieres que empiece por implementar alguna de estas funcionalidades críticas?
