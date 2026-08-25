export interface VehiculoConfigDto {
  rateId: string;
  branchId?: number | null;
  vehicleType: number | string;
  category: string;
  gracePeriodMinutes: number;
  hourRate: number;
  minuteRate: number;
  fullDayRate: number;
  iconKey?: string;
  isActive: boolean;
}

export interface SaveVehiculoConfigDto {
  rateId?: string;
  branchId?: number | null;
  vehicleType?: number | string;
  category: string;
  gracePeriodMinutes: number;
  hourRate: number;
  minuteRate: number;
  fullDayRate: number;
  iconKey?: string;
  isActive?: boolean;
}

