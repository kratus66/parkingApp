import api from './api';

/**
 * Servicio para operaciones de sesiones de parqueo
 */

export interface CheckInRequest {
  parkingLotId: string;
  vehicleType: 'CAR' | 'BICYCLE' | 'MOTORCYCLE' | 'TRUCK_BUS';
  vehiclePlate: string; // Obligatorio (para bicicletas usar el código)
  phoneNumber?: string;
  email?: string;
  notes?: string;
}

export interface CheckOutRequest {
  sessionId: string;
}

export interface CancelSessionRequest {
  sessionId: string;
  reason: string;
}

export interface ReprintTicketRequest {
  sessionId: string;
  reason: string;
}

export const sessionService = {
  /**
   * Registrar entrada de vehículo (Check-In)
   */
  async checkIn(data: CheckInRequest) {
    const response = await api.post('/parking-sessions/check-in', data);
    return response.data;
  },

  /**
   * Registrar salida de vehículo (Check-Out)
   */
  async checkOut(sessionId: string) {
    const response = await api.post(`/parking-sessions/${sessionId}/check-out`);
    return response.data;
  },

  /**
   * Buscar sesión activa por placa
   */
  async findActiveByPlate(licensePlate: string) {
    const response = await api.get(`/parking-sessions/by-plate/${licensePlate}`);
    return response.data;
  },

  /**
   * Buscar sesión por número de ticket
   */
  async findByTicketNumber(ticketNumber: string) {
    const response = await api.get(`/parking-sessions/by-ticket/${ticketNumber}`);
    return response.data;
  },

  /**
   * Cancelar sesión activa
   */
  async cancel(data: CancelSessionRequest) {
    const response = await api.post('/parking-sessions/cancel', data);
    return response.data;
  },

  /**
   * Reimprimir ticket
   */
  async reprintTicket(data: ReprintTicketRequest) {
    const response = await api.post('/parking-sessions/reprint-ticket', data);
    return response.data;
  },
};
