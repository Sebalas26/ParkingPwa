import type { TicketDto } from '../../vehicles/model/VehicleContracts';

export type ReportTicketDto = TicketDto;

export interface ReportSummaryDto {
  periodo: string;
  totalVehiculos: number;
  totalIngresos: number;
}
