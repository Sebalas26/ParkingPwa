export interface StoreDto {
  storeId: string;
  name: string;
  contactPhone?: string;
  email?: string;
  isActive: boolean;
  createdAtUtc?: string;
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
  // Campos de compatibilidad
  storeName?: string;
  freeMinutes?: number;
  effectiveToUtc?: string;
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
  freeMinutes?: number;
  effectiveToUtc?: string;
}
