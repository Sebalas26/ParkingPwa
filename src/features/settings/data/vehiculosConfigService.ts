import { apiClient } from '../../../shared/api/apiClient';
import type { VehiculoConfigDto, SaveVehiculoConfigDto } from '../model/VehiculosConfigContracts';

let localVehicleConfigs: VehiculoConfigDto[] = [
  { id: 'VCFG-01', category: 'Vehículo Liviano Standard', maxDurationHours: 12, requiresSpecialPermit: false, accessPriority: 'Normal', allowedZones: ['Zona A', 'Zona B', 'Zona C'] },
  { id: 'VCFG-02', category: 'Motos & Ciclomotores', maxDurationHours: 24, requiresSpecialPermit: false, accessPriority: 'Normal', allowedZones: ['Zona D'] },
  { id: 'VCFG-03', category: 'Vehículo Eléctrico / Carga', maxDurationHours: 4, requiresSpecialPermit: true, accessPriority: 'Alta', allowedZones: ['Zona A'] },
  { id: 'VCFG-04', category: 'Carga Pesada & Servicios', maxDurationHours: 2, requiresSpecialPermit: true, accessPriority: 'Baja', allowedZones: ['Zona C'] },
];

export const vehiculosConfigService = {
  getConfigs: async (): Promise<VehiculoConfigDto[]> => {
    try {
      // Si el backend dispone de endpoint de tarifas o vehículos, lo consumimos
      const rates = await apiClient.get<any[]>('/VehicleRates');
      if (rates && rates.length > 0) {
        return rates.map((r, i) => ({
          id: `VCFG-0${i + 1}`,
          category: r.vehicleType === 0 ? 'Sedán / Auto' : r.vehicleType === 1 ? 'Motocicleta' : r.vehicleType === 2 ? 'Camión' : 'Camioneta',
          maxDurationHours: 24,
          requiresSpecialPermit: false,
          accessPriority: 'Normal' as const,
          allowedZones: ['Zona General'],
        }));
      }
    } catch {
      // Fallback a configuración local en caso de offline
    }
    return [...localVehicleConfigs];
  },

  saveConfig: async (cfg: SaveVehiculoConfigDto): Promise<VehiculoConfigDto> => {
    if (cfg.id) {
      localVehicleConfigs = localVehicleConfigs.map((c) => (c.id === cfg.id ? { ...c, ...cfg } as VehiculoConfigDto : c));
      return localVehicleConfigs.find((c) => c.id === cfg.id)!;
    } else {
      const newCfg: VehiculoConfigDto = {
        id: `VCFG-0${localVehicleConfigs.length + 1}`,
        category: cfg.category,
        maxDurationHours: cfg.maxDurationHours || 12,
        requiresSpecialPermit: Boolean(cfg.requiresSpecialPermit),
        accessPriority: cfg.accessPriority || 'Normal',
        allowedZones: cfg.allowedZones || ['Zona A'],
      };
      localVehicleConfigs.push(newCfg);
      return newCfg;
    }
  },
};
