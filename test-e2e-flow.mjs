import { execSync } from 'node:child_process';

const BASE = 'http://localhost:3001/api/v1';
let token = '';
async function call(m, p, b, tok) {
  const auth = tok !== undefined ? tok : token;
  const r = await fetch(BASE + p, {
    method: m,
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer ' + auth } : {}) },
    body: b ? JSON.stringify(b) : undefined,
  });
  let body;
  try { body = await r.json(); } catch { body = {}; }
  return { status: r.status, body };
}
const u = (r) => (r.body && r.body.data !== undefined ? r.body.data : r.body);
const rnd = Math.floor(Math.random() * 1000000);
let pass = 0, fail = 0;
const fails = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log('  OK  ' + name); }
  else { fail++; fails.push(name + (detail ? ' -- ' + detail : '')); console.log('  XX  ' + name + (detail ? ' -- ' + detail : '')); }
}
const backdate = (sid, h) => execSync('docker exec parking_postgres psql -U parking_user -d parking_system -c "UPDATE parking_sessions SET entry_at = entry_at - INTERVAL \'' + h + ' hours\' WHERE id=\'' + sid + '\'"');

console.log('\n=== 1. AUTH ===');
const la = await call('POST', '/auth/login', { email: 'admin@demo.com', password: 'Admin123*' });
check('login admin 201', la.status === 201);
token = u(la).accessToken;
const lot = u(la).user.parkingLot.id;
check('token presente', !!token);
const lc = await call('POST', '/auth/login', { email: 'cajero@demo.com', password: 'Cajero123*' });
check('login cajero 201', lc.status === 201, 'status ' + lc.status);
const lbad = await call('POST', '/auth/login', { email: 'admin@demo.com', password: 'malamala' });
check('login credenciales invalidas -> 401', lbad.status === 401, 'status ' + lbad.status);

console.log('\n=== 2. CATALOGO / CONFIG ===');
const lots = await call('GET', '/parking-lots');
check('GET /parking-lots', lots.status === 200 && Array.isArray(u(lots)));
const occ = await call('GET', '/occupancy/summary?parkingLotId=' + lot);
check('GET /occupancy/summary', occ.status === 200 && typeof u(occ).total === 'number', 'total=' + u(occ).total);
const resol = await call('GET', '/billing/resolutions/' + lot);
check('GET /billing/resolutions (FE)', resol.status === 200 && u(resol) && u(resol).prefix === 'FE', 'prefix=' + (u(resol) && u(resol).prefix));

console.log('\n=== 3. CAJA (turno) ===');
const openShift = await call('POST', '/cash/shifts/open', { parkingLotId: lot, openingFloat: 50000, openingNotes: 'e2e' });
const shiftId = u(openShift).id;
check('abrir turno de caja', (openShift.status === 201 || openShift.status === 200) && !!shiftId, 'status ' + openShift.status + ' ' + JSON.stringify(openShift.body).slice(0, 140));
const curShift = await call('GET', '/cash/shifts/current?parkingLotId=' + lot);
check('turno actual abierto', curShift.status === 200 && !!u(curShift), 'status ' + curShift.status);

console.log('\n=== 4. MAESTROS ===');
const agr = await call('POST', '/agreements', { name: 'E2E Convenio ' + rnd, discountType: 'PERCENT', discountValue: 15 });
const agrId = u(agr).id;
check('crear convenio', agr.status === 201 && !!agrId);
const agrList = await call('GET', '/agreements');
check('listar convenios', agrList.status === 200 && u(agrList).some((a) => a.id === agrId));
const zone = await call('POST', '/zones', { parkingLotId: lot, name: 'E2E Zona ' + rnd, allowedVehicleTypes: ['CAR'] });
const zoneId = u(zone).id;
check('crear zona', zone.status === 201 && !!zoneId);
const spot = await call('POST', '/spots', { parkingLotId: lot, zoneId, code: 'E2E-' + rnd, spotType: 'CAR' });
check('crear puesto', spot.status === 201 && !!u(spot).id);
const cus = await call('POST', '/customers', { documentType: 'CC', documentNumber: 'E2E' + rnd, fullName: 'Cliente E2E', phone: '3001234567', email: 'e2e' + rnd + '@test.com', agreementId: agrId });
const cusId = u(cus).id;
check('crear cliente (con convenio)', cus.status === 201 && !!cusId);
const cusDup = await call('POST', '/customers', { documentType: 'CC', documentNumber: 'E2E' + rnd, fullName: 'Duplicado' });
check('cliente documento duplicado -> 409', cusDup.status === 409, 'status ' + cusDup.status);
const ident = await call('POST', '/ops/identify', { documentType: 'CC', documentNumber: 'E2E' + rnd });
check('identificar cliente por documento', ident.status === 200 || ident.status === 201, 'status ' + ident.status);
const veh = await call('POST', '/vehicles-v2', { customerId: cusId, vehicleType: 'CAR', plate: 'E2E' + rnd, brand: 'Toyota', color: 'Rojo' });
const vehId = u(veh).id;
check('crear vehiculo', veh.status === 201 && !!vehId);
const consent = await call('POST', '/consents', { customerId: cusId, channel: 'WHATSAPP', status: 'GRANTED', source: 'IN_PERSON' });
check('registrar consentimiento', consent.status === 201 || consent.status === 200, 'status ' + consent.status + ' ' + JSON.stringify(consent.body).slice(0, 100));

console.log('\n=== 5. OPERACION: CHECK-IN ===');
const ci = await call('POST', '/parking-sessions/check-in', { vehicleType: 'CAR', vehiclePlate: 'E2E' + rnd, parkingLotId: lot });
const sid = u(ci).session && u(ci).session.id;
check('check-in exitoso', ci.status === 201 && !!sid, 'status ' + ci.status);
check('ticket generado', !!(u(ci).session && u(ci).session.ticketNumber), 'ticket=' + (u(ci).session && u(ci).session.ticketNumber));
check('puesto asignado', !!(u(ci).ticket && u(ci).ticket.spot && u(ci).ticket.spot.code));
const ciDup = await call('POST', '/parking-sessions/check-in', { vehicleType: 'CAR', vehiclePlate: 'E2E' + rnd, parkingLotId: lot });
check('check-in duplicado (placa activa) rechazado', ciDup.status >= 400, 'status ' + ciDup.status);
const active = await call('GET', '/parking-sessions/active?search=E2E' + rnd);
check('buscar sesiones activas', active.status === 200 && Array.isArray(u(active)) && u(active).length >= 1, 'n=' + (Array.isArray(u(active)) ? u(active).length : '?'));

console.log('\n=== 6. FACTURACION (checkout) ===');
backdate(sid, 3);
const prev = u(await call('POST', '/checkout/preview', { sessionId: sid }));
check('preview con IVA', prev.taxableBase + prev.taxAmount === prev.total && prev.taxRate === 19, 'base ' + prev.taxableBase + '+iva ' + prev.taxAmount + ' vs total ' + prev.total);
check('preview con descuento por convenio (15%)', prev.discount > 0 && !!prev.agreement, 'discount=' + prev.discount);
const badPay = await call('POST', '/checkout/confirm', { sessionId: sid, paymentItems: [{ method: 'CASH', amount: prev.total - 1000, receivedAmount: prev.total }] });
check('confirm con pago que no cuadra -> 400', badPay.status === 400, 'status ' + badPay.status);
const conf = u(await call('POST', '/checkout/confirm', { sessionId: sid, paymentItems: [{ method: 'CASH', amount: prev.total, receivedAmount: prev.total + 500 }] }));
const inv = conf.invoice;
check('confirm genera factura', !!(inv && inv.invoiceNumber));
check('numero por resolucion (FE...)', /^FE\d+$/.test((inv && inv.invoiceNumber) || ''), 'num=' + (inv && inv.invoiceNumber));
check('factura con CUFE (96 hex)', !!(inv && inv.cufe) && /^[a-f0-9]{96}$/.test(inv.cufe));
check('factura base+IVA=total', !!inv && inv.taxableBase + inv.taxAmount === inv.total);
check('factura con descuento aplicado', !!inv && inv.discounts > 0);
check('sesion cerrada', conf.session && conf.session.status === 'CLOSED');
check('vuelto calculado (500)', conf.payment && conf.payment.items && conf.payment.items[0].changeAmount === 500, 'change=' + (conf.payment && conf.payment.items && conf.payment.items[0].changeAmount));
const rawHtml = await (await fetch(BASE + '/checkout/invoices/' + inv.id + '/html', { headers: { Authorization: 'Bearer ' + token } })).text();
check('HTML factura: IVA', rawHtml.includes('IVA (19%)'));
check('HTML factura: CUFE', rawHtml.includes('CUFE:'));
check('HTML factura: QR', rawHtml.includes('data:image/png;base64'));
const invList = await call('GET', '/checkout/invoices?search=' + inv.invoiceNumber);
check('listar/buscar facturas', invList.status === 200);
const pays = await call('GET', '/payments?parkingLotId=' + lot);
check('listar pagos', pays.status === 200);

console.log('\n=== 7. ANULACION ===');
const voidInv = await call('POST', '/checkout/invoices/' + inv.id + '/void', { reason: 'Prueba e2e de anulacion' });
check('anular factura', voidInv.status === 200 || voidInv.status === 201, 'status ' + voidInv.status);
const invAfter = u(await call('GET', '/checkout/invoices/' + inv.id));
check('factura queda VOIDED', invAfter && invAfter.status === 'VOIDED', 'status=' + (invAfter && invAfter.status));

console.log('\n=== 8. CIERRE DE CAJA ===');
const closeShift = await call('POST', '/cash/shifts/' + shiftId + '/close', { closingNotes: 'cierre e2e' });
check('cerrar turno de caja', closeShift.status === 200 || closeShift.status === 201, 'status ' + closeShift.status + ' ' + JSON.stringify(closeShift.body).slice(0, 140));
const summary = await call('GET', '/cash/shifts/' + shiftId + '/summary');
check('resumen de turno', summary.status === 200, 'status ' + summary.status);

console.log('\n=== 9. OTROS / SEGURIDAD ===');
const hol = await call('GET', '/holidays?from=2026-01-01&to=2026-12-31');
check('listar festivos', hol.status === 200);
const invalidPrev = await call('POST', '/checkout/preview', { sessionId: '00000000-0000-0000-0000-000000000000' });
check('preview sesion inexistente -> 404', invalidPrev.status === 404, 'status ' + invalidPrev.status);
const noAuth = await call('GET', '/agreements', undefined, null);
check('endpoint protegido sin token -> 401', noAuth.status === 401, 'status ' + noAuth.status);

console.log('\n========================================');
console.log('RESULTADO: ' + pass + ' PASS / ' + fail + ' FAIL (' + (pass + fail) + ' pruebas)');
if (fails.length) { console.log('FALLOS:'); fails.forEach((f) => console.log('  - ' + f)); }
console.log('========================================');
