import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint2CustomersVehiclesConsents1705200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enums
    await queryRunner.query(`
      CREATE TYPE document_type_enum AS ENUM ('CC', 'CE', 'PASSPORT', 'PPT', 'OTHER');
    `);

    await queryRunner.query(`
      CREATE TYPE vehicle_type_v2_enum AS ENUM ('BICYCLE', 'MOTORCYCLE', 'CAR', 'TRUCK_BUS');
    `);

    await queryRunner.query(`
      CREATE TYPE consent_channel_enum AS ENUM ('WHATSAPP', 'EMAIL');
    `);

    await queryRunner.query(`
      CREATE TYPE consent_status_enum AS ENUM ('GRANTED', 'REVOKED');
    `);

    await queryRunner.query(`
      CREATE TYPE consent_source_enum AS ENUM ('IN_PERSON', 'WEB', 'CALLCENTER', 'OTHER');
    `);

    // Tabla customers
    await queryRunner.query(`
      CREATE TABLE customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        document_type document_type_enum NOT NULL,
        document_number VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(company_id, document_type, document_number)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_customers_document_number ON customers(document_number);
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_customers_full_name ON customers(full_name);
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_customers_phone ON customers(phone);
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_customers_email ON customers(email);
    `);

    // Tabla vehicles_v2 (nueva versión con customer)
    await queryRunner.query(`
      CREATE TABLE vehicles_v2 (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        vehicle_type vehicle_type_v2_enum NOT NULL,
        plate VARCHAR(20),
        bicycle_code VARCHAR(50),
        brand VARCHAR(100),
        model VARCHAR(100),
        color VARCHAR(50),
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT check_vehicle_identifier CHECK (
          (vehicle_type = 'BICYCLE' AND bicycle_code IS NOT NULL AND plate IS NULL) OR
          (vehicle_type != 'BICYCLE' AND plate IS NOT NULL AND bicycle_code IS NULL)
        )
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_vehicles_v2_plate ON vehicles_v2(company_id, plate) WHERE plate IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_vehicles_v2_bicycle_code ON vehicles_v2(company_id, bicycle_code) WHERE bicycle_code IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_vehicles_v2_plate_search ON vehicles_v2(plate);
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_vehicles_v2_bicycle_code_search ON vehicles_v2(bicycle_code);
    `);

    // Tabla consents
    await queryRunner.query(`
      CREATE TABLE consents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        channel consent_channel_enum NOT NULL,
        status consent_status_enum NOT NULL,
        source consent_source_enum NOT NULL,
        evidence_text TEXT,
        granted_at TIMESTAMP,
        revoked_at TIMESTAMP,
        actor_user_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_consents_customer_channel ON consents(customer_id, channel);
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_consents_status ON consents(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE consents;`);
    await queryRunner.query(`DROP TABLE vehicles_v2;`);
    await queryRunner.query(`DROP TABLE customers;`);
    await queryRunner.query(`DROP TYPE consent_source_enum;`);
    await queryRunner.query(`DROP TYPE consent_status_enum;`);
    await queryRunner.query(`DROP TYPE consent_channel_enum;`);
    await queryRunner.query(`DROP TYPE vehicle_type_v2_enum;`);
    await queryRunner.query(`DROP TYPE document_type_enum;`);
  }
}
