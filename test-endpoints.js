const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

async function testEndpoints() {
  console.log('\n🧪 ========================================');
  console.log('   PRUEBAS DE ENDPOINTS Y CONEXIÓN');
  console.log('========================================\n');

  let token = '';

  // Test 1: Health Check
  console.log('1️⃣  Test: Health Check');
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('   ✅ Health Check OK');
    console.log('   📊 Status:', response.data.data.status);
    console.log('   ⏰ Uptime:', response.data.data.uptime, 'segundos\n');
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   ⚠️  Asegúrate de que el backend esté corriendo en', API_URL, '\n');
    return;
  }

  // Test 2: Login con credenciales correctas
  console.log('2️⃣  Test: Login (Admin)');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@demo.com',
      password: 'Admin123*'
    });
    token = response.data.data.accessToken;
    console.log('   ✅ Login exitoso');
    console.log('   👤 Usuario:', response.data.data.user.fullName);
    console.log('   🔑 Rol:', response.data.data.user.role);
    console.log('   🏢 Empresa:', response.data.data.user.company.name);
    console.log('   🎫 Token:', token.substring(0, 30) + '...\n');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data?.message || error.message, '\n');
    return;
  }

  // Test 3: Login con credenciales incorrectas
  console.log('3️⃣  Test: Login con credenciales incorrectas');
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@demo.com',
      password: 'WrongPassword'
    });
    console.log('   ❌ Este test debería fallar\n');
  } catch (error) {
    console.log('   ✅ Error esperado:', error.response?.data?.message, '\n');
  }

  // Test 4: Obtener usuarios (con autenticación)
  console.log('4️⃣  Test: GET /users (Con autenticación)');
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Usuarios obtenidos:', response.data.data.length);
    response.data.data.forEach(user => {
      console.log(`   👤 ${user.fullName} (${user.email}) - ${user.role}`);
    });
    console.log('');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data?.message || error.message, '\n');
  }

  // Test 5: Intentar acceder sin token
  console.log('5️⃣  Test: GET /users (Sin autenticación)');
  try {
    await axios.get(`${API_URL}/users`);
    console.log('   ❌ Este test debería fallar\n');
  } catch (error) {
    console.log('   ✅ Error esperado (401):', error.response?.status, '\n');
  }

  // Test 6: Obtener empresas
  console.log('6️⃣  Test: GET /companies (Admin)');
  try {
    const response = await axios.get(`${API_URL}/companies`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Empresas obtenidas:', response.data.data.length);
    response.data.data.forEach(company => {
      console.log(`   🏢 ${company.name} (${company.nit})`);
    });
    console.log('');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data?.message || error.message, '\n');
  }

  // Test 7: Obtener parqueaderos
  console.log('7️⃣  Test: GET /parking-lots');
  try {
    const response = await axios.get(`${API_URL}/parking-lots`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Parqueaderos obtenidos:', response.data.data.length);
    response.data.data.forEach(lot => {
      console.log(`   🅿️  ${lot.name} - ${lot.address}`);
    });
    console.log('');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data?.message || error.message, '\n');
  }

  // Test 8: Login como Supervisor
  console.log('8️⃣  Test: Login (Supervisor)');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'supervisor@demo.com',
      password: 'Super123*'
    });
    console.log('   ✅ Login exitoso');
    console.log('   👤 Usuario:', response.data.data.user.fullName);
    console.log('   🔑 Rol:', response.data.data.user.role, '\n');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data?.message || error.message, '\n');
  }

  // Test 9: Login como Cajero
  console.log('9️⃣  Test: Login (Cajero)');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'cajero@demo.com',
      password: 'Cajero123*'
    });
    console.log('   ✅ Login exitoso');
    console.log('   👤 Usuario:', response.data.data.user.fullName);
    console.log('   🔑 Rol:', response.data.data.user.role, '\n');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data?.message || error.message, '\n');
  }

  // Test 10: Obtener logs de auditoría
  console.log('🔟 Test: GET /audit (Solo Admin)');
  try {
    const response = await axios.get(`${API_URL}/audit?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Logs de auditoría obtenidos:', response.data.data.total);
    console.log('   📝 Últimos', response.data.data.results.length, 'eventos:\n');
    response.data.data.results.forEach(log => {
      console.log(`   📌 ${log.action} en ${log.entityName} - ${new Date(log.createdAt).toLocaleString()}`);
    });
    console.log('');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data?.message || error.message, '\n');
  }

  console.log('========================================');
  console.log('   ✅ PRUEBAS COMPLETADAS');
  console.log('========================================\n');

  console.log('📚 Resumen:');
  console.log('   • Base de datos: PostgreSQL en puerto 5433');
  console.log('   • API corriendo en:', API_URL);
  console.log('   • Swagger disponible en: http://localhost:3001/docs');
  console.log('   • Frontend (cuando esté activo): http://localhost:3000\n');
}

testEndpoints().catch(console.error);
