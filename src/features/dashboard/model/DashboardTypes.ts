export interface CarEntry {
  id: string;
  licensePlate: string;
  vehicleType: string;
  entryTime: string;
  status: 'entry' | 'exit';
}

export interface Alert {
  id: string;
  type: string;
  licensePlate: string;
  fechaIncidente: string;
  propietario: string;
  celular: string;
  evidencia: string;
  observacion: string;
}

export interface DashboardStats {
  vehiculosIngresadosHoy: number;
  vehiculosActuales: number;
  revenueToday: number;
}
