const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

export const parkingSessionsApi = {
  getActiveSessions: async (params: { search?: string; parkingLotId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.parkingLotId) queryParams.append('parkingLotId', params.parkingLotId);

    const response = await fetch(
      `${API_URL}/parking-sessions/active?${queryParams.toString()}`,
      {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch active sessions');
    const data = await response.json();
    return data.data || [];
  },

  getSession: async (id: string) => {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/parking-sessions/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Failed to fetch session');
    return response.json();
  },

  getSessionByTicket: async (ticketNumber: string) => {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL}/parking-sessions/by-ticket/${ticketNumber}`,
      {
        credentials: 'include',
      }
    );

    if (!response.ok) throw new Error('Failed to fetch session');
    return response.json();
  },

  getSessionByPlate: async (plate: string, parkingLotId?: string) => {
    const queryParams = new URLSearchParams();
    if (parkingLotId) queryParams.append('parkingLotId', parkingLotId);

    const response = await fetch(
      `${NEXT_PUBLIC_API_URL}/parking-sessions/by-plate/${plate}?${queryParams.toString()}`,
      {
        credentials: 'include',
      }
    );

    if (!response.ok) throw new Error('Failed to fetch session');
    const data = await response.json();
    return data;
  },
};
