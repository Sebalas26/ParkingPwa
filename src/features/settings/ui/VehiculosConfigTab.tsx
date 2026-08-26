import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Car, Bike, Truck } from 'lucide-react';
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
      console.error('Error al cargar tipos de vehículos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingConfig({
      branchId: null,
      vehicleType: 0,
      category: '',
      gracePeriodMinutes: undefined,
      hourRate: undefined,
      minuteRate: undefined,
      fullDayRate: undefined,
      iconKey: 'IconCar',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehiculoConfigDto) => {
    setEditingConfig({ ...v });
    setIsModalOpen(true);
  };

  const inferVehicleType = (name: string): { type: number; icon: string } => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('moto')) return { type: 1, icon: 'IconMotorcycle' };
    if (lower.includes('camion') || lower.includes('camión') || lower.includes('pesado')) return { type: 2, icon: 'IconTruck' };
    if (lower.includes('furgon') || lower.includes('furgón') || lower.includes('van')) return { type: 3, icon: 'IconVan' };
    if (lower.includes('bici') || lower.includes('cicla')) return { type: 4, icon: 'IconBike' };
    if (lower.includes('suv') || lower.includes('camioneta')) return { type: 5, icon: 'IconCar' };
    return { type: 0, icon: 'IconCar' };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig || !editingConfig.category || !editingConfig.category.trim()) {
      alert('Por favor ingresa el nombre o tipo de vehículo.');
      return;
    }

    const { type, icon } = inferVehicleType(editingConfig.category);
    const payload: SaveVehiculoConfigDto = {
      rateId: editingConfig.rateId,
      branchId: editingConfig.branchId ?? null,
      vehicleType: editingConfig.vehicleType ?? type,
      category: editingConfig.category.trim(),
      hourRate: editingConfig.hourRate ?? 0,
      minuteRate: editingConfig.minuteRate ?? 0,
      fullDayRate: editingConfig.fullDayRate ?? 0,
      gracePeriodMinutes: editingConfig.gracePeriodMinutes ?? 0,
      iconKey: editingConfig.iconKey || icon,
      isActive: editingConfig.isActive ?? true,
    };

    try {
      await vehiculosConfigService.saveConfig(payload, null);
      setIsModalOpen(false);
      setEditingConfig(null);
      await loadConfigs();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar tipo de vehículo.');
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Tipos de Vehículos</h2>
          <p>Parametriza el catálogo general de tipos de vehículos y tarifas base del sistema.</p>
        </div>
        {(authService.hasPermission('settings.vehiculos.manage') || authService.hasPermission('rates.create')) && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Tipo de Vehículo
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
                <td className="font-bold">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Number(c.vehicleType) === 1 ? <Bike size={18} color="#2563eb" /> : Number(c.vehicleType) === 2 ? <Truck size={18} color="#d97706" /> : <Car size={18} color="#07665e" />}
                    <span>{c.category}</span>
                  </div>
                </td>
                <td>{c.gracePeriodMinutes || 0} min</td>
                <td><strong>${(c.hourRate || 0).toLocaleString()}</strong></td>
                <td>${(c.minuteRate || 0).toLocaleString()}</td>
                <td>${(c.fullDayRate || 0).toLocaleString()}</td>
                <td>
                  <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="text-right">
                  {(authService.hasPermission('settings.vehiculos.manage') || authService.hasPermission('rates.edit')) && (
                    <button className="btn-icon" onClick={() => handleOpenEdit(c)} title="Editar Tipo de Vehículo">
                      <Edit2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando tipos de vehículos...' : 'No hay tipos de vehículos registrados en el catálogo general. Crea el primero con el botón superior.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && editingConfig && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{editingConfig.rateId ? 'Editar Tipo de Vehículo' : 'Nuevo Tipo de Vehículo'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre / Tipo de Vehículo *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Automóvil, Motocicleta, Camión, Bicicleta"
                    value={editingConfig.category || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, category: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Valor Hora ($) *</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0"
                      value={editingConfig.hourRate !== undefined && editingConfig.hourRate !== null ? editingConfig.hourRate : ''}
                      onChange={(e) => setEditingConfig({ ...editingConfig, hourRate: e.target.value === '' ? undefined : Number(e.target.value) })}
                      min={0}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor Minuto ($) *</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0"
                      value={editingConfig.minuteRate !== undefined && editingConfig.minuteRate !== null ? editingConfig.minuteRate : ''}
                      onChange={(e) => setEditingConfig({ ...editingConfig, minuteRate: e.target.value === '' ? undefined : Number(e.target.value) })}
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Máximo Día (Full Day $) *</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0"
                      value={editingConfig.fullDayRate !== undefined && editingConfig.fullDayRate !== null ? editingConfig.fullDayRate : ''}
                      onChange={(e) => setEditingConfig({ ...editingConfig, fullDayRate: e.target.value === '' ? undefined : Number(e.target.value) })}
                      min={0}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tiempo Gracia (Minutos) *</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0"
                      value={editingConfig.gracePeriodMinutes !== undefined && editingConfig.gracePeriodMinutes !== null ? editingConfig.gracePeriodMinutes : ''}
                      onChange={(e) => setEditingConfig({ ...editingConfig, gracePeriodMinutes: e.target.value === '' ? undefined : Number(e.target.value) })}
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingConfig.isActive ?? true}
                      onChange={(e) => setEditingConfig({ ...editingConfig, isActive: e.target.checked })}
                    />
                    <span>Tipo de Vehículo Activo en el Sistema</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Tipo de Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
