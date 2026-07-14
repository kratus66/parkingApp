import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sprint B — Convenios y descuentos.
 * Crea la tabla `agreements` y agrega `customers.agreement_id`.
 */
export class CreateAgreements1768700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE agreement_discount_type_enum AS ENUM ('PERCENT', 'FIXED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agreements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        parking_lot_id UUID REFERENCES parking_lots(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        nit VARCHAR(50),
        discount_type agreement_discount_type_enum NOT NULL DEFAULT 'PERCENT',
        discount_value INTEGER NOT NULL DEFAULT 0,
        valid_from DATE,
        valid_until DATE,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_agreements_company_name UNIQUE (company_id, name)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_agreements_company ON agreements(company_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_agreements_active ON agreements(is_active);`,
    );

    await queryRunner.query(`
      ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS agreement_id UUID
        REFERENCES agreements(id) ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE customers DROP COLUMN IF EXISTS agreement_id;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS agreements;`);
    await queryRunner.query(`DROP TYPE IF EXISTS agreement_discount_type_enum;`);
  }
}
