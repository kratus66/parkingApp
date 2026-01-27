export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  QR = 'QR',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PAID = 'PAID',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
  PARTIAL = 'PARTIAL',
}

export enum InvoiceStatus {
  ISSUED = 'ISSUED',
  VOIDED = 'VOIDED',
}

export interface PaymentItem {
  id?: string;
  paymentId?: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  receivedAmount?: number;
  changeAmount?: number;
}

export interface Payment {
  id: string;
  companyId: string;
  parkingLotId: string;
  parkingSessionId: string;
  customerId?: string;
  totalAmount: number;
  status: PaymentStatus;
  createdByUserId: string;
  voidedByUserId?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
  items?: PaymentItem[];
  customer?: any;
  parkingSession?: any;
  createdBy?: any;
  voidedBy?: any;
}

export interface CustomerInvoiceItem {
  id: string;
  customerInvoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CustomerInvoice {
  id: string;
  companyId: string;
  parkingLotId: string;
  parkingSessionId: string;
  customerId?: string;
  invoiceNumber: string;
  issuedAt: string;
  subtotal: number;
  discounts: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  voidedByUserId?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
  items?: CustomerInvoiceItem[];
  customer?: any;
  parkingSession?: any;
  voidedBy?: any;
}

export interface CheckoutPreview {
  sessionId: string;
  ticketNumber: string;
  entryAt: string;
  exitAt: string;
  totalMinutes: number;
  vehicleType: string;
  quote: any;
  total: number;
  customer?: any;
  vehicle?: any;
}

export interface CheckoutConfirmResponse {
  session: any;
  payment: Payment;
  invoice: CustomerInvoice;
  snapshot: any;
  printableInvoiceHtml: string;
}
