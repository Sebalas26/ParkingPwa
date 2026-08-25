import { apiClient } from '../../../shared/api/apiClient';
import type { VehiculoConfigDto, SaveVehiculoConfigDto } from '../model/VehiculosConfigContracts';

export const getCategoryName = (r: any): string => {
  if (r.displayName && typeof r.displayName === 'string' && r.displayName.trim()) {
    return r.displayName;
  }
  const vType = String(r.vehicleType);
  switch (vType) {
    case '0':
    case 'Car':
      return 'Automóvil / Sedán';
    case '1':
    case 'Motorcycle':
      return 'Motocicleta';
    case '2':
    case 'Truck':
      return 'Vehículo Pesado / Camión';
    case '3':
    case 'Van':
      return 'Furgón / Minibús';
    case '4':
    case 'Bicycle':
      return 'Bicicleta';
    case '5':
    case 'Suv':
      return 'Camioneta / SUV';
    default:
      return vType || 'Vehículo General';
  }
};

export const vehiculosConfigService = {
  getConfigs: async (): Promise<VehiculoConfigDto[]> => {
    try {
      const rates = await apiClient.get<any[]>('/VehicleRates');
      if (rates && rates.length > 0) {
        return rates.map((r) => ({
          rateId: r.rateId || r.id,
          vehicleType: r.vehicleType,
          category: getCategoryName(r),
          gracePeriodMinutes: r.gracePeriodMinutes ?? 15,
          hourRate: r.hourRate ?? 0,
          minuteRate: r.minuteRate ?? 0,
          fullDayRate: r.fullDayRate ?? 0,
          isActive: r.isActive ?? true,
        }));
      }
    } catch (err) {
      console.warn('Error fetching vehicle rates for categories from API:', err);
    }
    return [];
  },

  saveConfig: async (cfg: SaveVehiculoConfigDto): Promise<VehiculoConfigDto> => {
    try {
      const payload = {
        rateId: cfg.rateId,
        vehicleType: cfg.vehicleType,
        displayName: cfg.category,
        hourRate: cfg.hourRate,
        minuteRate: cfg.minuteRate,
        fullDayRate: cfg.fullDayRate,
        gracePeriodMinutes: cfg.gracePeriodMinutes,
        isActive: cfg.isActive ?? true,
      };

      if (cfg.rateId) {
        const result = await apiClient.put<VehiculoConfigDto>(`/VehicleRates/${cfg.rateId}`, payload);
        if (result) return result;
      } else {
        const result = await apiClient.post<VehiculoConfigDto>('/VehicleRates', payload);
        if (result) return result;
      }
    } catch (err) {
      console.warn('Error saving vehicle config via API:', err);
    }

    return {
      rateId: cfg.rateId || '',
      vehicleType: cfg.vehicleType || 0,
      category: cfg.category,
      gracePeriodMinutes: cfg.gracePeriodMinutes || 15,
      hourRate: cfg.hourRate || 0,
      minuteRate: cfg.minuteRate || 0,
      fullDayRate: cfg.fullDayRate || 0,
      isActive: cfg.isActive ?? true,
    };
  },
};

