import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrige la clave foránea parking_sessions.vehicle_id, que originalmente
 * apuntaba a la tabla legacy `vehicles` cuando la aplicación usa `vehicles_v2`.
 * Sin esto, el check-in falla con violación de FK
 * (parking_sessions_vehicle_id_fkey) al insertar sesiones.
 */
export class FixParkingSessionVehicleFk1768600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la FK incorrecta si existe y recrearla apuntando a vehicles_v2
    await queryRunner.query(`
      ALTER TABLE parking_sessions
        DROP CONSTRAINT IF EXISTS parking_sessions_vehicle_id_fkey;
    `);
    await queryRunner.query(`
      ALTER TABLE parking_sessions
        ADD CONSTRAINT parking_sessions_vehicle_id_fkey
        FOREIGN KEY (vehicle_id) REFERENCES vehicles_v2(id) ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir: volver a apuntar a la tabla legacy `vehicles`
    await queryRunner.query(`
      ALTER TABLE parking_sessions
        DROP CONSTRAINT IF EXISTS parking_sessions_vehicle_id_fkey;
    `);
    await queryRunner.query(`
      ALTER TABLE parking_sessions
        ADD CONSTRAINT parking_sessions_vehicle_id_fkey
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
    `);
  }
}
