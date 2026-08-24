import { apiClient } from '../../../shared/api/apiClient';
import type { CommercialAgreementDto, SaveCommercialAgreementDto, StoreDto } from '../model/ConveniosContracts';

export const conveniosService = {
  getAllAgreements: async (): Promise<CommercialAgreementDto[]> => {
    try {
      const data = await apiClient.get<CommercialAgreementDto[]>('/Agreements');
      return data || [];
    } catch {
      return [];
    }
  },

  getAgreementById: async (id: string): Promise<CommercialAgreementDto | null> => {
    return await apiClient.get<CommercialAgreementDto>(`/Agreements/${id}`);
  },

  getStores: async (): Promise<StoreDto[]> => {
    try {
      const data = await apiClient.get<StoreDto[]>('/Stores');
      return data || [];
    } catch {
      return [];
    }
  },

  createStore: async (store: { name: string; contactPhone?: string; email?: string }): Promise<StoreDto> => {
    return await apiClient.post<StoreDto>('/Stores', store);
  },

  createAgreement: async (agreement: SaveCommercialAgreementDto): Promise<CommercialAgreementDto> => {
    return await apiClient.post<CommercialAgreementDto>('/Agreements', agreement);
  },

  updateAgreement: async (id: string, agreement: SaveCommercialAgreementDto): Promise<CommercialAgreementDto> => {
    return await apiClient.put<CommercialAgreementDto>(`/Agreements/${id}`, agreement);
  },
};
