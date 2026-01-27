#!/bin/bash

# Script de prueba para endpoints Sprint 2
# Ejecutar: bash test-sprint2-endpoints.sh

BASE_URL="http://localhost:3002/api/v1"
TOKEN=""

echo "=================================================="
echo "🔐 1. LOGIN PARA OBTENER TOKEN JWT"
echo "=================================================="
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido: ${TOKEN:0:50}..."
echo ""

# Variables globales para IDs
CUSTOMER_ID=""
VEHICLE_ID=""

echo "=================================================="
echo "👤 2. CREAR CLIENTE"
echo "=================================================="
CREATE_CUSTOMER=$(curl -s -X POST "${BASE_URL}/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "CC",
    "documentNumber": "1234567890",
    "fullName": "Juan Pérez",
    "phone": "+57 300 1234567",
    "email": "juan.perez@example.com"
  }')

CUSTOMER_ID=$(echo $CREATE_CUSTOMER | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$CUSTOMER_ID" ]; then
  echo "❌ Error al crear cliente"
  echo "Response: $CREATE_CUSTOMER"
else
  echo "✅ Cliente creado con ID: $CUSTOMER_ID"
  echo "Respuesta: $CREATE_CUSTOMER" | head -c 200
  echo "..."
fi
echo ""

echo "=================================================="
echo "🔍 3. BUSCAR CLIENTES (con paginación)"
echo "=================================================="
SEARCH_CUSTOMERS=$(curl -s -X GET "${BASE_URL}/customers/search?page=1&limit=10&search=Juan" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Búsqueda de clientes:"
echo "$SEARCH_CUSTOMERS" | head -c 300
echo "..."
echo ""

echo "=================================================="
echo "👤 4. OBTENER CLIENTE POR ID"
echo "=================================================="
if [ ! -z "$CUSTOMER_ID" ]; then
  GET_CUSTOMER=$(curl -s -X GET "${BASE_URL}/customers/${CUSTOMER_ID}" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "✅ Cliente encontrado:"
  echo "$GET_CUSTOMER" | head -c 300
  echo "..."
else
  echo "⚠️ No se puede consultar (no hay customer ID)"
fi
echo ""

echo "=================================================="
echo "🚗 5. CREAR VEHÍCULO (CARRO)"
echo "=================================================="
if [ ! -z "$CUSTOMER_ID" ]; then
  CREATE_VEHICLE=$(curl -s -X POST "${BASE_URL}/vehicles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"customerId\": \"$CUSTOMER_ID\",
      \"vehicleType\": \"CAR\",
      \"plate\": \"ABC-123\"
    }")
  
  VEHICLE_ID=$(echo $CREATE_VEHICLE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  
  if [ -z "$VEHICLE_ID" ]; then
    echo "❌ Error al crear vehículo"
    echo "Response: $CREATE_VEHICLE"
  else
    echo "✅ Vehículo creado con ID: $VEHICLE_ID"
    echo "Respuesta: $CREATE_VEHICLE" | head -c 300
    echo "..."
  fi
else
  echo "⚠️ No se puede crear vehículo (no hay customer ID)"
fi
echo ""

echo "=================================================="
echo "🚲 6. CREAR BICICLETA"
echo "=================================================="
if [ ! -z "$CUSTOMER_ID" ]; then
  CREATE_BICYCLE=$(curl -s -X POST "${BASE_URL}/vehicles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"customerId\": \"$CUSTOMER_ID\",
      \"vehicleType\": \"BICYCLE\",
      \"bicycleCode\": \"BIKE-001\"
    }")
  
  echo "✅ Bicicleta creada:"
  echo "$CREATE_BICYCLE" | head -c 300
  echo "..."
else
  echo "⚠️ No se puede crear bicicleta (no hay customer ID)"
fi
echo ""

echo "=================================================="
echo "🔍 7. BUSCAR VEHÍCULOS"
echo "=================================================="
SEARCH_VEHICLES=$(curl -s -X GET "${BASE_URL}/vehicles/search?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Búsqueda de vehículos:"
echo "$SEARCH_VEHICLES" | head -c 400
echo "..."
echo ""

echo "=================================================="
echo "👤➡️🚗 8. OBTENER VEHÍCULOS DE UN CLIENTE"
echo "=================================================="
if [ ! -z "$CUSTOMER_ID" ]; then
  GET_CUSTOMER_VEHICLES=$(curl -s -X GET "${BASE_URL}/customers/${CUSTOMER_ID}/vehicles" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "✅ Vehículos del cliente:"
  echo "$GET_CUSTOMER_VEHICLES" | head -c 400
  echo "..."
else
  echo "⚠️ No se puede consultar (no hay customer ID)"
fi
echo ""

echo "=================================================="
echo "📝 9. CREAR CONSENTIMIENTO WhatsApp"
echo "=================================================="
if [ ! -z "$CUSTOMER_ID" ]; then
  CREATE_CONSENT=$(curl -s -X POST "${BASE_URL}/consents" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"customerId\": \"$CUSTOMER_ID\",
      \"channel\": \"WHATSAPP\",
      \"status\": \"GRANTED\",
      \"source\": \"WEB_FORM\",
      \"evidenceText\": \"Cliente aceptó recibir notificaciones por WhatsApp\"
    }")
  
  echo "✅ Consentimiento creado:"
  echo "$CREATE_CONSENT" | head -c 300
  echo "..."
else
  echo "⚠️ No se puede crear consentimiento (no hay customer ID)"
fi
echo ""

echo "=================================================="
echo "📝 10. CREAR CONSENTIMIENTO Email"
echo "=================================================="
if [ ! -z "$CUSTOMER_ID" ]; then
  CREATE_EMAIL_CONSENT=$(curl -s -X POST "${BASE_URL}/consents" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"customerId\": \"$CUSTOMER_ID\",
      \"channel\": \"EMAIL\",
      \"status\": \"GRANTED\",
      \"source\": \"CASHIER\",
      \"evidenceText\": \"Cliente solicitó recibir notificaciones por email\"
    }")
  
  echo "✅ Consentimiento Email creado:"
  echo "$CREATE_EMAIL_CONSENT" | head -c 300
  echo "..."
else
  echo "⚠️ No se puede crear consentimiento (no hay customer ID)"
fi
echo ""

echo "=================================================="
echo "👤➡️📝 11. OBTENER CONSENTIMIENTOS DE UN CLIENTE"
echo "=================================================="
if [ ! -z "$CUSTOMER_ID" ]; then
  GET_CONSENTS=$(curl -s -X GET "${BASE_URL}/consents/customer/${CUSTOMER_ID}" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "✅ Consentimientos del cliente:"
  echo "$GET_CONSENTS" | head -c 500
  echo "..."
else
  echo "⚠️ No se puede consultar (no hay customer ID)"
fi
echo ""

echo "=================================================="
echo "🔍 12. ENDPOINT OPS/IDENTIFY - Buscar por Placa"
echo "=================================================="
IDENTIFY_PLATE=$(curl -s -X POST "${BASE_URL}/ops/identify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehiclePlate": "ABC-123"
  }')

echo "✅ Identificación por placa:"
echo "$IDENTIFY_PLATE" | head -c 500
echo "..."
echo ""

echo "=================================================="
echo "🔍 13. ENDPOINT OPS/IDENTIFY - Buscar por Documento"
echo "=================================================="
IDENTIFY_DOC=$(curl -s -X POST "${BASE_URL}/ops/identify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "CC",
    "documentNumber": "1234567890"
  }')

echo "✅ Identificación por documento:"
echo "$IDENTIFY_DOC" | head -c 500
echo "..."
echo ""

echo "=================================================="
echo "🔍 14. ENDPOINT OPS/IDENTIFY - Buscar por Bicicleta"
echo "=================================================="
IDENTIFY_BIKE=$(curl -s -X POST "${BASE_URL}/ops/identify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bicycleCode": "BIKE-001"
  }')

echo "✅ Identificación por código de bicicleta:"
echo "$IDENTIFY_BIKE" | head -c 500
echo "..."
echo ""

echo "=================================================="
echo "✏️ 15. ACTUALIZAR CLIENTE"
echo "=================================================="
if [ ! -z "$CUSTOMER_ID" ]; then
  UPDATE_CUSTOMER=$(curl -s -X PATCH "${BASE_URL}/customers/${CUSTOMER_ID}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "+57 300 9999999",
      "email": "juan.actualizado@example.com"
    }')
  
  echo "✅ Cliente actualizado:"
  echo "$UPDATE_CUSTOMER" | head -c 300
  echo "..."
else
  echo "⚠️ No se puede actualizar (no hay customer ID)"
fi
echo ""

echo "=================================================="
echo "✏️ 16. ACTUALIZAR VEHÍCULO"
echo "=================================================="
if [ ! -z "$VEHICLE_ID" ]; then
  UPDATE_VEHICLE=$(curl -s -X PATCH "${BASE_URL}/vehicles/${VEHICLE_ID}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "plate": "XYZ-999"
    }')
  
  echo "✅ Vehículo actualizado:"
  echo "$UPDATE_VEHICLE" | head -c 300
  echo "..."
else
  echo "⚠️ No se puede actualizar (no hay vehicle ID)"
fi
echo ""

echo "=================================================="
echo "🔍 17. VERIFICAR ACTUALIZACIÓN - OPS/IDENTIFY con nueva placa"
echo "=================================================="
VERIFY_UPDATE=$(curl -s -X POST "${BASE_URL}/ops/identify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehiclePlate": "XYZ-999"
  }')

echo "✅ Verificar vehículo con nueva placa:"
echo "$VERIFY_UPDATE" | head -c 500
echo "..."
echo ""

echo "=================================================="
echo "✅ PRUEBAS COMPLETADAS"
echo "=================================================="
echo "Resumen:"
echo "- Customer ID: $CUSTOMER_ID"
echo "- Vehicle ID: $VEHICLE_ID"
echo ""
echo "Para ver todos los datos en formato JSON, ejecuta:"
echo "curl -s \"${BASE_URL}/customers/${CUSTOMER_ID}\" -H \"Authorization: Bearer $TOKEN\" | jq ."
echo ""
echo "Para ver Swagger UI, abre:"
echo "http://localhost:3002/docs"
