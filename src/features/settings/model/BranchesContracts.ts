export interface BranchDto {
  id: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  totalCapacity: number;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  // Campos auxiliares UI
  imageUrl?: string;
  isMainImage?: boolean;
  userBranches?: { userId: number; branchId: number; isDefault?: boolean }[];
  branchPaymentMethods?: BranchPaymentMethodDto[];
}

export interface CreateBranchDto {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  totalCapacity: number;
  notes?: string;
}

export interface UpdateBranchDto {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  totalCapacity: number;
  notes?: string;
  isActive: boolean;
}

export interface AssignUserBranchDto {
  userId: number;
  branchId: number;
  isDefault?: boolean;
}

export interface BranchPaymentMethodDto {
  branchId: number;
  paymentMethodId: number;
  isEnabled: boolean;
  name?: string;
  icon?: string;
  paymentMethod?: {
    id: number;
    name: string;
    icon?: string;
    isActive: boolean;
  };
}

export interface ConfigureBranchPaymentMethodsDto {
  branchId: number;
  paymentMethodIds: number[];
}
