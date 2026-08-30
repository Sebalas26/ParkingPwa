export interface BillingResolutionDto {
  resolutionId: string;
  companyId?: number | null;
  branchId?: number | null;
  branchName?: string | null;
  name: string;
  documentType: string;
  prefix: string;
  resolutionNumber: string;
  fromNumber: number;
  toNumber: number;
  currentNumber: number;
  validFrom: string;
  validTo: string;
  technicalKey?: string | null;
  isActive: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string | null;
}

export interface SaveBillingResolutionDto {
  resolutionId?: string;
  companyId?: number | null;
  branchId?: number | null;
  name: string;
  documentType: string;
  prefix: string;
  resolutionNumber: string;
  fromNumber: number;
  toNumber: number;
  currentNumber: number;
  validFrom: string;
  validTo: string;
  technicalKey?: string | null;
  isActive: boolean;
}
