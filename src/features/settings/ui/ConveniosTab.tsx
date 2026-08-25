import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Tag, Percent, DollarSign, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import type { CommercialAgreementDto, SaveCommercialAgreementDto } from '../model/ConveniosContracts';
import { conveniosService } from '../data/conveniosService';
import { authService } from '../../auth/data/authService';

export const ConveniosTab: React.FC = () => {
  const [convenios, setConvenios] = useState<CommercialAgreementDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState<SaveCommercialAgreementDto | null>(null);
  const [discountMode, setDiscountMode] = useState<'percentage' | 'fixed'>('percentage');

  useEffect(() => {
    loadData();
  }, []);

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

  const handleOpenCreate = () => {
    setEditingConvenio({
      storeId: '',
      name: '',
      minPurchaseAmount: undefined as any,
      discountPercentage: undefined as any,
      discountFixedAmount: undefined as any,
      maxHoursApplicable: undefined as any,
      isActive: true,
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
    });
    setIsModalOpen(true);
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
          <p>Administra los convenios de descuento y tarifas preferenciales aplicables en caja.</p>
        </div>

        {(authService.hasPermission('settings.convenios.manage') || authService.hasPermission('agreements.manage')) && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Convenio
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>CONVENIO</th>
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
                ? `$${(c.discountFixedAmount || 0).toLocaleString()} COP de descuento`
                : `${c.discountPercentage || 0}% de descuento`;

              return (
                <tr key={c.agreementId}>
                  <td className="font-bold">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={16} color="#07665e" />
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                      {discountText}
                    </span>
                  </td>
                  <td>
                    {c.minPurchaseAmount && c.minPurchaseAmount > 0
                      ? `$${c.minPurchaseAmount.toLocaleString()} COP`
                      : 'Sin mínimo'}
                  </td>
                  <td>{c.maxHoursApplicable ? `${c.maxHoursApplicable} horas` : 'Ilimitado'}</td>
                  <td>
                    <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {c.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
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
              <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando convenios...' : 'No hay convenios registrados. Crea el primero con el botón superior.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && editingConvenio && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingConvenio.agreementId ? 'Editar Convenio Comercial' : 'Nuevo Convenio Comercial'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Convenio *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Convenio Éxito, Descuento Cine Colombia 50%"
                    value={editingConvenio.name || ''}
                    onChange={(e) => setEditingConvenio({ ...editingConvenio, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

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
                    <label>Valor de Descuento en Pesos (COP) *</label>
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
                    <label>Compra Mínima ($ COP)</label>
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
      )}
    </div>
  );
};
