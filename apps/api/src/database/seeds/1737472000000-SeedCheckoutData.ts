import { DataSource } from 'typeorm';

export class SeedCheckoutData1737472000000 {
  public async up(dataSource: DataSource): Promise<void> {
    // Seed para invoice_counters en parking lots existentes
    await dataSource.query(`
      INSERT INTO invoice_counters (parking_lot_id, counter, prefix)
      SELECT id, 0, 'INV'
      FROM parking_lots
      ON CONFLICT (parking_lot_id) DO NOTHING;
    `);

    console.log('✅ Invoice counters inicializados para todos los parking lots');

    // Opcional: Crear algunas sesiones activas para testing de checkout
    // Solo si no existen ya sesiones activas

    const activeSessions = await dataSource.query(`
      SELECT COUNT(*) as count FROM parking_sessions WHERE status = 'ACTIVE';
    `);

    if (parseInt(activeSessions[0].count) < 3) {
      // Obtener datos necesarios para crear sesiones de prueba
      const parkingLots = await dataSource.query(`
        SELECT id, company_id FROM parking_lots LIMIT 1;
      `);

      if (parkingLots.length > 0) {
        const parkingLotId = parkingLots[0].id;
        const companyId = parkingLots[0].company_id;

        // Obtener spots disponibles
        const freeSpots = await dataSource.query(`
          SELECT id FROM parking_spots 
          WHERE parking_lot_id = $1 AND status = 'FREE' 
          LIMIT 2;
        `, [parkingLotId]);

        // Obtener vehículos
        const vehicles = await dataSource.query(`
          SELECT id FROM vehicles_v2 WHERE company_id = $1 LIMIT 2;
        `, [companyId]);

        if (freeSpots.length >= 2 && vehicles.length >= 2) {
          // Sesión 1: Entrada hace 2 horas
          const entryAt1 = new Date();
          entryAt1.setHours(entryAt1.getHours() - 2);

          await dataSource.query(`
            INSERT INTO parking_sessions (
              company_id, parking_lot_id, vehicle_id, spot_id,
              ticket_number, entry_at, status
            ) VALUES (
              $1, $2, $3, $4, $5, $6, 'ACTIVE'
            );
          `, [
            companyId,
            parkingLotId,
            vehicles[0].id,
            freeSpots[0].id,
            'TEST-CHECKOUT-001',
            entryAt1,
          ]);

          // Marcar spot como ocupado
          await dataSource.query(`
            UPDATE parking_spots SET status = 'OCCUPIED' WHERE id = $1;
          `, [freeSpots[0].id]);

          // Sesión 2: Entrada hace 5 horas
          const entryAt2 = new Date();
          entryAt2.setHours(entryAt2.getHours() - 5);

          await dataSource.query(`
            INSERT INTO parking_sessions (
              company_id, parking_lot_id, vehicle_id, spot_id,
              ticket_number, entry_at, status
            ) VALUES (
              $1, $2, $3, $4, $5, $6, 'ACTIVE'
            );
          `, [
            companyId,
            parkingLotId,
            vehicles[1].id,
            freeSpots[1].id,
            'TEST-CHECKOUT-002',
            entryAt2,
          ]);

          // Marcar spot como ocupado
          await dataSource.query(`
            UPDATE parking_spots SET status = 'OCCUPIED' WHERE id = $1;
          `, [freeSpots[1].id]);

          console.log('✅ Sesiones activas de prueba creadas para testing de checkout');
        }
      }
    }
  }

  public async down(dataSource: DataSource): Promise<void> {
    // Eliminar sesiones de prueba
    await dataSource.query(`
      DELETE FROM parking_sessions WHERE ticket_number LIKE 'TEST-CHECKOUT-%';
    `);

    // No eliminamos invoice_counters para no perder el consecutivo
  }
}
