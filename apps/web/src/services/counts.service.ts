import axios from 'axios';
import type { CashCount, CreateCountDto } from '../types/cash';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const countsApi = {
  /**
   * Registrar/actualizar conteo de arqueo (upsert)
   */
  async upsert(dto: CreateCountDto): Promise<CashCount> {
    const response = await axios.post<CashCount>(
      `${API_URL}/cash/counts`,
      dto,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Listar conteos de un turno
   */
  async findByShift(cashShiftId: string): Promise<CashCount[]> {
    const response = await axios.get<CashCount[]>(`${API_URL}/cash/counts`, {
      params: { cashShiftId },
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};
