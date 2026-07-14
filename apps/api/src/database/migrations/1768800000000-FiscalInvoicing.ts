import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sprint C — Facturación formal (DIAN-ready).
 * - Campos fiscales en customer_invoices (base gravable, IVA, CUFE, resolución).
 * - Tabla billing_resolutions (resolución de numeración DIAN por parqueadero).
 */
export class FiscalInvoicing1768800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customer_invoices
        ADD COLUMN IF NOT EXISTS taxable_base INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tax_rate INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tax_amount INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS cufe VARCHAR(96),
        ADD COLUMN IF NOT EXISTS resolution_number VARCHAR(50);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS billing_resolutions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
        document_type VARCHAR(40) NOT NULL DEFAULT 'FACTURA_VENTA',
        prefix VARCHAR(10) NOT NULL DEFAULT '',
        resolution_number VARCHAR(50) NOT NULL,
        range_from INTEGER NOT NULL DEFAULT 1,
        range_to INTEGER NOT NULL DEFAULT 1,
        current_number INTEGER NOT NULL DEFAULT 0,
        valid_from DATE,
        valid_until DATE,
        technical_key VARCHAR(100),
        environment INTEGER NOT NULL DEFAULT 2,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_resolutions_lot
        ON billing_resolutions(parking_lot_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS billing_resolutions;`);
    await queryRunner.query(`
      ALTER TABLE customer_invoices
        DROP COLUMN IF EXISTS taxable_base,
        DROP COLUMN IF EXISTS tax_rate,
        DROP COLUMN IF EXISTS tax_amount,
        DROP COLUMN IF EXISTS cufe,
        DROP COLUMN IF EXISTS resolution_number;
    `);
  }
}
