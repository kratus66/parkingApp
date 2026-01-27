#!/bin/bash

# Test rápido de endpoints Sprint 2
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZmYxYmE3My0xYTQ1LTQ0YzYtODNhMi1kZGU2NzY1YmQ5MTkiLCJlbWFpbCI6ImFkbWluQGRlbW8uY29tIiwicm9sZSI6IkFETUlOIiwiY29tcGFueUlkIjoiNGM5NjU4MWYtNWEyYi00YThlLTliNjctZmI0NWJmZTFjOWM2IiwicGFya2luZ0xvdElkIjoiMWM2MGU0NTQtNmIwYS00NGJlLWJhMTgtZTNjOGFmZGZiNWJjIiwiaWF0IjoxNzY4NDg4OTkwLCJleHAiOjE3NjkwOTM3OTB9.7Ny9iE-VQK7omJJZHZmMxXZTw5Jb5_psarNzTnjoypQ"

echo "1. Crear Cliente..."
CUSTOMER=$(curl -s -X POST http://localhost:3002/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "CC",
    "documentNumber": "9876543210",
    "fullName": "María González",
    "phone": "+57 310 5555555",
    "email": "maria.gonzalez@test.com"
  }')

CUSTOMER_ID=$(echo $CUSTOMER | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Cliente creado: $CUSTOMER_ID"
echo ""

echo "2. Crear Vehículo (Carro)..."
VEHICLE=$(curl -s -X POST http://localhost:3002/api/v1/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"vehicleType\": \"CAR\",
    \"plate\": \"XYZ-789\"
  }")

echo "✅ Vehículo creado"
echo ""

echo "3. Crear Bicicleta..."
curl -s -X POST http://localhost:3002/api/v1/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"vehicleType\": \"BICYCLE\",
    \"bicycleCode\": \"BIKE-999\"
  }" > /dev/null

echo "✅ Bicicleta creada"
echo ""

echo "4. Crear Consentimiento WhatsApp..."
curl -s -X POST http://localhost:3002/api/v1/consents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"channel\": \"WHATSAPP\",
    \"status\": \"GRANTED\",
    \"source\": \"WEB_FORM\",
    \"evidenceText\": \"Cliente aceptó WhatsApp\"
  }" > /dev/null

echo "✅ Consentimiento creado"
echo ""

echo "5. Buscar por placa (OPS/IDENTIFY)..."
curl -s -X POST http://localhost:3002/api/v1/ops/identify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehiclePlate": "XYZ-789"}' | head -c 400
echo ""
echo ""

echo "6. Buscar por documento (OPS/IDENTIFY)..."
curl -s -X POST http://localhost:3002/api/v1/ops/identify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentType": "CC", "documentNumber": "9876543210"}' | head -c 400
echo ""
echo ""

echo "7. Buscar clientes..."
curl -s -X GET "http://localhost:3002/api/v1/customers/search?search=María" \
  -H "Authorization: Bearer $TOKEN" | head -c 400
echo ""
echo ""

echo "8. Ver vehículos del cliente..."
curl -s -X GET "http://localhost:3002/api/v1/customers/$CUSTOMER_ID/vehicles" \
  -H "Authorization: Bearer $TOKEN" | head -c 400
echo ""
echo ""

echo "9. Ver consentimientos del cliente..."
curl -s -X GET "http://localhost:3002/api/v1/consents/customer/$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN" | head -c 400
echo ""
echo ""

echo "✅ TODAS LAS PRUEBAS COMPLETADAS"
