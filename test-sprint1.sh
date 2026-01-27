#!/bin/bash

# Script de prueba para Sprint 1 - Sistema de Parqueo
# Puerto: 3002

API_URL="http://localhost:3002/api/v1"

echo "======================================"
echo "  PRUEBAS SPRINT 1 - PARKING SYSTEM"
echo "======================================"
echo ""

# Limpiar datos de pruebas anteriores
echo "🧹  Limpiando datos de pruebas anteriores..."
docker exec -i parking_postgres psql -U parking_user -d parking_system << EOF
DELETE FROM audit_logs WHERE entity_name IN ('Vehicle', 'Ticket');
DELETE FROM tickets;
DELETE FROM vehicles WHERE license_plate LIKE 'TEST%' OR license_plate = 'ABC123';
EOF
echo "✅ Base de datos limpia"
echo ""

# 1. Probar Health Check
echo "1️⃣  Probando Health Check..."
curl -s $API_URL/health
echo -e "\n"

# 2. Login como Admin
echo "2️⃣  Login como Admin..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Admin123*"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido"
echo "Token: ${TOKEN:0:50}..."
echo ""

# 3. Crear un vehículo
echo "3️⃣  Creando vehículo ABC123..."
VEHICLE_RESPONSE=$(curl -s -X POST $API_URL/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "licensePlate": "ABC123",
    "vehicleType": "CAR",
    "brand": "Toyota",
    "model": "Corolla",
    "color": "Blanco"
  }')

VEHICLE_ID=$(echo $VEHICLE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$VEHICLE_ID" ]; then
  echo "❌ Error al crear vehículo"
  echo "Response: $VEHICLE_RESPONSE"
else
  echo "✅ Vehículo creado - ID: $VEHICLE_ID"
fi
echo ""

# 4. Listar vehículos
echo "4️⃣  Listando vehículos..."
curl -s -X GET $API_URL/vehicles \
  -H "Authorization: Bearer $TOKEN" | head -200
echo -e "\n"

# 5. Registrar entrada de vehículo
echo "5️⃣  Registrando entrada de vehículo..."
TICKET_RESPONSE=$(curl -s -X POST $API_URL/tickets/entry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "licensePlate": "ABC123",
    "vehicleType": "CAR"
  }')

TICKET_NUMBER=$(echo $TICKET_RESPONSE | grep -o '"ticketNumber":"[^"]*' | cut -d'"' -f4)

if [ -z "$TICKET_NUMBER" ]; then
  echo "❌ Error al registrar entrada"
  echo "Response: $TICKET_RESPONSE"
else
  echo "✅ Entrada registrada - Ticket: $TICKET_NUMBER"
fi
echo ""

# 6. Ver tickets activos
echo "6️⃣  Tickets activos (vehículos en el parqueadero)..."
curl -s -X GET $API_URL/tickets/active \
  -H "Authorization: Bearer $TOKEN" | head -200
echo -e "\n"

# 7. Esperar un momento (simulando tiempo de estadía)
echo "⏳ Esperando 3 segundos (simulando tiempo de estadía)..."
sleep 3
echo ""

# 8. Registrar salida
if [ ! -z "$TICKET_NUMBER" ]; then
  echo "7️⃣  Registrando salida del vehículo..."
  EXIT_RESPONSE=$(curl -s -X POST "$API_URL/tickets/exit/$TICKET_NUMBER" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "paymentMethod": "CASH",
      "isPaid": true
    }')
  
  echo "✅ Salida registrada"
  echo "Response: $EXIT_RESPONSE" | head -200
  echo ""
fi

# 9. Estadísticas del día
echo "8️⃣  Estadísticas del día..."
curl -s -X GET $API_URL/tickets/stats/daily \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 10. Historial de tickets
echo "9️⃣  Historial de tickets..."
curl -s -X GET $API_URL/tickets/history \
  -H "Authorization: Bearer $TOKEN" | head -200
echo -e "\n"

echo "======================================"
echo "  ✅ PRUEBAS COMPLETADAS"
echo "======================================"
echo ""
echo "📚 Para ver la documentación Swagger:"
echo "   http://localhost:3002/docs"
echo ""
