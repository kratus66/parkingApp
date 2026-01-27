import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint4ParkingSessions1768494495213 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create parking_lot_counters table
    await queryRunner.query(`
      CREATE TABLE parking_lot_counters (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parking_lot_id UUID NOT NULL UNIQUE REFERENCES parking_lots(id) ON DELETE CASCADE,
        next_ticket_number INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_parking_lot_counters_parking_lot_id ON parking_lot_counters(parking_lot_id)
    `);

    // 2. Create parking_sessions table
    await queryRunner.query(`
      CREATE TYPE parking_session_status_enum AS ENUM ('ACTIVE', 'CLOSED', 'CANCELED')
    `);

    await queryRunner.query(`
      CREATE TABLE parking_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        spot_id UUID REFERENCES parking_spots(id) ON DELETE SET NULL,
        entry_at TIMESTAMP NOT NULL DEFAULT NOW(),
        exit_at TIMESTAMP,
        status parking_session_status_enum NOT NULL DEFAULT 'ACTIVE',
        created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        closed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        canceled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        cancel_reason TEXT,
        ticket_number VARCHAR(50) NOT NULL,
        ticket_printed_at TIMESTAMP,
        ticket_reprinted_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_parking_sessions_parking_lot_status ON parking_sessions(parking_lot_id, status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_parking_sessions_vehicle_active ON parking_sessions(vehicle_id) WHERE status = 'ACTIVE'
    `);

    await queryRunner.query(`
      CREATE INDEX idx_parking_sessions_spot_active ON parking_sessions(spot_id) WHERE status = 'ACTIVE'
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_parking_sessions_ticket_number ON parking_sessions(parking_lot_id, ticket_number)
    `);

    // 3. Create ticket_templates table
    await queryRunner.query(`
      CREATE TABLE ticket_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        header_lines JSONB NOT NULL DEFAULT '[]',
        footer_lines JSONB NOT NULL DEFAULT '[]',
        show_qr BOOLEAN NOT NULL DEFAULT TRUE,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ticket_templates_parking_lot ON ticket_templates(parking_lot_id)
    `);

    // 4. Create notification_logs table
    await queryRunner.query(`
      CREATE TYPE notification_channel_enum AS ENUM ('WHATSAPP', 'EMAIL')
    `);

    await queryRunner.query(`
      CREATE TYPE notification_template_enum AS ENUM ('ENTRY', 'EXIT', 'INVOICE')
    `);

    await queryRunner.query(`
      CREATE TYPE notification_status_enum AS ENUM ('QUEUED', 'SENT', 'FAILED')
    `);

    await queryRunner.query(`
      CREATE TABLE notification_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
        parking_session_id UUID REFERENCES parking_sessions(id) ON DELETE SET NULL,
        channel notification_channel_enum NOT NULL,
        "to" VARCHAR(255) NOT NULL,
        template notification_template_enum NOT NULL,
        status notification_status_enum NOT NULL DEFAULT 'QUEUED',
        provider VARCHAR(100) NOT NULL DEFAULT 'mock',
        error_message TEXT,
        payload JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notification_logs_parking_lot ON notification_logs(parking_lot_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notification_logs_status ON notification_logs(status)
    `);

    // 5. Create ticket_print_logs table
    await queryRunner.query(`
      CREATE TYPE ticket_print_action_enum AS ENUM ('PRINT', 'REPRINT')
    `);

    await queryRunner.query(`
      CREATE TABLE ticket_print_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
        parking_session_id UUID NOT NULL REFERENCES parking_sessions(id) ON DELETE CASCADE,
        action ticket_print_action_enum NOT NULL,
        actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        printed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        device_name VARCHAR(255)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ticket_print_logs_session ON ticket_print_logs(parking_session_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ticket_print_logs_parking_lot ON ticket_print_logs(parking_lot_id, printed_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ticket_print_logs`);
    await queryRunner.query(`DROP TYPE IF EXISTS ticket_print_action_enum`);

    await queryRunner.query(`DROP TABLE IF EXISTS notification_logs`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_template_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_channel_enum`);

    await queryRunner.query(`DROP TABLE IF EXISTS ticket_templates`);

    await queryRunner.query(`DROP TABLE IF EXISTS parking_sessions`);
    await queryRunner.query(`DROP TYPE IF EXISTS parking_session_status_enum`);

    await queryRunner.query(`DROP TABLE IF EXISTS parking_lot_counters`);
  }
}
