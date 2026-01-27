# Comandos Útiles - Sprint 3

## 🗄️ Base de Datos

### Ejecutar Migración
```bash
cd apps/api
npm run migration:run
```

### Revertir Migración
```bash
cd apps/api
npm run migration:revert
```

### Ejecutar Seeds
```bash
# Edita primero los IDs en el archivo de seed:
# apps/api/src/database/seeds/sprint3-zones-spots.seed.ts

# Luego ejecuta:
npx ts-node apps/api/src/database/seeds/sprint3-zones-spots.seed.ts
```

## 🚀 Servidor

### Iniciar servidor en desarrollo
```bash
npm run dev:api
```

### Ver logs del servidor
```bash
# Los logs incluyen eventos WebSocket
tail -f apps/api/logs/app.log
```

## 📖 Swagger

Acceder a la documentación interactiva:
```
http://localhost:4000/api/docs
```

## 🔌 WebSocket Testing

### Opción 1: Script de ejemplo
```bash
# Edita primero TOKEN y PARKING_LOT_ID en:
# apps/api/examples/test-websocket.ts

npm install socket.io-client
npx ts-node apps/api/examples/test-websocket.ts
```

### Opción 2: Postman
1. Crear nueva request WebSocket
2. URL: `ws://localhost:4000/realtime`
3. Headers: `Authorization: Bearer {token}`
4. Conectar y enviar:
```json
{
  "event": "joinParkingLot",
  "data": {
    "parkingLotId": "your-id"
  }
}
```

### Opción 3: Socket.IO Client (Browser Console)
```javascript
const socket = io('http://localhost:4000/realtime', {
  auth: { token: 'your-token' }
});

socket.emit('joinParkingLot', { parkingLotId: 'your-id' });

socket.on('occupancyUpdated', (data) => console.log('Occupancy:', data));
socket.on('spotUpdated', (data) => console.log('Spot:', data));
```

## 🧪 Testing con cURL

### 1. Login para obtener token
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

### 2. Crear Zona
```bash
curl -X POST http://localhost:4000/zones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "parkingLotId": "your-parking-lot-id",
    "name": "Zona A - Autos",
    "description": "Zona principal",
    "allowedVehicleTypes": ["CAR"]
  }'
```

### 3. Crear Puesto
```bash
curl -X POST http://localhost:4000/spots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "parkingLotId": "your-parking-lot-id",
    "zoneId": "your-zone-id",
    "code": "A-01",
    "spotType": "CAR",
    "priority": 10,
    "notes": "Cerca de entrada"
  }'
```

### 4. Listar Puestos
```bash
curl -X GET "http://localhost:4000/spots?parkingLotId=your-id&page=1&limit=20" \
  -H "Authorization: Bearer {TOKEN}"
```

### 5. Asignar Puesto Automáticamente
```bash
curl -X POST http://localhost:4000/occupancy/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "parkingLotId": "your-parking-lot-id",
    "vehicleType": "CAR"
  }'
```

### 6. Obtener Resumen de Ocupación
```bash
curl -X GET "http://localhost:4000/occupancy/summary?parkingLotId=your-id" \
  -H "Authorization: Bearer {TOKEN}"
```

### 7. Cambiar Estado de Puesto
```bash
curl -X POST http://localhost:4000/spots/{SPOT_ID}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "toStatus": "OUT_OF_SERVICE",
    "reason": "Mantenimiento programado"
  }'
```

### 8. Ver Historial de Puesto
```bash
curl -X GET http://localhost:4000/spots/{SPOT_ID}/history \
  -H "Authorization: Bearer {TOKEN}"
```

### 9. Liberar Puesto
```bash
curl -X POST http://localhost:4000/occupancy/release/{SPOT_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "reason": "Vehículo salió"
  }'
```

## 🔍 Queries SQL Útiles

### Ver todas las zonas
```sql
SELECT * FROM parking_zones WHERE parking_lot_id = 'your-id';
```

### Ver todos los puestos con su zona
```sql
SELECT 
  s.code, 
  s.status, 
  s.spot_type, 
  z.name as zone_name 
FROM parking_spots s
JOIN parking_zones z ON s.zone_id = z.id
WHERE s.parking_lot_id = 'your-id'
ORDER BY s.code;
```

### Ver ocupación por tipo
```sql
SELECT 
  spot_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'FREE') as free,
  COUNT(*) FILTER (WHERE status = 'OCCUPIED') as occupied
FROM parking_spots
WHERE parking_lot_id = 'your-id'
GROUP BY spot_type;
```

### Ver historial de un puesto
```sql
SELECT 
  from_status,
  to_status,
  reason,
  created_at
FROM spot_status_history
WHERE spot_id = 'your-spot-id'
ORDER BY created_at DESC
LIMIT 10;
```

### Ver puestos disponibles por prioridad
```sql
SELECT code, spot_type, priority
FROM parking_spots
WHERE parking_lot_id = 'your-id'
  AND status = 'FREE'
ORDER BY priority DESC, code ASC;
```

## 📊 Monitoreo

### Ver logs de auditoría de Sprint 3
```sql
SELECT 
  action,
  entity_type,
  metadata,
  created_at
FROM audit_logs
WHERE entity_type IN ('ParkingZone', 'ParkingSpot')
ORDER BY created_at DESC
LIMIT 50;
```

### Verificar índices creados
```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('parking_zones', 'parking_spots', 'spot_status_history');
```

## 🐛 Debugging

### Ver conexiones WebSocket activas
```bash
# Revisa los logs del servidor para ver:
# - Clientes conectados
# - Eventos joinParkingLot
# - Eventos emitidos
```

### Probar race conditions
```bash
# Terminal 1
curl -X POST http://localhost:4000/occupancy/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"parkingLotId": "id", "vehicleType": "CAR"}'

# Terminal 2 (ejecutar simultáneamente)
curl -X POST http://localhost:4000/occupancy/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"parkingLotId": "id", "vehicleType": "CAR"}'

# Solo uno debería tener éxito, el otro debería dar error 409
```

## 📝 Variables de Entorno

Asegúrate de tener configuradas en `.env`:

```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=parking_user
DATABASE_PASSWORD=parking_pass
DATABASE_NAME=parking_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# Frontend URL (para CORS en WebSocket)
FRONTEND_URL=http://localhost:3000

# Puerto del servidor
PORT=4000
```

## 🎯 Flujo de Prueba Completo

1. **Iniciar servidor**
```bash
npm run dev:api
```

2. **Ejecutar migración** (si no se ha ejecutado)
```bash
npm run migration:run
```

3. **Ejecutar seed** (opcional)
```bash
npx ts-node apps/api/src/database/seeds/sprint3-zones-spots.seed.ts
```

4. **Obtener token JWT**
```bash
# Login con usuario de prueba
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin123!"}'
```

5. **Conectar WebSocket** (en otro terminal)
```bash
npx ts-node apps/api/examples/test-websocket.ts
```

6. **Asignar puesto** y ver evento en tiempo real
```bash
curl -X POST http://localhost:4000/occupancy/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"parkingLotId": "id", "vehicleType": "CAR"}'
```

7. **Verificar en Swagger**
```
http://localhost:4000/api/docs
```

## 🔧 Troubleshooting

### Error: "Migration already executed"
```bash
# Verificar migraciones ejecutadas
npm run migration:show

# Si necesitas revertir
npm run migration:revert
```

### Error: "Cannot find module socket.io"
```bash
# Instalar dependencias del WebSocket Gateway
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### Error: "Token invalid"
```bash
# Generar nuevo token haciendo login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin123!"}'
```

### Error 409: "No hay puestos disponibles"
```bash
# Verificar puestos libres
curl -X GET "http://localhost:4000/occupancy/available?parkingLotId=id&vehicleType=CAR" \
  -H "Authorization: Bearer {TOKEN}"

# Si no hay puestos, liberar uno
curl -X POST http://localhost:4000/occupancy/release/{SPOT_ID} \
  -H "Authorization: Bearer {TOKEN}"
```
