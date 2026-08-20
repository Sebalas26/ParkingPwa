import React, { useState, useEffect } from 'react';
import { Car, Bike, Truck, Plus, CheckCircle, Search, X } from 'lucide-react';
import { vehicleService } from '../data/vehicleService';
import type { TicketDto } from '../model/VehicleContracts';
import './Vehicles.css';

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<TicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Ingreso Rápido
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState(0); // 0: Car, 1: Motorcycle, 2: Truck, 3: Van
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadActiveVehicles();
  }, []);

  const loadActiveVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await vehicleService.getActiveVehicles();
      setVehicles(data || []);
    } catch (err) {
      console.error('Error al cargar vehículos activos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) return;

    try {
      await vehicleService.checkIn({
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleType: Number(vehicleType),
        phoneNumber: phoneNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setPlateNumber('');
      setPhoneNumber('');
      setNotes('');
      setIsCheckInModalOpen(false);
      await loadActiveVehicles();
    } catch (err: any) {
      alert(err?.message || 'Error al registrar ingreso del vehículo.');
    }
  };

  const getVehicleTypeName = (type: number | string) => {
    switch (String(type)) {
      case '1':
      case 'Motorcycle':
        return 'Motocicleta';
      case '2':
      case 'Truck':
        return 'Camión';
      case '3':
      case 'Van':
        return 'Camioneta';
      default:
        return 'Auto';
    }
  };

  const calculateDuration = (entryDateUtc: string) => {
    if (!entryDateUtc) return '0 min';
    const entry = new Date(entryDateUtc).getTime();
    const now = new Date().getTime();
    const diffMs = Math.max(0, now - entry);
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  };

  const displayedVehicles = vehicles.filter((v) => {
    const typeName = getVehicleTypeName(v.vehicleType);
    const matchType = filterType === 'Todos' || typeName === filterType;
    const matchSearch =
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="vehicles-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      <div className="vehicles-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Vehículos Activos en Parqueadero</h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Consulta y gestión de vehículos que se encuentran actualmente dentro de las instalaciones.</p>
        </div>

        <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setIsCheckInModalOpen(true)}>
          <Plus size={16} /> Registrar Ingreso
        </button>
      </div>

      <div className="vehicles-toolbar">
        <div className="filters-group">
          <span className="filter-label">Tipo de Vehículo:</span>
          {['Todos', 'Auto', 'Camioneta', 'Motocicleta', 'Camión'].map((type) => (
            <button
              key={type}
              className={`filter-pill ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Buscar por placa o tiquete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>TIQUETE</th>
              <th>PLACA</th>
              <th>TIPO DE VEHÍCULO</th>
              <th>HORA DE INGRESO</th>
              <th>TIEMPO EN SITIO</th>
              <th>TARIFA BASE</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {displayedVehicles.length > 0 ? (
              displayedVehicles.map((v) => {
                const typeName = getVehicleTypeName(v.vehicleType);
                return (
                  <tr key={v.ticketId}>
                    <td className="font-bold text-muted">{v.ticketNumber}</td>
                    <td className="font-bold text-primary" style={{ fontSize: '1rem' }}>{v.plateNumber}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {typeName === 'Motocicleta' ? <Bike size={16} /> : typeName === 'Camioneta' || typeName === 'Camión' ? <Truck size={16} /> : <Car size={16} />}
                        <span>{typeName}</span>
                      </div>
                    </td>
                    <td className="text-muted">
                      {v.entryTimeUtc ? new Date(v.entryTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="font-bold">{calculateDuration(v.entryTimeUtc)}</td>
                    <td className="text-muted">${(v.hourlyRate || 0).toLocaleString()} /hr</td>
                    <td>
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> Activo
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  {isLoading ? 'Cargando vehículos activos...' : 'No hay vehículos activos que coincidan con la búsqueda.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Ingreso */}
      {isCheckInModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Registrar Ingreso de Vehículo</h3>
              <button className="btn-close-modal" onClick={() => setIsCheckInModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCheckIn}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Placa del Vehículo</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. ABC-123"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Vehículo</label>
                  <select
                    className="input-field"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(Number(e.target.value))}
                  >
                    <option value={0}>Auto / Sedán</option>
                    <option value={5}>SUV</option>
                    <option value={1}>Motocicleta</option>
                    <option value={3}>Camioneta / Van</option>
                    <option value={2}>Camión / Bus</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Teléfono Cliente (Opcional)</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="300 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Notas / Estado del Vehículo</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. Rayón en puerta derecha"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsCheckInModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Generar Tiquete de Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
