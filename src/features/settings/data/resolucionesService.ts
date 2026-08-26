import { apiClient } from '../../../shared/api/apiClient';
import type { BillingResolutionDto, SaveBillingResolutionDto } from '../model/ResolucionesContracts';

export const resolucionesService = {
  getAllResolutions: async (branchId?: number): Promise<BillingResolutionDto[]> => {
    try {
      const url = branchId ? `/Resolutions?branchId=${branchId}` : '/Resolutions';
      const data = await apiClient.get<BillingResolutionDto[]>(url);
      return data || [];
    } catch (err) {
      console.error('Error al consultar resoluciones:', err);
      return [];
    }
  },

  getActiveResolutions: async (branchId?: number): Promise<BillingResolutionDto[]> => {
    try {
      const url = branchId ? `/Resolutions/active?branchId=${branchId}` : '/Resolutions/active';
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
