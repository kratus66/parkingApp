import { api } from '../lib/api';

export interface ParkingSpot {
  id: string;
  code: string;
  spotType: 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'TRUCK_BUS';
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
  priority: number;
  zoneId: string;
}

export interface OccupancySummary {
  total: number;
  free: number;
  occupied: number;
  reserved: number;
  outOfService: number;
  byType: {
    [key: string]: {
      total: number;
      free: number;
      occupied: number;
    };
  };
  byZone: Array<{
    zoneId: string;
    zoneName: string;
    total: number;
    free: number;
    occupied: number;
  }>;
}

export const occupancyService = {
  async getSummary(parkingLotId: string): Promise<OccupancySummary> {
    console.log('🔵 [occupancyService.getSummary] URL:', `/occupancy/summary?parkingLotId=${parkingLotId}`);
    return api.get(`/occupancy/summary?parkingLotId=${parkingLotId}`);
  },

  async getAvailableSpots(parkingLotId: string, vehicleType: string): Promise<ParkingSpot[]> {
    const url = `/occupancy/available?parkingLotId=${parkingLotId}&vehicleType=${vehicleType}`;
    console.log('🔵 [occupancyService.getAvailableSpots] Llamando a:', url);
    console.log('🔵 [occupancyService.getAvailableSpots] Params:', { parkingLotId, vehicleType });
    
    try {
      const result = await api.get(url);
      console.log('✅ [occupancyService.getAvailableSpots] Respuesta recibida:', result);
      console.log('✅ [occupancyService.getAvailableSpots] Tipo de respuesta:', typeof result, Array.isArray(result));
      console.log('✅ [occupancyService.getAvailableSpots] Primer elemento:', result[0]);
      
      // Si la respuesta es un array, devolverlo directamente
      if (Array.isArray(result)) {
        return result;
      }
      
      // Si la respuesta tiene estructura {data: [...]}
      if (result && result.data && Array.isArray(result.data)) {
        console.log('⚠️ Respuesta con wrapper, extrayendo data');
        return result.data;
      }
      
      console.error('❌ Formato de respuesta inesperado:', result);
      return [];
    } catch (error: any) {
      console.error('❌ [occupancyService.getAvailableSpots] Error:', error);
      console.error('❌ [occupancyService.getAvailableSpots] Error response:', error.response);
      throw error;
    }
  },

  async assignSpot(parkingLotId: string, vehicleType: string): Promise<ParkingSpot> {
    console.log('🔵 [occupancyService.assignSpot] Asignando puesto:', { parkingLotId, vehicleType });
    return api.post('/occupancy/assign', { parkingLotId, vehicleType });
  },
};
