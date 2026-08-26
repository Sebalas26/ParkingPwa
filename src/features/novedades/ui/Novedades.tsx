import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  AlertTriangle,
  Car,
  X,
  Plus,
  ShieldAlert,
  CheckCircle,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Building,
  User,
  Phone,
  FileText
} from 'lucide-react';
import { novedadesService } from '../data/novedadesService';
import type { VehicleIncidentDto, SaveVehicleIncidentDto } from '../model/NovedadesContracts';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';
import { authService } from '../../../features/auth/data/authService';
import './Novedades.css';

const COMMON_INCIDENT_TYPES = [
  'No Pago / Deuda Pendiente',
  'Vehículo Sospechoso / Intento de Hurto',
  'Bloqueo de Ingreso (Lista Negra)',
  'Daños a Instalaciones o Terceros',
  'Conflicto con Personal / Mala Conducta',
  'Vehículo con Daños Previos al Ingreso',
  'Observación Operativa',
];

export const Novedades: React.FC = () => {
  const { parqueaderosList, selectedParqueaderoId } = useParqueaderoContext();
  const [incidents, setIncidents] = useState<VehicleIncidentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'blocked' | 'active' | 'resolved'>('all');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<SaveVehicleIncidentDto | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isCustomType, setIsCustomType] = useState(false);

  const [selectedIncident, setSelectedIncident] = useState<VehicleIncidentDto | null>(null);
  const [resolvingIncident, setResolvingIncident] = useState<VehicleIncidentDto | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();
  const operatorName = currentUser?.fullName || currentUser?.username || 'Operador';

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await novedadesService.getAllIncidents();
      setIncidents(data || []);
    } catch (err) {
      console.error('Error al cargar novedades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [selectedParqueaderoId]);

  const handleOpenCreate = () => {
    setEditingIncident({
      plateNumber: '',
      branchId: selectedParqueaderoId ? Number(selectedParqueaderoId) : null,
      incidentType: COMMON_INCIDENT_TYPES[0],
      isBlocked: true, // Por defecto al agregar novedad grave se sugiere bloqueo
      description: '',
      reportedBy: operatorName,
      contactPhone: '',
      status: 'Activa',
    });
    setCurrentId(null);
    setIsCustomType(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inc: VehicleIncidentDto) => {
    const isCustom = !COMMON_INCIDENT_TYPES.includes(inc.incidentType);
    setIsCustomType(isCustom);
    setEditingIncident({
      incidentId: inc.incidentId,
      plateNumber: inc.plateNumber,
      branchId: inc.branchId,
      incidentType: inc.incidentType,
      isBlocked: inc.isBlocked,
      description: inc.description,
      reportedBy: inc.reportedBy,
      contactPhone: inc.contactPhone || '',
      status: inc.status,
    });
    setCurrentId(inc.incidentId);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident) return;

    if (!editingIncident.plateNumber.trim() || !editingIncident.incidentType.trim() || !editingIncident.description.trim()) {
      setErrorMsg('La placa, el tipo de novedad y la descripción son obligatorios.');
      return;
    }

    try {
      if (currentId) {
        await novedadesService.updateIncident(currentId, editingIncident);
      } else {
        await novedadesService.createIncident(editingIncident);
      }
      setIsModalOpen(false);
      setEditingIncident(null);
      setCurrentId(null);
      loadIncidents();
    } catch (err: any) {
      console.error('Error al guardar novedad:', err);
      setErrorMsg(err.message || 'Error al guardar los datos de la novedad.');
    }
  };

  const handleOpenResolve = (inc: VehicleIncidentDto) => {
    setResolvingIncident(inc);
    setResolveNotes('');
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIncident) return;

    try {
      await novedadesService.resolveIncident(resolvingIncident.incidentId, {
        resolvedNotes: resolveNotes.trim() || 'Novedad resuelta y bloqueo levantado.',
      });
      setResolvingIncident(null);
      setResolveNotes('');
      loadIncidents();
    } catch (err) {
      console.error('Error al resolver novedad:', err);
    }
  };

  const handleDelete = async (id: string, plate: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro de novedad para la placa "${plate}"?`)) {
      return;
    }

    try {
      await novedadesService.deleteIncident(id);
      loadIncidents();
    } catch (err) {
      console.error('Error al eliminar novedad:', err);
    }
  };

  // Filtrado de datos
  const filteredData = incidents.filter((n) => {
    // Filtro rápido de tabs
    if (filterType === 'blocked' && !n.isBlocked) return false;
    if (filterType === 'active' && n.status !== 'Activa') return false;
    if (filterType === 'resolved' && n.status !== 'Resuelta') return false;

    // Filtro por sede seleccionada (si aplica)
    if (selectedParqueaderoId && n.branchId && n.branchId !== Number(selectedParqueaderoId)) {
      return false;
    }

    const term = searchTerm.toLowerCase();
    return (
      n.plateNumber.toLowerCase().includes(term) ||
      n.incidentType.toLowerCase().includes(term) ||
      n.reportedBy.toLowerCase().includes(term) ||
      n.description.toLowerCase().includes(term) ||
      (n.contactPhone && n.contactPhone.toLowerCase().includes(term))
    );
  });

  const blockedCount = incidents.filter((i) => i.isBlocked && i.status === 'Activa').length;

  return (
    <div className="novedades-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      {/* Encabezado limpio y organizado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="novedades-header">
          <h1>Novedades e Incidencias en Sitio</h1>
          <p>Monitoreo de observaciones, cartera pendiente y bloqueo de placas en el parqueadero.</p>
        </div>

        <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleOpenCreate}>
          <Plus size={18} /> Agregar Novedad
        </button>
      </div>

      {/* Barra de Herramientas y Filtros */}
      <div className="novedades-toolbar">
        <div className="novedades-filters">
          <button
            className={`slicer-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Todas ({incidents.length})
          </button>
          <button
            className={`slicer-pill ${filterType === 'blocked' ? 'active' : ''}`}
            style={filterType === 'blocked' ? { background: '#dc2626', color: '#fff', borderColor: '#b91c1c' } : {}}
            onClick={() => setFilterType('blocked')}
          >
            <ShieldAlert size={14} style={{ marginRight: '4px' }} /> Bloqueados ({blockedCount})
          </button>
          <button
            className={`slicer-pill ${filterType === 'active' ? 'active' : ''}`}
            onClick={() => setFilterType('active')}
          >
            Activas ({incidents.filter((i) => i.status === 'Activa').length})
          </button>
          <button
            className={`slicer-pill ${filterType === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilterType('resolved')}
          >
            Resueltas ({incidents.filter((i) => i.status === 'Resuelta').length})
          </button>
        </div>

        <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '360px' }}>
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Buscar por placa, tipo, observador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Tabla de Novedades */}
      <div className="table-card" style={{ flex: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>PLACA</th>
              <th>TIPO NOVEDAD</th>
              <th>SEDE</th>
              <th>FECHA Y HORA</th>
              <th>REPORTADO POR</th>
              <th>OBSERVACIÓN</th>
              <th>ESTADO</th>
              <th className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((n) => (
                <tr key={n.incidentId} style={n.isBlocked && n.status === 'Activa' ? { background: 'rgba(239, 68, 68, 0.03)' } : {}}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div className="novedades-plate-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                        <Car size={14} style={{ color: 'var(--text-secondary)' }} />
                        {n.plateNumber}
                      </div>
                      {n.isBlocked && n.status === 'Activa' && (
                        <span
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #fca5a5',
                          }}
                        >
                          <Lock size={10} /> BLOQUEADO
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        n.incidentType.includes('No Pago') || n.incidentType.includes('Bloqueo') || n.incidentType.includes('Hurto')
                          ? 'badge-danger'
                          : n.incidentType.includes('Daño') || n.incidentType.includes('Conflicto')
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <AlertTriangle size={13} /> {n.incidentType}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {n.branchName || '🌐 Todas las Sedes'}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                    {n.createdAtUtc ? n.createdAtUtc.slice(0, 10) : '--'} <br />
                    <small>{n.createdAtUtc ? new Date(n.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                  </td>
                  <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {n.reportedBy}
                  </td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }} title={n.description}>
                    {n.description}
                  </td>
                  <td>
                    <span className={`badge ${n.status === 'Activa' ? (n.isBlocked ? 'badge-danger' : 'badge-warning') : 'badge-success'}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button className="btn-action primary" onClick={() => setSelectedIncident(n)} title="Ver Detalle">
                        <Eye size={15} />
                      </button>
                      <button className="btn-action primary" onClick={() => handleOpenEdit(n)} title="Editar Novedad">
                        <Edit2 size={15} />
                      </button>
                      {n.status === 'Activa' && (
                        <button
                          className="btn-action success"
                          style={{ color: '#10b981' }}
                          onClick={() => handleOpenResolve(n)}
                          title="Resolver Novedad y Desbloquear"
                        >
                          <Unlock size={15} />
                        </button>
                      )}
                      <button className="btn-action danger" onClick={() => handleDelete(n.incidentId, n.plateNumber)} title="Eliminar Registro">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center text-muted" style={{ padding: '3rem' }}>
                  {isLoading ? 'Consultando novedades activas...' : 'No hay novedades u observaciones registradas.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar / Editar Novedad */}
      {isModalOpen && editingIncident && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={20} color="#dc2626" />
                </div>
                <h3>{currentId ? `Editar Novedad - ${editingIncident.plateNumber}` : 'Registrar Nueva Novedad / Bloqueo'}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Placa del Vehículo *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej. ABC123"
                      value={editingIncident.plateNumber}
                      onChange={(e) => setEditingIncident({ ...editingIncident, plateNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                      required
                      maxLength={10}
                      style={{ fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sede Asociada</label>
                    <select
                      className="input-field"
                      value={editingIncident.branchId || ''}
                      onChange={(e) => setEditingIncident({ ...editingIncident, branchId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">🌐 Todas las Sedes (Global)</option>
                      {parqueaderosList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Tipo de Novedad *</label>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setIsCustomType(!isCustomType)}
                    >
                      {isCustomType ? '← Seleccionar de la lista' : '✎ Escribir personalizado'}
                    </button>
                  </div>
                  {isCustomType ? (
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Escribe el tipo de novedad..."
                      value={editingIncident.incidentType}
                      onChange={(e) => setEditingIncident({ ...editingIncident, incidentType: e.target.value })}
                      required
                    />
                  ) : (
                    <select
                      className="input-field"
                      value={editingIncident.incidentType}
                      onChange={(e) => setEditingIncident({ ...editingIncident, incidentType: e.target.value })}
                      required
                    >
                      {COMMON_INCIDENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Switch de Bloqueo de Ingreso Destacado */}
                <div
                  style={{
                    background: editingIncident.isBlocked ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-body)',
                    border: `1.5px solid ${editingIncident.isBlocked ? '#f87171' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={editingIncident.isBlocked}
                      onChange={(e) => setEditingIncident({ ...editingIncident, isBlocked: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: editingIncident.isBlocked ? '#dc2626' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={15} /> Bloquear ingreso en Parqueaderos (WPF y PWA)
                      </span>
                      <small style={{ display: 'block', color: 'var(--text-secondary)', marginTop: '2px', fontSize: '0.78rem' }}>
                        Si está marcado, el sistema WPF impedirá registrar el ingreso de esta placa y emitirá una alerta sonora.
                      </small>
                    </div>
                  </label>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Reportado Por</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Nombre del operador"
                      value={editingIncident.reportedBy}
                      onChange={(e) => setEditingIncident({ ...editingIncident, reportedBy: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono Contacto (Opcional)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej. 3001234567"
                      value={editingIncident.contactPhone || ''}
                      onChange={(e) => setEditingIncident({ ...editingIncident, contactPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción y Observaciones *</label>
                  <textarea
                    className="input-field"
                    style={{ minHeight: '85px', fontSize: '0.88rem' }}
                    placeholder="Describe en detalle los hechos ocurridos (ej. monto adeudado, fecha, comportamiento o requerimientos)..."
                    value={editingIncident.description}
                    onChange={(e) => setEditingIncident({ ...editingIncident, description: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  <CheckCircle size={16} /> {currentId ? 'Actualizar Novedad' : 'Guardar Novedad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Resolver Novedad / Desbloquear Placa */}
      {resolvingIncident && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Unlock size={20} color="#10b981" />
                </div>
                <h3>Resolver Novedad ({resolvingIncident.plateNumber})</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setResolvingIncident(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve}>
              <div className="modal-body">
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Al resolver esta novedad, <strong>el bloqueo de la placa será levantado de inmediato</strong> y el vehículo podrá volver a ingresar normalmente en todas las sedes.
                </p>

                <div className="form-group">
                  <label>Justificación / Notas de Resolución</label>
                  <textarea
                    className="input-field"
                    style={{ minHeight: '80px', fontSize: '0.88rem' }}
                    placeholder="Ej. El cliente canceló el saldo pendiente de $15.000 / Se aclaró el malentendido..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setResolvingIncident(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', background: '#10b981', borderColor: '#059669' }}>
                  <CheckCircle size={16} /> Confirmar Desbloqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Detalle */}
      {selectedIncident && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Car size={22} color="var(--primary-color)" />
                <h3>Detalle de Novedad - {selectedIncident.plateNumber}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedIncident(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="badge badge-warning" style={{ display: 'inline-flex', gap: '6px', fontSize: '0.88rem', padding: '6px 12px' }}>
                  <AlertTriangle size={16} /> {selectedIncident.incidentType}
                </span>
                {selectedIncident.isBlocked && selectedIncident.status === 'Activa' && (
                  <span className="badge badge-danger" style={{ display: 'inline-flex', gap: '4px', fontSize: '0.88rem', padding: '6px 12px' }}>
                    <Lock size={14} /> Vehículo Bloqueado
                  </span>
                )}
                <span className={`badge ${selectedIncident.status === 'Activa' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.88rem', padding: '6px 12px' }}>
                  Estado: {selectedIncident.status}
                </span>
              </div>

              <div className="novedad-details-grid">
                <div className="detail-group">
                  <label><User size={13} style={{ display: 'inline', marginRight: 4 }} /> Reportado por</label>
                  <p>{selectedIncident.reportedBy}</p>
                </div>
                <div className="detail-group">
                  <label><Phone size={13} style={{ display: 'inline', marginRight: 4 }} /> Teléfono de Contacto</label>
                  <p>{selectedIncident.contactPhone || 'No registrado'}</p>
                </div>
                <div className="detail-group">
                  <label><Building size={13} style={{ display: 'inline', marginRight: 4 }} /> Sede</label>
                  <p>{selectedIncident.branchName || '🌐 Todas las Sedes'}</p>
                </div>
                <div className="detail-group">
                  <label>Fecha de Registro</label>
                  <p>{selectedIncident.createdAtUtc ? selectedIncident.createdAtUtc.slice(0, 10) : '--'} ({selectedIncident.createdAtUtc ? new Date(selectedIncident.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''})</p>
                </div>
              </div>

              <div className="detail-group" style={{ marginTop: '1rem' }}>
                <label><FileText size={13} style={{ display: 'inline', marginRight: 4 }} /> Observaciones Registradas</label>
                <div style={{ background: 'var(--bg-body)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '6px' }}>
                  <p style={{ fontSize: '0.92rem', margin: 0, lineHeight: 1.5 }}>{selectedIncident.description}</p>
                </div>
              </div>

              {selectedIncident.resolvedNotes && (
                <div className="detail-group" style={{ marginTop: '1rem' }}>
                  <label style={{ color: '#10b981', fontWeight: 700 }}>Notas de Resolución / Desbloqueo</label>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #a7f3d0', marginTop: '6px' }}>
                    <p style={{ fontSize: '0.9rem', margin: 0, color: '#065f46' }}>{selectedIncident.resolvedNotes}</p>
                    {selectedIncident.resolvedAtUtc && (
                      <small style={{ display: 'block', marginTop: '4px', color: '#047857' }}>
                        Fecha: {selectedIncident.resolvedAtUtc.slice(0, 10)} {new Date(selectedIncident.resolvedAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedIncident(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
