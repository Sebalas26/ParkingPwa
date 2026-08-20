export interface DailySummaryDto {
  totalRevenueToday?: number;
  activeVehiclesCount?: number;
  completedTransactionsToday?: number;
  averageDurationMinutes?: number;
  revenueByVehicleType?: Record<string, number>;
  countByVehicleType?: Record<string, number>;
  // Fallbacks legacy
  totalTickets?: number;
  activeTickets?: number;
  completedTickets?: number;
  totalRevenue?: number;
}

export interface OccupancyStatsDto {
  totalCapacity: number;
  occupiedSpots?: number;
  availableSpots?: number;
  occupancyRate?: number;
  occupancyByType?: Record<string, number>;
  // Fallbacks
  occupiedSpaces?: number;
  availableSpaces?: number;
  occupancyPercentage?: number;
}

export interface RecentTicketDto {
  ticketId: string;
  ticketNumber: string;
  plateNumber: string;
  vehicleType: number | string;
  entryTimeUtc: string;
  status: number | string;
  hourlyRate?: number;
}
