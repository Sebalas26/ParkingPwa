import { apiClient } from '../../../shared/api/apiClient';
import type { VehiculoConfigDto, SaveVehiculoConfigDto } from '../model/VehiculosConfigContracts';

export const parseVehicleTypeToEnum = (v: any): number => {
  if (typeof v === 'number' && !isNaN(v)) return v;
  const str = String(v ?? '').trim();
  if (str !== '' && !isNaN(Number(str))) return Number(str);
  switch (str.toLowerCase()) {
    case 'car':
      return 0;
    case 'motorcycle':
      return 1;
    case 'truck':
      return 2;
    case 'van':
      return 3;
    case 'bicycle':
      return 4;
    case 'suv':
      return 5;
    default:
      return 0;
  }
};

export const getCategoryName = (r: any): string => {
  if (r.displayName && typeof r.displayName === 'string' && r.displayName.trim()) {
    return r.displayName;
  }
  const enumVal = parseVehicleTypeToEnum(r.vehicleType);
  switch (enumVal) {
    case 0:
      return 'Automóvil / Sedán';
    case 1:
      return 'Motocicleta';
    case 2:
      return 'Vehículo Pesado / Camión';
    case 3:
      return 'Furgón / Minibús';
    case 4:
      return 'Bicicleta';
    case 5:
      return 'Camioneta / SUV';
    default:
      return 'Vehículo General';
  }
};

export const vehiculosConfigService = {
  /**
   * Obtiene exclusivamente los tipos de vehículos del catálogo general (BranchId == null)
   */
  getGlobalTypes: async (companyId?: number): Promise<VehiculoConfigDto[]> => {
    try {
      const url = companyId ? `/VehicleRates?companyId=${companyId}` : '/VehicleRates';
      const rates = await apiClient.get<any[]>(url);
      if (rates && rates.length > 0) {
        const globalRates = rates.filter((r) => r.branchId === null || r.branchId === undefined);
        const source = globalRates.length > 0 ? globalRates : rates;
        return source.map((r) => ({
          rateId: r.rateId || r.id,
          branchId: null,
          vehicleType: parseVehicleTypeToEnum(r.vehicleType),
          category: r.displayName?.trim() || getCategoryName(r),
          gracePeriodMinutes: r.gracePeriodMinutes ?? 15,
          hourRate: r.hourRate ?? 0,
          minuteRate: r.minuteRate ?? 0,
          fullDayRate: r.fullDayRate ?? 0,
          iconKey: r.iconKey || 'IconCar',
          isActive: r.isActive ?? true,
        }));
      }
    } catch (err) {
      console.warn('Error al consultar tipos de vehículos globales:', err);
    }
    return [];
  },

  /**
   * Obtiene estrictamente las tarifas asignadas a una sede específica (BranchId == branchId)
   */
  getBranchRates: async (branchId: number, companyId?: number): Promise<VehiculoConfigDto[]> => {
    try {
      const url = companyId ? `/VehicleRates?companyId=${companyId}` : '/VehicleRates';
      const rates = await apiClient.get<any[]>(url);
      if (rates && rates.length > 0) {
        const branchSpecific = rates.filter((r) => r.branchId === branchId);
        return branchSpecific.map((r) => ({
          rateId: r.rateId || r.id,
          branchId: r.branchId,
          vehicleType: parseVehicleTypeToEnum(r.vehicleType),
          category: r.displayName?.trim() || getCategoryName(r),
          gracePeriodMinutes: r.gracePeriodMinutes ?? 15,
          hourRate: r.hourRate ?? 0,
          minuteRate: r.minuteRate ?? 0,
          fullDayRate: r.fullDayRate ?? 0,
          iconKey: r.iconKey || 'IconCar',
          isActive: r.isActive ?? true,
        }));
      }
    } catch (err) {
      console.warn(`Error al consultar tarifas para la sede ${branchId}:`, err);
    }
    return [];
  },

  /**
   * Obtiene la lista completa de tipos de vehículos activos para operar en una sede,
   * combinando las tarifas parametrizadas de la sede con el catálogo general de la BD.
   */
  getConfigs: async (branchId?: number | null, companyId?: number): Promise<VehiculoConfigDto[]> => {
    try {
      const url = companyId ? `/VehicleRates?companyId=${companyId}` : '/VehicleRates';
      const rates = await apiClient.get<any[]>(url);
      if (rates && rates.length > 0) {
        let branchRates: any[] = [];
        if (branchId !== undefined && branchId !== null) {
          branchRates = rates.filter((r) => r.branchId === branchId && (r.isActive ?? true));
        }

        const globalRates = rates.filter((r) => (r.branchId === null || r.branchId === undefined) && (r.isActive ?? true));

        let combined: any[] = [];
        if (branchRates.length > 0) {
          const branchVTypes = new Set(branchRates.map((r) => String(r.vehicleType)));
          const remainingGlobals = globalRates.filter((g) => !branchVTypes.has(String(g.vehicleType)));
          combined = [...branchRates, ...remainingGlobals];
        } else if (globalRates.length > 0) {
          combined = globalRates;
        } else {
          combined = rates.filter((r) => r.isActive ?? true);
        }

        return combined.map((r) => ({
          rateId: r.rateId || r.id,
          branchId: r.branchId ?? null,
          vehicleType: parseVehicleTypeToEnum(r.vehicleType),
          category: r.displayName?.trim() || getCategoryName(r),
          gracePeriodMinutes: r.gracePeriodMinutes ?? 15,
          hourRate: r.hourRate ?? 0,
          minuteRate: r.minuteRate ?? 0,
          fullDayRate: r.fullDayRate ?? 0,
          iconKey: r.iconKey || 'IconCar',
          isActive: r.isActive ?? true,
        }));
      }
    } catch (err) {
      console.warn('Error al consultar configuración de vehículos:', err);
    }
    return [];
  },

  saveConfig: async (cfg: SaveVehiculoConfigDto & { companyId?: number }, branchId?: number | null): Promise<VehiculoConfigDto> => {
    try {
      const targetBranchId = cfg.branchId !== undefined ? cfg.branchId : (branchId ?? null);
      const payload = {
        rateId: cfg.rateId,
        branchId: targetBranchId,
        companyId: cfg.companyId,
        vehicleType: typeof cfg.vehicleType === 'string' ? Number(cfg.vehicleType) || 0 : (cfg.vehicleType || 0),
        displayName: cfg.category,
        hourRate: cfg.hourRate ?? 0,
        minuteRate: cfg.minuteRate ?? 0,
        fullDayRate: cfg.fullDayRate ?? 0,
        gracePeriodMinutes: cfg.gracePeriodMinutes ?? 15,
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

  deleteConfig: async (rateId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/VehicleRates/${rateId}`);
      return true;
    } catch (err) {
      console.warn('Error deleting vehicle config via API:', err);
      throw err;
    }
  },
};
