import type { CarEntry, DashboardStats } from '../model/DashboardTypes';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return {
      totalCarsToday: 145,
      currentlyParked: 42,
      availableSpots: 108,
      totalRevenue: 1250.50
    };
  },

  getRecentEntries: async (): Promise<CarEntry[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const now = new Date();
    return [
      { id: '1', licensePlate: 'ABC-123', entryTime: new Date(now.getTime() - 1000 * 60 * 15).toISOString(), status: 'parked' },
      { id: '2', licensePlate: 'XYZ-789', entryTime: new Date(now.getTime() - 1000 * 60 * 45).toISOString(), status: 'parked' },
      { id: '3', licensePlate: 'LMN-456', entryTime: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), status: 'exited' },
      { id: '4', licensePlate: 'DEF-012', entryTime: new Date(now.getTime() - 1000 * 60 * 150).toISOString(), status: 'exited' },
    ];
  }
};
