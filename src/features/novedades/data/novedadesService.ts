import { apiClient } from '../../../shared/api/apiClient';
import type { NovedadDto } from '../model/NovedadesContracts';
import type { TicketDto } from '../../vehicles/model/VehicleContracts';

export const novedadesService = {
  getNovedades: async (): Promise<NovedadDto[]> => {
    try {
      const activeTickets = await apiClient.get<TicketDto[]>('/Tickets/active');
      // Filtramos o mapeamos aquellos tickets que contengan notas o incidentes
      const ticketsWithNotes = (activeTickets || []).filter((t) => t.notes && t.notes.trim().length > 0);

      return ticketsWithNotes.map((t, idx) => ({
        id: `NOV-${String(idx + 1).padStart(3, '0')}`,
        placa: t.plateNumber,
        tipoVehiculo: typeof t.vehicleType === 'number' ? (t.vehicleType === 1 ? 'Motocicleta' : 'Auto') : String(t.vehicleType),
        tipoNovedad: 'Vehículo con Observación / Alerta',
        fecha: t.entryTimeUtc ? t.entryTimeUtc.slice(0, 10) : new Date().toISOString().slice(0, 10),
        hora: t.entryTimeUtc ? new Date(t.entryTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        propietario: t.operatorName ? `Operador: ${t.operatorName}` : 'Cliente General',
        celular: t.customerPhone || 'No registrado',
        observacion: t.notes || '',
        estado: 'Activa',
      }));
    } catch {
      return [];
    }
  },
};
