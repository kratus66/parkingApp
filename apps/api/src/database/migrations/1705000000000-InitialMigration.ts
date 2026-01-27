import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1705000000000 implements MigrationInterface {
  name = 'InitialMigration1705000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create extension for UUID
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Companies table
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "nit" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_companies_name" ON "companies" ("name")`);

    // Parking lots table
    await queryRunner.query(`
      CREATE TABLE "parking_lots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "address" character varying(500),
        "legal_name" character varying(255),
        "legal_nit" character varying(50),
        "ticket_header" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parking_lots" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_parking_lots_company_id" ON "parking_lots" ("company_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "parking_lots"
      ADD CONSTRAINT "FK_parking_lots_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
    `);

    // Users table
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM('ADMIN', 'SUPERVISOR', 'CASHIER')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "parking_lot_id" uuid,
        "full_name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'CASHIER',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_company_id" ON "users" ("company_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_parking_lot_id" ON "users" ("parking_lot_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_parking_lot"
      FOREIGN KEY ("parking_lot_id") REFERENCES "parking_lots"("id") ON DELETE SET NULL
    `);

    // Audit logs table
    await queryRunner.query(`
      CREATE TYPE "audit_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN')
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "parking_lot_id" uuid,
        "actor_user_id" uuid,
        "entity_name" character varying(100) NOT NULL,
        "entity_id" uuid NOT NULL,
        "action" "audit_action_enum" NOT NULL,
        "before" jsonb,
        "after" jsonb,
        "ip" character varying(50),
        "user_agent" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_company_id" ON "audit_logs" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_parking_lot_id" ON "audit_logs" ("parking_lot_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_actor_user_id" ON "audit_logs" ("actor_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entity_name" ON "audit_logs" ("entity_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_parking_lot"
      FOREIGN KEY ("parking_lot_id") REFERENCES "parking_lots"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_actor_user"
      FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TYPE "audit_action_enum"`);
    await queryRunner.query(`DROP TABLE "users" CASCADE`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
    await queryRunner.query(`DROP TABLE "parking_lots" CASCADE`);
    await queryRunner.query(`DROP TABLE "companies" CASCADE`);
  }
}
