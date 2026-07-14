import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomerInvoice, InvoiceStatus } from '../../entities/customer-invoice.entity';
import { CustomerInvoiceItem } from '../../entities/customer-invoice-item.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ParkingLot } from '../parking-lots/entities/parking-lot.entity';

// Mock genérico de repositorio TypeORM para providers no ejercitados en estos tests
const mockRepositoryFactory = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  })),
});

describe('InvoiceService', () => {
  let service: InvoiceService;
  let invoiceRepo: Repository<CustomerInvoice>;

  const mockInvoice = {
    id: 'invoice-1',
    companyId: 'company-1',
    parkingLotId: 'lot-1',
    invoiceNumber: 'INV-00000001',
    subtotal: 10000,
    discounts: 0,
    total: 10000,
    currency: 'COP',
    issuedAt: new Date('2024-01-15T12:00:00Z'),
    status: InvoiceStatus.ISSUED,
    items: [
      {
        description: 'Servicio de parqueo',
        quantity: 1,
        unitPrice: 10000,
        total: 10000,
      },
    ],
    parkingSession: {
      entryAt: new Date('2024-01-15T10:00:00Z'),
      exitAt: new Date('2024-01-15T12:00:00Z'),
      ticketNumber: 'TICKET-001',
      vehicle: {
        vehicleType: 'CAR',
        plate: 'ABC123',
      },
      parkingLot: {
        legalName: 'Parqueadero Test',
        legalNit: '123456789',
        address: 'Calle 123',
        phone: '1234567890',
      },
    },
    customer: {
      fullName: 'Test User',
      documentNumber: '12345678',
      phone: '3001234567',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(CustomerInvoice),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(CustomerInvoiceItem),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(ParkingLot),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    invoiceRepo = module.get<Repository<CustomerInvoice>>(
      getRepositoryToken(CustomerInvoice),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateInvoiceHtml', () => {
    it('should generate valid HTML invoice', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(mockInvoice as any);

      const html = await service.generateInvoiceHtml('invoice-1');

      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('INV-00000001');
      expect(html).toContain('ABC123');
      expect(html).toContain('Test User');
      expect(html).toContain('10.000'); // Monto formateado es-CO (punto de miles)
    });

    it('should include voided status in HTML if invoice is voided', async () => {
      const voidedInvoice = {
        ...mockInvoice,
        status: InvoiceStatus.VOIDED,
      };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(voidedInvoice as any);

      const html = await service.generateInvoiceHtml('invoice-1');

      expect(html).toContain('FACTURA ANULADA');
    });

    it('should calculate time correctly', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(mockInvoice as any);

      const html = await service.generateInvoiceHtml('invoice-1');

      // 2 hours = 120 minutes = 2h 0m
      expect(html).toContain('2h 0m');
    });
  });

  describe('findOne', () => {
    it('should return invoice with all relations', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(mockInvoice as any);

      const result = await service.findOne('invoice-1', 'company-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('invoice-1');
      expect(result.items).toBeDefined();
      expect(result.parkingSession).toBeDefined();
    });

    it('should throw error if invoice not found', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid', 'company-1')).rejects.toThrow(
        'Factura no encontrada',
      );
    });
  });
});
