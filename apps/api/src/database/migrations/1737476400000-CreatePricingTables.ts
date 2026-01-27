import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePricingTables1737476400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. pricing_config
    await queryRunner.createTable(
      new Table({
        name: 'pricing_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'parking_lot_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'default_grace_minutes',
            type: 'int',
            default: 0,
          },
          {
            name: 'default_daily_max',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'lost_ticket_fee',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'enable_dynamic_pricing',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'pricing_config',
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'pricing_config',
      new TableForeignKey({
        columnNames: ['parking_lot_id'],
        referencedTableName: 'parking_lots',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 2. tariff_plans
    await queryRunner.createTable(
      new Table({
        name: 'tariff_plans',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'parking_lot_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '50',
            default: "'America/Bogota'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'tariff_plans',
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tariff_plans',
      new TableForeignKey({
        columnNames: ['parking_lot_id'],
        referencedTableName: 'parking_lots',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 3. tariff_rules
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type_enum') THEN
          CREATE TYPE vehicle_type_enum AS ENUM ('BICYCLE', 'MOTORCYCLE', 'CAR', 'TRUCK_BUS');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_type_enum') THEN
          CREATE TYPE day_type_enum AS ENUM ('WEEKDAY', 'WEEKEND', 'HOLIDAY');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'period_type_enum') THEN
          CREATE TYPE period_type_enum AS ENUM ('DAY', 'NIGHT');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_unit_enum') THEN
          CREATE TYPE billing_unit_enum AS ENUM ('MINUTE', 'BLOCK_15', 'BLOCK_30', 'HOUR', 'DAY');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rounding_type_enum') THEN
          CREATE TYPE rounding_type_enum AS ENUM ('CEIL', 'FLOOR', 'NEAREST');
        END IF;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'tariff_rules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'parking_lot_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tariff_plan_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'vehicle_type',
            type: 'vehicle_type_enum',
            isNullable: false,
          },
          {
            name: 'day_type',
            type: 'day_type_enum',
            isNullable: false,
          },
          {
            name: 'period',
            type: 'period_type_enum',
            isNullable: false,
          },
          {
            name: 'start_time',
            type: 'varchar',
            length: '5',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'varchar',
            length: '5',
            isNullable: false,
          },
          {
            name: 'billing_unit',
            type: 'billing_unit_enum',
            isNullable: false,
          },
          {
            name: 'unit_price',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'minimum_charge',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'daily_max',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'grace_minutes',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'rounding',
            type: 'rounding_type_enum',
            default: "'CEIL'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('tariff_rules', [
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['parking_lot_id'],
        referencedTableName: 'parking_lots',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['tariff_plan_id'],
        referencedTableName: 'tariff_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'tariff_rules',
      new TableIndex({
        name: 'IDX_tariff_rules_lookup',
        columnNames: ['parking_lot_id', 'vehicle_type', 'day_type', 'period', 'is_active'],
      }),
    );

    // 4. holidays
    await queryRunner.createTable(
      new Table({
        name: 'holidays',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'country',
            type: 'varchar',
            length: '2',
            default: "'CO'",
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'holidays',
      new TableIndex({
        name: 'IDX_holidays_country_date',
        columnNames: ['country', 'date'],
        isUnique: true,
      }),
    );

    // 5. tariff_change_logs
    await queryRunner.query(`
      CREATE TYPE tariff_change_type_enum AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE');
    `);

    await queryRunner.createTable(
      new Table({
        name: 'tariff_change_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'parking_lot_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'actor_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'entity',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'entity_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'change_type',
            type: 'tariff_change_type_enum',
            isNullable: false,
          },
          {
            name: 'before',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'after',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('tariff_change_logs', [
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['parking_lot_id'],
        referencedTableName: 'parking_lots',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['actor_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createIndex(
      'tariff_change_logs',
      new TableIndex({
        name: 'IDX_tariff_change_logs_entity',
        columnNames: ['entity', 'entity_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tariff_change_logs');
    await queryRunner.dropTable('holidays');
    await queryRunner.dropTable('tariff_rules');
    await queryRunner.dropTable('tariff_plans');
    await queryRunner.dropTable('pricing_config');

    await queryRunner.query(`
      DROP TYPE IF EXISTS tariff_change_type_enum;
      DROP TYPE IF EXISTS rounding_type_enum;
      DROP TYPE IF EXISTS billing_unit_enum;
      DROP TYPE IF EXISTS period_type_enum;
      DROP TYPE IF EXISTS day_type_enum;
      DROP TYPE IF EXISTS vehicle_type_enum;
    `);
  }
}
