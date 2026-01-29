import { api } from '../lib/api';

export interface ParkingSpot {
  id: string;
  companyId: string;
  parkingLotId: string;
  zoneId: string;
  code: string;
  spotType: 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'TRUCK_BUS';
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
  priority: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  zone?: {
    id: string;
    name: string;
  };
}

export interface CreateSpotDto {
  parkingLotId: string;
  zoneId: string;
  code: string;
  spotType: 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'TRUCK_BUS';
  priority?: number;
  notes?: string;
}

export interface UpdateSpotDto {
  zoneId?: string;
  code?: string;
  spotType?: 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'TRUCK_BUS';
  status?: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
  priority?: number;
  notes?: string;
}

export interface ChangeStatusDto {
  toStatus: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
  reason?: string;
}

export interface SpotsListResponse {
  data: ParkingSpot[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const spotService = {
  async list(params: {
    parkingLotId: string;
    zoneId?: string;
    status?: string;
    spotType?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<SpotsListResponse> {
    const queryParams = new URLSearchParams({
      parkingLotId: params.parkingLotId,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
    });
    
    if (params.zoneId) queryParams.append('zoneId', params.zoneId);
    if (params.status) queryParams.append('status', params.status);
    if (params.spotType) queryParams.append('spotType', params.spotType);
    if (params.search) queryParams.append('search', params.search);
    
    return api.get(`/spots?${queryParams.toString()}`);
  },

  async getById(id: string): Promise<ParkingSpot> {
    return api.get(`/spots/${id}`);
  },

  async create(data: CreateSpotDto): Promise<ParkingSpot> {
    return api.post('/spots', data);
  },

  async update(id: string, data: UpdateSpotDto): Promise<ParkingSpot> {
    return api.patch(`/spots/${id}`, data);
  },

  async changeStatus(id: string, data: ChangeStatusDto): Promise<ParkingSpot> {
    return api.post(`/spots/${id}/status`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/spots/${id}`);
  },
};
