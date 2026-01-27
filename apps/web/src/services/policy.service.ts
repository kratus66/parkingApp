import axios from 'axios';
import type { CashPolicy, UpdatePolicyDto } from '../types/cash';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const policyApi = {
  /**
   * Obtener política de caja
   */
  async get(parkingLotId: string): Promise<CashPolicy | null> {
    const response = await axios.get<CashPolicy | null>(`${API_URL}/cash/policy`, {
      params: { parkingLotId },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Crear/actualizar política de caja (upsert)
   */
  async upsert(parkingLotId: string, dto: UpdatePolicyDto): Promise<CashPolicy> {
    const response = await axios.put<CashPolicy>(
      `${API_URL}/cash/policy`,
      dto,
      {
        params: { parkingLotId },
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },
};
