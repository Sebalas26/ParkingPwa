import React from 'react';
import { Car, Bike, Plus } from 'lucide-react';
import './Vehicles.css';

interface Vehicle {
  plate: string;
  type: 'Sedán' | 'SUV' | 'Motocicleta';
  spot: string;
  zone: string;
  entry: string;
  duration: string;
  status: 'Activo' | 'Sobreestadía' | 'Infracción';
}

const mockVehicles: Vehicle[] = [
  { plate: 'TX-7762-K', type: 'Sedán', spot: 'A-04', zone: 'Zona A', entry: '11:24', duration: '3h 08m', status: 'Activo' },
  { plate: 'NY-889-BB', type: 'SUV', spot: 'B-15', zone: 'Zona B', entry: '10:12', duration: '4h 20m', status: 'Sobreestadía' },
  { plate: 'CA-4432-P', type: 'Motocicleta', spot: 'D-09', zone: 'Zona D', entry: '14:10', duration: '0h 22m', status: 'Activo' },
  { plate: 'TX-1102-W', type: 'Sedán', spot: 'A-12', zone: 'Zona A', entry: '08:45', duration: '5h 47m', status: 'Sobreestadía' },
  { plate: 'FL-505-AA', type: 'SUV', spot: 'C-01', zone: 'Zona C', entry: '13:30', duration: '1h 02m', status: 'Activo' },
  { plate: 'CO-9023-F', type: 'Sedán', spot: 'B-22', zone: 'Zona B', entry: '12:15', duration: '2h 17m', status: 'Activo' },
  { plate: 'IL-8871-M', type: 'SUV', spot: 'C-14', zone: 'Zona C', entry: '07:12', duration: '7h 20m', status: 'Infracción' },
  { plate: 'TX-4402-B', type: 'Sedán', spot: 'A-03', zone: 'Zona A', entry: '14:02', duration: '0h 30m', status: 'Activo' },
  { plate: 'NY-7711-X', type: 'SUV', spot: 'B-01', zone: 'Zona B', entry: '13:45', duration: '0h 47m', status: 'Activo' },
  { plate: 'AZ-1002-L', type: 'Motocicleta', spot: 'D-14', zone: 'Zona D', entry: '14:21', duration: '0h 11m', status: 'Activo' },
  { plate: 'NV-5050-Y', type: 'Sedán', spot: 'C-08', zone: 'Zona C', entry: '09:00', duration: '5h 32m', status: 'Infracción' },
  { plate: 'WA-2291-Q', type: 'SUV', spot: 'A-19', zone: 'Zona A', entry: '12:40', duration: '1h 52m', status: 'Activo' },
];

export const Vehicles: React.FC = () => {
  return (
    <div className="vehicles-container">
      <div className="vehicles-toolbar">
        <div className="filters-group">
          <span className="filter-label">Zona:</span>
          <button className="filter-pill active">Todas las Zonas</button>
          <button className="filter-pill">Zona A</button>
          <button className="filter-pill">Zona B</button>
          <button className="filter-pill">Zona C</button>
          <button className="filter-pill">Zona D</button>
          
          <div className="filter-divider"></div>
          
          <span className="filter-label">Estado:</span>
          <button className="filter-pill active">Todos</button>
          <button className="filter-pill">Activos</button>
          <button className="filter-pill">Sobreestadía</button>
          <button className="filter-pill">Infracción</button>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }}>
          <Plus size={18} /> Agregar Vehículo
        </button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>MATRÍCULA / PATENTE</th>
              <th>TIPO DE VEHÍCULO</th>
              <th>ESPACIO</th>
              <th>ZONA</th>
              <th>HORA DE INGRESO</th>
              <th>DURACIÓN</th>
              <th>ESTADO</th>
              <th className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {mockVehicles.map((v, i) => (
              <tr key={i}>
                <td className="font-bold">{v.plate}</td>
                <td className="flex-cell text-muted">
                  {v.type === 'Motocicleta' ? <Bike size={16} /> : <Car size={16} />} {v.type}
                </td>
                <td className="font-bold">{v.spot}</td>
                <td className="text-muted">{v.zone}</td>
                <td>{v.entry}</td>
                <td>{v.duration}</td>
                <td>
                  <span className={`badge ${v.status === 'Activo' ? 'badge-success' : v.status === 'Sobreestadía' ? 'badge-warning' : 'badge-danger'}`}>
                    {v.status}
                  </span>
                </td>
                <td className="text-right">
                  <button className="btn-action">Ver</button>
                  <button className="btn-action primary">Salida Manual</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Mostrando 1-12 de 87 vehículos activos</span>
          <div className="page-buttons">
            <button className="page-btn">Ant</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">Sig</button>
          </div>
        </div>
      </div>
    </div>
  );
};
