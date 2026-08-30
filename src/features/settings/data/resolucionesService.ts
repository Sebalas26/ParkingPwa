import { apiClient } from '../../../shared/api/apiClient';
import type { BillingResolutionDto, SaveBillingResolutionDto } from '../model/ResolucionesContracts';

export const resolucionesService = {
  getAllResolutions: async (branchId?: number, companyId?: number): Promise<BillingResolutionDto[]> => {
    try {
      let url = '/Resolutions';
      const params: string[] = [];
      if (branchId) params.push(`branchId=${branchId}`);
      if (companyId) params.push(`companyId=${companyId}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      const data = await apiClient.get<BillingResolutionDto[]>(url);
      return data || [];
    } catch (err) {
      console.error('Error al consultar resoluciones:', err);
      return [];
    }
  },

  getActiveResolutions: async (branchId?: number, companyId?: number): Promise<BillingResolutionDto[]> => {
    try {
      let url = '/Resolutions/active';
      const params: string[] = [];
      if (branchId) params.push(`branchId=${branchId}`);
      if (companyId) params.push(`companyId=${companyId}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      const data = await apiClient.get<BillingResolutionDto[]>(url);
      return data || [];
    } catch (err) {
      console.error('Error al consultar resoluciones activas:', err);
      return [];
    }
  },

  getResolutionById: async (id: string): Promise<BillingResolutionDto | null> => {
    return await apiClient.get<BillingResolutionDto>(`/Resolutions/${id}`);
  },

  createResolution: async (dto: SaveBillingResolutionDto): Promise<BillingResolutionDto> => {
    return await apiClient.post<BillingResolutionDto>('/Resolutions', dto);
  },

  updateResolution: async (id: string, dto: SaveBillingResolutionDto): Promise<BillingResolutionDto> => {
    return await apiClient.put<BillingResolutionDto>(`/Resolutions/${id}`, dto);
  },

  deactivateResolution: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/Resolutions/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
