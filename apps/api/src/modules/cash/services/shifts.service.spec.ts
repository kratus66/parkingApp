import { Test, TestingModule } from '@nestjs/testing';
import { ShiftsService } from './shifts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CashShift, CashShiftStatus } from '../../../entities/cash-shift.entity';
import { CashPolicy } from '../../../entities/cash-policy.entity';
import { CashMovement, CashMovementType } from '../../../entities/cash-movement.entity';
import { CashCount } from '../../../entities/cash-count.entity';
import { Payment, PaymentStatus } from '../../../entities/payment.entity';
import { PaymentItem } from '../../../entities/payment-item.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ShiftsService', () => {
  let service: ShiftsService;
  let shiftsRepo: any;
  let policyRepo: any;
  let paymentsRepo: any;
  let movementsRepo: any;

  const mockShiftRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((shift) => Promise.resolve({ id: 'shift-1', ...shift })),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(() => Promise.resolve([])),
    })),
  };

  const mockPolicyRepo = {
    findOne: jest.fn(),
  };

  const mockPaymentsRepo = {
    find: jest.fn(() => Promise.resolve([])),
  };

  // (H5/Sprint D) El esperado por método consulta payment_items agrupados por método.
  const mockPaymentItemsRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(() => Promise.resolve([{ method: 'CASH', total: '30000' }])),
    })),
  };

  const mockMovementsRepo = {
    find: jest.fn(() => Promise.resolve([])),
  };

  const mockCountsRepo = {
    find: jest.fn(() => Promise.resolve([])),
  };

  const mockAuditRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn((audit) => Promise.resolve(audit)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        {
          provide: getRepositoryToken(CashShift),
          useValue: mockShiftRepo,
        },
        {
          provide: getRepositoryToken(CashPolicy),
          useValue: mockPolicyRepo,
        },
        {
          provide: getRepositoryToken(CashMovement),
          useValue: mockMovementsRepo,
        },
        {
          provide: getRepositoryToken(CashCount),
          useValue: mockCountsRepo,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentsRepo,
        },
        {
          provide: getRepositoryToken(PaymentItem),
          useValue: mockPaymentItemsRepo,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditRepo,
        },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
    shiftsRepo = module.get(getRepositoryToken(CashShift));
    policyRepo = module.get(getRepositoryToken(CashPolicy));
    paymentsRepo = module.get(getRepositoryToken(Payment));
    movementsRepo = module.get(getRepositoryToken(CashMovement));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('openShift', () => {
    it('should open a new shift successfully', async () => {
      const dto = {
        parkingLotId: 'lot-1',
        openingFloat: 50000,
        openingNotes: 'Test shift',
      };

      policyRepo.findOne.mockResolvedValue(null); // No policy
      // mockResolvedValueOnce: evita fuga entre tests (clearAllMocks no resetea implementaciones)
      shiftsRepo.save.mockResolvedValueOnce({ id: 'shift-1', ...dto });

      const result = await service.openShift(dto, 'user-1', 'company-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('shift-1');
      expect(shiftsRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if policy disallows multiple shifts', async () => {
      const dto = {
        parkingLotId: 'lot-1',
        openingFloat: 50000,
      };

      const policy = {
        allowMultipleOpenShiftsPerCashier: false,
      };

      const existingShift = {
        id: 'shift-1',
        status: CashShiftStatus.OPEN,
      };

      policyRepo.findOne.mockResolvedValue(policy);
      shiftsRepo.findOne.mockResolvedValue(existingShift);

      await expect(service.openShift(dto, 'user-1', 'company-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('closeShift', () => {
    it('should close shift and calculate totals', async () => {
      const shift = {
        id: 'shift-1',
        companyId: 'company-1',
        parkingLotId: 'lot-1',
        cashierUserId: 'user-1',
        status: CashShiftStatus.OPEN,
        openingFloat: 50000,
      };

      const payments = [
        { totalAmount: 10000, status: PaymentStatus.PAID, items: [] },
        { totalAmount: 20000, status: PaymentStatus.PAID, items: [] },
      ];

      shiftsRepo.findOne.mockResolvedValue(shift);
      paymentsRepo.find.mockResolvedValue(payments);
      movementsRepo.find
        .mockResolvedValueOnce([{ type: CashMovementType.INCOME, amount: 5000 }])
        .mockResolvedValueOnce([{ type: CashMovementType.EXPENSE, amount: 3000 }]);

      const result = await service.closeShift(
        'shift-1',
        { closingNotes: 'All good' },
        'user-1',
        'company-1',
      );

      expect(result.status).toBe(CashShiftStatus.CLOSED);
      expect(result.expectedTotal).toBe(82000); // 50000 + 30000 + 5000 - 3000
    });

    it('should reconcile by method: cash counted + card not counted → no false shortage (H5)', async () => {
      const shift = {
        id: 'shift-1',
        companyId: 'company-1',
        parkingLotId: 'lot-1',
        cashierUserId: 'user-1',
        status: CashShiftStatus.OPEN,
        openingFloat: 0,
      };

      shiftsRepo.findOne.mockResolvedValue(shift);
      // 10.000 en efectivo + 20.000 en tarjeta
      mockPaymentItemsRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(() =>
          Promise.resolve([
            { method: 'CASH', total: '10000' },
            { method: 'CARD', total: '20000' },
          ]),
        ),
      });
      movementsRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      // El cajero solo arquea el efectivo del cajón (10.000), que coincide con lo esperado
      mockCountsRepo.find.mockResolvedValueOnce([
        { method: 'CASH', countedAmount: 10000 },
      ] as any);

      const result = await service.closeShift(
        'shift-1',
        {},
        'user-1',
        'company-1',
      );

      // Antes: diferencia = 10000 - 30000 = -20000 (faltante falso por la tarjeta).
      // Ahora: solo se concilia el efectivo → diferencia 0.
      expect(result.difference).toBe(0);
      expect(result.expectedTotal).toBe(30000); // 10000 CASH + 20000 CARD
    });

    it('should throw NotFoundException if shift not found', async () => {
      shiftsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.closeShift('shift-1', {}, 'user-1', 'company-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if shift already closed', async () => {
      const shift = {
        id: 'shift-1',
        status: CashShiftStatus.CLOSED,
      };

      shiftsRepo.findOne.mockResolvedValue(shift);

      await expect(
        service.closeShift('shift-1', {}, 'user-1', 'company-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
