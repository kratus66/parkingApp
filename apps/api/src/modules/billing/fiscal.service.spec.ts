import { FiscalService } from './fiscal.service';

describe('FiscalService', () => {
  const service = new FiscalService();

  describe('extractTaxFromGross (precio incluye IVA)', () => {
    it('desglosa IVA 19% de un total con IVA incluido', () => {
      const t = service.extractTaxFromGross(9000, 19);
      expect(t.taxableBase).toBe(7563);
      expect(t.taxAmount).toBe(1437);
      // base + iva siempre = total
      expect(t.taxableBase + t.taxAmount).toBe(9000);
    });

    it('base + IVA siempre reconstruye el total (sin pérdida por redondeo)', () => {
      for (const total of [100, 999, 1000, 4800, 15000, 123457]) {
        const t = service.extractTaxFromGross(total, 19);
        expect(t.taxableBase + t.taxAmount).toBe(total);
      }
    });

    it('sin IVA cuando la tasa es 0', () => {
      const t = service.extractTaxFromGross(9000, 0);
      expect(t.taxAmount).toBe(0);
      expect(t.taxableBase).toBe(9000);
    });

    it('total 0 no genera IVA', () => {
      const t = service.extractTaxFromGross(0, 19);
      expect(t.taxAmount).toBe(0);
    });
  });

  describe('computeCufe', () => {
    const input = {
      invoiceNumber: 'FE1000',
      issuedAt: new Date('2026-07-14T15:00:00.000Z'),
      taxableBase: 7563,
      taxAmount: 1437,
      total: 9000,
      sellerNit: '900123456',
      buyerDoc: '1234567890',
      technicalKey: 'abc123',
      environment: 2,
    };

    it('genera un hash SHA-384 (96 hex)', () => {
      const cufe = service.computeCufe(input);
      expect(cufe).toMatch(/^[a-f0-9]{96}$/);
    });

    it('es determinista para la misma entrada', () => {
      expect(service.computeCufe(input)).toBe(service.computeCufe(input));
    });

    it('cambia si cambia el total', () => {
      const other = service.computeCufe({ ...input, total: 9001 });
      expect(other).not.toBe(service.computeCufe(input));
    });
  });
});
