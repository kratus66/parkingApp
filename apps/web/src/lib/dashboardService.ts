import api from './api';

export interface DashboardStats {
  activeVehicles: number;
  availableSpots: number;
  dailyRevenue: number;
  entriesToday: number;
  exitsToday: number;
  totalOccupancy: {
    occupied: number;
    total: number;
    percentage: number;
  };
  vehicleTypes: Array<{
    type: string;
    occupied: number;
    capacity: number;
    percentage: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
  }>;
}

/**
 * Servicio para obtener datos del dashboard
 */
export const dashboardService = {
  /**
   * Obtener estadísticas del dashboard
   */
  async getStats(parkingLotId?: string): Promise<DashboardStats> {
    const params = parkingLotId ? { parkingLotId } : {};
    const response = await api.get('/ops/dashboard/stats', { params });
    return response.data;
  },

  /**
   * Buscar sesión activa por placa
   */
  async searchByPlate(plate: string, parkingLotId: string) {
    return await api.get('/parking-sessions/active', {
      params: { vehiclePlate: plate, parkingLotId },
    });
  },
};
