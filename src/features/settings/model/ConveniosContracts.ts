export interface CommercialAgreementDto {
  agreementId: string;
  storeId?: string;
  storeName?: string;
  name: string;
  discountPercentage: number;
  freeMinutes: number;
  isActive: boolean;
  effectiveFromUtc?: string;
  effectiveToUtc?: string;
}

export interface SaveCommercialAgreementDto {
  agreementId?: string;
  storeId?: string;
  name: string;
  discountPercentage: number;
  freeMinutes: number;
  isActive: boolean;
  effectiveToUtc?: string;
}
