import React, { useState, useEffect } from 'react';
import { Plus, Edit2, CreditCard, ChevronDown, AlertCircle, CheckCircle2, PauseCircle, Loader2 } from 'lucide-react';
import type { PaymentMethodDto, SavePaymentMethodDto } from '../model/MediosPagoContracts';
import { mediosPagoService } from '../data/mediosPagoService';
import { useAuthSession } from '../../../shared/hooks/useAuthSession';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';

const PAYMENT_EMOJIS = [
  { emoji: '💵', label: 'Efectivo' },
  { emoji: '💳', label: 'Tarjeta' },
  { emoji: '📱', label: 'Móvil / Nequi' },
  { emoji: '📲', label: 'QR / Pasarela' },
  { emoji: '🏦', label: 'Transferencia' },
  { emoji: '💰', label: 'Monedero' },
  { emoji: '🪙', label: 'Monedas' },
  { emoji: '👛', label: 'Billetera' },
  { emoji: '🧾', label: 'Recibo' },
  { emoji: '💸', label: 'Remesa' },
  { emoji: '🏧', label: 'Datáfono' },
  { emoji: '🎟️', label: 'Bono / Vale' },
  { emoji: '🏷️', label: 'Descuento' },
  { emoji: '⚡', label: 'Rápido' },
  { emoji: '💎', label: 'Puntos' },
  { emoji: '💼', label: 'Empresarial' },
];

export const MediosPagoTab: React.FC = () => {
  const { hasPermission } = useAuthSession();
  const canCreate = hasPermission('payment_methods.create');
  const canEdit = hasPermission('payment_methods.edit');
  const { selectedParqueaderoId } = useParqueaderoContext();
  const [mediosPago, setMediosPago] = useState<PaymentMethodDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedio, setEditingMedio] = useState<SavePaymentMethodDto | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPaymentId, setExpandedPaymentId] = useState<number | null>(null);

  const loadMediosPago = async () => {
    setIsLoading(true);
    try {
      const data = await mediosPagoService.getPaymentMethods(selectedParqueaderoId ?? undefined);
      setMediosPago(data || []);
    } catch (err) {
      console.error('Error al cargar medios de pago:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMediosPago();
  }, [selectedParqueaderoId]);

  const validateMedioPagoForm = (form: SavePaymentMethodDto): Record<string, string> => {
    const errors: Record<string, string> = {};
    const name = (form.name || '').trim();

    if (!name) {
      errors.name = 'El nombre del medio de pago es obligatorio.';
    } else if (name.length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres.';
    } else {
      const isDup = mediosPago.some(
        (mp) =>
          mp.id !== form.id &&
          (mp.name || '').trim().toLowerCase() === name.toLowerCase()
      );
      if (isDup) {
        errors.name = 'Este medio de pago ya existe en la empresa.';
      }
    }

    return errors;
  };

  const handleNameChange = (val: string) => {
    setEditingMedio((prev) => (prev ? { ...prev, name: val } : null));
    if (formErrors.name) {
      const updated = { ...(editingMedio || { name: '', icon: '💵', isActive: true }), name: val };
      const errs = validateMedioPagoForm(updated);
      if (!errs.name) {
        setFormErrors((prev) => {
          const copy = { ...prev };
          delete copy.name;
          return copy;
        });
      } else {
        setFormErrors((prev) => ({ ...prev, name: errs.name }));
      }
    } else if (val.trim()) {
      const updated = { ...(editingMedio || { name: '', icon: '💵', isActive: true }), name: val };
      const errs = validateMedioPagoForm(updated);
      if (errs.name) {
        setFormErrors((prev) => ({ ...prev, name: errs.name }));
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingMedio({
      name: '',
      icon: '💵',
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mp: PaymentMethodDto) => {
    const isAct = mp.isActive ?? (mp.status === true || mp.status === 'Activo' || mp.status === 'Active');
    setEditingMedio({
      id: mp.id,
      name: mp.name,
      icon: mp.icon || '💳',
      isActive: isAct,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedio) return;

    const errors = validateMedioPagoForm(editingMedio);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setIsSaving(true);
    try {
      await mediosPagoService.createOrEditPaymentMethod({
        id: editingMedio.id,
        name: editingMedio.name.trim(),
        icon: editingMedio.icon || '💳',
        isActive: editingMedio.isActive ?? true,
        companyId: selectedParqueaderoId ?? undefined,
      });
      setIsModalOpen(false);
      setEditingMedio(null);
      await loadMediosPago();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el medio de pago en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return <CreditCard size={18} style={{ color: '#07665e' }} />;

    // Si es un emoji o cadena directa de emoji
    if (/\p{Extended_Pictographic}/u.test(iconName) || iconName.length <= 4) {
      return (
        <span
          style={{
            fontSize: '1.25rem',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {iconName}
        </span>
      );
    }

    switch (iconName.toLowerCase()) {
      case 'banknote':
      case 'cash':
      case 'efectivo':
        return <span style={{ fontSize: '1.25rem' }}>💵</span>;
      case 'qrcode':
      case 'qr':
        return <span style={{ fontSize: '1.25rem' }}>📲</span>;
      case 'smartphone':
      case 'transfer':
      case 'nequi':
      case 'daviplata':
        return <span style={{ fontSize: '1.25rem' }}>📱</span>;
      case 'wallet':
        return <span style={{ fontSize: '1.25rem' }}>👛</span>;
      default:
        return <span style={{ fontSize: '1.25rem' }}>💳</span>;
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Medios de Pago</h2>
          <p>Configura las formas de recaudación y cobro disponibles en las cajas del parqueadero (Efectivo, Tarjetas, Transferencias, etc.).</p>
        </div>
        {canCreate && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Medio de Pago
          </button>
        )}
      </div>

      {/* 1. VISTA DESKTOP - TABLA CLÁSICA */}
      <div className="desktop-table-view">
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ minWidth: '520px' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>MEDIO DE PAGO</th>
                <th>ÍCONO</th>
                <th>ESTADO</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {mediosPago.length > 0 ? (
                mediosPago.map((mp) => {
                  const isAct = mp.isActive ?? (mp.status === 'Activo' || mp.status === true || mp.status === 'Active');

                  return (
                    <tr key={mp.id}>
                      <td className="font-bold text-muted">#{mp.id}</td>
                      <td className="font-bold">
                        <span style={{ whiteSpace: 'nowrap' }}>{mp.name}</span>
                      </td>
                      <td>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(7, 102, 94, 0.08)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                          }}
                        >
                          {getIconComponent(mp.icon || mp.name)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isAct ? 'badge-success' : 'badge-danger'}`}>
                          {isAct ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {canEdit && (
                            <button className="btn-action primary" onClick={() => handleOpenEdit(mp)}>
                              <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {isLoading ? 'Cargando medios de pago desde la API...' : 'No se encontraron medios de pago registrados en la base de datos.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. VISTA MOBILE - LISTA DE TARJETAS EXPANDIBLES (ACCORDION) */}
      <div className="mobile-card-list">
        {mediosPago.length > 0 ? (
          mediosPago.map((mp) => {
            const isAct = mp.isActive ?? (mp.status === 'Activo' || mp.status === true || mp.status === 'Active');
            const isExpanded = expandedPaymentId === mp.id;

            return (
              <div key={mp.id} className={`expandable-card ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="expandable-card-header"
                  onClick={() => setExpandedPaymentId(isExpanded ? null : mp.id)}
                >
                  <div className="expandable-card-main">
                    <div
                      className="expandable-card-avatar"
                      style={{ background: '#f1f5f9', color: '#0f172a', fontSize: '1.35rem' }}
                    >
                      {getIconComponent(mp.icon || mp.name)}
                      <span className={`avatar-status-dot ${isAct ? 'active' : 'inactive'}`} />
                    </div>
                    <div className="expandable-card-info">
                      <span className="expandable-card-title">{mp.name}</span>
                      <span className="expandable-card-subtitle">
                        ID #{mp.id} • {isAct ? 'Disponible en caja' : 'Deshabilitado'}
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
                        <span className="card-detail-label">Identificador:</span>
                        <span className="card-detail-value">#{mp.id}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Nombre Comercial:</span>
                        <span className="card-detail-value">{mp.name}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Ícono Representativo:</span>
                        <span className="card-detail-value">{getIconComponent(mp.icon || mp.name)}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Estado en Cajas:</span>
                        <span className={`badge ${isAct ? 'badge-success' : 'badge-danger'}`}>
                          {isAct ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="expandable-card-actions">
                      {canEdit && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-outline"
                          onClick={() => handleOpenEdit(mp)}
                        >
                          <Edit2 size={14} /> Editar
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
            {isLoading ? 'Cargando medios de pago...' : 'No hay medios de pago registrados.'}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Medio de Pago */}
      {isModalOpen && editingMedio && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !isSaving && setIsModalOpen(false)}>
            <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingMedio.id ? 'Editar Medio de Pago' : 'Crear Medio de Pago'}</h3>
              </div>

              <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
                <div className="modal-body">
                  <div className={`form-group ${formErrors.name ? 'has-error' : ''}`}>
                    <label>
                      Nombre del Medio de Pago <span className="required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      className={`input-field ${formErrors.name ? 'input-error' : ''}`}
                      placeholder="Ej. Efectivo, Nequi, Daviplata, Tarjeta Crédito..."
                      value={editingMedio.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      disabled={isSaving}
                      autoFocus
                    />
                    {formErrors.name && (
                      <span className="form-field-error">
                        <AlertCircle size={12} /> {formErrors.name}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Selecciona un Ícono Representativo</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Seleccionado: <strong style={{ fontSize: '1.2rem', marginLeft: '4px' }}>{editingMedio.icon || '💳'}</strong>
                      </span>
                    </label>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: '6px',
                        background: 'var(--bg-secondary, #f8fafc)',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                      }}
                    >
                      {PAYMENT_EMOJIS.map(({ emoji, label }) => {
                        const isSelected = (editingMedio.icon || '💳') === emoji;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            title={label}
                            onClick={() => !isSaving && setEditingMedio({ ...editingMedio, icon: emoji })}
                            disabled={isSaving}
                            style={{
                              fontSize: '1.35rem',
                              padding: '8px 4px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #07665e' : '1px solid #e2e8f0',
                              background: isSelected ? 'rgba(7, 102, 94, 0.15)' : '#ffffff',
                              cursor: isSaving ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                              transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                            }}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estado del Medio de Pago - Switch Card Moderno */}
                  <div
                    onClick={() => !isSaving && setEditingMedio({ ...editingMedio, isActive: !(editingMedio.isActive ?? true) })}
                    style={{
                      marginTop: '10px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: (editingMedio.isActive ?? true) ? '1px solid #10b981' : '1px solid #e2e8f0',
                      background: (editingMedio.isActive ?? true) ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
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
                          background: (editingMedio.isActive ?? true) ? 'rgba(16, 185, 129, 0.12)' : '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: (editingMedio.isActive ?? true) ? '#059669' : '#64748b',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {(editingMedio.isActive ?? true) ? <CheckCircle2 size={20} /> : <PauseCircle size={20} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: (editingMedio.isActive ?? true) ? '#065f46' : '#334155' }}>
                          {(editingMedio.isActive ?? true) ? 'Medio de Pago Habilitado (Activo en Caja)' : 'Medio de Pago Desactivado (Pausado)'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {(editingMedio.isActive ?? true)
                            ? 'Disponible para registrar cobros y recaudos en terminales de caja.'
                            : 'No estará disponible para liquidar tickets o mensualidades.'}
                        </div>
                      </div>
                    </div>

                    {/* iOS Style Toggle Switch Knob */}
                    <div
                      style={{
                        width: '46px',
                        height: '26px',
                        borderRadius: '13px',
                        background: (editingMedio.isActive ?? true) ? '#07665e' : '#cbd5e1',
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
                          left: (editingMedio.isActive ?? true) ? '23px' : '3px',
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
                    style={{ width: 'auto' }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Loader2 size={14} className="spinner" /> Guardando...
                      </span>
                    ) : (
                      editingMedio.id ? 'Guardar Cambios' : 'Crear Medio de Pago'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
