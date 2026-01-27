import { api } from '../lib/api';

export interface Vehicle {
  id: string;
  companyId: string;
  customerId: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'TRUCK' | 'BUS';
  plate?: string;
  bicycleCode?: string;
  brand?: string;
  model?: string;
  color?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    documentType: string;
    documentNumber: string;
    phone?: string;
    email?: string;
  };
}

export interface SearchVehiclesParams {
  query?: string;
  page?: number;
  limit?: number;
  vehicleType?: string;
}

export interface SearchVehiclesResponse {
  data: Vehicle[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const vehicleService = {
  async search(params: SearchVehiclesParams): Promise<SearchVehiclesResponse> {
    return api.get('/vehicles-v2/search', { params });
  },

  async findOne(id: string): Promise<Vehicle> {
    return api.get(`/vehicles-v2/${id}`);
  },

  async update(id: string, data: any): Promise<Vehicle> {
    return api.patch(`/vehicles-v2/${id}`, data);
  },

  async create(data: any): Promise<Vehicle> {
    return api.post('/vehicles-v2', data);
  },
};
