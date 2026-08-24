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
        return rates.map((r, i) => {
          const categoryName = getCategoryName(r);
          const isHeavy = r.vehicleType === 'Truck' || r.vehicleType === 2;
          const isMoto = r.vehicleType === 'Motorcycle' || r.vehicleType === 1 || r.vehicleType === 'Bicycle' || r.vehicleType === 4;
          const isCar = r.vehicleType === 'Car' || r.vehicleType === 0;

          return {
            id: `VCFG-0${i + 1}`,
            category: categoryName,
            maxDurationHours: 24,
            requiresSpecialPermit: isHeavy,
            accessPriority: isCar ? ('Alta' as const) : isHeavy ? ('Baja' as const) : ('Normal' as const),
            allowedZones: isMoto ? ['Zona Moto/Bici'] : isHeavy ? ['Zona Carga'] : ['Zona General A', 'Zona General B'],
          };
        });
      }
    } catch (err) {
      console.warn('Error fetching vehicle rates for categories from API:', err);
    }
    return [];
  },

  saveConfig: async (cfg: SaveVehiculoConfigDto): Promise<VehiculoConfigDto> => {
    try {
      const result = await apiClient.post<VehiculoConfigDto>('/VehicleRates', cfg);
      if (result) return result;
    } catch (err) {
      console.warn('Error saving vehicle config via API:', err);
    }

    return {
      id: cfg.id || 'VCFG-01',
      category: cfg.category,
      maxDurationHours: cfg.maxDurationHours || 12,
      requiresSpecialPermit: Boolean(cfg.requiresSpecialPermit),
      accessPriority: cfg.accessPriority || 'Normal',
      allowedZones: cfg.allowedZones || ['Zona General'],
    };
  },
};
