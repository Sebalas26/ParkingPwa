import { apiClient } from '../../../shared/api/apiClient';
import type {
  VehicleIncidentDto,
  SaveVehicleIncidentDto,
  PlateCheckResultDto,
  ResolveIncidentDto,
} from '../model/NovedadesContracts';

export const novedadesService = {
  getAllIncidents: async (params?: {
    branchId?: number;
    status?: string;
    isBlocked?: boolean;
    search?: string;
  }): Promise<VehicleIncidentDto[]> => {
    try {
      const queryParts: string[] = [];
      if (params?.branchId) queryParts.push(`branchId=${params.branchId}`);
      if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params?.isBlocked !== undefined) queryParts.push(`isBlocked=${params.isBlocked}`);
      if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);

      const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const data = await apiClient.get<VehicleIncidentDto[]>(`/VehicleIncidents${queryStr}`);
      return data || [];
    } catch (err) {
      console.error('Error al consultar novedades:', err);
      return [];
    }
  },

  getIncidentById: async (id: string): Promise<VehicleIncidentDto | null> => {
    return await apiClient.get<VehicleIncidentDto>(`/VehicleIncidents/${id}`);
  },

  checkPlate: async (plate: string, branchId?: number): Promise<PlateCheckResultDto> => {
    try {
      const url = branchId
        ? `/VehicleIncidents/check-plate/${encodeURIComponent(plate)}?branchId=${branchId}`
        : `/VehicleIncidents/check-plate/${encodeURIComponent(plate)}`;
      const result = await apiClient.get<PlateCheckResultDto>(url);
      return (
        result || {
          plateNumber: plate,
          hasIncidents: false,
          isBlocked: false,
        }
      );
    } catch {
      return {
        plateNumber: plate,
        hasIncidents: false,
        isBlocked: false,
      };
    }
  },

  createIncident: async (dto: SaveVehicleIncidentDto): Promise<VehicleIncidentDto> => {
    return await apiClient.post<VehicleIncidentDto>('/VehicleIncidents', dto);
  },

  updateIncident: async (id: string, dto: SaveVehicleIncidentDto): Promise<VehicleIncidentDto> => {
    return await apiClient.put<VehicleIncidentDto>(`/VehicleIncidents/${id}`, dto);
  },

  resolveIncident: async (id: string, dto: ResolveIncidentDto): Promise<boolean> => {
    try {
      await apiClient.post(`/VehicleIncidents/${id}/resolve`, dto);
      return true;
    } catch {
      return false;
    }
  },

  deleteIncident: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/VehicleIncidents/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
