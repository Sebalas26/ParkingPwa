import { apiClient } from '../../../shared/api/apiClient';
import type { TicketDto, CheckInRequestDto, CheckOutRequestDto } from '../model/VehicleContracts';

export const vehicleService = {
  getActiveVehicles: async (): Promise<TicketDto[]> => {
    try {
      const tickets = await apiClient.get<TicketDto[]>('/Tickets/active');
      return tickets || [];
    } catch {
      return [];
    }
  },

  checkIn: async (request: CheckInRequestDto): Promise<TicketDto> => {
    return await apiClient.post<TicketDto>('/Tickets/check-in', request);
  },

  checkOut: async (request: CheckOutRequestDto): Promise<TicketDto> => {
    return await apiClient.post<TicketDto>('/Tickets/check-out', request);
  },

  getByTicketNumber: async (ticketNumber: string): Promise<TicketDto> => {
    return await apiClient.get<TicketDto>(`/Tickets/find/${encodeURIComponent(ticketNumber)}`);
  },
};
