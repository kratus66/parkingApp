import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Like, In } from 'typeorm';
import { CustomerInvoice, InvoiceStatus } from '../../entities/customer-invoice.entity';
import { CustomerInvoiceItem } from '../../entities/customer-invoice-item.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { ParkingLot } from '../parking-lots/entities/parking-lot.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(CustomerInvoice)
    private invoiceRepo: Repository<CustomerInvoice>,
    @InjectRepository(CustomerInvoiceItem)
    private invoiceItemRepo: Repository<CustomerInvoiceItem>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
    @InjectRepository(ParkingLot)
    private parkingLotRepo: Repository<ParkingLot>,
    private dataSource: DataSource,
  ) {}

  /**
   * Listar facturas con filtros
   */
  async findAll(filters: {
    companyId: string;
    parkingLotId?: string;
    from?: Date;
    to?: Date;
    status?: InvoiceStatus;
    search?: string;
  }) {
    const query = this.invoiceRepo.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.parkingSession', 'session')
      .leftJoinAndSelect('session.vehicle', 'vehicle')
      .where('invoice.companyId = :companyId', { companyId: filters.companyId });

    if (filters.parkingLotId) {
      query.andWhere('invoice.parkingLotId = :parkingLotId', { parkingLotId: filters.parkingLotId });
    }

    if (filters.from && filters.to) {
      query.andWhere('invoice.issuedAt BETWEEN :from AND :to', { from: filters.from, to: filters.to });
    }

    if (filters.status) {
      query.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters.search) {
      query.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR customer.fullName ILIKE :search OR customer.documentNumber ILIKE :search OR vehicle.licensePlate ILIKE :search OR vehicle.bikeCode ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('invoice.issuedAt', 'DESC');

    return await query.getMany();
  }

  /**
   * Obtener factura por ID
   */
  async findOne(id: string, companyId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, companyId },
      relations: [
        'items',
        'customer',
        'parkingSession',
        'parkingSession.vehicle',
        'parkingSession.spot',
        'parkingSession.spot.zone',
        'voidedBy',
      ],
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    return invoice;
  }

  /**
   * Anular factura (solo SUPERVISOR/ADMIN)
   */
  async voidInvoice(
    id: string,
    companyId: string,
    userId: string,
    reason: string,
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('La razón de anulación es obligatoria');
    }

    return await this.dataSource.transaction(async (manager) => {
      const invoice = await manager.findOne(CustomerInvoice, {
        where: { id, companyId },
      });

      if (!invoice) {
        throw new NotFoundException('Factura no encontrada');
      }

      if (invoice.status === InvoiceStatus.VOIDED) {
        throw new BadRequestException('La factura ya está anulada');
      }

      const before = { ...invoice };

      invoice.status = InvoiceStatus.VOIDED;
      invoice.voidedByUserId = userId;
      invoice.voidReason = reason;

      await manager.save(invoice);

      // AuditLog
      await manager.save(AuditLog, {
        companyId,
        userId,
        action: AuditAction.INVOICE_VOIDED,
        entityType: 'CustomerInvoice',
        entityId: invoice.id,
        before,
        after: invoice,
      });

      return invoice;
    });
  }

  /**
   * Generar HTML imprimible de factura
   */
  async generateInvoiceHtml(invoiceId: string): Promise<string> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: [
        'items',
        'customer',
        'parkingSession',
        'parkingSession.vehicle',
        'parkingSession.spot',
        'parkingSession.parkingLot',
      ],
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    const parkingLot = invoice.parkingSession.parkingLot;
    const customer = invoice.customer;
    const vehicle = invoice.parkingSession.vehicle;
    const session = invoice.parkingSession;

    const totalMinutes = session.exitAt
      ? Math.round((session.exitAt.getTime() - session.entryAt.getTime()) / 60000)
      : 0;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Arial', sans-serif; 
      padding: 20px; 
      max-width: 800px; 
      margin: 0 auto;
      font-size: 14px;
    }
    .invoice-header { 
      text-align: center; 
      border-bottom: 2px solid #333; 
      padding-bottom: 20px; 
      margin-bottom: 20px; 
    }
    .invoice-header h1 { font-size: 24px; margin-bottom: 10px; }
    .invoice-header p { margin: 5px 0; color: #666; }
    .invoice-info { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin-bottom: 30px; 
    }
    .info-block { background: #f9f9f9; padding: 15px; border-radius: 8px; }
    .info-block h3 { margin-bottom: 10px; font-size: 16px; color: #333; }
    .info-block p { margin: 5px 0; }
    .info-label { font-weight: bold; color: #555; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { 
      background: #333; 
      color: white; 
      padding: 12px; 
      text-align: left; 
    }
    .items-table td { 
      padding: 12px; 
      border-bottom: 1px solid #ddd; 
    }
    .totals { 
      margin-left: auto; 
      width: 300px; 
      border-top: 2px solid #333; 
      padding-top: 15px; 
    }
    .totals .row { 
      display: flex; 
      justify-content: space-between; 
      margin: 8px 0; 
    }
    .totals .total { 
      font-size: 20px; 
      font-weight: bold; 
      border-top: 2px solid #333; 
      padding-top: 10px; 
      margin-top: 10px; 
    }
    .footer { 
      text-align: center; 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #ddd; 
      color: #666; 
      font-size: 12px; 
    }
    .status-void { 
      color: red; 
      font-weight: bold; 
      text-align: center; 
      font-size: 24px; 
      margin: 20px 0; 
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-header">
    <h1>${parkingLot.legalName || parkingLot.name}</h1>
    <p><strong>NIT:</strong> ${parkingLot.legalNit || 'N/A'}</p>
    <p>${parkingLot.address || ''}</p>
    <p><strong>Teléfono:</strong> ${parkingLot.ticketHeader?.phone || 'N/A'}</p>
    <p style="margin-top: 15px; font-size: 18px;"><strong>FACTURA ${invoice.invoiceNumber}</strong></p>
    <p>${new Date(invoice.issuedAt).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}</p>
  </div>

  ${invoice.status === InvoiceStatus.VOIDED ? '<div class="status-void">*** FACTURA ANULADA ***</div>' : ''}

  <div class="invoice-info">
    <div class="info-block">
      <h3>Información del Cliente</h3>
      <p><span class="info-label">Nombre:</span> ${customer?.fullName || 'Cliente general'}</p>
      <p><span class="info-label">Documento:</span> ${customer?.documentNumber || 'N/A'}</p>
      <p><span class="info-label">Teléfono:</span> ${customer?.phone || 'N/A'}</p>
    </div>

    <div class="info-block">
      <h3>Información del Vehículo</h3>
      <p><span class="info-label">Tipo:</span> ${vehicle?.vehicleType || 'N/A'}</p>
      <p><span class="info-label">Placa/Código:</span> ${vehicle?.plate || vehicle?.bicycleCode || 'N/A'}</p>
      <p><span class="info-label">Ticket:</span> ${session.ticketNumber}</p>
    </div>
  </div>

  <div class="invoice-info">
    <div class="info-block">
      <h3>Entrada</h3>
      <p>${new Date(session.entryAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</p>
    </div>

    <div class="info-block">
      <h3>Salida</h3>
      <p>${session.exitAt ? new Date(session.exitAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</p>
    </div>

    <div class="info-block">
      <h3>Tiempo Total</h3>
      <p>${hours}h ${minutes}m</p>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align: center;">Cantidad</th>
        <th style="text-align: right;">Valor Unit.</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">$${item.unitPrice.toLocaleString('es-CO')}</td>
          <td style="text-align: right;">$${item.total.toLocaleString('es-CO')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <span>Subtotal:</span>
      <span>$${invoice.subtotal.toLocaleString('es-CO')} COP</span>
    </div>
    ${invoice.discounts > 0 ? `
    <div class="row">
      <span>Descuentos:</span>
      <span>- $${invoice.discounts.toLocaleString('es-CO')} COP</span>
    </div>
    ` : ''}
    <div class="row total">
      <span>TOTAL:</span>
      <span>$${invoice.total.toLocaleString('es-CO')} COP</span>
    </div>
  </div>

  <div class="footer">
    <p>Este comprobante es un documento interno de servicio.</p>
    <p>Gracias por utilizar nuestro parqueadero.</p>
    <p style="margin-top: 10px;">Sistema de Gestión de Parqueaderos - ${new Date().getFullYear()}</p>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; background: #333; color: white; border: none; border-radius: 5px;">
      Imprimir
    </button>
  </div>
</body>
</html>
    `.trim();

    return html;
  }

  /**
   * Log de impresión de factura
   */
  async logPrint(invoiceId: string, companyId: string, userId: string) {
    const invoice = await this.findOne(invoiceId, companyId);

    await this.auditRepo.save({
      companyId,
      userId,
      action: AuditAction.INVOICE_PRINTED,
      entityType: 'CustomerInvoice',
      entityId: invoiceId,
      before: null,
      after: { invoiceNumber: invoice.invoiceNumber, printedAt: new Date() },
    });

    return { success: true, message: 'Impresión registrada' };
  }
}
