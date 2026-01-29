import axios from 'axios';
import type { CashMovement, CreateMovementDto } from '../types/cash';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const movementsApi = {
  /**
   * Registrar movimiento de caja
   */
  async create(dto: CreateMovementDto): Promise<CashMovement> {
    const response = await axios.post<{data: CashMovement}>(
      `${API_URL}/cash/movements`,
      dto,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data.data;
  },

  /**
   * Listar movimientos de un turno
   */
  async findByShift(cashShiftId: string): Promise<CashMovement[]> {
    const response = await axios.get<{data: CashMovement[]}>(`${API_URL}/cash/movements`, {
      params: { cashShiftId },
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /**
   * Eliminar movimiento (solo SUPERVISOR/ADMIN)
   */
  async delete(id: string, reason: string): Promise<void> {
    await axios.delete(`${API_URL}/cash/movements/${id}`, {
      params: { reason },
      headers: getAuthHeaders(),
    });
  },
};
