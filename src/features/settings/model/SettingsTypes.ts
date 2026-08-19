export interface Tarifa {
  id: string;
  vehicleType: 'Sedán' | 'SUV' | 'Motocicleta' | 'Camión / Bus';
  hourlyRate: number;
  fractionRate: number;
  maxDailyRate: number;
  gracePeriodMinutes: number;
  status: 'Activa' | 'Inactiva';
}

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Operador' | 'Supervisor';
  status: 'Activo' | 'Inactivo';
  lastLogin?: string;
}

export interface Convenio {
  id: string;
  companyName: string;
  code: string;
  discountPercentage: number;
  freeHours: number;
  status: 'Vigente' | 'Suspendido' | 'Vencido';
  validUntil: string;
}

export interface VehiculoConfig {
  id: string;
  category: string;
  maxDurationHours: number;
  requiresSpecialPermit: boolean;
  accessPriority: 'Alta' | 'Normal' | 'Baja';
  allowedZones: string[];
}
