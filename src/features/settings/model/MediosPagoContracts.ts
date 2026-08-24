export interface PaymentMethodDto {
  id: number;
  name: string;
  icon?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  status?: string | boolean;
}

export interface SavePaymentMethodDto {
  id?: number;
  name: string;
  icon?: string;
  isActive: boolean;
  status?: string | boolean;
}
