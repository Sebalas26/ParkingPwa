import { apiClient } from '../../../shared/api/apiClient';
import type { CommercialAgreementDto, SaveCommercialAgreementDto } from '../model/ConveniosContracts';

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

  createAgreement: async (agreement: SaveCommercialAgreementDto): Promise<CommercialAgreementDto> => {
    return await apiClient.post<CommercialAgreementDto>('/Agreements', agreement);
  },

  updateAgreement: async (id: string, agreement: SaveCommercialAgreementDto): Promise<CommercialAgreementDto> => {
    return await apiClient.put<CommercialAgreementDto>(`/Agreements/${id}`, agreement);
  },
};
