import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCheckoutTables1737471600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tabla payments
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL,
        parking_lot_id UUID NOT NULL,
        parking_session_id UUID NOT NULL,
        customer_id UUID,
        total_amount INT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PAID',
        created_by_user_id UUID NOT NULL,
        voided_by_user_id UUID,
        void_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_payment_parking_session FOREIGN KEY (parking_session_id) REFERENCES parking_sessions(id),
        CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
        CONSTRAINT fk_payment_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
        CONSTRAINT fk_payment_voided_by FOREIGN KEY (voided_by_user_id) REFERENCES users(id),
        CONSTRAINT chk_payment_status CHECK (status IN ('PAID', 'VOIDED', 'REFUNDED', 'PARTIAL'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_payments_company ON payments(company_id);
      CREATE INDEX idx_payments_parking_lot ON payments(parking_lot_id);
      CREATE INDEX idx_payments_session ON payments(parking_session_id);
      CREATE INDEX idx_payments_customer ON payments(customer_id);
      CREATE INDEX idx_payments_status ON payments(status);
      CREATE INDEX idx_payments_created_at ON payments(created_at);
    `);

    // 2. Tabla payment_items
    await queryRunner.query(`
      CREATE TABLE payment_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        payment_id UUID NOT NULL,
        method VARCHAR(20) NOT NULL,
        amount INT NOT NULL,
        reference VARCHAR(255),
        received_amount INT,
        change_amount INT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_payment_item_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
        CONSTRAINT chk_payment_method CHECK (method IN ('CASH', 'CARD', 'TRANSFER', 'QR', 'OTHER'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_payment_items_payment ON payment_items(payment_id);
      CREATE INDEX idx_payment_items_method ON payment_items(method);
    `);

    // 3. Tabla customer_invoices
    await queryRunner.query(`
      CREATE TABLE customer_invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL,
        parking_lot_id UUID NOT NULL,
        parking_session_id UUID NOT NULL,
        customer_id UUID,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        issued_at TIMESTAMP NOT NULL,
        subtotal INT NOT NULL,
        discounts INT NOT NULL DEFAULT 0,
        total INT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'COP',
        status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
        voided_by_user_id UUID,
        void_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_invoice_parking_session FOREIGN KEY (parking_session_id) REFERENCES parking_sessions(id),
        CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
        CONSTRAINT fk_invoice_voided_by FOREIGN KEY (voided_by_user_id) REFERENCES users(id),
        CONSTRAINT chk_invoice_status CHECK (status IN ('ISSUED', 'VOIDED'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_invoices_company ON customer_invoices(company_id);
      CREATE INDEX idx_invoices_parking_lot ON customer_invoices(parking_lot_id);
      CREATE INDEX idx_invoices_session ON customer_invoices(parking_session_id);
      CREATE INDEX idx_invoices_customer ON customer_invoices(customer_id);
      CREATE INDEX idx_invoices_number ON customer_invoices(invoice_number);
      CREATE INDEX idx_invoices_status ON customer_invoices(status);
      CREATE INDEX idx_invoices_issued_at ON customer_invoices(issued_at);
    `);

    // 4. Tabla customer_invoice_items
    await queryRunner.query(`
      CREATE TABLE customer_invoice_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_invoice_id UUID NOT NULL,
        description VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price INT NOT NULL,
        total INT NOT NULL,
        CONSTRAINT fk_invoice_item_invoice FOREIGN KEY (customer_invoice_id) REFERENCES customer_invoices(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_invoice_items_invoice ON customer_invoice_items(customer_invoice_id);
    `);

    // 5. Tabla pricing_snapshots
    await queryRunner.query(`
      CREATE TABLE pricing_snapshots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL,
        parking_lot_id UUID NOT NULL,
        parking_session_id UUID NOT NULL,
        entry_at TIMESTAMP NOT NULL,
        exit_at TIMESTAMP NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        total_minutes INT NOT NULL,
        quote JSONB NOT NULL,
        total INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_pricing_snapshot_session FOREIGN KEY (parking_session_id) REFERENCES parking_sessions(id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_pricing_snapshots_company ON pricing_snapshots(company_id);
      CREATE INDEX idx_pricing_snapshots_parking_lot ON pricing_snapshots(parking_lot_id);
      CREATE INDEX idx_pricing_snapshots_session ON pricing_snapshots(parking_session_id);
    `);

    // 6. Tabla invoice_counters
    await queryRunner.query(`
      CREATE TABLE invoice_counters (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parking_lot_id UUID NOT NULL UNIQUE,
        counter INT NOT NULL DEFAULT 0,
        prefix VARCHAR(10) NOT NULL DEFAULT 'INV',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_invoice_counters_parking_lot ON invoice_counters(parking_lot_id);
    `);

    // 7. Tabla refunds
    await queryRunner.query(`
      CREATE TABLE refunds (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        payment_id UUID NOT NULL,
        amount INT NOT NULL,
        method VARCHAR(20) NOT NULL,
        reason TEXT NOT NULL,
        created_by_user_id UUID NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
        CONSTRAINT fk_refund_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
        CONSTRAINT chk_refund_method CHECK (method IN ('CASH', 'CARD', 'TRANSFER', 'QR', 'OTHER'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_refunds_payment ON refunds(payment_id);
      CREATE INDEX idx_refunds_created_at ON refunds(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS refunds CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS invoice_counters CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS pricing_snapshots CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_invoice_items CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_invoices CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_items CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments CASCADE;`);
  }
}
