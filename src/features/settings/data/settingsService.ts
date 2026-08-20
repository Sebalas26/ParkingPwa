import type { Tarifa, Usuario, Convenio, VehiculoConfig } from '../model/SettingsTypes';

let mockTarifas: Tarifa[] = [
  { id: 'TAR-01', vehicleType: 'Sedán', hourlyRate: 2000, fractionRate: 600, maxDailyRate: 15000, gracePeriodMinutes: 15, status: 'Activa' },
  { id: 'TAR-02', vehicleType: 'SUV', hourlyRate: 2500, fractionRate: 750, maxDailyRate: 18000, gracePeriodMinutes: 15, status: 'Activa' },
  { id: 'TAR-03', vehicleType: 'Motocicleta', hourlyRate: 1000, fractionRate: 300, maxDailyRate: 8000, gracePeriodMinutes: 20, status: 'Activa' },
  { id: 'TAR-04', vehicleType: 'Camión / Bus', hourlyRate: 4500, fractionRate: 1200, maxDailyRate: 32000, gracePeriodMinutes: 10, status: 'Inactiva' },
];

let mockUsuarios: Usuario[] = [
  { id: 'USR-01', name: 'Carlos Mendoza', email: 'carlos.mendoza@parkcontrol.cl', role: 'Administrador', status: 'Activo', lastLogin: '2026-08-19 14:10' },
  { id: 'USR-02', name: 'Andrea Silva', email: 'andrea.silva@parkcontrol.cl', role: 'Supervisor', status: 'Activo', lastLogin: '2026-08-19 11:45' },
  { id: 'USR-03', name: 'Roberto Gómez', email: 'roberto.gomez@parkcontrol.cl', role: 'Operador', status: 'Activo', lastLogin: '2026-08-18 08:30' },
  { id: 'USR-04', name: 'Mariana López', email: 'mariana.lopez@parkcontrol.cl', role: 'Operador', status: 'Inactivo', lastLogin: '2026-08-01 16:20' },
];

let mockConvenios: Convenio[] = [
  { id: 'CONV-01', companyName: 'Supermercado Líder', code: 'LIDER2026', discountPercentage: 30, freeHours: 2, status: 'Vigente', validUntil: '2026-12-31' },
  { id: 'CONV-02', companyName: 'CineHoyts Mall', code: 'CINE20', discountPercentage: 50, freeHours: 3, status: 'Vigente', validUntil: '2027-03-15' },
  { id: 'CONV-03', companyName: 'Gimnasio SmartFit', code: 'FITPWT', discountPercentage: 20, freeHours: 1.5, status: 'Vigente', validUntil: '2026-11-30' },
  { id: 'CONV-04', companyName: 'Hotel Plaza', code: 'HOTELPLZ', discountPercentage: 100, freeHours: 12, status: 'Suspendido', validUntil: '2026-06-30' },
];

let mockVehiculoConfigs: VehiculoConfig[] = [
  { id: 'VCFG-01', category: 'Vehículo Liviano Standard', maxDurationHours: 12, requiresSpecialPermit: false, accessPriority: 'Normal', allowedZones: ['Zona A', 'Zona B', 'Zona C'] },
  { id: 'VCFG-02', category: 'Motos & Ciclomotores', maxDurationHours: 24, requiresSpecialPermit: false, accessPriority: 'Normal', allowedZones: ['Zona D'] },
  { id: 'VCFG-03', category: 'Vehículo Eléctrico / Carga', maxDurationHours: 4, requiresSpecialPermit: true, accessPriority: 'Alta', allowedZones: ['Zona A'] },
  { id: 'VCFG-04', category: 'Carga Pesada & Servicios', maxDurationHours: 2, requiresSpecialPermit: true, accessPriority: 'Baja', allowedZones: ['Zona C'] },
];

export const settingsService = {
  // Tarifas CRUD
  getTarifas: async (): Promise<Tarifa[]> => [...mockTarifas],
  saveTarifa: async (tarifa: Partial<Tarifa>): Promise<Tarifa> => {
    if (tarifa.id) {
      mockTarifas = mockTarifas.map(t => t.id === tarifa.id ? { ...t, ...tarifa } as Tarifa : t);
      return mockTarifas.find(t => t.id === tarifa.id)!;
    } else {
      const newTarifa: Tarifa = {
        id: `TAR-0${mockTarifas.length + 1}`,
        vehicleType: tarifa.vehicleType || 'Sedán',
        hourlyRate: Number(tarifa.hourlyRate) || 2000,
        fractionRate: Number(tarifa.fractionRate) || 500,
        maxDailyRate: Number(tarifa.maxDailyRate) || 15000,
        gracePeriodMinutes: Number(tarifa.gracePeriodMinutes) || 15,
        status: tarifa.status || 'Activa',
      };
      mockTarifas.push(newTarifa);
      return newTarifa;
    }
  },
  deleteTarifa: async (id: string): Promise<void> => {
    mockTarifas = mockTarifas.filter(t => t.id !== id);
  },

  // Usuarios CRUD
  getUsuarios: async (): Promise<Usuario[]> => [...mockUsuarios],
  saveUsuario: async (usuario: Partial<Usuario>): Promise<Usuario> => {
    if (usuario.id) {
      mockUsuarios = mockUsuarios.map(u => u.id === usuario.id ? { ...u, ...usuario } as Usuario : u);
      return mockUsuarios.find(u => u.id === usuario.id)!;
    } else {
      const newUsuario: Usuario = {
        id: `USR-0${mockUsuarios.length + 1}`,
        name: usuario.name || 'Nuevo Usuario',
        email: usuario.email || 'usuario@parkcontrol.cl',
        role: usuario.role || 'Operador',
        status: usuario.status || 'Activo',
        lastLogin: 'Nunca',
      };
      mockUsuarios.push(newUsuario);
      return newUsuario;
    }
  },
  deleteUsuario: async (id: string): Promise<void> => {
    mockUsuarios = mockUsuarios.filter(u => u.id !== id);
  },

  // Convenios CRUD
  getConvenios: async (): Promise<Convenio[]> => [...mockConvenios],
  saveConvenio: async (convenio: Partial<Convenio>): Promise<Convenio> => {
    if (convenio.id) {
      mockConvenios = mockConvenios.map(c => c.id === convenio.id ? { ...c, ...convenio } as Convenio : c);
      return mockConvenios.find(c => c.id === convenio.id)!;
    } else {
      const newConvenio: Convenio = {
        id: `CONV-0${mockConvenios.length + 1}`,
        companyName: convenio.companyName || 'Nuevo Convenio',
        code: convenio.code || 'CONV2026',
        discountPercentage: Number(convenio.discountPercentage) || 15,
        freeHours: Number(convenio.freeHours) || 1,
        status: convenio.status || 'Vigente',
        validUntil: convenio.validUntil || '2026-12-31',
      };
      mockConvenios.push(newConvenio);
      return newConvenio;
    }
  },
  deleteConvenio: async (id: string): Promise<void> => {
    mockConvenios = mockConvenios.filter(c => c.id !== id);
  },

  // Vehiculos Config CRUD
  getVehiculoConfigs: async (): Promise<VehiculoConfig[]> => [...mockVehiculoConfigs],
  saveVehiculoConfig: async (cfg: Partial<VehiculoConfig>): Promise<VehiculoConfig> => {
    if (cfg.id) {
      mockVehiculoConfigs = mockVehiculoConfigs.map(v => v.id === cfg.id ? { ...v, ...cfg } as VehiculoConfig : v);
      return mockVehiculoConfigs.find(v => v.id === cfg.id)!;
    } else {
      const newConfig: VehiculoConfig = {
        id: `VCFG-0${mockVehiculoConfigs.length + 1}`,
        category: cfg.category || 'Nueva Categoría',
        maxDurationHours: Number(cfg.maxDurationHours) || 8,
        requiresSpecialPermit: Boolean(cfg.requiresSpecialPermit),
        accessPriority: cfg.accessPriority || 'Normal',
        allowedZones: cfg.allowedZones || ['Zona A'],
      };
      mockVehiculoConfigs.push(newConfig);
      return newConfig;
    }
  },
  deleteVehiculoConfig: async (id: string): Promise<void> => {
    mockVehiculoConfigs = mockVehiculoConfigs.filter(v => v.id !== id);
  }
};
