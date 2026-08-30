import { apiClient } from '../../../shared/api/apiClient';
import type { PaymentMethodDto, SavePaymentMethodDto } from '../model/MediosPagoContracts';

export const mediosPagoService = {
  getPaymentMethods: async (companyId?: number): Promise<PaymentMethodDto[]> => {
    try {
      const url = companyId ? `/PaymentMethod/GetPaymentMethods?companyId=${companyId}` : '/PaymentMethod/GetPaymentMethods';
      const data = await apiClient.get<PaymentMethodDto[]>(url);
      const active = (data || []).filter((m) => m.isActive ?? true);
      return active;
    } catch {
      try {
        const urlFallback = companyId ? `/PaymentMethod?companyId=${companyId}` : '/PaymentMethod';
        const fallback = await apiClient.get<PaymentMethodDto[]>(urlFallback);
        const active = (fallback || []).filter((m) => m.isActive ?? true);
        return active;
      } catch {
        return [];
      }
    }
  },

  getMediosPago: async (companyId?: number): Promise<PaymentMethodDto[]> => {
    return await mediosPagoService.getPaymentMethods(companyId);
  },

  getPaymentMethodById: async (id: number): Promise<PaymentMethodDto | null> => {
    return await apiClient.get<PaymentMethodDto>(`/PaymentMethod/${id}`);
  },

  createOrEditPaymentMethod: async (dto: SavePaymentMethodDto & { companyId?: number }): Promise<PaymentMethodDto> => {
    return await apiClient.post<PaymentMethodDto>('/PaymentMethod/CreateOrEditPaymentMethod', dto);
  },
};
