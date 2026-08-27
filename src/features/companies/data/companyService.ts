import { apiClient } from '../../../shared/api/apiClient';
import type { CompanyDto, CreateCompanyDto, UpdateCompanyDto } from '../model/CompanyContracts';

export const companyService = {
  getAll: async (): Promise<CompanyDto[]> => {
    const data = await apiClient.get<CompanyDto[]>('/Companies');
    return Array.isArray(data) ? data : [];
  },

  getActive: async (): Promise<CompanyDto[]> => {
    const data = await apiClient.get<CompanyDto[]>('/Companies/active');
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: number): Promise<CompanyDto | null> => {
    return await apiClient.get<CompanyDto>(`/Companies/${id}`);
  },

  create: async (dto: CreateCompanyDto): Promise<CompanyDto> => {
    return await apiClient.post<CompanyDto>('/Companies', dto);
  },

  update: async (id: number, dto: UpdateCompanyDto): Promise<CompanyDto> => {
    return await apiClient.put<CompanyDto>(`/Companies/${id}`, dto);
  },

  toggleStatus: async (id: number): Promise<{ message: string }> => {
    return await apiClient.patch<{ message: string }>(`/Companies/${id}/toggle-status`, {});
  },
};
