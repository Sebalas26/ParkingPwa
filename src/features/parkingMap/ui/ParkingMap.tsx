import React from 'react';
import { RefreshCw } from 'lucide-react';
import './ParkingMap.css';

interface Spot {
  id: string;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Violation';
  plate?: string;
}

const zoneA: Spot[] = [
  { id: 'A-01', status: 'Occupied', plate: 'TX-7712' },
  { id: 'A-02', status: 'Available' },
  { id: 'A-03', status: 'Occupied', plate: 'CA-8890' },
  { id: 'A-04', status: 'Occupied', plate: 'TX-4402' },
  { id: 'A-05', status: 'Reserved' },
  { id: 'A-06', status: 'Available' },
  { id: 'A-07', status: 'Occupied', plate: 'FL-5541' },
  { id: 'A-08', status: 'Violation' },
  { id: 'A-09', status: 'Occupied', plate: 'TX-551Z' },
  { id: 'A-10', status: 'Available' },
];

const zoneB: Spot[] = [
  { id: 'B-01', status: 'Occupied', plate: 'NY-7711' },
  { id: 'B-02', status: 'Available' },
  { id: 'B-03', status: 'Occupied', plate: 'CA-442B' },
  { id: 'B-04', status: 'Occupied', plate: 'NY-991A' },
  { id: 'B-05', status: 'Available' },
  { id: 'B-06', status: 'Occupied', plate: 'TX-882B' },
  { id: 'B-07', status: 'Reserved' },
  { id: 'B-08', status: 'Available' },
  { id: 'B-09', status: 'Available' },
  { id: 'B-10', status: 'Occupied', plate: 'CO-9023' },
];

const zoneC: Spot[] = [
  { id: 'C-01', status: 'Occupied', plate: 'FL-505-A' },
  { id: 'C-02', status: 'Occupied', plate: 'AZ-404M' },
  { id: 'C-03', status: 'Available' },
  { id: 'C-04', status: 'Available' },
  { id: 'C-05', status: 'Violation' },
  { id: 'C-06', status: 'Occupied', plate: 'NV-5050' },
  { id: 'C-07', status: 'Available' },
  { id: 'C-08', status: 'Occupied', plate: 'NY-492M' },
  { id: 'C-09', status: 'Reserved' },
  { id: 'C-10', status: 'Available' },
];

const zoneD: Spot[] = [
  { id: 'D-01', status: 'Available' },
  { id: 'D-02', status: 'Available' },
  { id: 'D-03', status: 'Occupied', plate: 'WA-2291' },
  { id: 'D-04', status: 'Reserved' },
  { id: 'D-05', status: 'Occupied', plate: 'TX-4402' },
  { id: 'D-06', status: 'Available' },
  { id: 'D-07', status: 'Available' },
  { id: 'D-08', status: 'Occupied', plate: 'AZ-1002' },
  { id: 'D-09', status: 'Occupied', plate: 'CA-4432' },
  { id: 'D-10', status: 'Violation' },
];

const SpotBox: React.FC<{ spot: Spot }> = ({ spot }) => {
  const statusClass = spot.status.toLowerCase();
  return (
    <div className={`spot-box ${statusClass}`}>
      <div className="spot-id">{spot.id}</div>
      {spot.plate && <div className="spot-plate">{spot.plate}</div>}
    </div>
  );
};

export const ParkingMap: React.FC = () => {
  return (
    <div className="parking-map-container">
      <div className="map-toolbar card-shadow">
        <div className="legend-group">
          <div className="legend-item">
            <span className="dot available"></span> <strong>33</strong> Disponibles
          </div>
          <div className="legend-item">
            <span className="dot occupied"></span> <strong>87</strong> Ocupados
          </div>
          <div className="legend-item">
            <span className="dot reserved"></span> <strong>8</strong> Reservados
          </div>
          <div className="legend-item">
            <span className="dot violation"></span> <strong>4</strong> Infracciones / Bloqueados
          </div>
        </div>
        <button className="btn-outline">
          <RefreshCw size={16} /> Actualizar Mapa
        </button>
      </div>

      <div className="zones-grid">
        <div className="zone-card card-shadow">
          <div className="zone-header">
            <h3>Zona A - Corta Estada</h3>
            <span className="text-muted text-sm">10 Espacios</span>
          </div>
          <div className="spots-grid">
            {zoneA.slice(0,5).map(s => <SpotBox key={s.id} spot={s} />)}
          </div>
          <div className="grid-divider"></div>
          <div className="spots-grid">
            {zoneA.slice(5,10).map(s => <SpotBox key={s.id} spot={s} />)}
          </div>
        </div>

        <div className="zone-card card-shadow">
          <div className="zone-header">
            <h3>Zona B - Larga Estada</h3>
            <span className="text-muted text-sm">10 Espacios</span>
          </div>
          <div className="spots-grid">
            {zoneB.slice(0,5).map(s => <SpotBox key={s.id} spot={s} />)}
          </div>
          <div className="grid-divider"></div>
          <div className="spots-grid">
            {zoneB.slice(5,10).map(s => <SpotBox key={s.id} spot={s} />)}
          </div>
        </div>

        <div className="zone-card card-shadow">
          <div className="zone-header">
            <h3>Zona C - General</h3>
            <span className="text-muted text-sm">10 Espacios</span>
          </div>
          <div className="spots-grid">
            {zoneC.slice(0,5).map(s => <SpotBox key={s.id} spot={s} />)}
          </div>
          <div className="grid-divider"></div>
          <div className="spots-grid">
            {zoneC.slice(5,10).map(s => <SpotBox key={s.id} spot={s} />)}
          </div>
        </div>

        <div className="zone-card card-shadow">
          <div className="zone-header">
            <h3>Zona D - Reservados / Motos</h3>
            <span className="text-muted text-sm">10 Espacios</span>
          </div>
          <div className="spots-grid">
            {zoneD.slice(0,5).map(s => <SpotBox key={s.id} spot={s} />)}
          </div>
          <div className="grid-divider"></div>
          <div className="spots-grid">
            {zoneD.slice(5,10).map(s => <SpotBox key={s.id} spot={s} />)}
          </div>
        </div>
      </div>
    </div>
  );
};
