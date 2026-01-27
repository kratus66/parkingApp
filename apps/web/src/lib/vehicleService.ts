import api from './api';

/**
 * Servicio para operaciones de vehículos
 */

export interface CreateVehicleRequest {
  customerId: string;
  vehicleType: 'CAR' | 'BICYCLE' | 'MOTORCYCLE' | 'TRUCK_BUS';
  plate?: string;
  bicycleCode?: string;
  brand?: string;
  model?: string;
  color?: string;
}

export const vehicleService = {
  /**
   * Crear nuevo vehículo
   */
  async create(data: CreateVehicleRequest) {
    try {
      // Log del payload enviado
      console.log('Enviando vehicleData:', data);
      const response = await api.post('/vehicles-v2', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Log del error detallado del backend
        console.error('Error creando vehículo:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else {
        console.error('Error inesperado:', error);
      }
      throw error;
    }
  },

  /**
   * Buscar vehículo por placa
   */
  async findByPlate(plate: string) {
    const response = await api.get(`/vehicles-v2/search`, {
      params: { plate },
    });
    return response.data;
  },

  /**
   * Buscar vehículos del cliente
   */
  async findByCustomer(customerId: string) {
    const response = await api.get(`/vehicles-v2`, {
      params: { customerId },
    });
    return response.data;
  },
};
