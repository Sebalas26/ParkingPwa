export interface TicketDto {
  ticketId: string;
  ticketNumber: string;
  plateNumber: string;
  vehicleType: number | string;
  customerPhone?: string | null;
  notes?: string | null;
  entryTimeUtc: string;
  exitTimeUtc?: string | null;
  totalDurationMinutes: number;
  hourlyRate: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  amountPaid: number;
  changeGiven: number;
  paymentMethod?: number | string | null;
  status: number | string;
  operatorName: string;
}

export interface CheckInRequestDto {
  plateNumber: string;
  vehicleType: number;
  phoneNumber?: string;
  notes?: string;
  operatorName?: string;
}

export interface CheckOutRequestDto {
  ticketId: string;
  paymentMethod: number;
  amountPaid: number;
  storeId?: string | null;
  agreementId?: string | null;
  invoiceNumber?: string | null;
  purchaseAmount?: number | null;
  discountAmount?: number;
}
