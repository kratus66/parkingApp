import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sprint E (E6/H13) — Separa la política de caja en dos flags:
 * `requireOpenShiftForCheckout` (ya existente) y el nuevo
 * `requireOpenShiftForCheckIn`, para exigir turno abierto en la entrada de
 * vehículos de forma independiente. Por defecto true, preservando el
 * comportamiento previo (donde el flag de checkout también gateaba el check-in).
 */
export class AddRequireOpenShiftForCheckIn1768900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cash_policies
      ADD COLUMN IF NOT EXISTS "requireOpenShiftForCheckIn" BOOLEAN NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cash_policies
      DROP COLUMN IF EXISTS "requireOpenShiftForCheckIn"
    `);
  }
}
