export interface PaymentMethodDto {
  id: number;
  name: string;
  status?: string | boolean;
}

export interface SavePaymentMethodDto {
  id?: number;
  name: string;
  status?: string | boolean;
}
