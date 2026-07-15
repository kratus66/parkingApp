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

  // checkOut eliminado (Sprint D / H1): la salida con cobro se hace por el flujo
  // /checkout (preview + confirm), no por parking-sessions. Ver services/checkout.service.ts.

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
