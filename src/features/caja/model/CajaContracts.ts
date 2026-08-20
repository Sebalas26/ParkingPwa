export interface WorkShiftDto {
  shiftId: string;
  userId: number;
  operatorName: string;
  startTimeUtc?: string;
  endTimeUtc?: string | null;
  baseAmount?: number;
  totalCashCollected?: number;
  totalCardCollected?: number;
  totalTransferCollected?: number;
  totalDiscounts?: number;
  expectedCash?: number;
  actualCashCounted?: number | null;
  cashDifference?: number;
  totalTicketsProcessed?: number;
  totalVehiclesEntered?: number;
  status: 'Open' | 'Closed' | 'Cancelled' | number;
  notes?: string | null;
  createdAtUtc?: string;
  closedAtUtc?: string | null;
  // Fallbacks legacy
  openedAtUtc?: string;
  initialCashAmount?: number;
  finalCashAmount?: number | null;
  totalCollected?: number;
}

export interface OpenShiftRequestDto {
  baseAmount: number;
  notes?: string;
}

export interface CloseShiftRequestDto {
  shiftId: string;
  actualCashCounted: number;
  notes?: string;
  // Fallback
  actualCashAmount?: number;
}

export interface ShiftSummaryDto {
  shiftId: string;
  userId?: number;
  operatorName: string;
  startTimeUtc?: string;
  endTimeUtc?: string | null;
  baseAmount: number;
  totalCashCollected: number;
  totalCardCollected: number;
  totalTransferCollected: number;
  totalDiscounts?: number;
  expectedCash?: number;
  actualCashCounted?: number;
  cashDifference?: number;
  totalTicketsProcessed: number;
  totalVehiclesEntered?: number;
  status?: number | string;
  notes?: string;
  // Fallbacks
  openedAtUtc?: string;
  initialCashAmount?: number;
  totalRevenue?: number;
  calculatedCashInDrawer?: number;
}
