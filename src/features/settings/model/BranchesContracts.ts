export interface BranchDto {
  id: number;
  companyId?: number;
  companyName?: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  totalCapacity: number;
  notes?: string;
  logoBase64?: string;
  isActive: boolean;
  createdAt?: string;
  // Campos auxiliares UI
  imageUrl?: string;
  isMainImage?: boolean;
  userBranches?: { userId: number; branchId: number; isDefault?: boolean }[];
  branchPaymentMethods?: BranchPaymentMethodDto[];
}

export interface CreateBranchDto {
  companyId?: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  totalCapacity: number;
  notes?: string;
  logoBase64?: string;
}

export interface UpdateBranchDto {
  companyId?: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  totalCapacity: number;
  notes?: string;
  logoBase64?: string;
  isActive: boolean;
}

export interface AssignUserBranchDto {
  userId: number;
  branchId: number;
  isDefault?: boolean;
}

export interface BranchPaymentMethodDto {
  id: number;
  branchId: number;
  paymentMethodId: number;
  paymentMethodName?: string;
  paymentMethodIcon?: string;
  requiresCashTender: boolean;
  isActive: boolean;
  // Fallbacks de compatibilidad
  isEnabled?: boolean;
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
