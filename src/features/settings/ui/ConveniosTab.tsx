import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Tag, Percent, DollarSign, Trash2, Upload, Image as ImageIcon, ChevronDown } from 'lucide-react';
import type { CommercialAgreementDto, SaveCommercialAgreementDto } from '../model/ConveniosContracts';
import { conveniosService } from '../data/conveniosService';
import { authService } from '../../auth/data/authService';
import { ModalPortal } from '../../../shared/ui/ModalPortal';

export const ConveniosTab: React.FC = () => {
  const [convenios, setConvenios] = useState<CommercialAgreementDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState<SaveCommercialAgreementDto | null>(null);
  const [discountMode, setDiscountMode] = useState<'percentage' | 'fixed'>('percentage');
  const [expandedAgreementId, setExpandedAgreementId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await conveniosService.getAllAgreements();
      setConvenios(data || []);
    } catch (err) {
      console.error('Error al cargar convenios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingConvenio({
      storeId: '',
      name: '',
      minPurchaseAmount: undefined as any,
      discountPercentage: undefined as any,
      discountFixedAmount: undefined as any,
      maxHoursApplicable: undefined as any,
      isActive: true,
      imageUrl: null,
    });
    setDiscountMode('percentage');
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
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setEditingConvenio((prev) => (prev ? { ...prev, imageUrl: null } : null));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConvenio || !editingConvenio.name.trim()) {
      alert('Por favor ingresa el nombre del convenio.');
      return;
    }

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

    try {
      if (editingConvenio.agreementId) {
        await conveniosService.updateAgreement(editingConvenio.agreementId, payload);
      } else {
        await conveniosService.createAgreement(payload);
      }
      setIsModalOpen(false);
      setEditingConvenio(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el convenio comercial.');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('¿Deseas inactivar este convenio comercial?')) {
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

        {(authService.hasPermission('settings.convenios.manage') || authService.hasPermission('agreements.manage')) && (
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
                          {(authService.hasPermission('settings.convenios.manage') || authService.hasPermission('agreements.manage')) && (
                            <button className="btn-icon" onClick={() => handleOpenEdit(c)} title="Editar Convenio">
                              <Edit2 size={16} />
                            </button>
                          )}
                          {c.isActive && (authService.hasPermission('settings.convenios.manage') || authService.hasPermission('agreements.manage')) && (
                            <button className="btn-icon danger" onClick={() => handleDeactivate(c.agreementId)} title="Inactivar Convenio">
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
                      {(authService.hasPermission('settings.convenios.manage') || authService.hasPermission('agreements.manage')) && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-outline"
                          onClick={() => handleOpenEdit(c)}
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                      )}
                      {c.isActive && (authService.hasPermission('settings.convenios.manage') || authService.hasPermission('agreements.manage')) && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-danger"
                          onClick={() => handleDeactivate(c.agreementId)}
                        >
                          <Trash2 size={14} /> Inactivar
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

      {isModalOpen && editingConvenio && (
        <ModalPortal>
          <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{editingConvenio.agreementId ? 'Editar Convenio Comercial' : 'Nuevo Convenio Comercial'}</h3>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {/* 1. IMAGEN / LOGO DEL CONVENIO */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={16} color="#07665e" />
                    <span>Logo / Imagen del Convenio o Comercio Aliado</span>
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
                          >
                            <Trash2 size={13} /> Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '20px 16px',
                        textAlign: 'center',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#07665e';
                        e.currentTarget.style.background = '#f0fdfa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                    >
                      <Upload size={24} style={{ color: '#07665e', margin: '0 auto 6px auto' }} />
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155' }}>
                        Haz clic aquí para seleccionar una imagen o logo
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        Formatos soportados: PNG, JPG, WebP o SVG (máximo 2 MB)
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* 2. NOMBRE DEL CONVENIO */}
                <div className="form-group">
                  <label>Nombre del Convenio *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Convenio Éxito, Descuento Cine Colombia 50%"
                    value={editingConvenio.name || ''}
                    onChange={(e) => setEditingConvenio({ ...editingConvenio, name: e.target.value })}
                    required
                  />
                </div>

                {/* 3. MODALIDAD DE DESCUENTO */}
                <div className="form-group">
                  <label>Modalidad de Descuento</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setDiscountMode('percentage')}
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
                    >
                      <Percent size={16} /> Porcentaje (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountMode('fixed')}
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
                    >
                      <DollarSign size={16} /> Valor Fijo ($)
                    </button>
                  </div>
                </div>

                {discountMode === 'percentage' ? (
                  <div className="form-group">
                    <label>Porcentaje de Descuento (%) *</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Ej: 50 o 100"
                      min={1}
                      max={100}
                      value={editingConvenio.discountPercentage !== undefined && editingConvenio.discountPercentage !== null ? editingConvenio.discountPercentage : ''}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, discountPercentage: e.target.value === '' ? undefined : Number(e.target.value) })}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Valor de Descuento ($) *</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0"
                      min={1}
                      value={editingConvenio.discountFixedAmount !== undefined && editingConvenio.discountFixedAmount !== null ? editingConvenio.discountFixedAmount : ''}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, discountFixedAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                      required
                    />
                  </div>
                )}

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Compra Mínima ($)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0"
                      min={0}
                      value={editingConvenio.minPurchaseAmount !== undefined && editingConvenio.minPurchaseAmount !== null ? editingConvenio.minPurchaseAmount : ''}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, minPurchaseAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Máximo Horas Aplicables</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Ej: 2"
                      min={1}
                      value={editingConvenio.maxHoursApplicable !== undefined && editingConvenio.maxHoursApplicable !== null ? editingConvenio.maxHoursApplicable : ''}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, maxHoursApplicable: e.target.value === '' ? undefined : Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingConvenio.isActive ?? true}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, isActive: e.target.checked })}
                    />
                    <span>Convenio Activo para Liquidación de Tickets</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Convenio
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
