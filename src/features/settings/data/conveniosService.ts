import { apiClient } from '../../../shared/api/apiClient';
import type { CommercialAgreementDto, SaveCommercialAgreementDto, StoreDto, SaveStoreDto } from '../model/ConveniosContracts';

export const conveniosService = {
  getAllAgreements: async (): Promise<CommercialAgreementDto[]> => {
    try {
      const data = await apiClient.get<CommercialAgreementDto[]>('/Agreements');
      return data || [];
    } catch (err) {
      console.error('Error al consultar convenios:', err);
      return [];
    }
  },

  getAgreementById: async (id: string): Promise<CommercialAgreementDto | null> => {
    return await apiClient.get<CommercialAgreementDto>(`/Agreements/${id}`);
  },

  createAgreement: async (agreement: SaveCommercialAgreementDto): Promise<CommercialAgreementDto> => {
    return await apiClient.post<CommercialAgreementDto>('/Agreements', agreement);
  },

  updateAgreement: async (id: string, agreement: SaveCommercialAgreementDto): Promise<CommercialAgreementDto> => {
    return await apiClient.put<CommercialAgreementDto>(`/Agreements/${id}`, agreement);
  },

  deactivateAgreement: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/Agreements/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  getStores: async (): Promise<StoreDto[]> => {
    try {
      const data = await apiClient.get<StoreDto[]>('/Stores');
      return data || [];
    } catch (err) {
      console.error('Error al consultar comercios:', err);
      return [];
    }
  },

  createStore: async (store: SaveStoreDto): Promise<StoreDto> => {
    return await apiClient.post<StoreDto>('/Stores', store);
  },

  updateStore: async (id: string, store: SaveStoreDto): Promise<StoreDto> => {
    return await apiClient.put<StoreDto>(`/Stores/${id}`, store);
  },

  deactivateStore: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/Stores/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
