# 🧪 GUÍA DE PRUEBAS - SPRINT 2

## ⚠️ IMPORTANTE: Los errores de TypeScript en VSCode son FALSOS

Los siguientes errores que ves en VSCode son del **cache de TypeScript Language Server**:
- ❌ `No se encuentra el módulo "../../common/decorators/current-user.decorator"`
- ❌ `No se encuentra el módulo "./consent.entity"`

**SOLUCIÓN**: Los archivos SÍ existen y el servidor NestJS **compila perfectamente** sin errores.

Para limpiar estos errores:
1. Presiona `Ctrl+Shift+P` 
2. Escribe: `TypeScript: Restart TS Server`
3. O cierra y reabre VSCode

## ✅ Estado del Backend

**Servidor**: http://localhost:3002/api/v1  
**Swagger UI**: http://localhost:3002/docs  
**Compilación**: ✅ 0 errores

**Módulos registrados**:
- ✅ CustomersModule
- ✅ VehiclesV2Module  
- ✅ ConsentsModule
- ✅ OpsModule

**Endpoints nuevos (13)**:
- 6 endpoints de Customers
- 4 endpoints de VehiclesV2
- 2 endpoints de Consents
- 1 endpoint de Ops (identify)

---

## 🚀 Cómo Probar los Endpoints

### Opción 1: Swagger UI (Recomendado)

1. Abre el navegador en: **http://localhost:3002/docs**
2. Primero haz login en `/api/v1/auth/login`:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
3. Copia el `accessToken` de la respuesta
4. Haz clic en el botón **"Authorize"** arriba a la derecha
5. Pega el token en el campo `Bearer {token}`
6. Ahora puedes probar todos los endpoints

### Opción 2: curl (Terminal)

#### 1️⃣ Login
```bash
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Guarda el token en una variable:
```bash
export TOKEN="<el_token_que_obtuviste>"
```

#### 2️⃣ Crear Cliente
```bash
curl -X POST http://localhost:3002/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "CC",
    "documentNumber": "1234567890",
    "fullName": "Juan Pérez",
    "phone": "+57 300 1234567",
    "email": "juan.perez@example.com"
  }'
```

Guarda el ID del cliente:
```bash
export CUSTOMER_ID="<el_id_del_cliente>"
```

#### 3️⃣ Buscar Clientes
```bash
curl -X GET "http://localhost:3002/api/v1/customers/search?page=1&limit=10&search=Juan" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4️⃣ Obtener Cliente por ID
```bash
curl -X GET "http://localhost:3002/api/v1/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

#### 5️⃣ Crear Vehículo (Carro)
```bash
curl -X POST http://localhost:3002/api/v1/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"vehicleType\": \"CAR\",
    \"plate\": \"ABC-123\"
  }"
```

#### 6️⃣ Crear Bicicleta
```bash
curl -X POST http://localhost:3002/api/v1/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"vehicleType\": \"BICYCLE\",
    \"bicycleCode\": \"BIKE-001\"
  }"
```

#### 7️⃣ Buscar Vehículos
```bash
curl -X GET "http://localhost:3002/api/v1/vehicles/search?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 8️⃣ Obtener Vehículos de un Cliente
```bash
curl -X GET "http://localhost:3002/api/v1/customers/$CUSTOMER_ID/vehicles" \
  -H "Authorization: Bearer $TOKEN"
```

#### 9️⃣ Crear Consentimiento WhatsApp
```bash
curl -X POST http://localhost:3002/api/v1/consents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"channel\": \"WHATSAPP\",
    \"status\": \"GRANTED\",
    \"source\": \"WEB_FORM\",
    \"evidenceText\": \"Cliente aceptó recibir notificaciones por WhatsApp\"
  }"
```

#### 🔟 Crear Consentimiento Email
```bash
curl -X POST http://localhost:3002/api/v1/consents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"channel\": \"EMAIL\",
    \"status\": \"GRANTED\",
    \"source\": \"CASHIER\",
    \"evidenceText\": \"Cliente solicitó recibir notificaciones por email\"
  }"
```

#### 1️⃣1️⃣ Obtener Consentimientos del Cliente
```bash
curl -X GET "http://localhost:3002/api/v1/consents/customer/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

#### 1️⃣2️⃣ Endpoint OPS/IDENTIFY - Buscar por Placa
```bash
curl -X POST http://localhost:3002/api/v1/ops/identify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehiclePlate": "ABC-123"
  }'
```

#### 1️⃣3️⃣ Endpoint OPS/IDENTIFY - Buscar por Documento
```bash
curl -X POST http://localhost:3002/api/v1/ops/identify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "CC",
    "documentNumber": "1234567890"
  }'
```

#### 1️⃣4️⃣ Endpoint OPS/IDENTIFY - Buscar por Bicicleta
```bash
curl -X POST http://localhost:3002/api/v1/ops/identify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bicycleCode": "BIKE-001"
  }'
```

#### 1️⃣5️⃣ Actualizar Cliente
```bash
curl -X PATCH "http://localhost:3002/api/v1/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+57 300 9999999",
    "email": "juan.actualizado@example.com"
  }'
```

---

## 🔍 Validaciones Implementadas

### Cliente (Customer)
- ✅ Documento único por companyId
- ✅ Normalización documentNumber (uppercase, trim)
- ✅ Validación de email y teléfono
- ✅ CASHIER no puede modificar documentType/documentNumber
- ✅ Relaciones con vehicles y consents

### Vehículo V2 (Vehicle)
- ✅ Placa única por companyId (para CAR/MOTORCYCLE/TRUCK_BUS)
- ✅ BicycleCode único por companyId (para BICYCLE)
- ✅ Normalización plate (uppercase, sin espacios/guiones)
- ✅ CHECK constraint: BICYCLE debe tener bicycleCode, otros vehicleType deben tener plate
- ✅ CASHIER no puede modificar customerId
- ✅ Relación con customer

### Consentimiento (Consent)
- ✅ Historial completo (no se elimina, solo se inserta)
- ✅ grantedAt se setea automáticamente cuando status=GRANTED
- ✅ revokedAt se setea automáticamente cuando status=REVOKED
- ✅ Trazabilidad con actorUserId
- ✅ Multi-canal (WHATSAPP, EMAIL, SMS, CALL)

### OPS Identify
- ✅ Búsqueda unificada por: plate OR bicycleCode OR (documentType + documentNumber)
- ✅ Retorna customer + vehicles + current consents
- ✅ Suggestions si no encuentra resultados

---

## 📊 Enums Disponibles

### DocumentType
- `CC` - Cédula de Ciudadanía
- `CE` - Cédula de Extranjería
- `PASSPORT` - Pasaporte
- `PPT` - Permiso por Protección Temporal
- `OTHER` - Otro

### VehicleType
- `BICYCLE` - Bicicleta
- `MOTORCYCLE` - Motocicleta
- `CAR` - Carro
- `TRUCK_BUS` - Camión o Bus

### ConsentChannel
- `WHATSAPP` - WhatsApp
- `EMAIL` - Email
- `SMS` - SMS
- `CALL` - Llamada telefónica

### ConsentStatus
- `GRANTED` - Otorgado
- `REVOKED` - Revocado
- `PENDING` - Pendiente

### ConsentSource
- `WEB_FORM` - Formulario web
- `CASHIER` - Cajero
- `MOBILE_APP` - App móvil
- `PHONE_CALL` - Llamada telefónica
- `EMAIL` - Email

---

## ✅ Checklist de Funcionalidades

- [x] Multi-tenant (todas las queries filtran por companyId)
- [x] Permisos basados en roles (CASHIER tiene restricciones)
- [x] Auditoría completa (todos los CUD registrados)
- [x] Normalización automática (documentos y placas)
- [x] Validaciones con class-validator
- [x] Paginación en búsquedas
- [x] Swagger documentado
- [x] Soporte bicicletas con bicycleCode
- [x] Historial de consentimientos GDPR
- [x] Búsqueda unificada para taquilla (/ops/identify)

---

## 🎯 Próximos Pasos

1. **Probar todos los endpoints en Swagger**
2. **Crear datos de prueba (seed)** con clientes, vehículos y consentimientos variados
3. **Implementar frontend** (apps/web) con Next.js
4. **Escribir tests unitarios** para normalización y validaciones
5. **Tests de integración** para verificar 409 Conflict en duplicados
