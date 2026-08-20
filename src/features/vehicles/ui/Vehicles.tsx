import React, { useState } from 'react';
import { Car, Bike, Truck } from 'lucide-react';
import './Vehicles.css';

interface Vehicle {
  plate: string;
  type: 'Auto' | 'Camioneta' | 'Motocicleta';
  entry: string;
  duration: string;
}

const allMockVehicles: Vehicle[] = [
  { plate: 'TX-7762-K', type: 'Auto', entry: '11:24', duration: '3h 08m' },
  { plate: 'NY-889-BB', type: 'Camioneta', entry: '10:12', duration: '4h 20m' },
  { plate: 'CA-4432-P', type: 'Motocicleta', entry: '14:10', duration: '0h 22m' },
  { plate: 'TX-1102-W', type: 'Auto', entry: '08:45', duration: '5h 47m' },
  { plate: 'FL-505-AA', type: 'Camioneta', entry: '13:30', duration: '1h 02m' },
  { plate: 'CO-9023-F', type: 'Auto', entry: '12:15', duration: '2h 17m' },
  { plate: 'IL-8871-M', type: 'Camioneta', entry: '07:12', duration: '7h 20m' },
  { plate: 'TX-4402-B', type: 'Auto', entry: '14:02', duration: '0h 30m' },
  { plate: 'NY-7711-X', type: 'Camioneta', entry: '13:45', duration: '0h 47m' },
  { plate: 'AZ-1002-L', type: 'Motocicleta', entry: '14:21', duration: '0h 11m' },
  { plate: 'NV-5050-Y', type: 'Auto', entry: '09:00', duration: '5h 32m' },
  { plate: 'WA-2291-Q', type: 'Camioneta', entry: '12:40', duration: '1h 52m' },
];

export const Vehicles: React.FC = () => {
  const [filterType, setFilterType] = useState('Todos');

  const displayedVehicles = filterType === 'Todos' 
    ? allMockVehicles 
    : allMockVehicles.filter(v => v.type === filterType);

  return (
    <div className="vehicles-container">
      <div className="vehicles-toolbar">
        <div className="filters-group">
          <span className="filter-label">Tipo de Vehículo:</span>
          <button 
            className={`filter-pill ${filterType === 'Todos' ? 'active' : ''}`}
            onClick={() => setFilterType('Todos')}
          >
            Todos
          </button>
          <button 
            className={`filter-pill ${filterType === 'Auto' ? 'active' : ''}`}
            onClick={() => setFilterType('Auto')}
          >
            Auto
          </button>
          <button 
            className={`filter-pill ${filterType === 'Camioneta' ? 'active' : ''}`}
            onClick={() => setFilterType('Camioneta')}
          >
            Camioneta
          </button>
          <button 
            className={`filter-pill ${filterType === 'Motocicleta' ? 'active' : ''}`}
            onClick={() => setFilterType('Motocicleta')}
          >
            Motocicleta
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>PLACA</th>
              <th>TIPO DE VEHÍCULO</th>
              <th>HORA DE INGRESO</th>
              <th>DURACIÓN</th>
            </tr>
          </thead>
          <tbody>
            {displayedVehicles.length > 0 ? (
              displayedVehicles.map((v, i) => (
                <tr key={i}>
                  <td className="font-bold">{v.plate}</td>
                  <td className="text-muted">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {v.type === 'Motocicleta' ? <Bike size={16} /> : v.type === 'Camioneta' ? <Truck size={16} /> : <Car size={16} />} 
                      <span>{v.type}</span>
                    </div>
                  </td>
                  <td>{v.entry}</td>
                  <td>{v.duration}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No se encontraron vehículos de este tipo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pagination">
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Mostrando {displayedVehicles.length} vehículos activos</span>
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
