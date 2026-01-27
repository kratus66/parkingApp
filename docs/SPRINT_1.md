# Sprint 1 - Gestión de Vehículos y Tickets

## ✅ Implementación Completada

### Nuevas Entidades

#### 1. Vehicle (Vehículo)
- **Ubicación**: `apps/api/src/entities/vehicle.entity.ts`
- **Campos**:
  - `id`: UUID
  - `licensePlate`: Placa del vehículo (única)
  - `vehicleType`: Tipo (CAR, MOTORCYCLE, TRUCK, VAN, SUV)
  - `brand`, `model`, `color`: Detalles opcionales
  - `isBlacklisted`: Indica si está bloqueado
  - `blacklistReason`: Razón del bloqueo
  - `notes`: Notas adicionales
  - `companyId`: Relación con empresa
  - Timestamps: `createdAt`, `updatedAt`

#### 2. Ticket (Tiquete de Parqueo)
- **Ubicación**: `apps/api/src/entities/ticket.entity.ts`
- **Campos**:
  - `id`: UUID
  - `ticketNumber`: Número único de ticket (formato: T240115-0001)
  - `vehicleId`: Relación con vehículo
  - `parkingLotId`: Relación con parqueadero
  - `entryUserId`: Usuario que registró entrada
  - `exitUserId`: Usuario que registró salida
  - `entryTime`: Hora de entrada
  - `exitTime`: Hora de salida
  - `status`: Estado (ACTIVE, COMPLETED, CANCELLED)
  - `parkingDurationMinutes`: Duración en minutos
  - `amount`: Monto a pagar
  - `paymentMethod`: Método de pago (CASH, CARD, TRANSFER, MOBILE)
  - `isPaid`: Indicador de pago
  - `paidAt`: Fecha de pago
  - `notes`: Notas adicionales
  - Timestamps: `createdAt`, `updatedAt`

### Módulos Creados

#### 1. VehiclesModule
**Ubicación**: `apps/api/src/modules/vehicles/`

**Endpoints**:
- `POST /api/v1/vehicles` - Crear vehículo
- `GET /api/v1/vehicles` - Listar vehículos
- `GET /api/v1/vehicles/:id` - Obtener vehículo por ID
- `GET /api/v1/vehicles/by-plate/:licensePlate` - Buscar por placa
- `GET /api/v1/vehicles/blacklisted` - Listar vehículos bloqueados
- `PATCH /api/v1/vehicles/:id` - Actualizar vehículo
- `DELETE /api/v1/vehicles/:id` - Eliminar vehículo
- `POST /api/v1/vehicles/:id/blacklist` - Bloquear vehículo
- `POST /api/v1/vehicles/:id/unblacklist` - Desbloquear vehículo

**Permisos**:
- Crear/Buscar: ADMIN, SUPERVISOR, CASHIER
- Actualizar/Bloquear: ADMIN, SUPERVISOR
- Eliminar: Solo ADMIN

#### 2. TicketsModule
**Ubicación**: `apps/api/src/modules/tickets/`

**Endpoints**:
- `POST /api/v1/tickets/entry` - Registrar entrada de vehículo
- `POST /api/v1/tickets/exit/:ticketNumber` - Registrar salida y cobro
- `POST /api/v1/tickets/cancel/:ticketNumber` - Cancelar ticket
- `GET /api/v1/tickets/active` - Vehículos actualmente en el parqueadero
- `GET /api/v1/tickets/history` - Historial de tickets
- `GET /api/v1/tickets/stats/daily` - Estadísticas del día
- `GET /api/v1/tickets/:ticketNumber` - Buscar ticket por número

**Permisos**:
- Entrada/Salida: ADMIN, SUPERVISOR, CASHIER
- Cancelar/Historial/Stats: ADMIN, SUPERVISOR

### Lógica de Negocio

#### Sistema de Tarifas
Configurado en `TicketsService`:
- Tarifa base: $3,000 por hora
- Cobro mínimo: 15 minutos
- Cálculo automático basado en tiempo de estadía

#### Flujo de Trabajo
1. **Entrada**:
   - Registrar placa (crea vehículo automáticamente si no existe)
   - Verificar si está en lista negra
   - Verificar que no tenga ticket activo
   - Generar número de ticket único
   - Registrar hora de entrada

2. **Salida**:
   - Buscar ticket activo por número
   - Calcular duración y monto
   - Registrar método de pago
   - Marcar como completado
   - Registrar auditoría

3. **Cancelación**:
   - Solo para ADMIN/SUPERVISOR
   - Requiere razón
   - Registra en auditoría

### Base de Datos

**Migración**: `1705100000000-Sprint1VehiclesTickets.ts`

Crea:
- Tabla `vehicles` con FK a `companies`
- Tabla `tickets` con FK a `vehicles`, `parking_lots`, `users`
- Índices para optimización de consultas

### Auditoría

Todas las acciones se registran en el sistema de auditoría:
- CREATE_VEHICLE
- UPDATE_VEHICLE
- DELETE_VEHICLE
- BLACKLIST_VEHICLE
- UNBLACKLIST_VEHICLE
- VEHICLE_ENTRY
- VEHICLE_EXIT
- CANCEL_TICKET

## 🚀 Cómo Probar

### 1. Iniciar Docker Desktop
Abre Docker Desktop manualmente en Windows.

### 2. Levantar Servicios
```bash
cd c:\Users\Usuario\Desktop\parking_app
npm run docker:up
```

### 3. Ejecutar Migraciones
```bash
cd apps/api
npm run migration:run
```

### 4. Iniciar Backend
```bash
npm run start:dev
```

### 5. Probar Endpoints

#### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@demo.com\",\"password\":\"Admin123*\"}"
```

Guarda el token JWT que recibes.

#### Crear Vehículo
```bash
curl -X POST http://localhost:3001/api/v1/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d "{
    \"licensePlate\": \"ABC123\",
    \"vehicleType\": \"CAR\",
    \"brand\": \"Toyota\",
    \"model\": \"Corolla\",
    \"color\": \"Blanco\"
  }"
```

#### Registrar Entrada
```bash
curl -X POST http://localhost:3001/api/v1/tickets/entry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d "{
    \"licensePlate\": \"ABC123\",
    \"vehicleType\": \"CAR\"
  }"
```

Guarda el `ticketNumber` que recibes.

#### Ver Tickets Activos
```bash
curl -X GET http://localhost:3001/api/v1/tickets/active \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### Registrar Salida
```bash
curl -X POST http://localhost:3001/api/v1/tickets/exit/T240115-0001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d "{
    \"paymentMethod\": \"CASH\",
    \"isPaid\": true
  }"
```

#### Estadísticas del Día
```bash
curl -X GET http://localhost:3001/api/v1/tickets/stats/daily \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## 📊 Swagger UI

Accede a la documentación interactiva en:
```
http://localhost:3001/api/docs
```

Aquí puedes probar todos los endpoints visualmente.

## ⚠️ Importante

Antes de ejecutar las pruebas:
1. ✅ Docker Desktop debe estar corriendo
2. ✅ Contenedores de PostgreSQL y pgAdmin iniciados
3. ✅ Migraciones ejecutadas
4. ✅ Backend en ejecución

## 📝 Próximos Pasos

Sprint 2 incluirá:
- Dashboard con métricas en tiempo real
- Reportes de ingresos
- Configuración de tarifas personalizadas
- Sistema de suscripciones/abonados
- Impresión de tickets

## 🎯 Resumen de URLs

- Backend API: http://localhost:3001/api/v1
- Swagger Docs: http://localhost:3001/api/docs
- PostgreSQL: localhost:5433
- pgAdmin: http://localhost:5050

## 👥 Usuarios Demo

- **Admin**: admin@demo.com / Admin123*
- **Supervisor**: supervisor@demo.com / Super123*
- **Cajero**: cajero@demo.com / Cajero123*
