import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Tag , Trash2} from 'lucide-react';
import type { Convenio } from '../model/SettingsTypes';
import { settingsService } from '../data/settingsService';

export const ConveniosTab: React.FC = () => {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState<Partial<Convenio> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Convenio | null>(null);

  useEffect(() => {
    loadConvenios();
  }, []);

  const loadConvenios = async () => {
    const data = await settingsService.getConvenios();
    setConvenios(data);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    await settingsService.deleteConvenio(itemToDelete.id);
    setItemToDelete(null);
    await loadConvenios();
  };

  const handleOpenCreate = () => {
    setEditingConvenio({
      companyName: '',
      code: '',
      discountPercentage: 20,
      freeHours: 1,
      status: 'Vigente',
      validUntil: '2026-12-31'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Convenio) => {
    setEditingConvenio({ ...c });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConvenio) return;
    await settingsService.saveConvenio(editingConvenio);
    setIsModalOpen(false);
    setEditingConvenio(null);
    await loadConvenios();
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Convenios Comerciales y Descuentos</h2>
          <p>Configura acuerdos con comercios aliados, porcentajes de descuento, horas liberadas y códigos de validación.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
          <Plus size={16} /> Crear Convenio
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>EMPRESA / ALIADO</th>
            <th>CÓDIGO</th>
            <th>DESCUENTO (%)</th>
            <th>HORAS GRATIS</th>
            <th>VIGENCIA HASTA</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {convenios.map((c) => (
            <tr key={c.id}>
              <td className="font-bold text-muted">{c.id}</td>
              <td className="font-bold">{c.companyName}</td>
              <td>
                <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#9333ea', fontFamily: 'monospace' }}>
                  <Tag size={12} style={{ marginRight: 4 }} /> {c.code}
                </span>
              </td>
              <td>{c.discountPercentage}%</td>
              <td>{c.freeHours} hrs</td>
              <td className="text-muted">{c.validUntil}</td>
              <td>
                <span className={`badge ${c.status === 'Vigente' ? 'badge-success' : c.status === 'Suspendido' ? 'badge-warning' : 'badge-danger'}`}>
                  {c.status}
                </span>
              </td>
              <td className="text-right">
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button className="btn-action primary" onClick={() => handleOpenEdit(c)}>
                  <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                </button>
                <button className="btn-action danger" style={{ color: '#ef4444' }} onClick={() => setItemToDelete(c)}>
                  <Trash2 size={14} style={{ marginRight: 4 }} /> Eliminar
                </button>
                              </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Crear / Editar Convenio */}
      {isModalOpen && editingConvenio && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingConvenio.id ? `Editar Convenio (${editingConvenio.id})` : 'Crear Nuevo Convenio'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Empresa / Aliado Comercial</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej: Tienda Falabella / Gym"
                    value={editingConvenio.companyName || ''}
                    onChange={(e) => setEditingConvenio({ ...editingConvenio, companyName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Código de Validación</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="FALA2026"
                      value={editingConvenio.code || ''}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Descuento (%)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={editingConvenio.discountPercentage || 0}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, discountPercentage: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Horas Liberadas (Gratis)</label>
                    <input 
                      type="number" 
                      step="0.5"
                      className="input-field" 
                      value={editingConvenio.freeHours || 0}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, freeHours: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Vigente Hasta</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={editingConvenio.validUntil || '2026-12-31'}
                      onChange={(e) => setEditingConvenio({ ...editingConvenio, validUntil: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Estado del Convenio</label>
                  <select 
                    className="input-field" 
                    value={editingConvenio.status || 'Vigente'}
                    onChange={(e) => setEditingConvenio({ ...editingConvenio, status: e.target.value as any })}
                  >
                    <option value="Vigente">Vigente</option>
                    <option value="Suspendido">Suspendido</option>
                    <option value="Vencido">Vencido</option>
                  </select>
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

      {/* Modal Confirmar Eliminación */}
      {itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Confirmar Eliminación</h3>
              <button className="btn-close-modal" onClick={() => setItemToDelete(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar el registro <strong>{itemToDelete.id}</strong>?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setItemToDelete(null)}>Cancelar</button>
              <button className="btn-primary" style={{ background: '#ef4444' }} onClick={handleDeleteConfirm}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};
