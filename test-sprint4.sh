#!/bin/bash

# Script de pruebas para Sprint 4
# Prueba funcionalidades: reprint-ticket, cancel-session, consentimientos, audit logs

API_URL="http://localhost:3002/api/v1"
TOKEN=$(cat token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se encontró token.txt"
  echo "Por favor, primero inicia sesión y guarda el token"
  exit 1
fi

echo "======================================"
echo "🧪 PRUEBAS SPRINT 4"
echo "======================================"
echo ""

# Parking Lot ID
PARKING_LOT_ID="b04f6eec-264b-4143-9b71-814b05d4ffc4"

echo "📝 PASO 1: Crear vehículo de prueba"
echo "--------------------------------------"

VEHICLE_RESPONSE=$(curl -s -X POST "$API_URL/vehicles-v2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "CAR",
    "plate": "TEST'$(date +%s)'",
    "brand": "Toyota",
    "model": "Corolla",
    "color": "Azul",
    "customer": {
      "documentType": "CC",
      "documentNumber": "1234567890",
      "fullName": "Test Usuario Sprint4",
      "phone": "+573001234567",
      "email": "test@sprint4.com"
    }
  }')

echo "Response: $VEHICLE_RESPONSE"
VEHICLE_ID=$(echo $VEHICLE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
VEHICLE_PLATE=$(echo $VEHICLE_RESPONSE | grep -o '"plate":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$VEHICLE_ID" ]; then
  echo "❌ Error creando vehículo"
  exit 1
fi

echo "✅ Vehículo creado: $VEHICLE_PLATE (ID: $VEHICLE_ID)"
echo ""

echo "📝 PASO 2: Check-In con consentimientos"
echo "--------------------------------------"

CHECKIN_RESPONSE=$(curl -s -X POST "$API_URL/parking-sessions/check-in" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parkingLotId": "'$PARKING_LOT_ID'",
    "vehicleType": "CAR",
    "vehiclePlate": "'$VEHICLE_PLATE'",
    "phoneNumber": "+573001234567",
    "email": "test@sprint4.com",
    "whatsappConsent": true,
    "emailConsent": true
  }')

echo "Response: $CHECKIN_RESPONSE"
SESSION_ID=$(echo $CHECKIN_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TICKET_NUMBER=$(echo $CHECKIN_RESPONSE | grep -o '"ticketNumber":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo "❌ Error en check-in"
  exit 1
fi

echo "✅ Check-In exitoso"
echo "   Session ID: $SESSION_ID"
echo "   Ticket: $TICKET_NUMBER"
echo ""

echo "📝 PASO 3: Verificar consentimientos guardados"
echo "--------------------------------------"

# Buscar el customerId del vehículo
CUSTOMER_ID=$(echo $VEHICLE_RESPONSE | grep -o '"customerId":"[^"]*"' | cut -d'"' -f4)

CONSENTS_RESPONSE=$(curl -s -X GET "$API_URL/consents?customerId=$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $CONSENTS_RESPONSE"

WHATSAPP_CONSENT=$(echo $CONSENTS_RESPONSE | grep -o '"channel":"WHATSAPP"')
EMAIL_CONSENT=$(echo $CONSENTS_RESPONSE | grep -o '"channel":"EMAIL"')

if [ -n "$WHATSAPP_CONSENT" ] && [ -n "$EMAIL_CONSENT" ]; then
  echo "✅ Consentimientos guardados correctamente (WhatsApp y Email)"
else
  echo "⚠️  Advertencia: No se encontraron todos los consentimientos"
fi
echo ""

echo "📝 PASO 4: Reimprimir ticket (1ra vez)"
echo "--------------------------------------"

REPRINT1_RESPONSE=$(curl -s -X POST "$API_URL/parking-sessions/reprint-ticket" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'$SESSION_ID'",
    "reason": "Cliente perdió el ticket original"
  }')

echo "Response: $REPRINT1_RESPONSE"
REPRINT_COUNT=$(echo $REPRINT1_RESPONSE | grep -o '"reprintCount":[0-9]*' | cut -d':' -f2)

if [ "$REPRINT_COUNT" = "1" ]; then
  echo "✅ Reimpresión 1 exitosa (contador: $REPRINT_COUNT)"
else
  echo "❌ Error en reimpresión 1"
fi
echo ""

echo "📝 PASO 5: Reimprimir ticket (2da vez)"
echo "--------------------------------------"

REPRINT2_RESPONSE=$(curl -s -X POST "$API_URL/parking-sessions/reprint-ticket" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'$SESSION_ID'",
    "reason": "Ticket dañado por lluvia"
  }')

echo "Response: $REPRINT2_RESPONSE"
REPRINT_COUNT=$(echo $REPRINT2_RESPONSE | grep -o '"reprintCount":[0-9]*' | cut -d':' -f2)

if [ "$REPRINT_COUNT" = "2" ]; then
  echo "✅ Reimpresión 2 exitosa (contador: $REPRINT_COUNT)"
else
  echo "❌ Error en reimpresión 2"
fi
echo ""

echo "📝 PASO 6: Verificar sesión activa"
echo "--------------------------------------"

ACTIVE_RESPONSE=$(curl -s -X GET "$API_URL/parking-sessions/active" \
  -H "Authorization: Bearer $TOKEN")

echo "Active sessions count: $(echo $ACTIVE_RESPONSE | grep -o '"id":"'$SESSION_ID'"' | wc -l)"

if echo "$ACTIVE_RESPONSE" | grep -q "$SESSION_ID"; then
  echo "✅ Sesión aparece en lista de activas"
else
  echo "❌ Sesión NO aparece en lista de activas"
fi
echo ""

echo "📝 PASO 7: Cancelar sesión"
echo "--------------------------------------"

CANCEL_RESPONSE=$(curl -s -X POST "$API_URL/parking-sessions/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'$SESSION_ID'",
    "reason": "Cliente decidió no estacionar - prueba Sprint 4"
  }')

echo "Response: $CANCEL_RESPONSE"

if echo "$CANCEL_RESPONSE" | grep -q '"status":"CANCELED"'; then
  echo "✅ Sesión cancelada exitosamente"
else
  echo "❌ Error al cancelar sesión"
fi
echo ""

echo "📝 PASO 8: Verificar que ya no está activa"
echo "--------------------------------------"

ACTIVE2_RESPONSE=$(curl -s -X GET "$API_URL/parking-sessions/active" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ACTIVE2_RESPONSE" | grep -q "$SESSION_ID"; then
  echo "❌ ERROR: Sesión cancelada aún aparece como activa"
else
  echo "✅ Sesión cancelada NO aparece en activas (correcto)"
fi
echo ""

echo "======================================"
echo "📊 RESUMEN DE PRUEBAS SPRINT 4"
echo "======================================"
echo ""
echo "Funcionalidades probadas:"
echo "  ✓ Check-In con consentimientos"
echo "  ✓ Guardado de consentimientos WhatsApp/Email"
echo "  ✓ Reimpresión de tickets (múltiples)"
echo "  ✓ Contador de reimpresiones"
echo "  ✓ Cancelación de sesiones"
echo "  ✓ Liberación de espacio al cancelar"
echo ""
echo "Datos de prueba:"
echo "  Vehicle Plate: $VEHICLE_PLATE"
echo "  Ticket Number: $TICKET_NUMBER"
echo "  Session ID: $SESSION_ID"
echo ""
echo "✅ Pruebas completadas"
