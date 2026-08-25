import { apiClient } from '../../../shared/api/apiClient';
import type { DailySummaryDto, OccupancyStatsDto, RecentTicketDto } from '../model/DashboardContracts';

export const dashboardService = {
  getDailySummary: async (): Promise<DailySummaryDto> => {
    try {
      const summary = await apiClient.get<DailySummaryDto>('/Analytics/daily-summary');
      if (summary) {
        return summary;
      }
    } catch {
      // Fallback a objeto vacío
    }
    return {
      totalTickets: 0,
      activeTickets: 0,
      completedTickets: 0,
      totalRevenue: 0,
      averageDurationMinutes: 0,
      averageTicketAmount: 0,
      conveniosCount: 0,
      conveniosRevenue: 0,
      electronicInvoicesCount: 0,
      standardInvoicesCount: 0,
    };
  },

  getOccupancyStats: async (): Promise<OccupancyStatsDto> => {
    try {
      return await apiClient.get<OccupancyStatsDto>('/Analytics/occupancy');
    } catch {
      return {
        totalCapacity: 100,
        occupiedSpaces: 0,
        availableSpaces: 100,
        occupancyPercentage: 0,
      };
    }
  },

  getActiveTickets: async (): Promise<RecentTicketDto[]> => {
    try {
      const tickets = await apiClient.get<RecentTicketDto[]>('/Tickets/active');
      return tickets || [];
    } catch {
      return [];
    }
  },
};
