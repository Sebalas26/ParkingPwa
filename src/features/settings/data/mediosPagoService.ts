import { apiClient } from '../../../shared/api/apiClient';
import type { PaymentMethodDto, SavePaymentMethodDto } from '../model/MediosPagoContracts';

export const mediosPagoService = {
  getPaymentMethods: async (): Promise<PaymentMethodDto[]> => {
    try {
      const data = await apiClient.get<PaymentMethodDto[]>('/PaymentMethod/GetPaymentMethods');
      const active = (data || []).filter((m) => m.isActive ?? true);
      return active;
    } catch {
      try {
        const fallback = await apiClient.get<PaymentMethodDto[]>('/PaymentMethod');
        const active = (fallback || []).filter((m) => m.isActive ?? true);
        return active;
      } catch {
        return [];
      }
    }
  },

  getMediosPago: async (): Promise<PaymentMethodDto[]> => {
    return await mediosPagoService.getPaymentMethods();
  },

  getPaymentMethodById: async (id: number): Promise<PaymentMethodDto | null> => {
    return await apiClient.get<PaymentMethodDto>(`/PaymentMethod/${id}`);
  },

  createOrEditPaymentMethod: async (dto: SavePaymentMethodDto): Promise<PaymentMethodDto> => {
    return await apiClient.post<PaymentMethodDto>('/PaymentMethod/CreateOrEditPaymentMethod', dto);
  },
};
