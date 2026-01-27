import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class Sprint1VehiclesTickets1705100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla de vehículos
    await queryRunner.createTable(
      new Table({
        name: 'vehicles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'license_plate',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'vehicle_type',
            type: 'enum',
            enum: ['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'SUV'],
            default: "'CAR'",
          },
          {
            name: 'brand',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'model',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'is_blacklisted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'blacklist_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'company_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // FK vehicles -> companies
    await queryRunner.createForeignKey(
      'vehicles',
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Tabla de tickets
    await queryRunner.createTable(
      new Table({
        name: 'tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ticket_number',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'vehicle_id',
            type: 'uuid',
          },
          {
            name: 'parking_lot_id',
            type: 'uuid',
          },
          {
            name: 'entry_user_id',
            type: 'uuid',
          },
          {
            name: 'exit_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'entry_time',
            type: 'timestamp',
          },
          {
            name: 'exit_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
            default: "'ACTIVE'",
          },
          {
            name: 'parking_duration_minutes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['CASH', 'CARD', 'TRANSFER', 'MOBILE'],
            isNullable: true,
          },
          {
            name: 'is_paid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'paid_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // FK tickets -> vehicles
    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['vehicle_id'],
        referencedTableName: 'vehicles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // FK tickets -> parking_lots
    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['parking_lot_id'],
        referencedTableName: 'parking_lots',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // FK tickets -> users (entry)
    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['entry_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // FK tickets -> users (exit)
    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['exit_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // Índices para mejorar rendimiento
    await queryRunner.query(
      `CREATE INDEX idx_vehicles_company_id ON vehicles(company_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tickets_vehicle_id ON tickets(vehicle_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tickets_parking_lot_id ON tickets(parking_lot_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tickets_status ON tickets(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tickets_entry_time ON tickets(entry_time)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tickets_entry_time`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tickets_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tickets_parking_lot_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tickets_vehicle_id`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_vehicles_license_plate`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vehicles_company_id`);

    // Drop tablas
    await queryRunner.dropTable('tickets', true);
    await queryRunner.dropTable('vehicles', true);
  }
}
