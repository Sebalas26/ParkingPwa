export interface CompanyDto {
  id: number;
  name: string;
  legalName?: string;
  nit: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  logo?: string;
  planType: string;
  maxBranches: number;
  isActive: boolean;
  subscriptionExpiresAt?: string;
  branchesCount: number;
  usersCount: number;
  createdAt: string;
}

export interface CreateCompanyDto {
  name: string;
  legalName?: string;
  nit: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  logo?: string;
  planType: string;
  maxBranches: number;
  subscriptionExpiresAt?: string;
  adminUsername: string;
  adminPassword: string;
  adminFullName: string;
  adminEmail: string;
  adminIdentificationNumber?: string;
  adminIdentificationTypeId?: number;
}

export interface UpdateCompanyDto {
  name: string;
  legalName?: string;
  nit: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  logo?: string;
  planType: string;
  maxBranches: number;
  isActive: boolean;
  subscriptionExpiresAt?: string;
}
