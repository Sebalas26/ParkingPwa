import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Tag, Store as StoreIcon, Clock, Trash2, DollarSign, Percent, Phone, Building } from 'lucide-react';
import type { CommercialAgreementDto, SaveCommercialAgreementDto, StoreDto, SaveStoreDto } from '../model/ConveniosContracts';
import { conveniosService } from '../data/conveniosService';
import { authService } from '../../auth/data/authService';

export const ConveniosTab: React.FC = () => {
  const [convenios, setConvenios] = useState<CommercialAgreementDto[]>([]);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'convenios' | 'comercios'>('convenios');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Convenio
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState<SaveCommercialAgreementDto | null>(null);
  const [discountMode, setDiscountMode] = useState<'percentage' | 'fixed'>('percentage');

  // Modal Comercio (Store)
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<SaveStoreDto | null>(null);

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

  // --- Manejadores Convenios ---
  const handleOpenCreateAgreement = () => {
    const defaultStoreId = stores.length > 0 ? stores[0].storeId : '';
    setEditingConvenio({
      storeId: defaultStoreId,
      name: '',
      minPurchaseAmount: 0,
      discountPercentage: 100,
      discountFixedAmount: null,
      maxHoursApplicable: 2,
      isActive: true,
    });
    setDiscountMode('percentage');
    setIsAgreementModalOpen(true);
  };

  const handleOpenEditAgreement = (c: CommercialAgreementDto) => {
    const isFixed = Boolean(c.discountFixedAmount && c.discountFixedAmount > 0 && (!c.discountPercentage || c.discountPercentage === 0));
    setDiscountMode(isFixed ? 'fixed' : 'percentage');
    setEditingConvenio({
      agreementId: c.agreementId,
      storeId: c.storeId || (stores[0]?.storeId || ''),
      name: c.name || '',
      minPurchaseAmount: c.minPurchaseAmount || 0,
      discountPercentage: c.discountPercentage,
      discountFixedAmount: c.discountFixedAmount,
      maxHoursApplicable: c.maxHoursApplicable,
      isActive: c.isActive,
    });
    setIsAgreementModalOpen(true);
  };

  const handleSaveAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConvenio) return;

    if (!editingConvenio.storeId) {
      alert('Debes seleccionar un comercio aliado para el convenio.');
      return;
    }

    const payload: SaveCommercialAgreementDto = {
      ...editingConvenio,
      discountPercentage: discountMode === 'percentage' ? (Number(editingConvenio.discountPercentage) || 0) : null,
      discountFixedAmount: discountMode === 'fixed' ? (Number(editingConvenio.discountFixedAmount) || 0) : null,
      minPurchaseAmount: Number(editingConvenio.minPurchaseAmount) || 0,
      maxHoursApplicable: editingConvenio.maxHoursApplicable ? Number(editingConvenio.maxHoursApplicable) : null,
    };

    try {
      if (editingConvenio.agreementId) {
        await conveniosService.updateAgreement(editingConvenio.agreementId, payload);
      } else {
        await conveniosService.createAgreement(payload);
      }
      setIsAgreementModalOpen(false);
      setEditingConvenio(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el convenio comercial en la BD.');
    }
  };

  const handleDeactivateAgreement = async (id: string) => {
    if (confirm('¿Deseas inactivar este convenio comercial?')) {
      await conveniosService.deactivateAgreement(id);
      await loadData();
    }
  };

  // --- Manejadores Comercios ---
  const handleOpenCreateStore = () => {
    setEditingStore({
      name: '',
      taxId: '',
      phoneNumber: '',
      isActive: true,
    });
    setIsStoreModalOpen(true);
  };

  const handleOpenEditStore = (s: StoreDto) => {
    setEditingStore({
      storeId: s.storeId,
      name: s.name,
      taxId: s.taxId || '',
      phoneNumber: s.phoneNumber || s.contactPhone || '',
      isActive: s.isActive,
    });
    setIsStoreModalOpen(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore || !editingStore.name.trim()) return;

    try {
      if (editingStore.storeId) {
        await conveniosService.updateStore(editingStore.storeId, editingStore);
      } else {
        const created = await conveniosService.createStore(editingStore);
        if (created?.storeId && editingConvenio) {
          setEditingConvenio({ ...editingConvenio, storeId: created.storeId });
        }
      }
      setIsStoreModalOpen(false);
      setEditingStore(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el comercio aliado.');
    }
  };

  const handleDeactivateStore = async (id: string) => {
    if (confirm('¿Deseas inactivar este comercio aliado?')) {
      await conveniosService.deactivateStore(id);
      await loadData();
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Convenios Comerciales y Comercios Aliados</h2>
          <p>Gestiona los convenios de descuento por compras y los comercios/locales aliados directamente con la base de datos.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Sub-Tabs Selector */}
          <div style={{ display: 'flex', background: 'var(--table-header-bg, #f1f5f9)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <button
              type="button"
              onClick={() => setActiveSubTab('convenios')}
              style={{
                background: activeSubTab === 'convenios' ? 'var(--primary-color, #07665e)' : 'transparent',
                color: activeSubTab === 'convenios' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              📄 Convenios ({convenios.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('comercios')}
              style={{
                background: activeSubTab === 'comercios' ? 'var(--primary-color, #07665e)' : 'transparent',
                color: activeSubTab === 'comercios' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              🏢 Comercios ({stores.length})
            </button>
          </div>

          {(authService.hasPermission('settings.convenios.manage') || authService.hasPermission('agreements.manage')) && (
            activeSubTab === 'convenios' ? (
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreateAgreement}>
                <Plus size={16} /> Crear Convenio
              </button>
            ) : (
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreateStore}>
                <Plus size={16} /> Crear Comercio
              </button>
            )
          )}
        </div>
      </div>

      {/* VISTA 1: TABLA DE CONVENIOS */}
      {activeSubTab === 'convenios' && (
        <table className="data-table">
          <thead>
            <tr>
              <th>CONVENIO</th>
              <th>COMERCIO ALIADO</th>
              <th>COMPRA MÍNIMA</th>
              <th>DESCUENTO / BENEFICIO</th>
              <th>MÁXIMO HORAS</th>
              <th>ESTADO</th>
              <th className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {convenios.length > 0 ? (
              convenios.map((c) => {
                const storeObj = stores.find((s) => s.storeId === c.storeId) || c.store;
                const storeDisplayName = storeObj?.name || c.storeName || 'Comercio General';
                const discountText =
                  c.discountPercentage !== null && c.discountPercentage !== undefined
                    ? `${c.discountPercentage}% Descuento`
                    : c.discountFixedAmount
                    ? `$${Number(c.discountFixedAmount).toLocaleString()} COP Descuento`
                    : '100% Descuento';

                return (
                  <tr key={c.agreementId}>
                    <td className="font-bold">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={15} style={{ color: 'var(--primary-color, #07665e)' }} />
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StoreIcon size={14} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                          <div className="font-bold">{storeDisplayName}</div>
                          {storeObj?.taxId && (
                            <small style={{ fontSize: '0.72rem', color: '#64748b' }}>NIT: {storeObj.taxId}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {c.minPurchaseAmount > 0
                        ? `$${Number(c.minPurchaseAmount).toLocaleString()} COP`
                        : <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }}>Sin Mínimo</span>}
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ background: 'rgba(7, 102, 94, 0.1)', color: 'var(--primary-color, #07665e)', fontWeight: 700 }}>
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
                          <>
                            <button className="btn-action primary" onClick={() => handleOpenEditAgreement(c)}>
                              <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                            </button>
                            {c.isActive && (
                              <button
                                className="btn-action danger"
                                style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)' }}
                                onClick={() => handleDeactivateAgreement(c.agreementId)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  {isLoading ? 'Cargando convenios comerciales desde la API...' : 'No se encontraron convenios registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* VISTA 2: TABLA DE COMERCIOS ALIADOS */}
      {activeSubTab === 'comercios' && (
        <table className="data-table">
          <thead>
            <tr>
              <th>NOMBRE DEL COMERCIO</th>
              <th>NIT / IDENTIFICACIÓN</th>
              <th>TELÉFONO DE CONTACTO</th>
              <th>CONVENIOS ACTIVOS</th>
              <th>ESTADO</th>
              <th className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {stores.length > 0 ? (
              stores.map((s) => {
                const storeAgreementsCount = convenios.filter((c) => c.storeId === s.storeId).length;

                return (
                  <tr key={s.storeId}>
                    <td className="font-bold">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={16} style={{ color: 'var(--primary-color, #07665e)' }} />
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td>{s.taxId || <span className="text-muted">No registrado</span>}</td>
                    <td>
                      {s.phoneNumber || s.contactPhone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={13} style={{ color: 'var(--text-secondary)' }} />
                          <span>{s.phoneNumber || s.contactPhone}</span>
                        </div>
                      ) : (
                        <span className="text-muted">No registrado</span>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(7, 102, 94, 0.1)', color: 'var(--primary-color, #07665e)', fontWeight: 600 }}>
                        {storeAgreementsCount} {storeAgreementsCount === 1 ? 'Convenio' : 'Convenios'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {s.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {(authService.hasPermission('settings.convenios.manage') || authService.hasPermission('agreements.manage')) && (
                          <>
                            <button className="btn-action primary" onClick={() => handleOpenEditStore(s)}>
                              <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                            </button>
                            {s.isActive && (
                              <button
                                className="btn-action danger"
                                style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)' }}
                                onClick={() => handleDeactivateStore(s.storeId)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  {isLoading ? 'Cargando comercios desde la API...' : 'No se encontraron comercios aliados registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Modal Crear / Editar Convenio */}
      {isAgreementModalOpen && editingConvenio && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>{editingConvenio.agreementId ? 'Editar Convenio Comercial' : 'Crear Nuevo Convenio Comercial'}</h3>
              <button className="btn-close-modal" onClick={() => setIsAgreementModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAgreement}>
              <div className="modal-body">
                {/* Selector de Comercio */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Comercio Aliado / Local *</label>
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary-color, #07665e)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                      onClick={() => {
                        handleOpenCreateStore();
                      }}
                    >
                      + Crear Nuevo Comercio
                    </button>
                  </div>
                  <select
                    className="input-field"
                    value={editingConvenio.storeId}
                    onChange={(e) => setEditingConvenio({ ...editingConvenio, storeId: e.target.value })}
                    required
                  >
                    {stores.length === 0 && <option value="">No hay comercios registrados</option>}
                    {stores.map((s) => (
                      <option key={s.storeId} value={s.storeId}>
                        🏢 {s.name} {s.taxId ? `(NIT: ${s.taxId})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Nombre del Convenio *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Convenio CineMark (3 Horas con Boleta)"
                    value={editingConvenio.name}
                    onChange={(e) => setEditingConvenio({ ...editingConvenio, name: e.target.value })}
                    required
                  />
                </div>

                {/* Tipo de Descuento: Porcentaje vs Monto Fijo */}
                <div className="form-group">
                  <label>Tipo de Beneficio / Descuento</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setDiscountMode('percentage')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px',
                        borderRadius: '6px',
                        border: discountMode === 'percentage' ? '2px solid #07665e' : '1px solid var(--border-color)',
                        background: discountMode === 'percentage' ? 'rgba(7, 102, 94, 0.08)' : 'transparent',
                        color: discountMode === 'percentage' ? '#07665e' : 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Percent size={14} /> Porcentaje (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountMode('fixed')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px',
                        borderRadius: '6px',
                        border: discountMode === 'fixed' ? '2px solid #07665e' : '1px solid var(--border-color)',
                        background: discountMode === 'fixed' ? 'rgba(7, 102, 94, 0.08)' : 'transparent',
                        color: discountMode === 'fixed' ? '#07665e' : 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      <DollarSign size={14} /> Monto Fijo ($ COP)
                    </button>
                  </div>

                  {discountMode === 'percentage' ? (
                    <div className="form-group">
                      <label>Porcentaje de Descuento (%)</label>
                      <input
                        type="number"
                        className="input-field"
                        min="1"
                        max="100"
                        placeholder="100 (100% de descuento en la tarifa)"
                        value={editingConvenio.discountPercentage ?? 100}
                        onChange={(e) => setEditingConvenio({ ...editingConvenio, discountPercentage: Number(e.target.value) })}
                        required
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Monto Fijo de Descuento ($ COP)</label>
                      <input
                        type="number"
                        className="input-field"
                        min="100"
                        step="100"
                        placeholder="Ej: 5000"
                        value={editingConvenio.discountFixedAmount ?? 5000}
                        onChange={(e) => setEditingConvenio({ ...editingConvenio, discountFixedAmount: Number(e.target.value) })}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Compra Mínima en Comercio ($ COP)</label>
                    <input
                      type="number"
                      className="input-field"
                      min="0"
                      step="1000"
                      placeholder="0 (Sin compra mínima)"
                      value={editingConvenio.minPurchaseAmount}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, minPurchaseAmount: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Máximo de Horas Cubiertas</label>
                    <input
                      type="number"
                      className="input-field"
                      min="1"
                      placeholder="Ej: 2 horas (Vacío = Ilimitado)"
                      value={editingConvenio.maxHoursApplicable ?? ''}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, maxHoursApplicable: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
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

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsAgreementModalOpen(false)}>
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

      {/* Modal Crear / Editar Comercio Aliado */}
      {isStoreModalOpen && editingStore && (
        <div className="modal-overlay" style={{ zIndex: 10050 }}>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{editingStore.storeId ? 'Editar Comercio Aliado' : 'Crear Nuevo Comercio Aliado'}</h3>
              <button className="btn-close-modal" onClick={() => setIsStoreModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStore}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Comercio / Razón Social *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: CineMark Colombia, Supermercado Éxito"
                    value={editingStore.name}
                    onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>NIT / Identificación Tributaria</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: 900.123.456-1"
                      value={editingStore.taxId || ''}
                      onChange={(e) => setEditingStore({ ...editingStore, taxId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Teléfono de Contacto</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: 300 123 4567"
                      value={editingStore.phoneNumber || ''}
                      onChange={(e) => setEditingStore({ ...editingStore, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Estado del Comercio</label>
                  <select
                    className="input-field"
                    value={editingStore.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingStore({ ...editingStore, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsStoreModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Comercio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
