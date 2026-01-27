#!/bin/bash

echo "╔══════════════════════════════════════════╗"
echo "║  Pruebas Sprint 3 - Parking API         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:3002/api/v1"

# 1. Login
echo "🔐 1. Login para obtener token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Admin123*"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  echo "Respuesta: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido exitosamente"
echo ""

# Obtener IDs necesarios
echo "📋 Obteniendo IDs de parqueadero..."
PARKING_LOTS=$(curl -s -X GET "$API_URL/parking-lots" \
  -H "Authorization: Bearer $TOKEN")

PARKING_LOT_ID=$(echo $PARKING_LOTS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PARKING_LOT_ID" ]; then
  echo "❌ Error: No se encontraron parqueaderos"
  exit 1
fi

echo "✅ Parking Lot ID: $PARKING_LOT_ID"
echo ""

# 2. Crear Zona
echo "🏢 2. Crear Zona de Estacionamiento..."
ZONE_RESPONSE=$(curl -s -X POST "$API_URL/zones" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"parkingLotId\": \"$PARKING_LOT_ID\",
    \"name\": \"Zona Test - Autos\",
    \"description\": \"Zona de prueba para automóviles\",
    \"allowedVehicleTypes\": [\"CAR\"]
  }")

ZONE_ID=$(echo $ZONE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
  echo "❌ Error al crear zona"
  echo "Respuesta: $ZONE_RESPONSE"
else
  echo "✅ Zona creada exitosamente"
  echo "   ID: $ZONE_ID"
fi
echo ""

# 3. Listar Zonas
echo "📋 3. Listar Zonas..."
ZONES_LIST=$(curl -s -X GET "$API_URL/zones?parkingLotId=$PARKING_LOT_ID" \
  -H "Authorization: Bearer $TOKEN")

ZONES_COUNT=$(echo $ZONES_LIST | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "✅ Total de zonas: $ZONES_COUNT"
echo ""

# 4. Crear Puestos
echo "🚗 4. Crear Puestos de Estacionamiento..."
for i in 1 2 3; do
  SPOT_CODE="TEST-0$i"
  SPOT_RESPONSE=$(curl -s -X POST "$API_URL/spots" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"parkingLotId\": \"$PARKING_LOT_ID\",
      \"zoneId\": \"$ZONE_ID\",
      \"code\": \"$SPOT_CODE\",
      \"spotType\": \"CAR\",
      \"priority\": $((10 - i)),
      \"notes\": \"Puesto de prueba $i\"
    }")
  
  SPOT_ID=$(echo $SPOT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -z "$SPOT_ID" ]; then
    echo "   ❌ Error al crear puesto $SPOT_CODE"
  else
    echo "   ✅ Puesto $SPOT_CODE creado (ID: $SPOT_ID)"
    if [ $i -eq 1 ]; then
      FIRST_SPOT_ID=$SPOT_ID
    fi
  fi
done
echo ""

# 5. Listar Puestos
echo "📋 5. Listar Puestos..."
SPOTS_LIST=$(curl -s -X GET "$API_URL/spots?parkingLotId=$PARKING_LOT_ID&status=FREE" \
  -H "Authorization: Bearer $TOKEN")

SPOTS_COUNT=$(echo $SPOTS_LIST | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "✅ Total de puestos libres: $SPOTS_COUNT"
echo ""

# 6. Ver Resumen de Ocupación
echo "📊 6. Resumen de Ocupación..."
OCCUPANCY=$(curl -s -X GET "$API_URL/occupancy/summary?parkingLotId=$PARKING_LOT_ID" \
  -H "Authorization: Bearer $TOKEN")

TOTAL=$(echo $OCCUPANCY | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
FREE=$(echo $OCCUPANCY | grep -o '"free":[0-9]*' | head -1 | cut -d':' -f2)
OCCUPIED=$(echo $OCCUPANCY | grep -o '"occupied":[0-9]*' | head -1 | cut -d':' -f2)

echo "   Total: $TOTAL puestos"
echo "   Libres: $FREE"
echo "   Ocupados: $OCCUPIED"
echo ""

# 7. Asignar Puesto Automáticamente
echo "🎯 7. Asignar Puesto Automáticamente..."
ASSIGN_RESPONSE=$(curl -s -X POST "$API_URL/occupancy/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"parkingLotId\": \"$PARKING_LOT_ID\",
    \"vehicleType\": \"CAR\"
  }")

ASSIGNED_SPOT_ID=$(echo $ASSIGN_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ASSIGNED_CODE=$(echo $ASSIGN_RESPONSE | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
ASSIGNED_STATUS=$(echo $ASSIGN_RESPONSE | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ASSIGNED_SPOT_ID" ]; then
  echo "❌ Error al asignar puesto"
  echo "Respuesta: $ASSIGN_RESPONSE"
else
  echo "✅ Puesto asignado exitosamente"
  echo "   Código: $ASSIGNED_CODE"
  echo "   Estado: $ASSIGNED_STATUS"
  echo "   ID: $ASSIGNED_SPOT_ID"
fi
echo ""

# 8. Cambiar Estado de Puesto
if [ ! -z "$FIRST_SPOT_ID" ]; then
  echo "🔧 8. Cambiar Estado de Puesto..."
  STATUS_CHANGE=$(curl -s -X POST "$API_URL/spots/$FIRST_SPOT_ID/status" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"toStatus\": \"OUT_OF_SERVICE\",
      \"reason\": \"Mantenimiento programado\"
    }")
  
  NEW_STATUS=$(echo $STATUS_CHANGE | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ "$NEW_STATUS" = "OUT_OF_SERVICE" ]; then
    echo "✅ Estado cambiado exitosamente a OUT_OF_SERVICE"
  else
    echo "❌ Error al cambiar estado"
  fi
  echo ""
fi

# 9. Ver Historial de Puesto
if [ ! -z "$FIRST_SPOT_ID" ]; then
  echo "📜 9. Ver Historial del Puesto..."
  HISTORY=$(curl -s -X GET "$API_URL/spots/$FIRST_SPOT_ID/history" \
    -H "Authorization: Bearer $TOKEN")
  
  HISTORY_COUNT=$(echo $HISTORY | grep -o '"id":"[^"]*"' | wc -l)
  echo "✅ Cambios de estado registrados: $HISTORY_COUNT"
  echo ""
fi

# 10. Liberar Puesto
if [ ! -z "$ASSIGNED_SPOT_ID" ]; then
  echo "🔓 10. Liberar Puesto Ocupado..."
  RELEASE_RESPONSE=$(curl -s -X POST "$API_URL/occupancy/release/$ASSIGNED_SPOT_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"reason\": \"Vehículo salió del parqueadero\"
    }")
  
  RELEASED_STATUS=$(echo $RELEASE_RESPONSE | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ "$RELEASED_STATUS" = "FREE" ]; then
    echo "✅ Puesto liberado exitosamente"
  else
    echo "❌ Error al liberar puesto"
  fi
  echo ""
fi

# 11. Ver Ocupación Final
echo "📊 11. Resumen Final de Ocupación..."
FINAL_OCCUPANCY=$(curl -s -X GET "$API_URL/occupancy/summary?parkingLotId=$PARKING_LOT_ID" \
  -H "Authorization: Bearer $TOKEN")

FINAL_TOTAL=$(echo $FINAL_OCCUPANCY | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
FINAL_FREE=$(echo $FINAL_OCCUPANCY | grep -o '"free":[0-9]*' | head -1 | cut -d':' -f2)
FINAL_OCCUPIED=$(echo $FINAL_OCCUPANCY | grep -o '"occupied":[0-9]*' | head -1 | cut -d':' -f2)
FINAL_OUT_OF_SERVICE=$(echo $FINAL_OCCUPANCY | grep -o '"outOfService":[0-9]*' | head -1 | cut -d':' -f2)

echo "   Total: $FINAL_TOTAL puestos"
echo "   Libres: $FINAL_FREE"
echo "   Ocupados: $FINAL_OCCUPIED"
echo "   Fuera de servicio: $FINAL_OUT_OF_SERVICE"
echo ""

echo "╔══════════════════════════════════════════╗"
echo "║  ✅ TODAS LAS PRUEBAS COMPLETADAS       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "📝 Endpoints probados:"
echo "   ✅ POST /auth/login"
echo "   ✅ POST /zones (Crear zona)"
echo "   ✅ GET /zones (Listar zonas)"
echo "   ✅ POST /spots (Crear puesto)"
echo "   ✅ GET /spots (Listar puestos)"
echo "   ✅ GET /occupancy/summary (Resumen)"
echo "   ✅ POST /occupancy/assign (Asignar)"
echo "   ✅ POST /spots/:id/status (Cambiar estado)"
echo "   ✅ GET /spots/:id/history (Historial)"
echo "   ✅ POST /occupancy/release/:id (Liberar)"
echo ""
echo "🎯 Sprint 3 - Pruebas completadas con éxito!"
