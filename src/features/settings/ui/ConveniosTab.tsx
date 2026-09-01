import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Tag, Percent, DollarSign, Trash2, Upload, Image as ImageIcon, ChevronDown, AlertCircle, CheckCircle2, PauseCircle, Loader2 } from 'lucide-react';
import type { CommercialAgreementDto, SaveCommercialAgreementDto } from '../model/ConveniosContracts';
import { conveniosService } from '../data/conveniosService';
import { useAuthSession } from '../../../shared/hooks/useAuthSession';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';

const formatCurrencyDisplay = (val?: number | string | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/\D/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('es-CO');
};

export const ConveniosTab: React.FC = () => {
  const { hasPermission } = useAuthSession();
  const canCreate = hasPermission('agreements.create');
  const canEdit = hasPermission('agreements.edit');
  const canDelete = hasPermission('agreements.delete');
  const { selectedParqueaderoId } = useParqueaderoContext();
  const [convenios, setConvenios] = useState<CommercialAgreementDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState<SaveCommercialAgreementDto | null>(null);
  const [discountMode, setDiscountMode] = useState<'percentage' | 'fixed'>('percentage');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedAgreementId, setExpandedAgreementId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await conveniosService.getAllAgreements(selectedParqueaderoId ?? undefined);
      setConvenios(data || []);
    } catch (err) {
      console.error('Error al cargar convenios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedParqueaderoId]);

  const handleOpenCreate = () => {
    setEditingConvenio({
      storeId: '',
      name: '',
      minPurchaseAmount: 0,
      discountPercentage: undefined as any,
      discountFixedAmount: undefined as any,
      maxHoursApplicable: undefined as any,
      isActive: true,
      imageUrl: null,
    });
    setDiscountMode('percentage');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CommercialAgreementDto) => {
    const isFixed = Boolean(c.discountFixedAmount && c.discountFixedAmount > 0 && (!c.discountPercentage || c.discountPercentage === 0));
    setDiscountMode(isFixed ? 'fixed' : 'percentage');
    setEditingConvenio({
      agreementId: c.agreementId,
      storeId: c.storeId || '',
      name: c.name || '',
      minPurchaseAmount: c.minPurchaseAmount || 0,
      discountPercentage: c.discountPercentage,
      discountFixedAmount: c.discountFixedAmount,
      maxHoursApplicable: c.maxHoursApplicable,
      isActive: c.isActive,
      imageUrl: c.imageUrl || null,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen seleccionada supera el límite máximo de 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditingConvenio((prev) => (prev ? { ...prev, imageUrl: base64 } : null));
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.imageUrl;
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setEditingConvenio((prev) => (prev ? { ...prev, imageUrl: null } : null));
    setFormErrors((prev) => ({ ...prev, imageUrl: 'La imagen o logo del convenio es obligatorio.' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateConvenioForm = (form: SaveCommercialAgreementDto, mode: 'percentage' | 'fixed'): Record<string, string> => {
    const errors: Record<string, string> = {};

    // 1. Imagen Obligatoria
    if (!form.imageUrl || !form.imageUrl.trim()) {
      errors.imageUrl = 'La imagen o logo del convenio es obligatorio.';
    }

    // 2. Nombre del Convenio
    if (!form.name || !form.name.trim()) {
      errors.name = 'El nombre del convenio es obligatorio.';
    } else if (form.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres.';
    } else {
      const isDup = convenios.some(
        (c) =>
          c.agreementId !== form.agreementId &&
          (c.name || '').trim().toLowerCase() === form.name.trim().toLowerCase()
      );
      if (isDup) {
        errors.name = 'Este nombre de convenio ya existe en el parqueadero.';
      }
    }

    // 3. Modalidad de Descuento
    if (mode === 'percentage') {
      const pct = form.discountPercentage !== undefined && form.discountPercentage !== null ? Number(form.discountPercentage) : NaN;
      if (isNaN(pct) || pct <= 0) {
        errors.discountPercentage = 'Ingresa un porcentaje de descuento válido (mínimo 1%).';
      } else if (pct > 100) {
        errors.discountPercentage = 'El porcentaje no puede ser mayor al 100%.';
      }
    } else {
      const fixed = form.discountFixedAmount !== undefined && form.discountFixedAmount !== null ? Number(form.discountFixedAmount) : NaN;
      if (isNaN(fixed) || fixed <= 0) {
        errors.discountFixedAmount = 'Ingresa un valor de descuento fijo mayor a 0.';
      }
    }

    return errors;
  };

  const handleNameChange = (val: string) => {
    setEditingConvenio((prev) => (prev ? { ...prev, name: val } : null));
    if (formErrors.name) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.name;
        return copy;
      });
    }
  };

  const handlePercentageChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    let num = clean ? Number(clean) : undefined;
    if (num !== undefined && num > 100) num = 100;
    setEditingConvenio((prev) => (prev ? { ...prev, discountPercentage: num } : null));
    if (formErrors.discountPercentage) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.discountPercentage;
        return copy;
      });
    }
  };

  const handleFixedAmountChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    const num = clean ? Number(clean) : undefined;
    setEditingConvenio((prev) => (prev ? { ...prev, discountFixedAmount: num } : null));
    if (formErrors.discountFixedAmount) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.discountFixedAmount;
        return copy;
      });
    }
  };

  const handleMinPurchaseChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    const num = clean ? Number(clean) : 0;
    setEditingConvenio((prev) => (prev ? { ...prev, minPurchaseAmount: num } : null));
    if (formErrors.minPurchaseAmount) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.minPurchaseAmount;
        return copy;
      });
    }
  };

  const handleMaxHoursChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    const num = clean ? Number(clean) : undefined;
    setEditingConvenio((prev) => (prev ? { ...prev, maxHoursApplicable: num } : null));
    if (formErrors.maxHoursApplicable) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.maxHoursApplicable;
        return copy;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConvenio) return;

    const errors = validateConvenioForm(editingConvenio, discountMode);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const payload: SaveCommercialAgreementDto = {
      agreementId: editingConvenio.agreementId,
      storeId: editingConvenio.storeId || '',
      name: editingConvenio.name.trim(),
      discountPercentage: discountMode === 'percentage' ? (Number(editingConvenio.discountPercentage) || 0) : null,
      discountFixedAmount: discountMode === 'fixed' ? (Number(editingConvenio.discountFixedAmount) || 0) : null,
      minPurchaseAmount: Number(editingConvenio.minPurchaseAmount) || 0,
      maxHoursApplicable: editingConvenio.maxHoursApplicable ? Number(editingConvenio.maxHoursApplicable) : null,
      isActive: editingConvenio.isActive ?? true,
      imageUrl: editingConvenio.imageUrl || null,
    };

    setIsSaving(true);
    try {
      if (editingConvenio.agreementId) {
        await conveniosService.updateAgreement(editingConvenio.agreementId, payload, selectedParqueaderoId ?? undefined);
      } else {
        await conveniosService.createAgreement(payload, selectedParqueaderoId ?? undefined);
      }
      setIsModalOpen(false);
      setEditingConvenio(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el convenio comercial.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Deseas eliminar este convenio comercial de forma permanente?')) {
      await conveniosService.deactivateAgreement(id);
      await loadData();
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Convenios Comerciales</h2>
          <p>Administra los convenios de descuento, logos aliados y tarifas preferenciales aplicables en caja.</p>
        </div>

        {canCreate && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Convenio
          </button>
        )}
      </div>      {/* 1. VISTA DESKTOP - TABLA CLÁSICA */}
      <div className="desktop-table-view">
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ minWidth: '600px' }}>
            <thead>
              <tr>
                <th>CONVENIO / LOGO</th>
                <th>DESCUENTO / BENEFICIO</th>
                <th>COMPRA MÍNIMA</th>
                <th>MÁXIMO HORAS</th>
                <th>ESTADO</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {convenios.length > 0 ? (
                convenios.map((c) => {
                  const isFixed = Boolean(c.discountFixedAmount && c.discountFixedAmount > 0);
                  const discountText = isFixed
                    ? `$${(c.discountFixedAmount || 0).toLocaleString()} de descuento`
                    : `${c.discountPercentage || 0}% de descuento`;

                  return (
                    <tr key={c.agreementId}>
                      <td className="font-bold">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
                          {c.imageUrl ? (
                            <img
                              src={c.imageUrl}
                              alt={c.name}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                background: '#ffffff',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '8px',
                                background: 'rgba(7, 102, 94, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(7, 102, 94, 0.15)',
                              }}
                            >
                              <Tag size={18} color="#07665e" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary, #1e293b)' }}>{c.name}</div>
                            {c.storeName && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                {c.storeName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                          {discountText}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {c.minPurchaseAmount && c.minPurchaseAmount > 0
                          ? `$${c.minPurchaseAmount.toLocaleString()}`
                          : 'Sin mínimo'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{c.maxHoursApplicable ? `${c.maxHoursApplicable} horas` : 'Ilimitado'}</td>
                      <td>
                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {c.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {canEdit && (
                            <button className="btn-icon" onClick={() => handleOpenEdit(c)} title="Editar Convenio">
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn-icon danger" onClick={() => handleDelete(c.agreementId)} title="Eliminar Convenio">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {isLoading ? 'Cargando convenios...' : 'No hay convenios comerciales registrados en el sistema.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. VISTA MOBILE - LISTA DE TARJETAS EXPANDIBLES (ACCORDION) */}
      <div className="mobile-card-list">
        {convenios.length > 0 ? (
          convenios.map((c) => {
            const isFixed = Boolean(c.discountFixedAmount && c.discountFixedAmount > 0);
            const discountText = isFixed
              ? `$${(c.discountFixedAmount || 0).toLocaleString()} Dto.`
              : `${c.discountPercentage || 0}% Dto.`;
            const isExpanded = expandedAgreementId === c.agreementId;

            return (
              <div key={c.agreementId} className={`expandable-card ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="expandable-card-header"
                  onClick={() => setExpandedAgreementId(isExpanded ? null : c.agreementId)}
                >
                  <div className="expandable-card-main">
                    {c.imageUrl ? (
                      <div className="expandable-card-avatar" style={{ overflow: 'hidden', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span className={`avatar-status-dot ${c.isActive ? 'active' : 'inactive'}`} />
                      </div>
                    ) : (
                      <div
                        className="expandable-card-avatar"
                        style={{ background: '#e0f2fe', color: '#0369a1' }}
                      >
                        <Tag size={20} />
                        <span className={`avatar-status-dot ${c.isActive ? 'active' : 'inactive'}`} />
                      </div>
                    )}
                    <div className="expandable-card-info">
                      <span className="expandable-card-title">{c.name}</span>
                      <span className="expandable-card-subtitle">
                        {discountText} • {c.storeName || 'Comercio General'}
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
                        <span className="card-detail-label">Beneficio:</span>
                        <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                          {isFixed ? `$${(c.discountFixedAmount || 0).toLocaleString()} Descuento Fijo` : `${c.discountPercentage || 0}% Descuento Porcentual`}
                        </span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Comercio / Tienda:</span>
                        <span className="card-detail-value">{c.storeName || 'No especificado'}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Compra Mínima:</span>
                        <span className="card-detail-value">
                          {c.minPurchaseAmount && c.minPurchaseAmount > 0 ? `$${c.minPurchaseAmount.toLocaleString()}` : 'Sin mínimo requerido'}
                        </span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Límite de Horas:</span>
                        <span className="card-detail-value">{c.maxHoursApplicable ? `${c.maxHoursApplicable} horas` : 'Ilimitado'}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Estado:</span>
                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {c.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="expandable-card-actions">
                      {canEdit && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-outline"
                          onClick={() => handleOpenEdit(c)}
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-danger"
                          onClick={() => handleDelete(c.agreementId)}
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
            {isLoading ? 'Cargando convenios...' : 'No hay convenios comerciales registrados.'}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Convenio */}
      {isModalOpen && editingConvenio && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !isSaving && setIsModalOpen(false)}>
            <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingConvenio.agreementId ? 'Editar Convenio Comercial' : 'Nuevo Convenio Comercial'}</h3>
              </div>

              <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
                <div className="modal-body">
                  {/* 1. IMAGEN / LOGO DEL CONVENIO */}
                  <div className={`form-group ${formErrors.imageUrl ? 'has-error' : ''}`}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ImageIcon size={16} color="#07665e" />
                      <span>
                        Logo / Imagen del Convenio o Comercio Aliado <span className="required-asterisk">*</span>
                      </span>
                    </label>

                    {editingConvenio.imageUrl ? (
                      <div
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px',
                          borderRadius: '12px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <img
                          src={editingConvenio.imageUrl}
                          alt="Vista previa del convenio"
                          style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '10px',
                            objectFit: 'contain',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            padding: '2px',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>
                            Imagen cargada correctamente
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                            Se mostrará en la lista de convenios y en caja.
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isSaving}
                            >
                              <Upload size={13} /> Cambiar
                            </button>
                            <button
                              type="button"
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                              }}
                              onClick={handleRemoveImage}
                              disabled={isSaving}
                            >
                              <Trash2 size={13} /> Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => !isSaving && fileInputRef.current?.click()}
                        style={{
                          border: formErrors.imageUrl ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
                          borderRadius: '12px',
                          padding: '20px 16px',
                          textAlign: 'center',
                          background: formErrors.imageUrl ? 'rgba(239, 68, 68, 0.04)' : '#f8fafc',
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!formErrors.imageUrl) {
                            e.currentTarget.style.borderColor = '#07665e';
                            e.currentTarget.style.background = '#f0fdfa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!formErrors.imageUrl) {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.background = '#f8fafc';
                          }
                        }}
                      >
                        <Upload size={24} style={{ color: formErrors.imageUrl ? '#ef4444' : '#07665e', margin: '0 auto 6px auto' }} />
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: formErrors.imageUrl ? '#dc2626' : '#334155' }}>
                          Haz clic aquí para seleccionar una imagen o logo
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          Formatos soportados: PNG, JPG, WebP o SVG (máximo 2 MB)
                        </div>
                      </div>
                    )}

                    {formErrors.imageUrl && (
                      <span className="form-field-error">
                        <AlertCircle size={12} /> {formErrors.imageUrl}
                      </span>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      disabled={isSaving}
                    />
                  </div>

                  {/* 2. NOMBRE DEL CONVENIO */}
                  <div className={`form-group ${formErrors.name ? 'has-error' : ''}`}>
                    <label>
                      Nombre del Convenio <span className="required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      className={`input-field ${formErrors.name ? 'input-error' : ''}`}
                      placeholder="Ej: Convenio Éxito, Descuento Cine Colombia 50%"
                      value={editingConvenio.name || ''}
                      onChange={(e) => handleNameChange(e.target.value)}
                      disabled={isSaving}
                    />
                    {formErrors.name && (
                      <span className="form-field-error">
                        <AlertCircle size={12} /> {formErrors.name}
                      </span>
                    )}
                  </div>

                  {/* 3. MODALIDAD DE DESCUENTO */}
                  <div className="form-group">
                    <label>Modalidad de Descuento</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountMode('percentage');
                          setFormErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.discountPercentage;
                            delete copy.discountFixedAmount;
                            return copy;
                          });
                        }}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: discountMode === 'percentage' ? '2px solid #07665e' : '1px solid #cbd5e1',
                          background: discountMode === 'percentage' ? '#f0fdfa' : '#ffffff',
                          color: discountMode === 'percentage' ? '#07665e' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        disabled={isSaving}
                      >
                        <Percent size={16} /> Porcentaje (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountMode('fixed');
                          setFormErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.discountPercentage;
                            delete copy.discountFixedAmount;
                            return copy;
                          });
                        }}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: discountMode === 'fixed' ? '2px solid #07665e' : '1px solid #cbd5e1',
                          background: discountMode === 'fixed' ? '#f0fdfa' : '#ffffff',
                          color: discountMode === 'fixed' ? '#07665e' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        disabled={isSaving}
                      >
                        <DollarSign size={16} /> Valor Fijo ($)
                      </button>
                    </div>
                  </div>

                  {discountMode === 'percentage' ? (
                    <div className={`form-group ${formErrors.discountPercentage ? 'has-error' : ''}`}>
                      <label>
                        Porcentaje de Descuento (%) <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`input-field ${formErrors.discountPercentage ? 'input-error' : ''}`}
                        placeholder="Ej: 50 o 100"
                        value={editingConvenio.discountPercentage !== undefined && editingConvenio.discountPercentage !== null ? String(editingConvenio.discountPercentage) : ''}
                        onChange={(e) => handlePercentageChange(e.target.value)}
                        disabled={isSaving}
                      />
                      {formErrors.discountPercentage && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {formErrors.discountPercentage}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={`form-group ${formErrors.discountFixedAmount ? 'has-error' : ''}`}>
                      <label>
                        Valor de Descuento ($) <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`input-field ${formErrors.discountFixedAmount ? 'input-error' : ''}`}
                        placeholder="Ej: 5.000"
                        value={formatCurrencyDisplay(editingConvenio.discountFixedAmount)}
                        onChange={(e) => handleFixedAmountChange(e.target.value)}
                        disabled={isSaving}
                      />
                      {formErrors.discountFixedAmount && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {formErrors.discountFixedAmount}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={`form-group ${formErrors.minPurchaseAmount ? 'has-error' : ''}`}>
                      <label>Compra Mínima ($)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`input-field ${formErrors.minPurchaseAmount ? 'input-error' : ''}`}
                        placeholder="0"
                        value={formatCurrencyDisplay(editingConvenio.minPurchaseAmount)}
                        onChange={(e) => handleMinPurchaseChange(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                    <div className={`form-group ${formErrors.maxHoursApplicable ? 'has-error' : ''}`}>
                      <label>Máximo Horas Aplicables</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`input-field ${formErrors.maxHoursApplicable ? 'input-error' : ''}`}
                        placeholder="Ej: 2"
                        value={editingConvenio.maxHoursApplicable !== undefined && editingConvenio.maxHoursApplicable !== null ? String(editingConvenio.maxHoursApplicable) : ''}
                        onChange={(e) => handleMaxHoursChange(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  {/* 5. ESTADO DEL CONVENIO - SWITCH CARD MODERNO */}
                  <div
                    onClick={() => !isSaving && setEditingConvenio({ ...editingConvenio, isActive: !(editingConvenio.isActive ?? true) })}
                    style={{
                      marginTop: '12px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: (editingConvenio.isActive ?? true) ? '1px solid #10b981' : '1px solid #e2e8f0',
                      background: (editingConvenio.isActive ?? true) ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
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
                          background: (editingConvenio.isActive ?? true) ? 'rgba(16, 185, 129, 0.12)' : '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: (editingConvenio.isActive ?? true) ? '#059669' : '#64748b',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {(editingConvenio.isActive ?? true) ? <CheckCircle2 size={20} /> : <PauseCircle size={20} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: (editingConvenio.isActive ?? true) ? '#065f46' : '#334155' }}>
                          {(editingConvenio.isActive ?? true) ? 'Convenio Habilitado (Activo en Caja)' : 'Convenio Desactivado (Pausado)'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {(editingConvenio.isActive ?? true)
                            ? 'Los cajeros podrán aplicar este descuento al liquidar tickets.'
                            : 'No estará disponible para liquidar en terminales de cobro.'}
                        </div>
                      </div>
                    </div>

                    {/* iOS Style Toggle Switch Knob */}
                    <div
                      style={{
                        width: '46px',
                        height: '26px',
                        borderRadius: '13px',
                        background: (editingConvenio.isActive ?? true) ? '#07665e' : '#cbd5e1',
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
                          left: (editingConvenio.isActive ?? true) ? '23px' : '3px',
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
                      <>
                        <Loader2 size={16} className="spinner" /> Guardando...
                      </>
                    ) : (
                      'Guardar Convenio'
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
