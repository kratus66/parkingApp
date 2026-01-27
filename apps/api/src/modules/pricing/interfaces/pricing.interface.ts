export interface PricingQuoteInput {
  companyId: string;
  parkingLotId: string;
  vehicleType: string; // VehicleType enum value
  entryAt: Date;
  exitAt: Date;
  options?: {
    lostTicket?: boolean;
    overrideDayType?: string;
    applyGrace?: boolean;
    applyDailyMax?: boolean;
  };
}

export interface PricingSegment {
  from: Date;
  to: Date;
  dayType: string; // WEEKDAY | WEEKEND | HOLIDAY
  period: string; // DAY | NIGHT
  unit: string; // billing unit
  unitsBilled: number;
  unitPrice: number;
  subtotal: number;
  ruleId: string;
}

export interface PricingQuoteOutput {
  total: number; // COP
  currency: string;
  breakdown: {
    totalMinutes: number;
    billableMinutes: number;
    graceAppliedMinutes: number;
    segments: PricingSegment[];
    dailyMaxApplied: boolean;
    dailyMaxAmount?: number;
    lostTicketFeeApplied: boolean;
    lostTicketFeeAmount?: number;
    ruleIdsUsed: string[];
  };
  debug: {
    warnings: string[];
  };
}
