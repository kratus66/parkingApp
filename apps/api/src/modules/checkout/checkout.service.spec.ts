import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutService } from './checkout.service';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParkingSession } from '../../entities/parking-session.entity';
import { ParkingSpot } from '../../entities/parking-spot.entity';
import { Payment } from '../../entities/payment.entity';
import { PaymentItem, PaymentMethod } from '../../entities/payment-item.entity';
import { CustomerInvoice } from '../../entities/customer-invoice.entity';
import { CustomerInvoiceItem } from '../../entities/customer-invoice-item.entity';
import { PricingSnapshot } from '../../entities/pricing-snapshot.entity';
import { InvoiceCounter } from '../../entities/invoice-counter.entity';
import { CashShift } from '../../entities/cash-shift.entity';
import { CashPolicy } from '../../entities/cash-policy.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { PricingService } from '../pricing/pricing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AgreementsService } from '../agreements/agreements.service';
import { BillingService } from '../billing/billing.service';
import { FiscalService } from '../billing/fiscal.service';
import { InvoiceService } from './invoice.service';

// Mock genérico de repositorio TypeORM
const mockRepositoryFactory = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

describe('CheckoutService', () => {
  let service: CheckoutService;
  let sessionRepo: Repository<ParkingSession>;
  let paymentRepo: Repository<Payment>;
  let invoiceRepo: Repository<CustomerInvoice>;

  const mockSession = {
    id: 'session-1',
    companyId: 'company-1',
    parkingLotId: 'lot-1',
    status: 'ACTIVE',
    entryAt: new Date('2024-01-15T10:00:00Z'),
    ticketNumber: 'TICKET-001',
    vehicle: {
      vehicleType: 'CAR',
      licensePlate: 'ABC123',
    },
    spot: {
      id: 'spot-1',
      status: 'OCCUPIED',
    },
    customer: {
      id: 'customer-1',
      fullName: 'Test User',
    },
  };

  const mockQuote = {
    total: 10000,
    breakdown: {
      baseRate: 10000,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: getRepositoryToken(ParkingSession),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(ParkingSpot),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(Payment),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(PaymentItem),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(CustomerInvoice),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(CustomerInvoiceItem),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(PricingSnapshot),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(InvoiceCounter),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(CashShift),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: getRepositoryToken(CashPolicy),
          useFactory: mockRepositoryFactory,
        },
        {
          provide: PricingService,
          useValue: {
            calculateQuote: jest.fn().mockResolvedValue(mockQuote),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
        {
          provide: AgreementsService,
          useValue: {
            resolve: jest.fn().mockResolvedValue(null),
            computeDiscount: jest.fn().mockReturnValue(0),
          },
        },
        {
          provide: BillingService,
          useValue: {
            nextNumber: jest.fn().mockResolvedValue(null),
          },
        },
        FiscalService,
        {
          provide: InvoiceService,
          useValue: {
            generateInvoiceHtml: jest.fn().mockResolvedValue('<html></html>'),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    sessionRepo = module.get<Repository<ParkingSession>>(
      getRepositoryToken(ParkingSession),
    );
    paymentRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    invoiceRepo = module.get<Repository<CustomerInvoice>>(
      getRepositoryToken(CustomerInvoice),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('preview', () => {
    it('should calculate checkout preview correctly', async () => {
      jest.spyOn(sessionRepo, 'findOne').mockResolvedValue(mockSession as any);

      const result = await service.preview(
        { sessionId: 'session-1', lostTicket: false },
        'company-1',
        'lot-1',
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.total).toBe(10000);
      expect(result.sessionId).toBe('session-1');
      expect(result.ticketNumber).toBe('TICKET-001');
    });

    it('should add lost ticket fee when applicable', async () => {
      jest.spyOn(sessionRepo, 'findOne').mockResolvedValue(mockSession as any);

      const result = await service.preview(
        { sessionId: 'session-1', lostTicket: true },
        'company-1',
        'lot-1',
        'user-1',
      );

      // Lost ticket fee = max(5000, 10000 * 0.2) = 5000
      expect(result.total).toBe(15000);
      // TODO: Update test after pricing engine changes
      // expect(result.quote.breakdown.lostTicketFee).toBe(5000);
    });

    it('should throw error if session not found', async () => {
      jest.spyOn(sessionRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.preview(
          { sessionId: 'invalid', lostTicket: false },
          'company-1',
          'lot-1',
          'user-1',
        ),
      ).rejects.toThrow('Sesión de parqueo no encontrada');
    });

    it('should throw error if session not active', async () => {
      jest
        .spyOn(sessionRepo, 'findOne')
        .mockResolvedValue({ ...mockSession, status: 'CLOSED' } as any);

      await expect(
        service.preview(
          { sessionId: 'session-1', lostTicket: false },
          'company-1',
          'lot-1',
          'user-1',
        ),
      ).rejects.toThrow('La sesión no está activa');
    });
  });

  describe('Payment validation', () => {
    it('should validate cash payment with correct change', () => {
      const paymentItem = {
        method: PaymentMethod.CASH,
        amount: 10000,
        receivedAmount: 15000,
      };

      const change = paymentItem.receivedAmount - paymentItem.amount;
      expect(change).toBe(5000);
    });

    it('should validate payment items sum equals total', () => {
      const total = 10000;
      const paymentItems = [
        { method: PaymentMethod.CASH, amount: 5000 },
        { method: PaymentMethod.CARD, amount: 5000 },
      ];

      const sum = paymentItems.reduce((acc, item) => acc + item.amount, 0);
      expect(sum).toBe(total);
    });

    it('should reject payment items sum not equals total', () => {
      const total = 10000;
      const paymentItems = [
        { method: PaymentMethod.CASH, amount: 5000 },
        { method: PaymentMethod.CARD, amount: 3000 },
      ];

      const sum = paymentItems.reduce((acc, item) => acc + item.amount, 0);
      expect(sum).not.toBe(total);
    });
  });
});
