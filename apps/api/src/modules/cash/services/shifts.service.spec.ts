import { Test, TestingModule } from '@nestjs/testing';
import { ShiftsService } from './shifts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CashShift, CashShiftStatus } from '../../../entities/cash-shift.entity';
import { CashPolicy } from '../../../entities/cash-policy.entity';
import { CashMovement, CashMovementType } from '../../../entities/cash-movement.entity';
import { CashCount } from '../../../entities/cash-count.entity';
import { Payment, PaymentStatus } from '../../../entities/payment.entity';
import { AuditLog } from '../../../entities/audit-log.entity';
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
      shiftsRepo.save.mockResolvedValue({ id: 'shift-1', ...dto });

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
