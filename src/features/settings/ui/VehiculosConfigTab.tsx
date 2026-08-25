import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Car, Bike, Truck, ShieldAlert, Building2 } from 'lucide-react';
import type { VehiculoConfigDto, SaveVehiculoConfigDto } from '../model/VehiculosConfigContracts';
import { vehiculosConfigService } from '../data/vehiculosConfigService';
import { useBranchContext } from '../../../shared/context/ParqueaderoContext';
import { authService } from '../../auth/data/authService';

export const VehiculosConfigTab: React.FC = () => {
  const { activeBranchId, activeBranch } = useBranchContext();
  const [configs, setConfigs] = useState<VehiculoConfigDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<SaveVehiculoConfigDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, [activeBranchId]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await vehiculosConfigService.getConfigs(activeBranchId);
      setConfigs(data || []);
    } catch (err) {
      console.error('Error al cargar configuraciones de vehículos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingConfig({
      branchId: activeBranchId,
      vehicleType: 0,
      category: 'Automóvil / Carro',
      gracePeriodMinutes: 15,
      hourRate: 4000,
      minuteRate: 70,
      fullDayRate: 35000,
      iconKey: 'IconCar',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehiculoConfigDto) => {
    setEditingConfig({ ...v });
    setIsModalOpen(true);
  };

  const handleVehicleTypePresetChange = (typeVal: number) => {
    let defaultName = 'Automóvil / Carro';
    let defaultIcon = 'IconCar';
    if (typeVal === 1) {
      defaultName = 'Motocicleta';
      defaultIcon = 'IconMotorcycle';
    } else if (typeVal === 2) {
      defaultName = 'Camión / Vehículo Pesado';
      defaultIcon = 'IconTruck';
    } else if (typeVal === 3) {
      defaultName = 'Bicicleta';
      defaultIcon = 'IconBike';
    }

    setEditingConfig((prev) => ({
      ...prev,
      vehicleType: typeVal,
      category: prev?.category && prev.category !== 'Automóvil / Carro' && prev.category !== 'Motocicleta' && prev.category !== 'Camión / Vehículo Pesado' && prev.category !== 'Bicicleta' ? prev.category : defaultName,
      iconKey: defaultIcon,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig || !editingConfig.category) return;

    try {
      await vehiculosConfigService.saveConfig(editingConfig as SaveVehiculoConfigDto, activeBranchId);
      setIsModalOpen(false);
      setEditingConfig(null);
      await loadConfigs();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar configuración de tarifa.');
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2>Configuración de Tarifas Vehiculares</h2>
            {activeBranch && (
              <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>
                📍 Sede: {activeBranch.code} — {activeBranch.name}
              </span>
            )}
          </div>
          <p>Parametriza los tipos de vehículos, tarifas por hora/minuto/día y tiempos de gracia para la sede activa.</p>
        </div>
        {(authService.hasPermission('settings.vehiculos.manage') || authService.hasPermission('rates.create')) && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Tarifa
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>CATEGORÍA / TIPO</th>
            <th>TIPO CÓDIGO</th>
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
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    Tipo {c.vehicleType}
                  </span>
                </td>
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
                  {(authService.hasPermission('settings.vehiculos.manage') || authService.hasPermission('rates.edit')) && (
                    <button className="btn-icon" onClick={() => handleOpenEdit(c)} title="Editar Tarifa">
                      <Edit2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="text-center py-6 text-muted">
                {isLoading ? 'Cargando tarifas vehiculares...' : 'No hay tarifas parametrizadas para esta sede. Crea la primera con el botón superior.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && editingConfig && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{editingConfig.rateId ? 'Editar Tarifa Vehicular' : 'Nueva Tarifa Vehicular'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {activeBranch && (
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={16} color="#07665e" />
                    <strong>Sede Asignada:</strong> {activeBranch.code} — {activeBranch.name}
                  </div>
                )}

                <div className="form-group">
                  <label>Tipo de Vehículo (Categoría Base)</label>
                  <select
                    className="input-field"
                    value={Number(editingConfig.vehicleType) || 0}
                    onChange={(e) => handleVehicleTypePresetChange(Number(e.target.value))}
                  >
                    <option value={0}>0 — Automóvil / Carro / Sedán</option>
                    <option value={1}>1 — Motocicleta</option>
                    <option value={2}>2 — Camión / Vehículo Pesado</option>
                    <option value={3}>3 — Bicicleta / Otros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nombre a Mostrar *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingConfig.category || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, category: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Valor Hora (COP) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingConfig.hourRate || 0}
                      onChange={(e) => setEditingConfig({ ...editingConfig, hourRate: Number(e.target.value) })}
                      min={0}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor Minuto (COP) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingConfig.minuteRate || 0}
                      onChange={(e) => setEditingConfig({ ...editingConfig, minuteRate: Number(e.target.value) })}
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Máximo Día (Full Day COP) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingConfig.fullDayRate || 0}
                      onChange={(e) => setEditingConfig({ ...editingConfig, fullDayRate: Number(e.target.value) })}
                      min={0}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tiempo Gracia (Minutos) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingConfig.gracePeriodMinutes ?? 15}
                      onChange={(e) => setEditingConfig({ ...editingConfig, gracePeriodMinutes: Number(e.target.value) })}
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingConfig.isActive ?? true}
                      onChange={(e) => setEditingConfig({ ...editingConfig, isActive: e.target.checked })}
                    />
                    <span>Tarifa Activa para operaciones de Parqueadero</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
