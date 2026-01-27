// Enums
export enum CashShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}

export enum CashMovementType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum CashMovementCategory {
  SUPPLIES = 'SUPPLIES',
  MAINTENANCE = 'MAINTENANCE',
  PETTY_CASH = 'PETTY_CASH',
  OTHER = 'OTHER',
}

export enum CashCountMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  QR = 'QR',
  OTHER = 'OTHER',
}

// Cash Shift
export interface CashShift {
  id: string;
  companyId: string;
  parkingLotId: string;
  cashierUserId: string;
  openedAt: string;
  closedAt: string | null;
  status: CashShiftStatus;
  openingFloat: number;
  openingNotes: string | null;
  closingNotes: string | null;
  expectedTotal: number;
  countedTotal: number | null;
  difference: number | null;
  requireSupervisorApproval: boolean;
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
  parkingLot?: {
    id: string;
    name: string;
  };
}

// Cash Movement
export interface CashMovement {
  id: string;
  companyId: string;
  parkingLotId: string;
  cashShiftId: string;
  type: CashMovementType;
  category: CashMovementCategory;
  amount: number;
  description: string;
  reference: string | null;
  createdByUserId: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

// Cash Count
export interface CashDenomination {
  value: number;
  qty: number;
}

export interface CashCountDetails {
  denominations?: CashDenomination[];
  coinsTotal?: number;
  notes?: string;
}

export interface CashCount {
  id: string;
  companyId: string;
  parkingLotId: string;
  cashShiftId: string;
  method: CashCountMethod;
  countedAmount: number;
  details: CashCountDetails | null;
  createdByUserId: string;
  createdAt: string;
}

// Cash Policy
export interface CashPolicy {
  id: string;
  companyId: string;
  parkingLotId: string;
  requireOpenShiftForCheckout: boolean;
  defaultShiftHours: number;
  allowMultipleOpenShiftsPerCashier: boolean;
  allowMultipleOpenShiftsPerParkingLot: boolean;
  createdAt: string;
  updatedAt: string;
}

// DTOs
export interface OpenShiftDto {
  parkingLotId: string;
  openingFloat: number;
  openingNotes?: string;
}

export interface CloseShiftDto {
  closingNotes?: string;
}

export interface CreateMovementDto {
  cashShiftId: string;
  type: CashMovementType;
  category: CashMovementCategory;
  amount: number;
  description: string;
  reference?: string;
}

export interface CreateCountDto {
  cashShiftId: string;
  method: CashCountMethod;
  countedAmount: number;
  details?: CashCountDetails;
}

export interface UpdatePolicyDto {
  requireOpenShiftForCheckout?: boolean;
  defaultShiftHours?: number;
  allowMultipleOpenShiftsPerCashier?: boolean;
  allowMultipleOpenShiftsPerParkingLot?: boolean;
}

// Shift Summary
export interface ShiftSummary {
  shift: {
    id: string;
    openedAt: string;
    closedAt: string | null;
    status: CashShiftStatus;
    openingFloat: number;
    openingNotes: string | null;
    closingNotes: string | null;
    expectedTotal: number;
    countedTotal: number | null;
    difference: number | null;
    cashier: {
      id: string;
      name: string;
      email: string;
    } | null;
    parkingLot: {
      id: string;
      name: string;
    } | null;
  };
  totals: {
    totalPayments: number;
    paymentsCount: number;
    totalIncome: number;
    totalExpenses: number;
    expectedTotal: number;
    countedTotal: number;
    difference: number;
  };
  payments: any[]; // Puede ser tipado mejor según tu entidad Payment
  movements: CashMovement[];
  counts: CashCount[];
}
