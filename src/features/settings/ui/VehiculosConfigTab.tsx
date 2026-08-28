import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Loader2, X, Car, Bike, Truck, ChevronDown } from 'lucide-react';
import type { VehiculoConfigDto, SaveVehiculoConfigDto } from '../model/VehiculosConfigContracts';
import { vehiculosConfigService } from '../data/vehiculosConfigService';
import { authService } from '../../auth/data/authService';
import { ModalPortal } from '../../../shared/ui/ModalPortal';

export const VehiculosConfigTab: React.FC = () => {
  const [configs, setConfigs] = useState<VehiculoConfigDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<SaveVehiculoConfigDto> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingConfig, setDeletingConfig] = useState<VehiculoConfigDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedConfigId, setExpandedConfigId] = useState<number | string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await vehiculosConfigService.getGlobalTypes();
      setConfigs(data || []);
    } catch (err) {
      console.error('Error al cargar catálogo de tipos de vehículos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingConfig({
      branchId: null,
      vehicleType: 0,
      category: '',
      gracePeriodMinutes: 15,
      hourRate: 0,
      minuteRate: 0,
      fullDayRate: 0,
      iconKey: 'IconCar',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehiculoConfigDto) => {
    setEditingConfig({ ...v });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (v: VehiculoConfigDto) => {
    setDeletingConfig(v);
  };

  const handleConfirmDelete = async () => {
    if (!deletingConfig || !deletingConfig.rateId) return;
    setIsDeleting(true);
    try {
      await vehiculosConfigService.deleteConfig(deletingConfig.rateId);
      setConfigs((prev) => prev.filter((c) => c.rateId !== deletingConfig.rateId));
      setDeletingConfig(null);
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el tipo de vehículo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const inferVehicleType = (name: string): { type: number; icon: string } => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('moto')) return { type: 1, icon: 'IconMotorcycle' };
    if (lower.includes('camion') || lower.includes('camión') || lower.includes('pesado')) return { type: 2, icon: 'IconTruck' };
    if (lower.includes('furgon') || lower.includes('furgón') || lower.includes('van')) return { type: 3, icon: 'IconVan' };
    if (lower.includes('bici') || lower.includes('cicla')) return { type: 4, icon: 'IconBike' };
    if (lower.includes('suv') || lower.includes('camioneta')) return { type: 5, icon: 'IconCar' };
    return { type: 0, icon: 'IconCar' };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig || !editingConfig.category || !editingConfig.category.trim()) {
      alert('Por favor ingresa el nombre o tipo de vehículo.');
      return;
    }

    const { type, icon } = inferVehicleType(editingConfig.category);
    const payload: SaveVehiculoConfigDto = {
      rateId: editingConfig.rateId,
      branchId: null,
      vehicleType: editingConfig.vehicleType !== undefined ? editingConfig.vehicleType : type,
      category: editingConfig.category.trim(),
      hourRate: 0,
      minuteRate: 0,
      fullDayRate: 0,
      gracePeriodMinutes: 15,
      iconKey: editingConfig.iconKey || icon,
      isActive: editingConfig.isActive ?? true,
    };

    setIsSaving(true);
    try {
      await vehiculosConfigService.saveConfig(payload, null);
      setIsModalOpen(false);
      setEditingConfig(null);
      await loadConfigs();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar tipo de vehículo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Tipos de Vehículos</h2>
          <p>Catálogo general de tipos de vehículos disponibles para operar en los parqueaderos del sistema.</p>
        </div>
        {(authService.hasPermission('settings.vehiculos.manage') || authService.hasPermission('rates.create')) && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Tipo de Vehículo
          </button>
        )}
      </div>

      {/* 1. VISTA DESKTOP - TABLA CLÁSICA */}
      <div className="desktop-table-view">
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ minWidth: '480px' }}>
            <thead>
              <tr>
                <th>TIPO / CATEGORÍA DE VEHÍCULO</th>
                <th>ESTADO EN CATÁLOGO</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {configs.length > 0 ? (
                configs.map((c) => (
                  <tr key={c.rateId || c.category}>
                    <td className="font-bold">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                        {Number(c.vehicleType) === 1 ? <Bike size={18} color="#2563eb" /> : Number(c.vehicleType) === 2 ? <Truck size={18} color="#d97706" /> : <Car size={18} color="#07665e" />}
                        <span>{c.category}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {c.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                      {(authService.hasPermission('settings.vehiculos.manage') || authService.hasPermission('rates.edit')) && (
                        <button className="btn-icon" style={{ marginRight: '4px' }} onClick={() => handleOpenEdit(c)} title="Editar Tipo de Vehículo">
                          <Edit2 size={16} />
                        </button>
                      )}
                      {(authService.hasPermission('settings.vehiculos.manage') || authService.hasPermission('rates.delete')) && (
                        <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => handleOpenDelete(c)} title="Eliminar Tipo de Vehículo">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {isLoading ? 'Cargando tipos de vehículos...' : 'No hay tipos de vehículos registrados en el catálogo general. Crea los tipos de vehículos que tu negocio recibe (ej: Automóvil, Motocicleta, Camión).'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. VISTA MOBILE - LISTA DE TARJETAS EXPANDIBLES (ACCORDION) */}
      <div className="mobile-card-list">
        {configs.length > 0 ? (
          configs.map((c) => {
            const keyId = c.rateId || c.category;
            const isExpanded = expandedConfigId === keyId;
            const isBike = Number(c.vehicleType) === 1;
            const isTruck = Number(c.vehicleType) === 2;

            return (
              <div key={keyId} className={`expandable-card ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="expandable-card-header"
                  onClick={() => setExpandedConfigId(isExpanded ? null : keyId)}
                >
                  <div className="expandable-card-main">
                    <div
                      className="expandable-card-avatar"
                      style={{
                        background: isBike ? '#dbeafe' : isTruck ? '#ffedd5' : '#ccfbf1',
                        color: isBike ? '#1d4ed8' : isTruck ? '#c2410c' : '#0f766e',
                      }}
                    >
                      {isBike ? <Bike size={20} /> : isTruck ? <Truck size={20} /> : <Car size={20} />}
                      <span className={`avatar-status-dot ${c.isActive ? 'active' : 'inactive'}`} />
                    </div>
                    <div className="expandable-card-info">
                      <span className="expandable-card-title">{c.category}</span>
                      <span className="expandable-card-subtitle">
                        Tipo: {isBike ? 'Motocicleta / 2 Ruedas' : isTruck ? 'Vehículo Pesado / Camión' : 'Vehículo Ligero / Automóvil'}
                      </span>
                    </div>
                  </div>
                  <div className={`expandable-card-chevron ${isExpanded ? 'expanded' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="expandable-card-body">
                    <div className="card-details-panel">
                      <div className="card-detail-row">
                        <span className="card-detail-label">Categoría:</span>
                        <span className="card-detail-value">{c.category}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Clasificación:</span>
                        <span className="card-detail-value">
                          {isBike ? 'Motocicleta (2 Ruedas)' : isTruck ? 'Pesado / Camión' : 'Automóvil / Camioneta'}
                        </span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Estado en Catálogo:</span>
                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {c.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="expandable-card-actions">
                      {(authService.hasPermission('settings.vehiculos.manage') || authService.hasPermission('rates.edit')) && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-outline"
                          onClick={() => handleOpenEdit(c)}
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                      )}
                      {(authService.hasPermission('settings.vehiculos.manage') || authService.hasPermission('rates.delete')) && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-danger"
                          onClick={() => handleOpenDelete(c)}
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '14px' }}>
            {isLoading ? 'Cargando tipos de vehículos...' : 'No hay tipos de vehículos registrados.'}
          </div>
        )}
      </div>

      {isModalOpen && editingConfig && (
        <ModalPortal>
          <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{editingConfig.rateId ? 'Editar Tipo de Vehículo' : 'Nuevo Tipo de Vehículo'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Nombre / Tipo de Vehículo *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Automóvil, Motocicleta, Camión, Bicicleta"
                    value={editingConfig.category || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, category: e.target.value })}
                    required
                    autoFocus
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '6px', display: 'block' }}>
                    Las tarifas de cobro por hora, minuto y día se parametrizan al asignar este tipo a cada parqueadero.
                  </small>
                </div>

                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingConfig.isActive ?? true}
                      onChange={(e) => setEditingConfig({ ...editingConfig, isActive: e.target.checked })}
                    />
                    <span>Tipo de Vehículo Activo en el Sistema</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={14} className="spinner" /> Guardando...
                    </span>
                  ) : (
                    'Guardar Tipo de Vehículo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Modal de Confirmación para Eliminar Tipo de Vehículo */}
      {deletingConfig && (
        <ModalPortal>
          <div className="confirm-dialog-overlay" style={{ zIndex: 20000 }}>
          <div className="confirm-dialog-card">
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              ¿Eliminar Tipo de Vehículo?
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas eliminar el tipo de vehículo <strong>"{deletingConfig.category}"</strong> del catálogo general?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => setDeletingConfig(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                style={{ flex: 1, padding: '10px' }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Loader2 size={14} className="spinner" /> Eliminando...
                  </span>
                ) : (
                  'Sí, Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};
