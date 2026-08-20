import { apiClient } from '../../../shared/api/apiClient';
import type {
  WorkShiftDto,
  OpenShiftRequestDto,
  CloseShiftRequestDto,
  ShiftSummaryDto,
} from '../model/CajaContracts';

export const cajaService = {
  getActiveShift: async (userId?: number): Promise<WorkShiftDto | null> => {
    try {
      return await apiClient.get<WorkShiftDto>('/Shifts/active', { userId });
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      return null;
    }
  },

  openShift: async (request: OpenShiftRequestDto): Promise<WorkShiftDto> => {
    return await apiClient.post<WorkShiftDto>('/Shifts/open', {
      baseAmount: Number(request.baseAmount),
      notes: request.notes || undefined,
    });
  },

  closeShift: async (request: CloseShiftRequestDto): Promise<WorkShiftDto> => {
    return await apiClient.post<WorkShiftDto>('/Shifts/close', {
      shiftId: request.shiftId,
      actualCashCounted: Number(request.actualCashCounted ?? request.actualCashAmount ?? 0),
      notes: request.notes || undefined,
    });
  },

  getShiftSummary: async (shiftId: string): Promise<ShiftSummaryDto> => {
    return await apiClient.get<ShiftSummaryDto>(`/Shifts/summary/${shiftId}`);
  },

  getHistory: async (fromDate?: string, toDate?: string): Promise<WorkShiftDto[]> => {
    try {
      const data = await apiClient.get<WorkShiftDto[]>('/Shifts/history', { fromDate, toDate });
      return data || [];
    } catch {
      return [];
    }
  },
};
