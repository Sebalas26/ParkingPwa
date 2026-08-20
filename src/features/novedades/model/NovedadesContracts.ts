export interface NovedadDto {
  id: string;
  placa: string;
  tipoVehiculo: string;
  tipoNovedad: 'Vehículo Hurtado' | 'Problema de Pago' | 'Vehículo con Problemas' | string;
  fecha: string;
  hora: string;
  propietario: string;
  celular: string;
  observacion: string;
  estado: 'Activa' | 'Resuelta';
}
