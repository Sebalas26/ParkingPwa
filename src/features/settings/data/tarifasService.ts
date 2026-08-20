import { apiClient } from '../../../shared/api/apiClient';
import type { VehicleRateDto, UpdateVehicleRateDto } from '../model/TarifasContracts';

export const tarifasService = {
  getAllRates: async (): Promise<VehicleRateDto[]> => {
    try {
      const data = await apiClient.get<VehicleRateDto[]>('/VehicleRates');
      return data || [];
    } catch {
      return [];
    }
  },

  getRateById: async (id: string): Promise<VehicleRateDto | null> => {
    return await apiClient.get<VehicleRateDto>(`/VehicleRates/${id}`);
  },

  updateRate: async (id: string, rate: UpdateVehicleRateDto): Promise<VehicleRateDto> => {
    return await apiClient.put<VehicleRateDto>(`/VehicleRates/${id}`, rate);
  },
};
