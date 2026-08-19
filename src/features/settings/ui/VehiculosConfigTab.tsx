import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import type { VehiculoConfig } from '../model/SettingsTypes';
import { settingsService } from '../data/settingsService';

export const VehiculosConfigTab: React.FC = () => {
  const [configs, setConfigs] = useState<VehiculoConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<VehiculoConfig> | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    const data = await settingsService.getVehiculoConfigs();
    setConfigs(data);
  };

  const handleOpenCreate = () => {
    setEditingConfig({
      category: '',
      maxDurationHours: 12,
      requiresSpecialPermit: false,
      accessPriority: 'Normal',
      allowedZones: ['Zona A', 'Zona B']
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehiculoConfig) => {
    setEditingConfig({ ...v });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;
    await settingsService.saveVehiculoConfig(editingConfig);
    setIsModalOpen(false);
    setEditingConfig(null);
    await loadConfigs();
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Configuración de Categorías de Vehículos</h2>
          <p>Define reglas de permanencia máxima, prioridad de acceso y zonas autorizadas por categoría de vehículo.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
          <Plus size={16} /> Crear Categoría
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>CATEGORÍA DE VEHÍCULO</th>
            <th>ESTADA MÁXIMA</th>
            <th>PERMISO ESPECIAL</th>
            <th>PRIORIDAD ACCESO</th>
            <th>ZONAS PERMITIDAS</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((c) => (
            <tr key={c.id}>
              <td className="font-bold text-muted">{c.id}</td>
              <td className="font-bold">{c.category}</td>
              <td>{c.maxDurationHours} hrs</td>
              <td>
                <span className={`badge ${c.requiresSpecialPermit ? 'badge-warning' : 'badge-success'}`}>
                  {c.requiresSpecialPermit ? 'Requerido' : 'No Requerido'}
                </span>
              </td>
              <td>
                <span className="badge" style={{ 
                  background: c.accessPriority === 'Alta' ? 'rgba(16, 185, 129, 0.15)' : c.accessPriority === 'Baja' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                  color: c.accessPriority === 'Alta' ? '#10b981' : c.accessPriority === 'Baja' ? '#ef4444' : '#64748b' 
                }}>
                  {c.accessPriority}
                </span>
              </td>
              <td className="text-muted">{c.allowedZones.join(', ')}</td>
              <td className="text-right">
                <button className="btn-action primary" onClick={() => handleOpenEdit(c)}>
                  <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Crear / Editar Configuración de Vehículo */}
      {isModalOpen && editingConfig && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingConfig.id ? `Editar Categoría (${editingConfig.id})` : 'Crear Nueva Categoría'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre de Categoría</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej: Eléctrico / Carga Preferente"
                    value={editingConfig.category || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, category: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Permanencia Máxima (Horas)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={editingConfig.maxDurationHours || 0}
                      onChange={(e) => setEditingConfig({ ...editingConfig, maxDurationHours: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Prioridad de Acceso</label>
                    <select 
                      className="input-field" 
                      value={editingConfig.accessPriority || 'Normal'}
                      onChange={(e) => setEditingConfig({ ...editingConfig, accessPriority: e.target.value as any })}
                    >
                      <option value="Alta">Alta</option>
                      <option value="Normal">Normal</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
                    <input 
                      type="checkbox"
                      checked={editingConfig.requiresSpecialPermit || false}
                      onChange={(e) => setEditingConfig({ ...editingConfig, requiresSpecialPermit: e.target.checked })}
                    />
                    <span>Requiere Permiso Especial de Operaciones</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
