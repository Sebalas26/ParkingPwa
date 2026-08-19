export interface CarEntry {
  id: string;
  licensePlate: string;
  spot: string;
  entryTime: string;
  status: 'entry' | 'exit';
}

export interface Alert {
  id: string;
  type: string;
  licensePlate: string;
  spot: string;
  details: string;
}

export interface DashboardStats {
  totalCapacity: number;
  occupiedSpaces: number;
  availableSpaces: number;
  revenueToday: number;
}
