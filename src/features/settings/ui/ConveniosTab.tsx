import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Tag, Store as StoreIcon, Clock } from 'lucide-react';
import type { CommercialAgreementDto, SaveCommercialAgreementDto, StoreDto } from '../model/ConveniosContracts';
import { conveniosService } from '../data/conveniosService';
import { authService } from '../../auth/data/authService';

export const ConveniosTab: React.FC = () => {
  const [convenios, setConvenios] = useState<CommercialAgreementDto[]>([]);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState<SaveCommercialAgreementDto | null>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agreementsData, storesData] = await Promise.all([
        conveniosService.getAllAgreements(),
        conveniosService.getStores(),
      ]);
      setConvenios(agreementsData || []);
      setStores(storesData || []);
    } catch (err) {
      console.error('Error al cargar convenios y comercios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const defaultStoreId = stores.length > 0 ? stores[0].storeId : '';
    setEditingConvenio({
      storeId: defaultStoreId,
      name: '',
      minPurchaseAmount: 0,
      discountPercentage: 100,
      discountFixedAmount: 0,
      maxHoursApplicable: 2,
      isActive: true,
    });
    setIsCreatingStore(false);
    setNewStoreName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CommercialAgreementDto) => {
    setEditingConvenio({
      agreementId: c.agreementId,
      storeId: c.storeId || (stores[0]?.storeId || ''),
      name: c.name || c.storeName || '',
      minPurchaseAmount: c.minPurchaseAmount || 0,
      discountPercentage: c.discountPercentage ?? 100,
      discountFixedAmount: c.discountFixedAmount ?? 0,
      maxHoursApplicable: c.maxHoursApplicable ?? 2,
      isActive: c.isActive,
    });
    setIsCreatingStore(false);
    setIsModalOpen(true);
  };

  const handleCreateQuickStore = async () => {
    if (!newStoreName.trim()) return;
    try {
      const created = await conveniosService.createStore({ name: newStoreName.trim() });
      if (created && created.storeId) {
        setStores((prev) => [...prev, created]);
        if (editingConvenio) {
          setEditingConvenio({ ...editingConvenio, storeId: created.storeId });
        }
        setIsCreatingStore(false);
        setNewStoreName('');
      }
    } catch (err: any) {
      alert(err?.message || 'Error al registrar el nuevo comercio aliado.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConvenio) return;

    // Si no hay comercios y se ingresó un nombre en la creación
    if (!editingConvenio.storeId && stores.length === 0) {
      alert('Debes seleccionar o crear primero un comercio asociado al convenio.');
      return;
    }

    try {
      if (editingConvenio.agreementId) {
        await conveniosService.updateAgreement(editingConvenio.agreementId, editingConvenio);
      } else {
        await conveniosService.createAgreement(editingConvenio);
      }
      setIsModalOpen(false);
      setEditingConvenio(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el convenio comercial en la BD.');
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Convenios Comerciales y Comercios Aliados</h2>
          <p>Configura acuerdos con marcas/locales, montos mínimos de compra, porcentajes de descuento y horas de gracia aplicables.</p>
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
            <th>COMERCIO ALIADO</th>
            <th>COMPRA MÍNIMA</th>
            <th>DESCUENTO</th>
            <th>HORAS TOPE</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {convenios.length > 0 ? (
            convenios.map((c) => {
              const storeName = c.store?.name || stores.find(s => s.storeId === c.storeId)?.name || c.storeName || 'Comercio General';
              const discountText = c.discountPercentage ? `${c.discountPercentage}%` : c.discountFixedAmount ? `$${c.discountFixedAmount.toLocaleString()} COP` : '100%';

              return (
                <tr key={c.agreementId}>
                  <td className="font-bold">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={14} style={{ color: 'var(--primary-color)' }} />
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <StoreIcon size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span className="font-bold">{storeName}</span>
                    </div>
                  </td>
                  <td>${(c.minPurchaseAmount || 0).toLocaleString()} COP</td>
                  <td>
                    <span className="badge badge-success" style={{ background: 'rgba(7, 102, 94, 0.1)', color: 'var(--primary-color)' }}>
                      {discountText}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
                      <span>{c.maxHoursApplicable ? `${c.maxHoursApplicable} hrs` : 'Ilimitado'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {c.isActive ? 'Vigente' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {(authService.hasPermission('settings.convenios.manage') || authService.hasPermission('agreements.manage')) && (
                        <button className="btn-action primary" onClick={() => handleOpenEdit(c)}>
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
              <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando convenios desde la API...' : 'No se encontraron convenios comerciales registrados.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Crear / Editar Convenio */}
      {isModalOpen && editingConvenio && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>{editingConvenio.agreementId ? 'Editar Convenio Comercial' : 'Crear Nuevo Convenio Comercial'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                
                {/* Selector / Creador de Comercio */}
                <div className="form-group">
                  <label>Comercio Aliado / Local</label>
                  {!isCreatingStore ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        className="input-field"
                        value={editingConvenio.storeId}
                        onChange={(e) => setEditingConvenio({ ...editingConvenio, storeId: e.target.value })}
                        required={stores.length > 0}
                      >
                        {stores.length === 0 && <option value="">No hay comercios creados</option>}
                        {stores.map((s) => (
                          <option key={s.storeId} value={s.storeId}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-action primary"
                        style={{ whiteSpace: 'nowrap', padding: '0 12px' }}
                        onClick={() => setIsCreatingStore(true)}
                      >
                        <Plus size={14} /> Nuevo Local
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Nombre del nuevo comercio (Ej: Éxito, Cine Colombia)"
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-action primary"
                        style={{ padding: '0 14px' }}
                        onClick={handleCreateQuickStore}
                      >
                        Guardar Local
                      </button>
                      <button
                        type="button"
                        className="btn-action"
                        onClick={() => setIsCreatingStore(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Nombre del Convenio</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Descuento Compras Superiores a $50.000"
                    value={editingConvenio.name}
                    onChange={(e) => setEditingConvenio({ ...editingConvenio, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Monto Mínimo de Compra (COP)</label>
                    <input
                      type="number"
                      className="input-field"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={editingConvenio.minPurchaseAmount}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, minPurchaseAmount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Porcentaje de Descuento (%)</label>
                    <input
                      type="number"
                      className="input-field"
                      min="0"
                      max="100"
                      placeholder="100"
                      value={editingConvenio.discountPercentage ?? 100}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, discountPercentage: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Máximo Horas Aplicables</label>
                    <input
                      type="number"
                      className="input-field"
                      min="1"
                      placeholder="2"
                      value={editingConvenio.maxHoursApplicable ?? 2}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, maxHoursApplicable: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Estado del Convenio</label>
                    <select
                      className="input-field"
                      value={editingConvenio.isActive ? 'true' : 'false'}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, isActive: e.target.value === 'true' })}
                    >
                      <option value="true">Vigente / Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Convenio en BD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
