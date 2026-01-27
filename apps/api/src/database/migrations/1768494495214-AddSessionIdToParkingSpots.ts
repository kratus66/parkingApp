import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSessionIdToParkingSpots1768494495214 implements MigrationInterface {
  name = 'AddSessionIdToParkingSpots1768494495214';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar session_id a parking_spots
    await queryRunner.addColumn(
      'parking_spots',
      new TableColumn({
        name: 'session_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Agregar last_status_change a parking_spots
    await queryRunner.addColumn(
      'parking_spots',
      new TableColumn({
        name: 'last_status_change',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('parking_spots', 'session_id');
    await queryRunner.dropColumn('parking_spots', 'last_status_change');
  }
}