import { apiClient } from '../../../shared/api/apiClient';
import type { ReportTicketDto, ReportSummaryDto } from '../model/ReportContracts';

export const reportsService = {
  getTicketsReport: async (date?: string): Promise<ReportTicketDto[]> => {
    try {
      const data = await apiClient.get<ReportTicketDto[]>('/Tickets/history', { date });
      return data || [];
    } catch {
      return [];
    }
  },

  getDailySummary: async (): Promise<ReportSummaryDto> => {
    try {
      const summary = await apiClient.get<any>('/Analytics/daily-summary');
      return {
        periodo: 'Hoy',
        totalVehiculos: summary?.totalTickets || 0,
        totalIngresos: summary?.totalRevenue || 0,
      };
    } catch {
      return {
        periodo: 'Hoy',
        totalVehiculos: 0,
        totalIngresos: 0,
      };
    }
  },
};
