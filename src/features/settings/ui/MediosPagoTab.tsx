import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, CreditCard, Banknote, QrCode, Wallet, Smartphone } from 'lucide-react';
import type { PaymentMethodDto, SavePaymentMethodDto } from '../model/MediosPagoContracts';
import { mediosPagoService } from '../data/mediosPagoService';
import { authService } from '../../auth/data/authService';

export const MediosPagoTab: React.FC = () => {
  const [mediosPago, setMediosPago] = useState<PaymentMethodDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedio, setEditingMedio] = useState<SavePaymentMethodDto | null>(null);
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
      icon: 'CreditCard',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mp: PaymentMethodDto) => {
    const isAct = mp.isActive ?? (mp.status === true || mp.status === 'Activo' || mp.status === 'Active');
    setEditingMedio({
      id: mp.id,
      name: mp.name,
      icon: mp.icon || 'CreditCard',
      isActive: isAct,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedio) return;

    try {
      await mediosPagoService.createOrEditPaymentMethod({
        id: editingMedio.id,
        name: editingMedio.name.trim(),
        icon: editingMedio.icon || 'CreditCard',
        isActive: editingMedio.isActive,
      });
      setIsModalOpen(false);
      setEditingMedio(null);
      await loadMediosPago();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el medio de pago en la base de datos.');
    }
  };

  const getIconComponent = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'banknote':
      case 'cash':
      case 'efectivo':
        return <Banknote size={16} style={{ color: '#16a34a' }} />;
      case 'qrcode':
      case 'qr':
        return <QrCode size={16} style={{ color: '#9333ea' }} />;
      case 'smartphone':
      case 'transfer':
      case 'nequi':
      case 'daviplata':
        return <Smartphone size={16} style={{ color: '#2563eb' }} />;
      case 'wallet':
        return <Wallet size={16} style={{ color: '#d97706' }} />;
      default:
        return <CreditCard size={16} style={{ color: '#07665e' }} />;
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Medios de Pago</h2>
          <p>Configura las formas de recaudación y cobro disponibles en las cajas del parqueadero (Efectivo, Tarjetas, Transferencias, etc.).</p>
        </div>
        {authService.hasPermission('settings.medios_pago.manage') && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Medio de Pago
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>MEDIO DE PAGO</th>
            <th>TIPO / ÍCONO</th>
            <th>ESTADO</th>
            <th className="text-right">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {mediosPago.length > 0 ? (
            mediosPago.map((mp) => {
              const isAct = mp.isActive ?? (mp.status === 'Activo' || mp.status === true || mp.status === 'Active');

              return (
                <tr key={mp.id}>
                  <td className="font-bold text-muted">#{mp.id}</td>
                  <td className="font-bold">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getIconComponent(mp.icon || mp.name)}
                      <span>{mp.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">{mp.icon || 'CreditCard'}</td>
                  <td>
                    <span className={`badge ${isAct ? 'badge-success' : 'badge-danger'}`}>
                      {isAct ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {authService.hasPermission('settings.medios_pago.manage') && (
                        <button className="btn-action primary" onClick={() => handleOpenEdit(mp)}>
                          <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Cargando medios de pago desde la API...' : 'No se encontraron medios de pago registrados en la base de datos.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Crear / Editar Medio de Pago */}
      {isModalOpen && editingMedio && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>
                {editingMedio.id ? `Editar Medio de Pago (#${editingMedio.id})` : 'Crear Medio de Pago en BD'}
              </h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Medio de Pago *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. Efectivo, Tarjeta de Crédito, PSE / Transferencia"
                    value={editingMedio.name}
                    onChange={(e) => setEditingMedio({ ...editingMedio, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ícono / Categoría Visual</label>
                  <select
                    className="input-field"
                    value={editingMedio.icon || 'CreditCard'}
                    onChange={(e) => setEditingMedio({ ...editingMedio, icon: e.target.value })}
                  >
                    <option value="CreditCard">💳 Tarjeta (Crédito / Débito)</option>
                    <option value="Banknote">💵 Efectivo (Billetes / Monedas)</option>
                    <option value="Smartphone">📱 Transferencia Móvil (Nequi / Daviplata)</option>
                    <option value="QrCode">📲 Código QR / Pasarela Digital</option>
                    <option value="Wallet">👛 Billetera Digital</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select
                    className="input-field"
                    value={editingMedio.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingMedio({ ...editingMedio, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Activo (Disponible en Caja)</option>
                    <option value="false">Inactivo (Deshabilitado)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Guardar en BD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
