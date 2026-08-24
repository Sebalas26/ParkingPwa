import { apiClient } from '../../../shared/api/apiClient';
import type { PaymentMethodDto, SavePaymentMethodDto } from '../model/MediosPagoContracts';

export const mediosPagoService = {
  getPaymentMethods: async (): Promise<PaymentMethodDto[]> => {
    try {
      const data = await apiClient.get<PaymentMethodDto[]>('/PaymentMethod/GetPaymentMethods');
      return data || [];
    } catch {
      try {
        const fallback = await apiClient.get<PaymentMethodDto[]>('/PaymentMethod');
        return fallback || [];
      } catch {
        return [];
      }
    }
  },

  getPaymentMethodById: async (id: number): Promise<PaymentMethodDto | null> => {
    return await apiClient.get<PaymentMethodDto>(`/PaymentMethod/${id}`);
  },

  createOrEditPaymentMethod: async (dto: SavePaymentMethodDto): Promise<PaymentMethodDto> => {
    return await apiClient.post<PaymentMethodDto>('/PaymentMethod/CreateOrEditPaymentMethod', dto);
  },
};
