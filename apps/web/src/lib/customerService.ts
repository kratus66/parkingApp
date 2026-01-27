import api from './api';

/**
 * Servicio para operaciones de clientes
 */

export interface IdentifyRequest {
  vehiclePlate?: string;
  bicycleCode?: string;
  documentType?: string;
  documentNumber?: string;
}

export interface IdentifyResponse {
  found: boolean;
  customer?: {
    id: string;
    documentType: string;
    documentNumber: string;
    fullName: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    isActive: boolean;
  };
  vehicles?: Array<{
    id: string;
    vehicleType: string;
    plate?: string;
    bicycleCode?: string;
    brand?: string;
    model?: string;
    color?: string;
    isActive: boolean;
  }>;
  consentsCurrent?: {
    whatsapp: any;
    email: any;
  };
  suggestions?: string[];
}

export interface CreateCustomerRequest {
  documentType: string;
  documentNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  consents?: {
    whatsapp?: boolean;
    email?: boolean;
  };
}

export const customerService = {
  /**
   * Identificar cliente por placa, código de bici o documento
   */
  async identify(data: IdentifyRequest): Promise<IdentifyResponse> {
    const response = await api.post('/ops/identify', data);
    return response.data;
  },

  /**
   * Crear nuevo cliente
   */
  async create(data: CreateCustomerRequest) {
    const response = await api.post('/customers', data);
    return response.data;
  },

  /**
   * Buscar cliente por ID
   */
  async findById(customerId: string) {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  },
};
