import { api } from '../lib/api';

export interface Consent {
  id: string;
  companyId: string;
  customerId: string;
  channel: 'WHATSAPP' | 'EMAIL';
  status: 'GRANTED' | 'REVOKED';
  source: 'IN_PERSON' | 'WEB' | 'CALLCENTER' | 'OTHER';
  evidenceText?: string;
  grantedAt?: string;
  revokedAt?: string;
  actorUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsentDto {
  customerId: string;
  channel: 'WHATSAPP' | 'EMAIL';
  status: 'GRANTED' | 'REVOKED';
  source: 'IN_PERSON' | 'WEB' | 'CALLCENTER' | 'OTHER';
  evidenceText?: string;
}

export interface ConsentStatus {
  whatsapp?: {
    status: 'GRANTED' | 'REVOKED';
    grantedAt?: string;
    revokedAt?: string;
  };
  email?: {
    status: 'GRANTED' | 'REVOKED';
    grantedAt?: string;
    revokedAt?: string;
  };
  history: Consent[];
}

export const consentService = {
  async create(data: CreateConsentDto): Promise<Consent> {
    return api.post('/consents', data);
  },

  async getCustomerConsents(customerId: string): Promise<ConsentStatus> {
    return api.get(`/consents/customer/${customerId}`);
  },
};
