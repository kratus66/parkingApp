import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgreementsService } from './agreements.service';
import {
  Agreement,
  AgreementDiscountType,
} from '../../entities/agreement.entity';

const makeAgreement = (over: Partial<Agreement>): Agreement =>
  ({
    id: 'a1',
    companyId: 'c1',
    parkingLotId: null,
    name: 'Conv',
    nit: null,
    discountType: AgreementDiscountType.PERCENT,
    discountValue: 10,
    validFrom: null,
    validUntil: null,
    notes: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Agreement;

describe('AgreementsService.computeDiscount', () => {
  let service: AgreementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgreementsService,
        { provide: getRepositoryToken(Agreement), useValue: {} },
      ],
    }).compile();
    service = module.get<AgreementsService>(AgreementsService);
  });

  it('devuelve 0 sin convenio', () => {
    expect(service.computeDiscount(null, 10000)).toBe(0);
  });

  it('aplica porcentaje redondeado', () => {
    const a = makeAgreement({ discountType: AgreementDiscountType.PERCENT, discountValue: 20 });
    expect(service.computeDiscount(a, 9000)).toBe(1800);
  });

  it('aplica monto fijo', () => {
    const a = makeAgreement({ discountType: AgreementDiscountType.FIXED, discountValue: 2500 });
    expect(service.computeDiscount(a, 9000)).toBe(2500);
  });

  it('nunca excede el subtotal', () => {
    const a = makeAgreement({ discountType: AgreementDiscountType.FIXED, discountValue: 99999 });
    expect(service.computeDiscount(a, 5000)).toBe(5000);
  });

  it('no aplica si está inactivo', () => {
    const a = makeAgreement({ isActive: false, discountValue: 50 });
    expect(service.computeDiscount(a, 10000)).toBe(0);
  });

  it('respeta la vigencia (fuera de rango = 0)', () => {
    const a = makeAgreement({
      discountValue: 50,
      validFrom: '2020-01-01',
      validUntil: '2020-12-31',
    });
    expect(service.computeDiscount(a, 10000, new Date('2026-07-14'))).toBe(0);
  });

  it('aplica dentro de la vigencia', () => {
    const a = makeAgreement({
      discountType: AgreementDiscountType.PERCENT,
      discountValue: 50,
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
    });
    expect(service.computeDiscount(a, 10000, new Date('2026-07-14'))).toBe(5000);
  });
});
