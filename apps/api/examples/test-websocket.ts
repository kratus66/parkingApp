/**
 * Script de ejemplo para probar el WebSocket Gateway
 * 
 * Instalar dependencias:
 * npm install socket.io-client
 * 
 * Ejecutar:
 * npx ts-node apps/api/examples/test-websocket.ts
 */

import { io, Socket } from 'socket.io-client';

// Configuración
const SERVER_URL = 'http://localhost:4000';
const TOKEN = 'your-jwt-token-here'; // Reemplazar con un token válido
const PARKING_LOT_ID = 'your-parking-lot-id'; // Reemplazar con un ID válido

let socket: Socket;

function connect() {
  console.log('🔌 Conectando al servidor WebSocket...\n');

  socket = io(`${SERVER_URL}/realtime`, {
    auth: {
      token: TOKEN,
    },
    transports: ['websocket'],
  });

  // Evento: Conexión exitosa
  socket.on('connect', () => {
    console.log('✅ Conectado al servidor!');
    console.log(`   Socket ID: ${socket.id}\n`);

    // Unirse al parqueadero
    joinParkingLot();
  });

  // Evento: Error de conexión
  socket.on('connect_error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    console.error('   Verifica que:');
    console.error('   1. El servidor esté corriendo en', SERVER_URL);
    console.error('   2. El token JWT sea válido');
    console.error('   3. El usuario tenga permisos correctos\n');
  });

  // Evento: Desconexión
  socket.on('disconnect', (reason) => {
    console.log('🔌 Desconectado:', reason, '\n');
  });

  // Eventos personalizados
  setupEventListeners();
}

function joinParkingLot() {
  console.log(`🚗 Uniéndose al parqueadero ${PARKING_LOT_ID}...\n`);

  socket.emit('joinParkingLot', { parkingLotId: PARKING_LOT_ID }, (response: any) => {
    if (response?.success) {
      console.log('✅', response.message);
      console.log('   Ahora recibirás actualizaciones en tiempo real\n');
      console.log('📡 Escuchando eventos...\n');
    } else {
      console.error('❌ Error al unirse:', response);
    }
  });
}

function setupEventListeners() {
  // Escuchar: Puesto actualizado
  socket.on('spotUpdated', (spot) => {
    console.log('🔄 SPOT UPDATED');
    console.log('   ID:', spot.id);
    console.log('   Código:', spot.code);
    console.log('   Estado:', spot.status);
    console.log('   Tipo:', spot.spotType);
    console.log('---');
  });

  // Escuchar: Ocupación actualizada
  socket.on('occupancyUpdated', (summary) => {
    console.log('📊 OCCUPANCY UPDATED');
    console.log('   Total:', summary.total);
    console.log('   Libres:', summary.free);
    console.log('   Ocupados:', summary.occupied);
    console.log('   Reservados:', summary.reserved);
    console.log('   Fuera de servicio:', summary.outOfService);
    console.log('\n   Por tipo:');
    Object.entries(summary.byType).forEach(([type, stats]: [string, any]) => {
      console.log(`     ${type}: ${stats.free}/${stats.total} libres`);
    });
    console.log('---');
  });

  // Escuchar: Estado de puesto cambiado
  socket.on('spotStatusChanged', (data) => {
    console.log('⚡ SPOT STATUS CHANGED');
    console.log('   Puesto:', data.code);
    console.log('   De:', data.fromStatus);
    console.log('   A:', data.toStatus);
    if (data.reason) {
      console.log('   Razón:', data.reason);
    }
    console.log('---');
  });
}

function disconnect() {
  if (socket) {
    console.log('\n👋 Saliendo del parqueadero...\n');
    socket.emit('leaveParkingLot');
    socket.disconnect();
  }
}

// Manejo de cierre del proceso
process.on('SIGINT', () => {
  disconnect();
  process.exit(0);
});

// Iniciar
console.log('╔══════════════════════════════════════════╗');
console.log('║  WebSocket Client - Sprint 3 Testing    ║');
console.log('╚══════════════════════════════════════════╝\n');

if (TOKEN === 'your-jwt-token-here' || PARKING_LOT_ID === 'your-parking-lot-id') {
  console.error('❌ Error: Debes configurar TOKEN y PARKING_LOT_ID en el script\n');
  console.log('Pasos:');
  console.log('1. Obtén un token JWT haciendo login en /auth/login');
  console.log('2. Obtén un parking lot ID de tu base de datos');
  console.log('3. Reemplaza las constantes TOKEN y PARKING_LOT_ID\n');
  process.exit(1);
}

connect();

console.log('\n💡 Tip: Abre otro terminal y ejecuta operaciones en el API:');
console.log('   POST /occupancy/assign');
console.log('   POST /occupancy/release/:spotId');
console.log('   POST /spots/:id/status');
console.log('\n   Verás las actualizaciones en tiempo real aquí!\n');
console.log('Presiona Ctrl+C para salir\n');
