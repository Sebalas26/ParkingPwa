export interface VehiculoConfigDto {
  rateId: string;
  vehicleType: number | string;
  category: string;
  gracePeriodMinutes: number;
  hourRate: number;
  minuteRate: number;
  fullDayRate: number;
  isActive: boolean;
}

export interface SaveVehiculoConfigDto {
  rateId?: string;
  vehicleType?: number | string;
  category: string;
  gracePeriodMinutes: number;
  hourRate: number;
  minuteRate: number;
  fullDayRate: number;
  isActive?: boolean;
}

