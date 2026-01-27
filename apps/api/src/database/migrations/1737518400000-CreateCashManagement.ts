import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCashManagement1737518400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. cash_policies
    await queryRunner.createTable(
      new Table({
        name: 'cash_policies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'companyId',
            type: 'uuid',
          },
          {
            name: 'parkingLotId',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'requireOpenShiftForCheckout',
            type: 'boolean',
            default: true,
          },
          {
            name: 'defaultShiftHours',
            type: 'int',
            default: 8,
          },
          {
            name: 'allowMultipleOpenShiftsPerCashier',
            type: 'boolean',
            default: false,
          },
          {
            name: 'allowMultipleOpenShiftsPerParkingLot',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'cash_policies',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_policies',
      new TableForeignKey({
        columnNames: ['parkingLotId'],
        referencedTableName: 'parking_lots',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 2. cash_shifts
    await queryRunner.createTable(
      new Table({
        name: 'cash_shifts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'companyId',
            type: 'uuid',
          },
          {
            name: 'parkingLotId',
            type: 'uuid',
          },
          {
            name: 'cashierUserId',
            type: 'uuid',
          },
          {
            name: 'openedAt',
            type: 'timestamp',
          },
          {
            name: 'closedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'OPEN'",
          },
          {
            name: 'openingFloat',
            type: 'int',
            default: 0,
            comment: 'Base inicial en COP',
          },
          {
            name: 'openingNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'closingNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expectedTotal',
            type: 'int',
            default: 0,
            comment: 'Total esperado calculado al cierre',
          },
          {
            name: 'countedTotal',
            type: 'int',
            isNullable: true,
            comment: 'Total contado en arqueo',
          },
          {
            name: 'difference',
            type: 'int',
            isNullable: true,
            comment: 'Diferencia: countedTotal - expectedTotal',
          },
          {
            name: 'requireSupervisorApproval',
            type: 'boolean',
            default: false,
          },
          {
            name: 'approvedByUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'cash_shifts',
      new TableIndex({
        name: 'IDX_cash_shifts_parking_lot_status',
        columnNames: ['parkingLotId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'cash_shifts',
      new TableIndex({
        name: 'IDX_cash_shifts_cashier_opened',
        columnNames: ['cashierUserId', 'openedAt'],
      }),
    );

    await queryRunner.createForeignKey(
      'cash_shifts',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_shifts',
      new TableForeignKey({
        columnNames: ['parkingLotId'],
        referencedTableName: 'parking_lots',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_shifts',
      new TableForeignKey({
        columnNames: ['cashierUserId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_shifts',
      new TableForeignKey({
        columnNames: ['approvedByUserId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // 3. cash_movements
    await queryRunner.createTable(
      new Table({
        name: 'cash_movements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'companyId',
            type: 'uuid',
          },
          {
            name: 'parkingLotId',
            type: 'uuid',
          },
          {
            name: 'cashShiftId',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'amount',
            type: 'int',
            comment: 'Monto en COP',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'createdByUserId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'cash_movements',
      new TableIndex({
        name: 'IDX_cash_movements_shift_created',
        columnNames: ['cashShiftId', 'createdAt'],
      }),
    );

    await queryRunner.createForeignKey(
      'cash_movements',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_movements',
      new TableForeignKey({
        columnNames: ['parkingLotId'],
        referencedTableName: 'parking_lots',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_movements',
      new TableForeignKey({
        columnNames: ['cashShiftId'],
        referencedTableName: 'cash_shifts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_movements',
      new TableForeignKey({
        columnNames: ['createdByUserId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // 4. cash_counts
    await queryRunner.createTable(
      new Table({
        name: 'cash_counts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'companyId',
            type: 'uuid',
          },
          {
            name: 'parkingLotId',
            type: 'uuid',
          },
          {
            name: 'cashShiftId',
            type: 'uuid',
          },
          {
            name: 'method',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'countedAmount',
            type: 'int',
            comment: 'Monto contado en COP',
          },
          {
            name: 'details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdByUserId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'cash_counts',
      new TableIndex({
        name: 'IDX_cash_counts_shift_method',
        columnNames: ['cashShiftId', 'method'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'cash_counts',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_counts',
      new TableForeignKey({
        columnNames: ['parkingLotId'],
        referencedTableName: 'parking_lots',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_counts',
      new TableForeignKey({
        columnNames: ['cashShiftId'],
        referencedTableName: 'cash_shifts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cash_counts',
      new TableForeignKey({
        columnNames: ['createdByUserId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // 5. Agregar cashShiftId a payments
    await queryRunner.query(`
      ALTER TABLE payments
      ADD COLUMN cash_shift_id uuid NULL;
    `);

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['cash_shift_id'],
        referencedTableName: 'cash_shifts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_cash_shift',
        columnNames: ['cash_shift_id'],
      }),
    );

    // CHECK constraints para enums
    await queryRunner.query(`
      ALTER TABLE cash_shifts
      ADD CONSTRAINT CHK_cash_shifts_status
      CHECK (status IN ('OPEN', 'CLOSED', 'CANCELED'));
    `);

    await queryRunner.query(`
      ALTER TABLE cash_movements
      ADD CONSTRAINT CHK_cash_movements_type
      CHECK (type IN ('INCOME', 'EXPENSE'));
    `);

    await queryRunner.query(`
      ALTER TABLE cash_movements
      ADD CONSTRAINT CHK_cash_movements_category
      CHECK (category IN ('SUPPLIES', 'MAINTENANCE', 'PETTY_CASH', 'OTHER'));
    `);

    await queryRunner.query(`
      ALTER TABLE cash_counts
      ADD CONSTRAINT CHK_cash_counts_method
      CHECK (method IN ('CASH', 'CARD', 'TRANSFER', 'QR', 'OTHER'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order
    await queryRunner.dropIndex('payments', 'IDX_payments_cash_shift');
    await queryRunner.dropForeignKey('payments', 'FK_payments_cash_shift_id');
    await queryRunner.query('ALTER TABLE payments DROP COLUMN cash_shift_id');

    await queryRunner.dropTable('cash_counts', true);
    await queryRunner.dropTable('cash_movements', true);
    await queryRunner.dropTable('cash_shifts', true);
    await queryRunner.dropTable('cash_policies', true);
  }
}
