import React, { useState, useEffect } from 'react';
import { Edit2, X } from 'lucide-react';
import type { VehicleRateDto, UpdateVehicleRateDto } from '../model/TarifasContracts';
import { tarifasService } from '../data/tarifasService';
import { authService } from '../../auth/data/authService';

export const TarifasTab: React.FC = () => {
  const [tarifas, setTarifas] = useState<VehicleRateDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarifa, setEditingTarifa] = useState<VehicleRateDto | null>(null);
  const [formData, setFormData] = useState<UpdateVehicleRateDto>({
    hourRate: 2000,
    minuteRate: 50,
    fullDayRate: 15000,
    gracePeriodMinutes: 15,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTarifas();
  }, []);

  const loadTarifas = async () => {
    setIsLoading(true);
    try {
      const data = await tarifasService.getAllRates();
      setTarifas(data || []);
    } catch (err) {
      console.error('Error al cargar tarifas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleTypeName = (type: number | string) => {
    switch (String(type)) {
      case '0':
      case 'Car':
        return 'Sedán / Auto';
      case '1':
      case 'Motorcycle':
        return 'Motocicleta';
      case '2':
      case 'Truck':
        return 'Camión';
      case '3':
      case 'Van':
        return 'Camioneta / Van';
      case '4':
      case 'Bicycle':
        return 'Bicicleta';
      case '5':
      case 'Suv':
        return 'SUV';
      default:
        return String(type);
    }
  };

  const handleOpenEdit = (t: VehicleRateDto) => {
    setEditingTarifa(t);
    setFormData({
      hourRate: t.hourRate,
      minuteRate: t.minuteRate,
      fullDayRate: t.fullDayRate,
      gracePeriodMinutes: t.gracePeriodMinutes,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarifa) return;

    try {
      await tarifasService.updateRate(editingTarifa.rateId, formData);
      setIsModalOpen(false);
      setEditingTarifa(null);
      await loadTarifas();
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar tarifa.');
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Tarifas y Precios</h2>
          <p>Configura las tarifas por hora, fracciones por minuto, períodos de gracia y montos máximos por día según el tipo de vehículo.</p>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>TIPO DE VEHÍCULO</th>
            <th>VALOR HORA</th>
            <th>VALOR MINUTO</th>
            <th>MÁXIMO DÍA</th>
            <th>TIEMPO DE GRACIA</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {tarifas.length > 0 ? (
            tarifas.map((t) => (
              <tr key={t.rateId}>
                <td className="font-bold">{getVehicleTypeName(t.vehicleType)}</td>
                <td>${(t.hourRate || 0).toLocaleString()}</td>
                <td>${(t.minuteRate || 0).toLocaleString()}</td>
                <td>${(t.fullDayRate || 0).toLocaleString()}</td>
                <td>{t.gracePeriodMinutes} min</td>
                <td>
                  <span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {t.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="text-right">
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {(authService.hasPermission('settings.tarifas.manage') || authService.hasPermission('rates.manage')) && (
                      <button className="btn-action primary" onClick={() => handleOpenEdit(t)}>
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
                {isLoading ? 'Cargando tarifas...' : 'No se encontraron tarifas configuradas.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Editar Tarifa */}
      {isModalOpen && editingTarifa && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Editar Tarifa: {getVehicleTypeName(editingTarifa.vehicleType)}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Valor Hora ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="input-field"
                      value={formData.hourRate}
                      onChange={(e) => setFormData({ ...formData, hourRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor Minuto Fracción ($)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={formData.minuteRate}
                      onChange={(e) => setFormData({ ...formData, minuteRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Máximo Día Completo ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      className="input-field"
                      value={formData.fullDayRate}
                      onChange={(e) => setFormData({ ...formData, fullDayRate: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tiempo de Gracia (Minutos)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={formData.gracePeriodMinutes}
                      onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })}
                      required
                    />
                  </div>
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
    </div>
  );
};
