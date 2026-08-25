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
  getConfigs: async (branchId?: number | null): Promise<VehiculoConfigDto[]> => {
    try {
      const rates = await apiClient.get<any[]>('/VehicleRates');
      if (rates && rates.length > 0) {
        let filtered = rates;
        if (branchId !== undefined && branchId !== null) {
          filtered = rates.filter((r) => r.branchId === branchId || r.branchId === null || r.branchId === undefined);
        }
        return filtered.map((r) => ({
          rateId: r.rateId || r.id,
          branchId: r.branchId,
          vehicleType: r.vehicleType,
          category: getCategoryName(r),
          gracePeriodMinutes: r.gracePeriodMinutes ?? 15,
          hourRate: r.hourRate ?? 0,
          minuteRate: r.minuteRate ?? 0,
          fullDayRate: r.fullDayRate ?? 0,
          iconKey: r.iconKey || 'IconCar',
          isActive: r.isActive ?? true,
        }));
      }
    } catch (err) {
      console.warn('Error fetching vehicle rates for categories from API:', err);
    }
    return [];
  },

  saveConfig: async (cfg: SaveVehiculoConfigDto, branchId?: number | null): Promise<VehiculoConfigDto> => {
    try {
      const targetBranchId = cfg.branchId !== undefined ? cfg.branchId : (branchId ?? null);
      const payload = {
        rateId: cfg.rateId,
        branchId: targetBranchId,
        vehicleType: typeof cfg.vehicleType === 'string' ? Number(cfg.vehicleType) || 0 : (cfg.vehicleType || 0),
        displayName: cfg.category,
        hourRate: cfg.hourRate,
        minuteRate: cfg.minuteRate,
        fullDayRate: cfg.fullDayRate,
        gracePeriodMinutes: cfg.gracePeriodMinutes,
        iconKey: cfg.iconKey || 'IconCar',
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
      branchId: cfg.branchId ?? branchId ?? null,
      vehicleType: cfg.vehicleType || 0,
      category: cfg.category,
      gracePeriodMinutes: cfg.gracePeriodMinutes || 15,
      hourRate: cfg.hourRate || 0,
      minuteRate: cfg.minuteRate || 0,
      fullDayRate: cfg.fullDayRate || 0,
      iconKey: cfg.iconKey || 'IconCar',
      isActive: cfg.isActive ?? true,
    };
  },
};

