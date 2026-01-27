import axios from 'axios';
import {
  PaymentItem,
  Payment,
  CustomerInvoice,
  CheckoutPreview,
  CheckoutConfirmResponse,
} from '@/types/checkout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const checkoutApi = {
  /**
   * Preview de checkout
   */
  async preview(sessionId: string, lostTicket = false): Promise<CheckoutPreview> {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/checkout/preview`,
      { sessionId, lostTicket },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  /**
   * Confirmar checkout
   */
  async confirm(
    sessionId: string,
    paymentItems: PaymentItem[],
    lostTicket = false,
  ): Promise<CheckoutConfirmResponse> {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/checkout/confirm`,
      { sessionId, paymentItems, lostTicket },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  /**
   * Listar facturas
   */
  async getInvoices(filters?: {
    parkingLotId?: string;
    from?: string;
    to?: string;
    status?: string;
    search?: string;
  }): Promise<CustomerInvoice[]> {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filters?.parkingLotId) params.append('parkingLotId', filters.parkingLotId);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await axios.get(`${API_URL}/checkout/invoices?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Obtener factura por ID
   */
  async getInvoice(id: string): Promise<CustomerInvoice> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/checkout/invoices/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Anular factura
   */
  async voidInvoice(id: string, reason: string): Promise<CustomerInvoice> {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/checkout/invoices/${id}/void`,
      { reason },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  /**
   * Obtener HTML de factura
   */
  getInvoiceHtmlUrl(id: string): string {
    return `${API_URL}/checkout/invoices/${id}/html`;
  },

  /**
   * Registrar impresión
   */
  async logPrint(id: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_URL}/checkout/invoices/${id}/print`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
};

export const paymentsApi = {
  /**
   * Listar pagos
   */
  async getPayments(filters?: {
    parkingLotId?: string;
    from?: string;
    to?: string;
    status?: string;
  }): Promise<Payment[]> {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filters?.parkingLotId) params.append('parkingLotId', filters.parkingLotId);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.status) params.append('status', filters.status);

    const response = await axios.get(`${API_URL}/payments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Obtener pago por ID
   */
  async getPayment(id: string): Promise<Payment> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Anular pago
   */
  async voidPayment(id: string, reason: string): Promise<Payment> {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/payments/${id}/void`,
      { reason },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  /**
   * Estadísticas de pagos
   */
  async getStats(filters?: {
    parkingLotId?: string;
    from?: string;
    to?: string;
  }): Promise<any> {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filters?.parkingLotId) params.append('parkingLotId', filters.parkingLotId);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);

    const response = await axios.get(`${API_URL}/payments/stats?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
