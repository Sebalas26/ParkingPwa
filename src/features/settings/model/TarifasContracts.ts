export interface VehicleRateDto {
  rateId: string;
  vehicleType: number | string;
  hourRate: number;
  minuteRate: number;
  fullDayRate: number;
  gracePeriodMinutes: number;
  effectiveFromUtc?: string;
  isActive: boolean;
}

export interface UpdateVehicleRateDto {
  hourRate: number;
  minuteRate: number;
  fullDayRate: number;
  gracePeriodMinutes: number;
}
