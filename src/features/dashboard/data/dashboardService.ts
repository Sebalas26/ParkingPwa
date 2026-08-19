import type { CarEntry, DashboardStats, Alert } from '../model/DashboardTypes';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    return {
      totalCapacity: 120,
      occupiedSpaces: 87,
      availableSpaces: 33,
      revenueToday: 2840
    };
  },

  getRecentEntries: async (): Promise<CarEntry[]> => {
    return [
      { id: '1', licensePlate: 'TX-998A', spot: 'A-12', entryTime: '14:30:12', status: 'entry' },
      { id: '2', licensePlate: 'CA-442B', spot: 'B-03', entryTime: '14:28:45', status: 'exit' },
      { id: '3', licensePlate: 'NY-1029', spot: 'C-14', entryTime: '14:25:01', status: 'entry' },
      { id: '4', licensePlate: 'TX-551Z', spot: 'A-09', entryTime: '14:22:19', status: 'entry' },
      { id: '5', licensePlate: 'FL-8820', spot: 'D-05', entryTime: '14:15:30', status: 'exit' },
    ];
  },

  getAlerts: async (): Promise<Alert[]> => {
    return [
      { id: '1', type: 'OVERSTAY ALERT', licensePlate: 'TX-882B', spot: 'B-12', details: 'Time elapsed: 4h 12m' },
      { id: '2', type: 'PAYMENT ISSUE', licensePlate: 'NY-492M', spot: 'C-08', details: 'Time elapsed: 2h 45m' },
      { id: '3', type: 'INVALID ZONE PERMIT', licensePlate: 'CA-9092', spot: 'A-19', details: 'Time elapsed: 1h 10m' },
      { id: '4', type: 'BLOCKED VEHICLE', licensePlate: 'FL-771A', spot: 'D-11', details: 'Time elapsed: 0h 35m' },
    ];
  }
};
