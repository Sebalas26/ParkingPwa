export interface VehiculoConfigDto {
  id: string;
  category: string;
  maxDurationHours: number;
  requiresSpecialPermit: boolean;
  accessPriority: 'Alta' | 'Normal' | 'Baja';
  allowedZones: string[];
}

export interface SaveVehiculoConfigDto {
  id?: string;
  category: string;
  maxDurationHours: number;
  requiresSpecialPermit: boolean;
  accessPriority: 'Alta' | 'Normal' | 'Baja';
  allowedZones: string[];
}
