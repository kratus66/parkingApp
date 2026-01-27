import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAuditActionEnum1737849600000 implements MigrationInterface {
  name = 'UpdateAuditActionEnum1737849600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar nuevos valores al enum audit_action_enum
    await queryRunner.query(`
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'PARKING_SESSION_CREATED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'PARKING_SESSION_COMPLETED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'PARKING_SESSION_CANCELLED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'TICKET_REPRINTED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'CASH_SHIFT_OPENED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'CASH_SHIFT_CLOSED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'CASH_MOVEMENT_CREATED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'CASH_MOVEMENT_DELETED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'CASH_COUNT_CREATED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'CASH_COUNT_UPDATED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'CASH_POLICY_CREATED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'CASH_POLICY_UPDATED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'CHECKOUT_CONFIRM';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'SPOT_RELEASED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'PAYMENT_CREATED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'PAYMENT_VOIDED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'INVOICE_ISSUED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'INVOICE_VOIDED';
      ALTER TYPE "audit_action_enum" ADD VALUE IF NOT EXISTS 'INVOICE_PRINTED';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No se pueden eliminar valores de un enum en PostgreSQL de forma directa
    // Se requeriría recrear el enum, lo cual es complejo y riesgoso
    // Por seguridad, dejamos el down vacío
  }
}
