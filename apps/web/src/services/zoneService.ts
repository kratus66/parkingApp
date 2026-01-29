import { api } from '../lib/api';

export interface ParkingZone {
  id: string;
  companyId: string;
  parkingLotId: string;
  name: string;
  description?: string;
  allowedVehicleTypes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ZonesListResponse {
  data: ParkingZone[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateZoneDto {
  parkingLotId: string;
  name: string;
  description?: string;
  allowedVehicleTypes: string[];
}

export interface UpdateZoneDto {
  name?: string;
  description?: string;
  allowedVehicleTypes?: string[];
  isActive?: boolean;
}

export const zoneService = {
  async list(parkingLotId: string, page = 1, limit = 100, search?: string): Promise<ZonesListResponse> {
    const params = new URLSearchParams({
      parkingLotId,
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    
    return api.get(`/zones?${params.toString()}`);
  },

  async getById(id: string): Promise<ParkingZone> {
    return api.get(`/zones/${id}`);
  },

  async create(data: CreateZoneDto): Promise<ParkingZone> {
    return api.post('/zones', data);
  },

  async update(id: string, data: UpdateZoneDto): Promise<ParkingZone> {
    return api.patch(`/zones/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/zones/${id}`);
  },
};
