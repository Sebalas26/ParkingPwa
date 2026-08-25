export interface StoreDto {
  storeId: string;
  branchId?: number | null;
  name: string;
  taxId?: string;
  phoneNumber?: string;
  contactPhone?: string;
  email?: string;
  isActive: boolean;
  createdAtUtc?: string;
}

export interface SaveStoreDto {
  storeId?: string;
  branchId?: number | null;
  name: string;
  taxId?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface CommercialAgreementDto {
  agreementId: string;
  storeId: string;
  name: string;
  minPurchaseAmount: number;
  discountPercentage?: number | null;
  discountFixedAmount?: number | null;
  maxHoursApplicable?: number | null;
  isActive: boolean;
  createdAtUtc?: string;
  store?: StoreDto;
  storeName?: string;
}

export interface SaveCommercialAgreementDto {
  agreementId?: string;
  storeId: string;
  name: string;
  minPurchaseAmount: number;
  discountPercentage?: number | null;
  discountFixedAmount?: number | null;
  maxHoursApplicable?: number | null;
  isActive: boolean;
}
