# Sprint 3: Gestión de Puestos, Zonas y Ocupación en Tiempo Real

## 📋 Descripción

Este sprint implementa la gestión completa de puestos de estacionamiento, zonas, capacidad por tipo de vehículo y ocupación en tiempo real utilizando WebSockets.

## 🎯 Objetivos Completados

✅ **Backend NestJS**
- [x] Entidades: ParkingZone, ParkingSpot, SpotStatusHistory
- [x] Migración completa con enums e índices
- [x] Módulo de Zonas (CRUD completo)
- [x] Módulo de Puestos (CRUD + cambio de estado + historial)
- [x] Módulo de Ocupación (resumen, asignación automática, liberación)
- [x] Gateway WebSocket para tiempo real
- [x] Integración con sistema de auditoría
- [x] Permisos por rol configurados

✅ **Características Técnicas**
- [x] Multi-tenant (companyId + parkingLotId)
- [x] Bloqueo pesimista para evitar race conditions
- [x] Validaciones de negocio robustas
- [x] Documentación Swagger completa
- [x] Seeds de datos de prueba

⏳ **Pendiente**
- [ ] Frontend Next.js (pantallas de CRUD)
- [ ] Cliente WebSocket en frontend
- [ ] Tests unitarios y e2e
- [ ] Ejecutar migración en BD
- [ ] Ejecutar seed de datos

## 🗂️ Estructura de Archivos

```
apps/api/src/
├── entities/
│   ├── parking-zone.entity.ts          # Entidad de zonas
│   ├── parking-spot.entity.ts          # Entidad de puestos
│   └── spot-status-history.entity.ts   # Historial de cambios de estado
│
├── database/
│   ├── migrations/
│   │   └── 1705300000000-Sprint3ParkingZonesSpots.ts  # Migración Sprint 3
│   └── seeds/
│       └── sprint3-zones-spots.seed.ts  # Seed de datos de prueba
│
└── modules/
    ├── parking-zones/                   # Módulo de Zonas
    │   ├── dto/
    │   │   ├── create-zone.dto.ts
    │   │   ├── update-zone.dto.ts
    │   │   └── search-zones.dto.ts
    │   ├── parking-zones.service.ts
    │   ├── parking-zones.controller.ts
    │   └── parking-zones.module.ts
    │
    ├── parking-spots/                   # Módulo de Puestos
    │   ├── dto/
    │   │   ├── create-spot.dto.ts
    │   │   ├── update-spot.dto.ts
    │   │   ├── change-spot-status.dto.ts
    │   │   └── search-spots.dto.ts
    │   ├── parking-spots.service.ts
    │   ├── parking-spots.controller.ts
    │   └── parking-spots.module.ts
    │
    ├── occupancy/                       # Módulo de Ocupación
    │   ├── dto/
    │   │   ├── assign-spot.dto.ts
    │   │   └── occupancy-query.dto.ts
    │   ├── occupancy.service.ts
    │   ├── occupancy.controller.ts
    │   └── occupancy.module.ts
    │
    └── realtime/                        # WebSocket Gateway
        ├── realtime.gateway.ts
        └── realtime.module.ts
```

## 📊 Modelo de Datos

### Enums

```typescript
enum VehicleType {
  BICYCLE = 'BICYCLE',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  TRUCK_BUS = 'TRUCK_BUS',
}

enum SpotStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}
```

### Relaciones

```
ParkingLot (1) ──────── (N) ParkingZone
                              │
                              │ (1)
                              │
                              ▼
                           (N) ParkingSpot ──────── (N) SpotStatusHistory
```

## 🔌 Endpoints API

### Zonas (parking-zones)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/zones` | Listar zonas con filtros | CASHIER, SUPERVISOR, ADMIN |
| GET | `/zones/:id` | Obtener zona por ID | CASHIER, SUPERVISOR, ADMIN |
| POST | `/zones` | Crear zona | SUPERVISOR, ADMIN |
| PATCH | `/zones/:id` | Actualizar zona | SUPERVISOR, ADMIN |
| DELETE | `/zones/:id` | Eliminar zona (soft delete) | SUPERVISOR, ADMIN |

### Puestos (parking-spots)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/spots` | Listar puestos con filtros | CASHIER, SUPERVISOR, ADMIN |
| GET | `/spots/:id` | Obtener puesto por ID | CASHIER, SUPERVISOR, ADMIN |
| POST | `/spots` | Crear puesto | SUPERVISOR, ADMIN |
| PATCH | `/spots/:id` | Actualizar puesto | SUPERVISOR, ADMIN |
| DELETE | `/spots/:id` | Eliminar puesto | SUPERVISOR, ADMIN |
| POST | `/spots/:id/status` | Cambiar estado | SUPERVISOR, ADMIN |
| GET | `/spots/:id/history` | Ver historial de cambios | SUPERVISOR, ADMIN |

### Ocupación (occupancy)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/occupancy/summary` | Resumen de ocupación | CASHIER, SUPERVISOR, ADMIN |
| GET | `/occupancy/available` | Puestos disponibles | CASHIER, SUPERVISOR, ADMIN |
| POST | `/occupancy/assign` | Asignar puesto automáticamente | CASHIER, SUPERVISOR, ADMIN |
| POST | `/occupancy/release/:spotId` | Liberar puesto | CASHIER, SUPERVISOR, ADMIN |

## 🔄 WebSocket (Realtime)

### Namespace: `/realtime`

### Autenticación
El cliente debe enviar el token JWT en el handshake:
```javascript
const socket = io('http://localhost:4000/realtime', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Eventos del Cliente → Servidor

#### `joinParkingLot`
Unirse a la sala de un parqueadero para recibir actualizaciones en tiempo real.
```javascript
socket.emit('joinParkingLot', { parkingLotId: 'uuid' });
```

#### `leaveParkingLot`
Salir de la sala del parqueadero.
```javascript
socket.emit('leaveParkingLot');
```

### Eventos del Servidor → Cliente

#### `spotUpdated`
Se emite cuando un puesto es actualizado.
```javascript
socket.on('spotUpdated', (spot) => {
  console.log('Puesto actualizado:', spot);
});
```

#### `occupancyUpdated`
Se emite cuando cambia la ocupación del parqueadero.
```javascript
socket.on('occupancyUpdated', (summary) => {
  console.log('Ocupación actualizada:', summary);
});
```

#### `spotStatusChanged`
Se emite cuando cambia el estado de un puesto.
```javascript
socket.on('spotStatusChanged', (data) => {
  console.log('Estado cambiado:', data);
  // data = { spotId, code, fromStatus, toStatus, reason }
});
```

## 🚀 Cómo Usar

### 1. Ejecutar Migración

```bash
cd apps/api
npm run migration:run
```

### 2. Ejecutar Seed (Opcional)

Primero, edita el archivo `apps/api/src/database/seeds/sprint3-zones-spots.seed.ts` y actualiza:
- `COMPANY_ID` con un ID válido de tu base de datos
- `PARKING_LOT_ID` con un ID válido de tu base de datos

Luego ejecuta:
```bash
npx ts-node apps/api/src/database/seeds/sprint3-zones-spots.seed.ts
```

### 3. Iniciar el Servidor

```bash
npm run dev:api
```

### 4. Probar con Swagger

Accede a `http://localhost:4000/api/docs` y prueba los endpoints.

### 5. Probar WebSocket

Usa un cliente como Socket.IO Client o Postman:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000/realtime', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Unirse al parqueadero
socket.emit('joinParkingLot', { 
  parkingLotId: 'your-parking-lot-id' 
});

// Escuchar eventos
socket.on('occupancyUpdated', (data) => {
  console.log('Ocupación:', data);
});
```

## 💡 Ejemplos de Uso

### Crear una Zona

```bash
POST /zones
Authorization: Bearer {token}
Content-Type: application/json

{
  "parkingLotId": "uuid",
  "name": "Zona A - Autos",
  "description": "Zona principal para automóviles",
  "allowedVehicleTypes": ["CAR"]
}
```

### Crear Puestos

```bash
POST /spots
Authorization: Bearer {token}
Content-Type: application/json

{
  "parkingLotId": "uuid",
  "zoneId": "uuid",
  "code": "A-01",
  "spotType": "CAR",
  "priority": 10,
  "notes": "Cerca de la entrada"
}
```

### Asignar Puesto Automáticamente

```bash
POST /occupancy/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "parkingLotId": "uuid",
  "vehicleType": "CAR"
}
```

Respuesta:
```json
{
  "id": "spot-uuid",
  "code": "A-01",
  "status": "OCCUPIED",
  "spotType": "CAR",
  ...
}
```

### Obtener Resumen de Ocupación

```bash
GET /occupancy/summary?parkingLotId=uuid
Authorization: Bearer {token}
```

Respuesta:
```json
{
  "total": 55,
  "free": 30,
  "occupied": 20,
  "reserved": 3,
  "outOfService": 2,
  "byType": {
    "CAR": { "total": 25, "free": 15, "occupied": 10 },
    "MOTORCYCLE": { "total": 15, "free": 8, "occupied": 7 },
    "TRUCK_BUS": { "total": 10, "free": 5, "occupied": 5 },
    "BICYCLE": { "total": 5, "free": 2, "occupied": 3 }
  },
  "byZone": [
    {
      "zoneId": "uuid",
      "zoneName": "Zona A - Autos",
      "total": 25,
      "free": 15,
      "occupied": 10
    },
    ...
  ]
}
```

## 🔒 Seguridad y Validaciones

### Validaciones de Negocio

1. **Zonas**:
   - Nombre único por parqueadero
   - Al menos un tipo de vehículo permitido
   - No se puede eliminar si tiene puestos asociados

2. **Puestos**:
   - Código único por parqueadero
   - Tipo de vehículo debe estar en tipos permitidos de la zona
   - No se puede eliminar si está OCCUPIED
   - No se puede cambiar a un estado igual al actual

3. **Asignación**:
   - Solo asigna puestos FREE
   - Usa bloqueo pesimista (pessimistic_write)
   - Valida que exista un puesto disponible del tipo solicitado

### Multi-tenant

Todas las consultas filtran automáticamente por `companyId` del usuario autenticado, garantizando aislamiento de datos entre compañías.

## 📈 Optimizaciones

- **14 índices** creados en la migración para optimizar queries frecuentes
- **Bloqueo pesimista** en asignación para evitar race conditions
- **Lazy loading** de relaciones para reducir queries innecesarias
- **Paginación** en todos los endpoints de listado

## 🧪 Testing (Pendiente)

### Tests Unitarios
```bash
# Probar servicios
npm run test apps/api/src/modules/parking-zones/parking-zones.service.spec.ts
npm run test apps/api/src/modules/parking-spots/parking-spots.service.spec.ts
npm run test apps/api/src/modules/occupancy/occupancy.service.spec.ts
```

### Tests E2E
```bash
# Probar endpoints
npm run test:e2e apps/api/test/parking-zones.e2e-spec.ts
npm run test:e2e apps/api/test/parking-spots.e2e-spec.ts
npm run test:e2e apps/api/test/occupancy.e2e-spec.ts
```

## 📝 Notas Importantes

1. **Migración**: Asegúrate de ejecutar la migración antes de usar los endpoints
2. **Seeds**: Los IDs de compañía y parqueadero en el seed deben existir en tu BD
3. **WebSocket**: Requiere token JWT válido en el handshake
4. **Roles**: CASHIER solo puede leer y asignar/liberar, no puede crear/editar zonas ni puestos
5. **Auditoría**: Todas las operaciones se registran automáticamente en audit_logs

## 🔗 Referencias

- [Documentación Sprints](../../docs/SPRINTS.md)
- [Swagger API](http://localhost:4000/api/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [TypeORM Transactions](https://typeorm.io/transactions)

## 📞 Soporte

Para preguntas o problemas, consulta la documentación completa en `/docs/SPRINTS.md`.
