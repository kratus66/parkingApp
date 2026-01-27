/**
 * Script de prueba para el flujo completo de Check-in → Check-out
 * Prueba: Entrada de vehículo, espera, y salida con cálculo de pago
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002/api/v1';
const PARKING_LOT_ID = 'b04f6eec-264b-4143-9b71-814b05d4ffc4';

let authToken = '';
let sessionId = '';
let ticketNumber = '';

// Función para login
async function login() {
  console.log('\n🔐 Paso 1: Login...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@demo.com',
      password: 'Admin123*',
    });
    
    authToken = response.data.data.accessToken;
    console.log('✅ Login exitoso');
    if (authToken) {
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
    }
    return authToken;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Función para hacer check-in
async function checkIn() {
  console.log('\n🚗 Paso 2: Check-in de vehículo ABC123...');
  
  try {
    // Primero identificar el vehículo
    console.log('   2.1. Identificando vehículo...');
    const identifyResponse = await axios.post(
      `${API_URL}/ops/identify`,
      {
        vehiclePlate: 'ABC123',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    console.log('   ✅ Vehículo identificado:', identifyResponse.data.data.vehicleType);
    
    // Obtener espacios disponibles
    console.log('   2.2. Obteniendo espacios disponibles...');
    const spotsResponse = await axios.get(
      `${API_URL}/occupancy/available?parkingLotId=${PARKING_LOT_ID}&vehicleType=CAR`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    const availableSpots = spotsResponse.data.data;
    console.log(`   ✅ ${availableSpots.length} espacios disponibles`);
    
    if (availableSpots.length === 0) {
      console.error('   ❌ No hay espacios disponibles');
      process.exit(1);
    }
    
    const selectedSpot = availableSpots[0];
    console.log(`   📍 Espacio seleccionado: ${selectedSpot.zone.name} - ${selectedSpot.code}`);
    
    // Hacer check-in
    console.log('   2.3. Registrando entrada...');
    const checkInResponse = await axios.post(
      `${API_URL}/parking-sessions/check-in`,
      {
        parkingLotId: PARKING_LOT_ID,
        vehiclePlate: 'ABC123',
        vehicleType: 'CAR',
        parkingSpotId: selectedSpot.id,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    sessionId = checkInResponse.data.data.session.id;
    ticketNumber = checkInResponse.data.data.ticket.ticketNumber;
    
    console.log('✅ Check-in completado');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Ticket: ${ticketNumber}`);
    console.log(`   Hora entrada: ${new Date(checkInResponse.data.data.session.entryAt).toLocaleString()}`);
    if (checkInResponse.data.data.ticket.spot) {
      console.log(`   Puesto: ${checkInResponse.data.data.ticket.spot.zone?.name || 'N/A'} - ${checkInResponse.data.data.ticket.spot.code}`);
    }
    
    return { sessionId, ticketNumber };
  } catch (error) {
    console.error('❌ Error en check-in:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Función para verificar sesión
async function verifySession() {
  console.log('\n🔍 Paso 3: Verificando sesión activa...');
  
  try {
    const response = await axios.get(
      `${API_URL}/parking-sessions/by-ticket/${ticketNumber}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    const session = response.data.data;
    console.log('✅ Sesión encontrada');
    console.log(`   Estado: ${session.status}`);
    if (session.vehicle) {
      console.log(`   Vehículo: ${session.vehicle.plate || session.vehicle.bicycleCode}`);
    }
    if (session.spot) {
      console.log(`   Puesto: ${session.spot.code}`);
    }
    
    return session;
  } catch (error) {
    console.error('❌ Error al verificar sesión:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Simular tiempo en el parqueadero (esperar 5 segundos)
async function simulateParking() {
  console.log('\n⏳ Paso 4: Simulando tiempo en parqueadero...');
  console.log('   Esperando 5 segundos...');
  
  return new Promise(resolve => {
    let seconds = 5;
    const interval = setInterval(() => {
      console.log(`   ${seconds}...`);
      seconds--;
      if (seconds < 0) {
        clearInterval(interval);
        console.log('✅ Tiempo completado');
        resolve();
      }
    }, 1000);
  });
}

// Función para hacer check-out
async function checkOut() {
  console.log('\n💰 Paso 5: Check-out y generación de recibo...');
  
  try {
    const response = await axios.post(
      `${API_URL}/parking-sessions/${sessionId}/check-out`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    const result = response.data.data;
    
    console.log('✅ Check-out completado');
    console.log('\n📄 RECIBO DE PAGO:');
    console.log('═══════════════════════════════════════');
    console.log(`Ticket: ${result.receipt.ticketNumber}`);
    console.log(`Entrada: ${new Date(result.receipt.entryAt).toLocaleString('es-CO')}`);
    console.log(`Salida: ${new Date(result.receipt.exitAt).toLocaleString('es-CO')}`);
    console.log('───────────────────────────────────────');
    console.log(`Duración: ${result.receipt.duration.formatted}`);
    console.log(`  (${result.receipt.duration.minutes} minutos)`);
    console.log('───────────────────────────────────────');
    console.log(`Vehículo: ${result.receipt.vehicle.type}`);
    console.log(`Placa: ${result.receipt.vehicle.licensePlate}`);
    console.log(`Puesto: ${result.receipt.spot.zone.name} - ${result.receipt.spot.code}`);
    console.log('───────────────────────────────────────');
    console.log(`Tarifa/hora: $${result.receipt.amount.ratePerHour.toLocaleString('es-CO')}`);
    console.log(`Horas cobradas: ${result.receipt.amount.totalHours}`);
    console.log('═══════════════════════════════════════');
    console.log(`TOTAL A PAGAR: ${result.receipt.amount.formattedAmount}`);
    console.log('═══════════════════════════════════════');
    console.log(`\nParqueadero: ${result.receipt.parkingLot.name}`);
    console.log(`Dirección: ${result.receipt.parkingLot.address}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error en check-out:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Detalles:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Verificar que el espacio fue liberado
async function verifySpotReleased() {
  console.log('\n🔓 Paso 6: Verificando que el espacio fue liberado...');
  
  try {
    const response = await axios.get(
      `${API_URL}/occupancy/summary?parkingLotId=${PARKING_LOT_ID}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    const summary = response.data.data;
    console.log('✅ Resumen de ocupación:');
    console.log(`   Total espacios: ${summary.totalSpots}`);
    console.log(`   Libres: ${summary.freeSpots}`);
    console.log(`   Ocupados: ${summary.occupiedSpots}`);
    
    return summary;
  } catch (error) {
    console.error('❌ Error al verificar ocupación:', error.response?.data || error.message);
  }
}

// Ejecutar flujo completo
async function runFullFlow() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   PRUEBA COMPLETA DE FLUJO CHECK-IN → CHECK-OUT         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  try {
    await login();
    await checkIn();
    await verifySession();
    await simulateParking();
    await checkOut();
    await verifySpotReleased();
    
    console.log('\n✅✅✅ FLUJO COMPLETADO EXITOSAMENTE ✅✅✅\n');
  } catch (error) {
    console.error('\n❌ Error en el flujo:', error.message);
    process.exit(1);
  }
}

// Ejecutar
runFullFlow();
