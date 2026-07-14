import { api } from '../lib/api';

// El cliente `api` (axios) inyecta el Bearer token desde localStorage y su interceptor
// devuelve el body del backend (envelope { data, meta }). Aquí extraemos `.data`.
export const parkingSessionsApi = {
  getActiveSessions: async (params: { search?: string; parkingLotId?: string }) => {
    const response: any = await api.get('/parking-sessions/active', { params });
    return response?.data ?? [];
  },

  getSession: async (id: string) => {
    const response: any = await api.get(`/parking-sessions/${id}`);
    return response?.data ?? response;
  },

  getSessionByTicket: async (ticketNumber: string) => {
    const response: any = await api.get(`/parking-sessions/by-ticket/${ticketNumber}`);
    return response?.data ?? response;
  },

  getSessionByPlate: async (plate: string, parkingLotId?: string) => {
    const response: any = await api.get(`/parking-sessions/by-plate/${plate}`, {
      params: parkingLotId ? { parkingLotId } : undefined,
    });
    return response?.data ?? response;
  },
};
