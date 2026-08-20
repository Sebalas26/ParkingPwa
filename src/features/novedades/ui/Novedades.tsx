import React, { useState, useEffect } from 'react';
import { Search, Eye, AlertTriangle, Car, X } from 'lucide-react';
import { novedadesService } from '../data/novedadesService';
import type { NovedadDto } from '../model/NovedadesContracts';
import './Novedades.css';

export const Novedades: React.FC = () => {
  const [novedades, setNovedades] = useState<NovedadDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNovedad, setSelectedNovedad] = useState<NovedadDto | null>(null);

  useEffect(() => {
    loadNovedades();
  }, []);

  const loadNovedades = async () => {
    setIsLoading(true);
    try {
      const data = await novedadesService.getNovedades();
      setNovedades(data || []);
    } catch (err) {
      console.error('Error al cargar novedades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = novedades.filter((n) => {
    const term = searchTerm.toLowerCase();
    return (
      n.placa.toLowerCase().includes(term) ||
      n.propietario.toLowerCase().includes(term) ||
      n.observacion.toLowerCase().includes(term)
    );
  });

  return (
    <div className="novedades-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      <div className="novedades-header">
        <h1>Novedades e Incidencias en Sitio</h1>
        <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Monitoreo de observaciones y alertas reportadas en los ingresos de vehículos activos.</p>
      </div>

      <div className="novedades-toolbar">
        <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px' }}>
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Buscar por placa, operador u observación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      <div className="table-card" style={{ flex: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>PLACA</th>
              <th>TIPO ALERTA / NOVEDAD</th>
              <th>FECHA Y HORA</th>
              <th>OBSERVACIÓN</th>
              <th className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((n) => (
                <tr key={n.id}>
                  <td className="font-bold text-muted">{n.id}</td>
                  <td>
                    <div className="novedades-plate-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                      <Car size={14} style={{ color: 'var(--text-secondary)' }} />
                      {n.placa}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} /> {n.tipoNovedad}
                    </span>
                  </td>
                  <td className="text-muted">
                    {n.fecha} <br />
                    <small>{n.hora}</small>
                  </td>
                  <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.observacion}
                  </td>
                  <td className="text-right">
                    <button className="btn-action primary" onClick={() => setSelectedNovedad(n)}>
                      <Eye size={16} style={{ marginRight: '6px' }} /> Ver Detalle
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-muted" style={{ padding: '3rem' }}>
                  {isLoading ? 'Consultando novedades activas...' : 'No hay novedades u observaciones activas reportadas en los vehículos en parqueadero.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog Detalle */}
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
                <span className="badge badge-warning" style={{ display: 'inline-flex', gap: '6px', fontSize: '0.9rem', padding: '6px 12px' }}>
                  <AlertTriangle size={16} /> {selectedNovedad.tipoNovedad}
                </span>
              </div>

              <div className="novedad-details-grid">
                <div className="detail-group">
                  <label>Registrado por</label>
                  <p>{selectedNovedad.propietario}</p>
                </div>
                <div className="detail-group">
                  <label>Teléfono de Contacto</label>
                  <p>{selectedNovedad.celular}</p>
                </div>
                <div className="detail-group">
                  <label>Fecha y Hora de Ingreso</label>
                  <p>{selectedNovedad.fecha} - {selectedNovedad.hora}</p>
                </div>
                <div className="detail-group">
                  <label>ID Registro</label>
                  <p>{selectedNovedad.id}</p>
                </div>
              </div>

              <div className="detail-group" style={{ marginTop: '1rem' }}>
                <label>Observaciones Registradas</label>
                <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '6px' }}>
                  <p style={{ fontSize: '0.95rem', margin: 0 }}>{selectedNovedad.observacion}</p>
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
