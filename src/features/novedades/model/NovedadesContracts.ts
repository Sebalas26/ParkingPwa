export interface VehicleIncidentDto {
  incidentId: string;
  plateNumber: string;
  branchId?: number | null;
  branchName?: string | null;
  isGlobal?: boolean;
  branchIds?: number[];
  branchNames?: string[];
  incidentType: string;
  isBlocked: boolean;
  description: string;
  reportedBy: string;
  contactPhone?: string | null;
  status: 'Activa' | 'Resuelta' | string;
  resolvedNotes?: string | null;
  resolvedAtUtc?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface SaveVehicleIncidentDto {
  incidentId?: string;
  plateNumber: string;
  branchId?: number | null;
  isGlobal?: boolean;
  branchIds?: number[];
  incidentType: string;
  isBlocked: boolean;
  description: string;
  reportedBy: string;
  contactPhone?: string | null;
  status?: string;
}

export interface PlateCheckResultDto {
  plateNumber: string;
  hasIncidents: boolean;
  isBlocked: boolean;
  reason?: string | null;
  incidentType?: string | null;
  description?: string | null;
  reportedBy?: string | null;
  reportedAtUtc?: string | null;
  incidentId?: string | null;
}

export interface ResolveIncidentDto {
  resolvedNotes: string;
}
