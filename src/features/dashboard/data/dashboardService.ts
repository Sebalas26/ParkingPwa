import type { CarEntry, DashboardStats, Alert } from '../model/DashboardTypes';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    return {
      vehiculosIngresadosHoy: 145,
      vehiculosActuales: 87,
      revenueToday: 4280 // Será multiplicado por 1000 en la UI para COP
    };
  },

  getRecentEntries: async (): Promise<CarEntry[]> => {
    return [
      { id: '1', licensePlate: 'TX-998A', vehicleType: 'Auto', entryTime: '14:30:12', status: 'entry' },
      { id: '2', licensePlate: 'CA-442B', vehicleType: 'Moto', entryTime: '14:28:45', status: 'exit' },
      { id: '3', licensePlate: 'NY-1029', vehicleType: 'Auto', entryTime: '14:25:01', status: 'entry' },
      { id: '4', licensePlate: 'TX-551Z', vehicleType: 'Camioneta', entryTime: '14:22:19', status: 'entry' },
      { id: '5', licensePlate: 'FL-8820', vehicleType: 'Auto', entryTime: '14:15:30', status: 'exit' },
    ];
  },

  getAlerts: async (): Promise<Alert[]> => {
    return [
      { 
        id: '1', 
        type: 'PROBLEMA DE PAGO', 
        licensePlate: 'TX-882B', 
        fechaIncidente: '24/10/2025 14:10',
        propietario: 'Juan Pérez',
        celular: '+57 300 123 4567',
        evidencia: 'https://images.unsplash.com/photo-1563286348-18e00cb105e1?auto=format&fit=crop&q=80&w=400',
        observacion: 'El cliente intentó pagar con tarjeta de crédito pero fue rechazada múltiples veces por fondos insuficientes. Dejó el vehículo como garantía temporal mientras busca efectivo.'
      },
      { 
        id: '2', 
        type: 'VEHÍCULO HURTADO', 
        licensePlate: 'NY-492M', 
        fechaIncidente: '24/10/2025 10:30',
        propietario: 'María Rodríguez',
        celular: '+57 315 987 6543',
        evidencia: 'https://images.unsplash.com/photo-1622359419143-4e444458f273?auto=format&fit=crop&q=80&w=400',
        observacion: 'Alerta policial vinculada a esta placa al momento del ingreso por lectura de cámara. La policía ya fue notificada y está en camino.'
      },
      { 
        id: '3', 
        type: 'VEHÍCULO CON PROBLEMAS', 
        licensePlate: 'CA-9092', 
        fechaIncidente: '24/10/2025 12:45',
        propietario: 'Carlos González',
        celular: '+57 320 555 8899',
        evidencia: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400',
        observacion: 'El vehículo presentó derrame de aceite significativo en la zona de parqueo, requiriendo aserrín y limpieza urgente. Se cobrará multa por daños a las instalaciones.'
      },
    ];
  }
};
