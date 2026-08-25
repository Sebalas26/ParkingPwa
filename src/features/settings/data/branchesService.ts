import { apiClient } from '../../../shared/api/apiClient';
import type {
  BranchDto,
  CreateBranchDto,
  UpdateBranchDto,
  AssignUserBranchDto,
  ConfigureBranchPaymentMethodsDto,
  BranchPaymentMethodDto,
} from '../model/BranchesContracts';

export const branchesService = {
  getAll: async (): Promise<BranchDto[]> => {
    try {
      const data = await apiClient.get<BranchDto[]>('/branches');
      return data || [];
    } catch (err) {
      console.warn('Error al consultar /api/branches:', err);
      return [];
    }
  },

  getActive: async (): Promise<BranchDto[]> => {
    try {
      const data = await apiClient.get<BranchDto[]>('/branches/active');
      return data || [];
    } catch (err) {
      console.warn('Error al consultar /api/branches/active:', err);
      return [];
    }
  },

  getById: async (id: number): Promise<BranchDto | null> => {
    try {
      return await apiClient.get<BranchDto>(`/branches/${id}`);
    } catch {
      return null;
    }
  },

  getByUser: async (userId: number): Promise<BranchDto[]> => {
    try {
      const data = await apiClient.get<BranchDto[]>(`/branches/user/${userId}`);
      return data || [];
    } catch {
      return [];
    }
  },

  create: async (dto: CreateBranchDto): Promise<BranchDto> => {
    return await apiClient.post<BranchDto>('/branches', dto);
  },

  update: async (id: number, dto: UpdateBranchDto): Promise<BranchDto> => {
    return await apiClient.put<BranchDto>(`/branches/${id}`, dto);
  },

  assignUser: async (dto: AssignUserBranchDto): Promise<{ message: string }> => {
    return await apiClient.post<{ message: string }>('/branches/assign-user', dto);
  },

  unassignUser: async (dto: AssignUserBranchDto): Promise<{ message: string }> => {
    return await apiClient.post<{ message: string }>('/branches/unassign-user', dto);
  },

  getPaymentMethods: async (branchId: number): Promise<BranchPaymentMethodDto[]> => {
    try {
      const data = await apiClient.get<BranchPaymentMethodDto[]>(`/branches/${branchId}/payment-methods`);
      return data || [];
    } catch {
      return [];
    }
  },

  configurePaymentMethods: async (dto: ConfigureBranchPaymentMethodsDto): Promise<{ message: string }> => {
    return await apiClient.post<{ message: string }>('/branches/configure-payment-methods', dto);
  },
};
