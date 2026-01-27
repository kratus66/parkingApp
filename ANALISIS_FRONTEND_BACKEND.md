# Análisis de Articulación Frontend-Backend

## ✅ Elementos Correctamente Implementados (según Sprint 1)

### Backend
1. ✅ **Estructura correcta**: Monorepo con apps/api y apps/web
2. ✅ **NestJS + TypeScript + TypeORM + PostgreSQL**
3. ✅ **Docker Compose** configurado
4. ✅ **Swagger** documentado en `/docs`
5. ✅ **Autenticación JWT** con roles (ADMIN, SUPERVISOR, CASHIER)
6. ✅ **Módulos base creados**:
   - auth ✅
   - users ✅
   - companies ✅
   - parking-lots ✅
   - audit ✅
   - customers ✅
   - vehicles-v2 ✅
   - parking-sessions ✅
   - tickets ✅
   - ops ✅
7. ✅ **Entidades multi-empresa/multi-parqueadero**
8. ✅ **Auditoría** implementada
9. ✅ **Validación global** con DTOs

### Frontend
1. ✅ **Next.js + TypeScript + TailwindCSS**
2. ✅ **Axios** configurado
3. ✅ **Login** funcional
4. ✅ **Dashboard** implementado
5. ✅ **Autenticación** con JWT

---

## ❌ PROBLEMAS CRÍTICOS DETECTADOS

### 1. **Inconsistencia en Creación de Vehículos**

**Backend espera:**
```typescript
{
  customerId: string,      // ❌ OBLIGATORIO pero frontend no lo envía
  vehicleType: VehicleType,
  plate?: string,          // Nombre correcto
  bicycleCode?: string,
  brand?: string,
  model?: string,
  color?: string
}
```

**Frontend envía (CheckInModal.tsx):**
```typescript
{
  vehicleType,
  // ❌ NO envía customerId
  // ❌ Algunas veces usa "licensePlate" en lugar de "plate"
  plate: normalizedPlate,
  brand,
  model,
  color
}
```

**Impacto**: Error 400 al intentar crear vehículos desde el frontend.

---

### 2. **Doble Tabla de Vehículos (Migración Incompleta)**

**Problema**: Existen dos tablas de vehículos:
- `vehicles` (tabla vieja, SIN relación directa con customers)
- `vehicles_v2` (tabla nueva, CON relación con customers)

**Estado actual**:
- Backend usa `vehicles_v2` ✅
- Datos antiguos en `vehicles` (ABC123, ZZZ15Z) ❌
- Migración manual realizada, pero inconsistencia en código

**Solución necesaria**: 
- Decidir si mantener ambas tablas o migrar todo a v2
- Actualizar seeds para usar solo vehicles_v2

---

### 3. **ParkingLotId Hardcodeado**

**Problema**: En `dashboard/page.tsx`:
```typescript
const parkingLotId = '1c60e454-6b0a-44be-ba18-e3c8afdfb5bc'; // ❌ Hardcoded
```

**Debería**: Obtenerse del contexto del usuario autenticado o permitir selección.

**Estado**: ✅ PARCIALMENTE CORREGIDO (funciona para testing local)

---

### 4. **Flujo de Check-In con Lógica Errónea**

**Problema en CheckInModal.tsx**:
```typescript
// ❌ ANTES: Intentaba crear vehículo aunque ya existiera
if (!selectedVehicleId) {
  await vehicleService.create(vehiclePayload); // Creaba duplicado
}

// ✅ AHORA: Corregido para no crear si ya existe
if (selectedVehicleId) {
  // Solo hace check-in
} else {
  // Crea vehículo nuevo
}
```

**Estado**: ✅ CORREGIDO

---

### 5. **Falta customerId en Creación de Vehículos**

**Problema**: El DTO del backend REQUIERE `customerId`:
```typescript
@ApiProperty({
  description: 'ID del cliente propietario',
  example: '123e4567-e89b-12d3-a456-426614174000',
})
@IsUUID()
@IsNotEmpty()
customerId: string; // ❌ OBLIGATORIO
```

Pero el frontend NO lo envía cuando crea vehículos.

**Solución**: El frontend debe:
1. Obtener el `customerId` del resultado de `identify` o del cliente recién creado
2. Incluirlo en el payload al crear el vehículo

---

## 🔧 SOLUCIONES IMPLEMENTADAS

### 1. Autocompletado de Búsqueda ✅
- Implementado debounce para búsqueda en tiempo real
- Muestra sugerencias de vehículos mientras se escribe
- Funcional con vehículos en `vehicles_v2`

### 2. Normalización de Búsquedas ✅
- Backend normaliza placas (case-insensitive, sin espacios/guiones)
- Mejora en findByPlate, findByBicycleCode, findByDocument
- Usa QueryBuilder para búsquedas flexibles

### 3. Logs de Depuración ✅
- Agregados logs en `ops.service.ts` para rastrear búsquedas
- Logs en frontend para ver payloads enviados

---

## 🚨 ACCIONES PENDIENTES

### Alta Prioridad

1. **Corregir creación de vehículos en CheckInModal**:
   ```typescript
   // Debe incluir customerId
   const vehiclePayload = {
     customerId: identifyResult?.customer?.id || customerId,
     vehicleType,
     plate: normalizedPlate,
     bicycleCode: normalizedBicycleCode,
     brand,
     model,
     color
   };
   ```

2. **Migrar datos de `vehicles` a `vehicles_v2`**:
   - Crear script de migración
   - Asociar vehículos existentes con customers
   - Deprecar tabla `vehicles`

3. **Implementar selector de Parqueadero**:
   - Componente en dashboard para seleccionar parking lot
   - Guardar en contexto/estado global
   - Actualizar todas las operaciones para usar el seleccionado

### Prioridad Media

4. **Validar que seeds incluyan datos en vehicles_v2**:
   - Actualizar `database/seeds` para crear vehículos en v2
   - Crear relaciones completas (company → parking_lot → users → customers → vehicles_v2)

5. **Mejorar manejo de errores en frontend**:
   - Mostrar errores específicos del backend
   - Mejor UX en validaciones

6. **Documentar cambios de API**:
   - Actualizar ARCHITECTURE.md con estructura actual
   - Documentar endpoints de vehicles-v2

---

## 📊 Resumen de Compatibilidad

| Componente | Backend | Frontend | Estado |
|------------|---------|----------|--------|
| Auth/Login | ✅ | ✅ | ✅ Compatible |
| Dashboard Stats | ✅ | ✅ | ✅ Compatible |
| Búsqueda de Vehículos | ✅ | ✅ | ✅ Compatible |
| Autocompletado | ✅ | ✅ | ✅ Compatible |
| Crear Vehículo | ✅ | ❌ | ❌ **Incompatible** (falta customerId) |
| Check-In | ✅ | ⚠️ | ⚠️ **Parcial** (depende de crear vehículo) |
| ParkingLot Selection | N/A | ❌ | ❌ **Hardcoded** |

**Leyenda**:
- ✅ Funcional
- ⚠️ Funcional con limitaciones
- ❌ No funcional / Incompleto
