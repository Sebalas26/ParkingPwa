export interface CarEntry {
  id: string;
  licensePlate: string;
  entryTime: string;
  status: 'parked' | 'exited';
}

export interface DashboardStats {
  totalCarsToday: number;
  currentlyParked: number;
  availableSpots: number;
  totalRevenue: number;
}
