import React, { useState } from 'react';
import { Bell, Search, Eye, AlertTriangle, Car, ShieldAlert, Image as ImageIcon, X } from 'lucide-react';
import './Novedades.css';

interface Novedad {
  id: string;
  placa: string;
  tipoVehiculo: 'Auto' | 'Camioneta' | 'Motocicleta';
  tipoNovedad: 'Vehículo Hurtado' | 'Problema de Pago' | 'Vehículo con Problemas';
  fecha: string;
  hora: string;
  propietario: string;
  celular: string;
  observacion: string;
  estado: 'Activa' | 'Resuelta';
}

const mockNovedades: Novedad[] = [
  { id: 'NOV-001', placa: 'TX-7762-K', tipoVehiculo: 'Auto', tipoNovedad: 'Vehículo Hurtado', fecha: '2023-10-24', hora: '11:30 AM', propietario: 'Juan Pérez', celular: '310 123 4567', observacion: 'Reportado por la policía, no permitir salida.', estado: 'Activa' },
  { id: 'NOV-002', placa: 'NY-889-BB', tipoVehiculo: 'Camioneta', tipoNovedad: 'Problema de Pago', fecha: '2023-10-24', hora: '10:15 AM', propietario: 'María García', celular: '320 987 6543', observacion: 'Rechazo de tarjeta recurrente. Pendiente por pago de $15,000.', estado: 'Activa' },
  { id: 'NOV-003', placa: 'CA-4432-P', tipoVehiculo: 'Motocicleta', tipoNovedad: 'Vehículo con Problemas', fecha: '2023-10-23', hora: '04:20 PM', propietario: 'Carlos López', celular: '300 555 1234', observacion: 'Fuga de aceite en el parqueadero B2.', estado: 'Activa' },
];

export const Novedades: React.FC = () => {
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);

  const filteredData = mockNovedades.filter(n => {
    const matchesFilter = filter === 'Todos' || n.tipoNovedad === filter;
    const matchesSearch = n.placa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.propietario.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'Vehículo Hurtado': return 'badge-danger';
      case 'Problema de Pago': return 'badge-warning';
      default: return 'badge-warning';
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'Vehículo Hurtado': return <ShieldAlert size={16} />;
      case 'Problema de Pago': return <AlertTriangle size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="novedades-container">
      <div className="novedades-header">
        <h1>Novedades y Alertas</h1>
        <p className="text-muted" style={{ margin: 0 }}>Gestión de vehículos con reportes o incidencias activas.</p>
      </div>

      <div className="novedades-toolbar">
        <div className="novedades-filters">
          <button className={`filter-pill ${filter === 'Todos' ? 'active' : ''}`} onClick={() => setFilter('Todos')}>Todos</button>
          <button className={`filter-pill ${filter === 'Problema de Pago' ? 'active' : ''}`} onClick={() => setFilter('Problema de Pago')}>Problemas de Pago</button>
          <button className={`filter-pill ${filter === 'Vehículo Hurtado' ? 'active' : ''}`} onClick={() => setFilter('Vehículo Hurtado')}>Hurtados</button>
          <button className={`filter-pill ${filter === 'Vehículo con Problemas' ? 'active' : ''}`} onClick={() => setFilter('Vehículo con Problemas')}>Otros Problemas</button>
        </div>
        
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por placa o propietario..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card" style={{ flex: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>PLACA</th>
              <th>TIPO ALERTA</th>
              <th>FECHA Y HORA</th>
              <th>PROPIETARIO</th>
              <th className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((n, i) => (
                <tr key={i}>
                  <td>
                    <div className="novedades-plate-badge">
                      <Car size={14} style={{ marginRight: 6, color: 'var(--text-secondary)' }}/>
                      {n.placa}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getBadgeClass(n.tipoNovedad)}`} style={{ display: 'inline-flex', gap: '6px' }}>
                      {getIcon(n.tipoNovedad)} {n.tipoNovedad}
                    </span>
                  </td>
                  <td className="text-muted">{n.fecha} <br/> <small>{n.hora}</small></td>
                  <td>{n.propietario}</td>
                  <td className="text-right">
                    <button className="btn-action primary" onClick={() => setSelectedNovedad(n)}>
                      <Eye size={16} style={{ marginRight: '6px' }} /> Ver Detalle
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-muted" style={{ padding: '3rem' }}>
                  No hay novedades registradas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {selectedNovedad && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Detalle de Novedad - {selectedNovedad.placa}</h3>
              <button className="btn-close-modal" onClick={() => setSelectedNovedad(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <span className={`badge ${getBadgeClass(selectedNovedad.tipoNovedad)}`} style={{ display: 'inline-flex', gap: '6px', fontSize: '1rem', padding: '6px 12px' }}>
                  {getIcon(selectedNovedad.tipoNovedad)} {selectedNovedad.tipoNovedad}
                </span>
              </div>

              <div className="novedad-details-grid">
                <div className="detail-group">
                  <label>Propietario</label>
                  <p>{selectedNovedad.propietario}</p>
                </div>
                <div className="detail-group">
                  <label>Celular de Contacto</label>
                  <p>{selectedNovedad.celular}</p>
                </div>
                <div className="detail-group">
                  <label>Fecha y Hora</label>
                  <p>{selectedNovedad.fecha} - {selectedNovedad.hora}</p>
                </div>
                <div className="detail-group">
                  <label>ID Reporte</label>
                  <p>{selectedNovedad.id}</p>
                </div>
              </div>

              <div className="detail-group" style={{ marginTop: '1rem' }}>
                <label>Observaciones del Incidente</label>
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '6px' }}>
                  <p style={{ fontSize: '0.95rem' }}>{selectedNovedad.observacion}</p>
                </div>
              </div>

              <div className="detail-group" style={{ marginTop: '1rem' }}>
                <label>Evidencia Adjunta</label>
                <div className="evidence-photo">
                  <ImageIcon size={32} opacity={0.5} />
                  <span>Sin evidencia fotográfica</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setSelectedNovedad(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
