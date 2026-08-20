import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Tag } from 'lucide-react';
import type { CommercialAgreementDto, SaveCommercialAgreementDto } from '../model/ConveniosContracts';
import { conveniosService } from '../data/conveniosService';

export const ConveniosTab: React.FC = () => {
  const [convenios, setConvenios] = useState<CommercialAgreementDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState<Partial<SaveCommercialAgreementDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConvenios();
  }, []);

  const loadConvenios = async () => {
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
      name: '',
      discountPercentage: 20,
      freeMinutes: 60,
      isActive: true,
      effectiveToUtc: '2026-12-31',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CommercialAgreementDto) => {
    setEditingConvenio({
      agreementId: c.agreementId,
      name: c.name || c.storeName || 'Convenio Comercial',
      discountPercentage: c.discountPercentage,
      freeMinutes: c.freeMinutes,
      isActive: c.isActive,
      effectiveToUtc: c.effectiveToUtc ? c.effectiveToUtc.slice(0, 10) : '2026-12-31',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConvenio) return;

    try {
      if (editingConvenio.agreementId) {
        await conveniosService.updateAgreement(editingConvenio.agreementId, editingConvenio as SaveCommercialAgreementDto);
      } else {
        await conveniosService.createAgreement(editingConvenio as SaveCommercialAgreementDto);
      }
      setIsModalOpen(false);
      setEditingConvenio(null);
      await loadConvenios();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar convenio.');
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Convenios Comerciales y Descuentos</h2>
          <p>Configura acuerdos con comercios aliados, porcentajes de descuento, minutos liberados y vigencias.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
          <Plus size={16} /> Crear Convenio
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>NOMBRE / COMERCIO</th>
            <th>DESCUENTO (%)</th>
            <th>TIEMPO GRATIS</th>
            <th>VIGENCIA</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {convenios.length > 0 ? (
            convenios.map((c) => (
              <tr key={c.agreementId}>
                <td className="font-bold">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={14} style={{ color: 'var(--primary-color)' }} />
                    <span>{c.name || c.storeName || 'Convenio Comercial'}</span>
                  </div>
                </td>
                <td>{c.discountPercentage}%</td>
                <td>{c.freeMinutes} min ({Math.round(c.freeMinutes / 60 * 10) / 10} hrs)</td>
                <td className="text-muted">
                  {c.effectiveToUtc ? new Date(c.effectiveToUtc).toLocaleDateString() : 'Indefinido'}
                </td>
                <td>
                  <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {c.isActive ? 'Vigente' : 'Inactivo'}
                  </span>
                </td>
                <td className="text-right">
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button className="btn-action primary" onClick={() => handleOpenEdit(c)}>
                      <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando convenios...' : 'No se encontraron convenios comerciales activos.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Crear / Editar Convenio */}
      {isModalOpen && editingConvenio && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingConvenio.agreementId ? 'Editar Convenio Comercial' : 'Crear Nuevo Convenio'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Convenio / Comercio Aliado</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Gimnasio SmartFit / Cine Colombia"
                    value={editingConvenio.name || ''}
                    onChange={(e) => setEditingConvenio({ ...editingConvenio, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Porcentaje Descuento (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input-field"
                      value={editingConvenio.discountPercentage || 0}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, discountPercentage: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Minutos Liberados (Gratis)</label>
                    <input
                      type="number"
                      min="0"
                      step="15"
                      className="input-field"
                      value={editingConvenio.freeMinutes || 0}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, freeMinutes: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Vigente Hasta</label>
                    <input
                      type="date"
                      className="input-field"
                      value={editingConvenio.effectiveToUtc || '2026-12-31'}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, effectiveToUtc: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
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
