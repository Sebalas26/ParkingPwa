import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import type { PaymentMethodDto, SavePaymentMethodDto } from '../model/MediosPagoContracts';
import { mediosPagoService } from '../data/mediosPagoService';

export const MediosPagoTab: React.FC = () => {
  const [mediosPago, setMediosPago] = useState<PaymentMethodDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedio, setEditingMedio] = useState<Partial<SavePaymentMethodDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMediosPago();
  }, []);

  const loadMediosPago = async () => {
    setIsLoading(true);
    try {
      const data = await mediosPagoService.getPaymentMethods();
      setMediosPago(data || []);
    } catch (err) {
      console.error('Error al cargar medios de pago:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingMedio({
      name: '',
      status: 'Activo',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mp: PaymentMethodDto) => {
    setEditingMedio({
      id: mp.id,
      name: mp.name,
      status: mp.status === true || mp.status === 'Activo' || mp.status === 'Active' ? 'Activo' : 'Inactivo',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedio) return;

    try {
      await mediosPagoService.createOrEditPaymentMethod({
        id: editingMedio.id,
        name: editingMedio.name || '',
        status: editingMedio.status === 'Activo' || editingMedio.status === true ? 'Activo' : 'Inactivo',
      });
      setIsModalOpen(false);
      setEditingMedio(null);
      await loadMediosPago();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el medio de pago.');
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Medios de Pago</h2>
          <p>Configura los medios de pago aceptados en el sistema de estacionamiento (Efectivo, Tarjetas, Transferencias, etc.).</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
          <Plus size={16} /> Crear Medio de Pago
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>NOMBRE DEL MEDIO</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {mediosPago.length > 0 ? (
            mediosPago.map((mp) => (
              <tr key={mp.id}>
                <td className="font-bold text-muted">#{mp.id}</td>
                <td className="font-bold">{mp.name}</td>
                <td>
                  <span className={`badge ${mp.status === 'Activo' || mp.status === true || mp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {mp.status === 'Activo' || mp.status === true || mp.status === 'Active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="text-right">
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button className="btn-action primary" onClick={() => handleOpenEdit(mp)}>
                      <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando medios de pago...' : 'No se encontraron medios de pago configurados.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Crear / Editar Medio de Pago */}
      {isModalOpen && editingMedio && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {editingMedio.id ? `Editar Medio de Pago (#${editingMedio.id})` : 'Crear Medio de Pago'}
              </h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Medio de Pago</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. Efectivo, Tarjeta de Débito, Transferencia Bancaria"
                    value={editingMedio.name || ''}
                    onChange={(e) => setEditingMedio({ ...editingMedio, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select
                    className="input-field"
                    value={editingMedio.status === true || editingMedio.status === 'Activo' ? 'Activo' : 'Inactivo'}
                    onChange={(e) => setEditingMedio({ ...editingMedio, status: e.target.value })}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar Medio de Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
