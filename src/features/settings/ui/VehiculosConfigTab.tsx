import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Loader2, Car, Bike, Truck, ChevronDown, AlertCircle, CheckCircle2, PauseCircle } from 'lucide-react';
import type { VehiculoConfigDto, SaveVehiculoConfigDto } from '../model/VehiculosConfigContracts';
import { vehiculosConfigService } from '../data/vehiculosConfigService';
import { authService } from '../../auth/data/authService';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';

export const VehiculosConfigTab: React.FC = () => {
  const { selectedParqueaderoId } = useParqueaderoContext();
  const [configs, setConfigs] = useState<VehiculoConfigDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<SaveVehiculoConfigDto> | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingConfig, setDeletingConfig] = useState<VehiculoConfigDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedConfigId, setExpandedConfigId] = useState<number | string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, [selectedParqueaderoId]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await vehiculosConfigService.getGlobalTypes(selectedParqueaderoId ?? undefined);
      setConfigs(data || []);
    } catch (err) {
      console.error('Error al cargar catálogo de tipos de vehículos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateVehicleForm = (form: Partial<SaveVehiculoConfigDto>): Record<string, string> => {
    const errors: Record<string, string> = {};
    const name = (form.category || '').trim();

    if (!name) {
      errors.category = 'El nombre o tipo de vehículo es obligatorio.';
    } else if (name.length < 2) {
      errors.category = 'El tipo de vehículo debe tener al menos 2 caracteres.';
    } else {
      const isDup = configs.some(
        (c) =>
          c.rateId !== form.rateId &&
          (c.category || '').trim().toLowerCase() === name.toLowerCase()
      );
      if (isDup) {
        errors.category = 'Este tipo de vehículo ya existe en el catálogo.';
      }
    }

    return errors;
  };

  const handleCategoryChange = (val: string) => {
    setEditingConfig((prev) => (prev ? { ...prev, category: val } : null));
    if (formErrors.category) {
      const updated = { ...(editingConfig || {}), category: val };
      const errs = validateVehicleForm(updated);
      if (!errs.category) {
        setFormErrors((prev) => {
          const copy = { ...prev };
          delete copy.category;
          return copy;
        });
      } else {
        setFormErrors((prev) => ({ ...prev, category: errs.category }));
      }
    } else if (val.trim()) {
      const updated = { ...(editingConfig || {}), category: val };
      const errs = validateVehicleForm(updated);
      if (errs.category) {
        setFormErrors((prev) => ({ ...prev, category: errs.category }));
      }
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
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehiculoConfigDto) => {
    setEditingConfig({ ...v });
    setFormErrors({});
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
    if (!editingConfig) return;

    const errors = validateVehicleForm(editingConfig);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const { type, icon } = inferVehicleType(editingConfig.category || '');
    const payload: SaveVehiculoConfigDto = {
      rateId: editingConfig.rateId,
      branchId: null,
      vehicleType: editingConfig.vehicleType !== undefined ? editingConfig.vehicleType : type,
      category: (editingConfig.category || '').trim(),
      hourRate: 0,
      minuteRate: 0,
      fullDayRate: 0,
      gracePeriodMinutes: 15,
      iconKey: editingConfig.iconKey || icon,
      isActive: editingConfig.isActive ?? true,
    };

    setIsSaving(true);
    try {
      await vehiculosConfigService.saveConfig({ ...payload, companyId: selectedParqueaderoId ?? undefined }, null);
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
          <div className="modal-overlay" onClick={() => !isSaving && setIsModalOpen(false)}>
            <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingConfig.rateId ? 'Editar Tipo de Vehículo' : 'Nuevo Tipo de Vehículo'}</h3>
              </div>

              <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
                <div className="modal-body">
                  <div className={`form-group ${formErrors.category ? 'has-error' : ''}`} style={{ marginBottom: '16px' }}>
                    <label>
                      Nombre / Tipo de Vehículo <span className="required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      className={`input-field ${formErrors.category ? 'input-error' : ''}`}
                      placeholder="Ej: Automóvil, Motocicleta, Camión, Bicicleta"
                      value={editingConfig.category || ''}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      disabled={isSaving}
                      autoFocus
                    />
                    {formErrors.category && (
                      <span className="form-field-error">
                        <AlertCircle size={12} /> {formErrors.category}
                      </span>
                    )}
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '6px', display: 'block' }}>
                      Las tarifas de cobro por hora, minuto y día se parametrizan al asignar este tipo a cada parqueadero.
                    </small>
                  </div>

                  {/* Estado del Tipo de Vehículo - Switch Card Moderno */}
                  <div
                    onClick={() => !isSaving && setEditingConfig({ ...editingConfig, isActive: !(editingConfig.isActive ?? true) })}
                    style={{
                      marginTop: '8px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: (editingConfig.isActive ?? true) ? '1px solid #10b981' : '1px solid #e2e8f0',
                      background: (editingConfig.isActive ?? true) ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: (editingConfig.isActive ?? true) ? 'rgba(16, 185, 129, 0.12)' : '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: (editingConfig.isActive ?? true) ? '#059669' : '#64748b',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {(editingConfig.isActive ?? true) ? <CheckCircle2 size={20} /> : <PauseCircle size={20} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: (editingConfig.isActive ?? true) ? '#065f46' : '#334155' }}>
                          {(editingConfig.isActive ?? true) ? 'Tipo de Vehículo Habilitado' : 'Tipo de Vehículo Desactivado'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {(editingConfig.isActive ?? true)
                            ? 'Activo y disponible para operar en parqueaderos.'
                            : 'Pausado (no se podrá asignar a nuevos parqueaderos).'}
                        </div>
                      </div>
                    </div>

                    {/* iOS Style Toggle Switch Knob */}
                    <div
                      style={{
                        width: '46px',
                        height: '26px',
                        borderRadius: '13px',
                        background: (editingConfig.isActive ?? true) ? '#07665e' : '#cbd5e1',
                        position: 'relative',
                        transition: 'background 0.25s ease',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: '3px',
                          left: (editingConfig.isActive ?? true) ? '23px' : '3px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving || Boolean(formErrors.category) || !editingConfig.category?.trim()}
                  >
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
