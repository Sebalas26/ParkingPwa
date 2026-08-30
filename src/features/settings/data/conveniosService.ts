import { apiClient } from '../../../shared/api/apiClient';
import type { CommercialAgreementDto, SaveCommercialAgreementDto, StoreDto, SaveStoreDto } from '../model/ConveniosContracts';

export const conveniosService = {
  getAllAgreements: async (companyId?: number): Promise<CommercialAgreementDto[]> => {
    try {
      const url = companyId ? `/Agreements?companyId=${companyId}` : '/Agreements';
      const data = await apiClient.get<CommercialAgreementDto[]>(url);
      return data || [];
    } catch (err) {
      console.error('Error al consultar convenios:', err);
      return [];
    }
  },

  getAgreementById: async (id: string): Promise<CommercialAgreementDto | null> => {
    return await apiClient.get<CommercialAgreementDto>(`/Agreements/${id}`);
  },

  createAgreement: async (agreement: SaveCommercialAgreementDto, companyId?: number): Promise<CommercialAgreementDto> => {
    let storeId = agreement.storeId;
    if (!storeId) {
      try {
        const stores = await conveniosService.getStores(companyId);
        if (stores && stores.length > 0) {
          storeId = stores[0].storeId;
        } else {
          const newStore = await apiClient.post<StoreDto>('/Stores', {
            name: 'Aliado Comercial General',
            taxId: 'ALIADO-GEN',
            phoneNumber: '',
            isActive: true,
            companyId: companyId,
          });
          storeId = newStore.storeId;
        }
      } catch {
        // Fallback
      }
    }
    return await apiClient.post<CommercialAgreementDto>('/Agreements', { ...agreement, storeId });
  },

  updateAgreement: async (id: string, agreement: SaveCommercialAgreementDto, companyId?: number): Promise<CommercialAgreementDto> => {
    let storeId = agreement.storeId;
    if (!storeId) {
      try {
        const stores = await conveniosService.getStores(companyId);
        if (stores && stores.length > 0) {
          storeId = stores[0].storeId;
        }
      } catch {
        // Fallback
      }
    }
    return await apiClient.put<CommercialAgreementDto>(`/Agreements/${id}`, { ...agreement, storeId });
  },

  deactivateAgreement: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/Agreements/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  getStores: async (companyId?: number): Promise<StoreDto[]> => {
    try {
      const url = companyId ? `/Stores?companyId=${companyId}` : '/Stores';
      const data = await apiClient.get<StoreDto[]>(url);
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
