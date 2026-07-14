import { api } from '@/lib/api';

export type AgreementDiscountType = 'PERCENT' | 'FIXED';

export interface Agreement {
  id: string;
  companyId: string;
  parkingLotId: string | null;
  name: string;
  nit: string | null;
  discountType: AgreementDiscountType;
  discountValue: number;
  validFrom: string | null;
  validUntil: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementInput {
  name: string;
  nit?: string;
  discountType: AgreementDiscountType;
  discountValue: number;
  parkingLotId?: string;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
  isActive?: boolean;
}

const unwrap = (r: any) => (r && r.data !== undefined ? r.data : r);

export const agreementsService = {
  async list(opts: { activeOnly?: boolean; parkingLotId?: string } = {}): Promise<Agreement[]> {
    const res: any = await api.get('/agreements', {
      params: {
        ...(opts.activeOnly ? { activeOnly: true } : {}),
        ...(opts.parkingLotId ? { parkingLotId: opts.parkingLotId } : {}),
      },
    });
    return unwrap(res) ?? [];
  },

  async findOne(id: string): Promise<Agreement> {
    const res: any = await api.get(`/agreements/${id}`);
    return unwrap(res);
  },

  async create(data: AgreementInput): Promise<Agreement> {
    const res: any = await api.post('/agreements', data);
    return unwrap(res);
  },

  async update(id: string, data: Partial<AgreementInput>): Promise<Agreement> {
    const res: any = await api.patch(`/agreements/${id}`, data);
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/agreements/${id}`);
  },
};
