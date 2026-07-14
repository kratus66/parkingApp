import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface TaxBreakdown {
  /** Base gravable (sin IVA). */
  taxableBase: number;
  /** Tasa de IVA aplicada (%). */
  taxRate: number;
  /** Valor del IVA. */
  taxAmount: number;
}

export interface CufeInput {
  invoiceNumber: string;
  issuedAt: Date;
  /** Valor de la factura antes de impuestos (base gravable). */
  taxableBase: number;
  taxAmount: number;
  total: number;
  sellerNit: string;
  buyerDoc: string;
  technicalKey: string;
  environment: number; // 1 producción, 2 pruebas
}

@Injectable()
export class FiscalService {
  /**
   * Calcula la base gravable y el IVA a partir de un total que YA incluye IVA.
   * base = round(total / (1 + tasa/100)); iva = total - base.
   */
  extractTaxFromGross(total: number, taxRate: number): TaxBreakdown {
    if (taxRate <= 0 || total <= 0) {
      return { taxableBase: Math.max(0, total), taxRate: Math.max(0, taxRate), taxAmount: 0 };
    }
    const taxableBase = Math.round(total / (1 + taxRate / 100));
    const taxAmount = total - taxableBase;
    return { taxableBase, taxRate, taxAmount };
  }

  private money(n: number): string {
    // DIAN usa 2 decimales con punto
    return (n ?? 0).toFixed(2);
  }

  /**
   * Genera el CUFE (Código Único de Factura Electrónica) según el algoritmo DIAN
   * (SHA-384 sobre la concatenación de campos). Se usan IVA (código 01) y 0.00
   * para los demás impuestos (INC 04, ICA 03) por no aplicar en este servicio.
   *
   * Nota: es la estructura oficial; para un CUFE válido ante la DIAN se requiere
   * la clave técnica real asignada en la resolución y transmisión habilitada.
   */
  computeCufe(input: CufeInput): string {
    const fecFac = input.issuedAt.toISOString().slice(0, 10); // YYYY-MM-DD
    const horFac = input.issuedAt.toISOString().slice(11, 19) + '-05:00'; // HH:MM:SS-05:00

    const valImpuesto1 = this.money(input.taxAmount); // IVA (01)
    const valImpuesto2 = this.money(0); // INC (04)
    const valImpuesto3 = this.money(0); // ICA (03)

    const chain =
      input.invoiceNumber +
      fecFac +
      horFac +
      this.money(input.taxableBase) + // ValFac (subtotal sin impuestos)
      '01' +
      valImpuesto1 +
      '04' +
      valImpuesto2 +
      '03' +
      valImpuesto3 +
      this.money(input.total) + // ValTot
      input.sellerNit +
      (input.buyerDoc || '222222222222') + // adquirente; consumidor final DIAN
      (input.technicalKey || '') +
      String(input.environment);

    return createHash('sha384').update(chain, 'utf8').digest('hex');
  }
}
