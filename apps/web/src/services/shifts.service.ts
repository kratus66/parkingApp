import axios from 'axios';
import type {
  CashShift,
  CashShiftStatus,
  OpenShiftDto,
  CloseShiftDto,
  ShiftSummary,
} from '../types/cash';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const shiftsApi = {
  /**
   * Abrir turno de caja
   */
  async open(dto: OpenShiftDto): Promise<CashShift> {
    const response = await axios.post<CashShift>(
      `${API_URL}/cash/shifts/open`,
      dto,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Obtener turno actual abierto
   */
  async getCurrent(parkingLotId: string): Promise<CashShift | null> {
    const response = await axios.get<CashShift | null>(
      `${API_URL}/cash/shifts/current`,
      {
        params: { parkingLotId },
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Cerrar turno de caja
   */
  async close(shiftId: string, dto: CloseShiftDto): Promise<CashShift> {
    const response = await axios.post<CashShift>(
      `${API_URL}/cash/shifts/${shiftId}/close`,
      dto,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Listar turnos con filtros
   */
  async findAll(params?: {
    parkingLotId?: string;
    status?: CashShiftStatus;
    cashierUserId?: string;
    from?: string;
    to?: string;
  }): Promise<CashShift[]> {
    const response = await axios.get<CashShift[]>(`${API_URL}/cash/shifts`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Obtener resumen detallado de turno
   */
  async getSummary(shiftId: string): Promise<ShiftSummary> {
    const response = await axios.get<ShiftSummary>(
      `${API_URL}/cash/shifts/${shiftId}/summary`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },
};
