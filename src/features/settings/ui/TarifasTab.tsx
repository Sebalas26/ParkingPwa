import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X , Trash2} from 'lucide-react';
import type { Tarifa } from '../model/SettingsTypes';
import { settingsService } from '../data/settingsService';

export const TarifasTab: React.FC = () => {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarifa, setEditingTarifa] = useState<Partial<Tarifa> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Tarifa | null>(null);

  useEffect(() => {
    loadTarifas();
  }, []);

  const loadTarifas = async () => {
    const data = await settingsService.getTarifas();
    setTarifas(data);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    await settingsService.deleteTarifa(itemToDelete.id);
    setItemToDelete(null);
    await loadTarifas();
  };

  const handleOpenCreate = () => {
    setEditingTarifa({
      vehicleType: 'Sedán',
      hourlyRate: 2000,
      fractionRate: 500,
      maxDailyRate: 15000,
      gracePeriodMinutes: 15,
      status: 'Activa'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Tarifa) => {
    setEditingTarifa({ ...t });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarifa) return;
    await settingsService.saveTarifa(editingTarifa);
    setIsModalOpen(false);
    setEditingTarifa(null);
    await loadTarifas();
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Tarifas y Precios</h2>
          <p>Configura las tarifas por hora, fracciones, períodos de gracia y montos máximos por día según el tipo de vehículo.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
          <Plus size={16} /> Crear Tarifa
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>TIPO DE VEHÍCULO</th>
            <th>VALOR HORA</th>
            <th>FRACCIÓN (15 min)</th>
            <th>MÁXIMO DÍA</th>
            <th>TIEMPO DE GRACIA</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {tarifas.map((t) => (
            <tr key={t.id}>
              <td className="font-bold text-muted">{t.id}</td>
              <td className="font-bold">{t.vehicleType}</td>
              <td>${t.hourlyRate.toLocaleString()}</td>
              <td>${t.fractionRate.toLocaleString()}</td>
              <td>${t.maxDailyRate.toLocaleString()}</td>
              <td>{t.gracePeriodMinutes} min</td>
              <td>
                <span className={`badge ${t.status === 'Activa' ? 'badge-success' : 'badge-danger'}`}>
                  {t.status}
                </span>
              </td>
              <td className="text-right">
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button className="btn-action primary" onClick={() => handleOpenEdit(t)}>
                  <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                </button>
                <button className="btn-action danger" style={{ color: '#ef4444' }} onClick={() => setItemToDelete(t)}>
                  <Trash2 size={14} style={{ marginRight: 4 }} /> Eliminar
                </button>
                              </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Crear / Editar Tarifa */}
      {isModalOpen && editingTarifa && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingTarifa.id ? `Editar Tarifa (${editingTarifa.id})` : 'Crear Nueva Tarifa'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tipo de Vehículo</label>
                  <select 
                    className="input-field" 
                    value={editingTarifa.vehicleType || 'Sedán'}
                    onChange={(e) => setEditingTarifa({ ...editingTarifa, vehicleType: e.target.value as any })}
                  >
                    <option value="Sedán">Sedán</option>
                    <option value="SUV">SUV</option>
                    <option value="Motocicleta">Motocicleta</option>
                    <option value="Camión / Bus">Camión / Bus</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Valor Hora ($)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={editingTarifa.hourlyRate || 0}
                      onChange={(e) => setEditingTarifa({ ...editingTarifa, hourlyRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fracción 15 min ($)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={editingTarifa.fractionRate || 0}
                      onChange={(e) => setEditingTarifa({ ...editingTarifa, fractionRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Máximo Día ($)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={editingTarifa.maxDailyRate || 0}
                      onChange={(e) => setEditingTarifa({ ...editingTarifa, maxDailyRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Gracia (minutos)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={editingTarifa.gracePeriodMinutes || 0}
                      onChange={(e) => setEditingTarifa({ ...editingTarifa, gracePeriodMinutes: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select 
                    className="input-field" 
                    value={editingTarifa.status || 'Activa'}
                    onChange={(e) => setEditingTarifa({ ...editingTarifa, status: e.target.value as any })}
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Tarifa
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
