export interface VehicleRateDto {
  rateId: string;
  vehicleType: number | string;
  displayName: string;
  hourRate: number;
  minuteRate: number;
  fullDayRate: number;
  gracePeriodMinutes: number;
  iconKey?: string;
  isActive: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface UpdateVehicleRateDto {
  hourRate: number;
  minuteRate: number;
  fullDayRate: number;
  gracePeriodMinutes: number;
  displayName?: string;
  iconKey?: string;
}
