import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import type { VehiculoConfigDto, SaveVehiculoConfigDto } from '../model/VehiculosConfigContracts';
import { vehiculosConfigService } from '../data/vehiculosConfigService';
import { authService } from '../../auth/data/authService';

export const VehiculosConfigTab: React.FC = () => {
  const [configs, setConfigs] = useState<VehiculoConfigDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<SaveVehiculoConfigDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await vehiculosConfigService.getConfigs();
      setConfigs(data || []);
    } catch (err) {
      console.error('Error al cargar configuraciones de vehículos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingConfig({
      category: '',
      gracePeriodMinutes: 15,
      hourRate: 2000,
      minuteRate: 50,
      fullDayRate: 15000,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehiculoConfigDto) => {
    setEditingConfig({ ...v });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig || !editingConfig.category) return;

    try {
      await vehiculosConfigService.saveConfig(editingConfig as SaveVehiculoConfigDto);
      setIsModalOpen(false);
      setEditingConfig(null);
      await loadConfigs();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar configuración.');
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Configuración de Categorías de Vehículos</h2>
          <p>Consulta y edita los tipos de vehículos parametrizados en el sistema y sus períodos de gracia.</p>
        </div>
        {authService.hasPermission('settings.vehiculos.manage') && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Categoría
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>CATEGORÍA / TIPO</th>
            <th>TIEMPO GRACIA</th>
            <th>VALOR HORA</th>
            <th>VALOR MINUTO</th>
            <th>MÁXIMO DÍA</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {configs.length > 0 ? (
            configs.map((c) => (
              <tr key={c.rateId || c.category}>
                <td className="font-bold">{c.category}</td>
                <td>{c.gracePeriodMinutes} min</td>
                <td>${(c.hourRate || 0).toLocaleString()} COP</td>
                <td>${(c.minuteRate || 0).toLocaleString()} COP</td>
                <td>${(c.fullDayRate || 0).toLocaleString()} COP</td>
                <td>
                  <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="text-right">
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {authService.hasPermission('settings.vehiculos.manage') && (
                      <button className="btn-action primary" onClick={() => handleOpenEdit(c)}>
                        <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando categorías...' : 'No hay categorías de vehículos registradas.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Crear / Editar Configuración de Vehículo */}
      {isModalOpen && editingConfig && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingConfig.rateId ? `Editar Categoría (${editingConfig.category})` : 'Crear Nueva Categoría'}</h3>
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
                    placeholder="Ej: Automóvil / Motocicleta"
                    value={editingConfig.category || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, category: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tiempo de Gracia (Minutos)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={editingConfig.gracePeriodMinutes || 0}
                      onChange={(e) => setEditingConfig({ ...editingConfig, gracePeriodMinutes: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor Hora ($ COP)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="input-field"
                      value={editingConfig.hourRate || 0}
                      onChange={(e) => setEditingConfig({ ...editingConfig, hourRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Valor Minuto Fracción ($ COP)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={editingConfig.minuteRate || 0}
                      onChange={(e) => setEditingConfig({ ...editingConfig, minuteRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Máximo Día Completo ($ COP)</label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      className="input-field"
                      value={editingConfig.fullDayRate || 0}
                      onChange={(e) => setEditingConfig({ ...editingConfig, fullDayRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label>Estado</label>
                  <select
                    className="input-field"
                    value={editingConfig.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingConfig({ ...editingConfig, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
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

