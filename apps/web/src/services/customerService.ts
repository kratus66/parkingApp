import { api } from '../lib/api';

export interface Customer {
  id: string;
  companyId: string;
  documentType: 'CC' | 'CE' | 'PASSPORT' | 'PPT' | 'OTHER';
  documentNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  documentType: 'CC' | 'CE' | 'PASSPORT' | 'PPT' | 'OTHER';
  documentNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  documentType?: 'CC' | 'CE' | 'PASSPORT' | 'PPT' | 'OTHER';
  documentNumber?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface SearchCustomersParams {
  query?: string;
  page?: number;
  limit?: number;
}

export interface SearchCustomersResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const customerService = {
  async create(data: CreateCustomerDto): Promise<Customer> {
    return api.post('/customers', data);
  },

  async search(params: SearchCustomersParams): Promise<SearchCustomersResponse> {
    return api.get('/customers/search', { params });
  },

  async findOne(id: string): Promise<Customer> {
    return api.get(`/customers/${id}`);
  },

  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return api.patch(`/customers/${id}`, data);
  },

  async getVehicles(id: string): Promise<any[]> {
    return api.get(`/customers/${id}/vehicles`);
  },

  async getConsents(id: string): Promise<any> {
    return api.get(`/customers/${id}/consents`);
  },
};
