import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint3ParkingZonesSpots1705300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear enum VehicleType
    await queryRunner.query(`
      CREATE TYPE "vehicle_type_enum" AS ENUM ('BICYCLE', 'MOTORCYCLE', 'CAR', 'TRUCK_BUS');
    `);

    // 2. Crear enum SpotStatus
    await queryRunner.query(`
      CREATE TYPE "spot_status_enum" AS ENUM ('FREE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE');
    `);

    // 3. Crear tabla parking_zones
    await queryRunner.query(`
      CREATE TABLE "parking_zones" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "company_id" UUID NOT NULL,
        "parking_lot_id" UUID NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "allowed_vehicle_types" vehicle_type_enum[] NOT NULL,
        "is_active" BOOLEAN DEFAULT true NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT "FK_parking_zones_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_parking_zones_parking_lot" FOREIGN KEY ("parking_lot_id") REFERENCES "parking_lots"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_parking_zones_parking_lot_name" UNIQUE ("parking_lot_id", "name")
      );
    `);

    // 4. Crear índices parking_zones
    await queryRunner.query(`
      CREATE INDEX "IDX_parking_zones_company_id" ON "parking_zones" ("company_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_parking_zones_parking_lot_id" ON "parking_zones" ("parking_lot_id");
    `);

    // 5. Crear tabla parking_spots
    await queryRunner.query(`
      CREATE TABLE "parking_spots" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "company_id" UUID NOT NULL,
        "parking_lot_id" UUID NOT NULL,
        "zone_id" UUID NOT NULL,
        "code" VARCHAR(50) NOT NULL,
        "spot_type" vehicle_type_enum NOT NULL,
        "status" spot_status_enum DEFAULT 'FREE' NOT NULL,
        "priority" INTEGER DEFAULT 0 NOT NULL,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT "FK_parking_spots_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_parking_spots_parking_lot" FOREIGN KEY ("parking_lot_id") REFERENCES "parking_lots"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_parking_spots_zone" FOREIGN KEY ("zone_id") REFERENCES "parking_zones"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_parking_spots_parking_lot_code" UNIQUE ("parking_lot_id", "code")
      );
    `);

    // 6. Crear índices parking_spots
    await queryRunner.query(`
      CREATE INDEX "IDX_parking_spots_company_id" ON "parking_spots" ("company_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_parking_spots_parking_lot_id" ON "parking_spots" ("parking_lot_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_parking_spots_zone_id" ON "parking_spots" ("zone_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_parking_spots_status" ON "parking_spots" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_parking_spots_spot_type" ON "parking_spots" ("spot_type");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_parking_spots_code" ON "parking_spots" ("code");
    `);

    // 7. Crear tabla spot_status_history
    await queryRunner.query(`
      CREATE TABLE "spot_status_history" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "company_id" UUID NOT NULL,
        "parking_lot_id" UUID NOT NULL,
        "spot_id" UUID NOT NULL,
        "from_status" spot_status_enum NOT NULL,
        "to_status" spot_status_enum NOT NULL,
        "reason" VARCHAR(500),
        "actor_user_id" UUID NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT "FK_spot_status_history_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spot_status_history_parking_lot" FOREIGN KEY ("parking_lot_id") REFERENCES "parking_lots"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spot_status_history_spot" FOREIGN KEY ("spot_id") REFERENCES "parking_spots"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spot_status_history_actor" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // 8. Crear índices spot_status_history
    await queryRunner.query(`
      CREATE INDEX "IDX_spot_status_history_company_id" ON "spot_status_history" ("company_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_spot_status_history_parking_lot_id" ON "spot_status_history" ("parking_lot_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_spot_status_history_spot_id" ON "spot_status_history" ("spot_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_spot_status_history_created_at" ON "spot_status_history" ("created_at");
    `);

    console.log('✅ Sprint 3: Tablas parking_zones, parking_spots, spot_status_history creadas');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "spot_status_history" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parking_spots" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parking_zones" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "spot_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "vehicle_type_enum";`);
  }
}
