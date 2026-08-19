import React from 'react';
import { Car, Bike, Plus } from 'lucide-react';
import './Vehicles.css';

interface Vehicle {
  plate: string;
  type: 'Sedan' | 'SUV' | 'Motorcycle';
  spot: string;
  zone: string;
  entry: string;
  duration: string;
  status: 'Active' | 'Overstay' | 'Violation';
}

const mockVehicles: Vehicle[] = [
  { plate: 'TX-7762-K', type: 'Sedan', spot: 'A-04', zone: 'Zone A', entry: '11:24', duration: '3h 08m', status: 'Active' },
  { plate: 'NY-889-BB', type: 'SUV', spot: 'B-15', zone: 'Zone B', entry: '10:12', duration: '4h 20m', status: 'Overstay' },
  { plate: 'CA-4432-P', type: 'Motorcycle', spot: 'D-09', zone: 'Zone D', entry: '14:10', duration: '0h 22m', status: 'Active' },
  { plate: 'TX-1102-W', type: 'Sedan', spot: 'A-12', zone: 'Zone A', entry: '08:45', duration: '5h 47m', status: 'Overstay' },
  { plate: 'FL-505-AA', type: 'SUV', spot: 'C-01', zone: 'Zone C', entry: '13:30', duration: '1h 02m', status: 'Active' },
  { plate: 'CO-9023-F', type: 'Sedan', spot: 'B-22', zone: 'Zone B', entry: '12:15', duration: '2h 17m', status: 'Active' },
  { plate: 'IL-8871-M', type: 'SUV', spot: 'C-14', zone: 'Zone C', entry: '07:12', duration: '7h 20m', status: 'Violation' },
  { plate: 'TX-4402-B', type: 'Sedan', spot: 'A-03', zone: 'Zone A', entry: '14:02', duration: '0h 30m', status: 'Active' },
  { plate: 'NY-7711-X', type: 'SUV', spot: 'B-01', zone: 'Zone B', entry: '13:45', duration: '0h 47m', status: 'Active' },
  { plate: 'AZ-1002-L', type: 'Motorcycle', spot: 'D-14', zone: 'Zone D', entry: '14:21', duration: '0h 11m', status: 'Active' },
  { plate: 'NV-5050-Y', type: 'Sedan', spot: 'C-08', zone: 'Zone C', entry: '09:00', duration: '5h 32m', status: 'Violation' },
  { plate: 'WA-2291-Q', type: 'SUV', spot: 'A-19', zone: 'Zone A', entry: '12:40', duration: '1h 52m', status: 'Active' },
];

export const Vehicles: React.FC = () => {
  return (
    <div className="vehicles-container">
      <div className="vehicles-toolbar">
        <div className="filters-group">
          <span className="filter-label">Zone:</span>
          <button className="filter-pill active">All Zones</button>
          <button className="filter-pill">Zone A</button>
          <button className="filter-pill">Zone B</button>
          <button className="filter-pill">Zone C</button>
          <button className="filter-pill">Zone D</button>
          
          <div className="filter-divider"></div>
          
          <span className="filter-label">Status:</span>
          <button className="filter-pill active">All</button>
          <button className="filter-pill">Active</button>
          <button className="filter-pill">Overstay</button>
          <button className="filter-pill">Violation</button>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }}>
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>LICENSE PLATE</th>
              <th>VEHICLE TYPE</th>
              <th>SPOT NUMBER</th>
              <th>ZONE</th>
              <th>ENTRY TIME</th>
              <th>DURATION</th>
              <th>STATUS</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {mockVehicles.map((v, i) => (
              <tr key={i}>
                <td className="font-bold">{v.plate}</td>
                <td className="flex-cell text-muted">
                  {v.type === 'Motorcycle' ? <Bike size={16} /> : <Car size={16} />} {v.type}
                </td>
                <td className="font-bold">{v.spot}</td>
                <td className="text-muted">{v.zone}</td>
                <td>{v.entry}</td>
                <td>{v.duration}</td>
                <td>
                  <span className={`badge ${v.status === 'Active' ? 'badge-success' : v.status === 'Overstay' ? 'badge-warning' : 'badge-danger'}`}>
                    {v.status}
                  </span>
                </td>
                <td className="text-right">
                  <button className="btn-action">View</button>
                  <button className="btn-action primary">Manual Exit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Showing 1-12 of 87 active vehicles</span>
          <div className="page-buttons">
            <button className="page-btn">Prev</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
