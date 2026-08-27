import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, CreditCard } from 'lucide-react';
import type { PaymentMethodDto, SavePaymentMethodDto } from '../model/MediosPagoContracts';
import { mediosPagoService } from '../data/mediosPagoService';
import { authService } from '../../auth/data/authService';

const PAYMENT_EMOJIS = [
  { emoji: '💵', label: 'Efectivo' },
  { emoji: '💳', label: 'Tarjeta' },
  { emoji: '📱', label: 'Móvil / Nequi' },
  { emoji: '📲', label: 'QR / Pasarela' },
  { emoji: '🏦', label: 'Transferencia' },
  { emoji: '💰', label: 'Monedero' },
  { emoji: '🪙', label: 'Monedas' },
  { emoji: '👛', label: 'Billetera' },
  { emoji: '🧾', label: 'Recibo' },
  { emoji: '💸', label: 'Remesa' },
  { emoji: '🏧', label: 'Datáfono' },
  { emoji: '🎟️', label: 'Bono / Vale' },
  { emoji: '🏷️', label: 'Descuento' },
  { emoji: '⚡', label: 'Rápido' },
  { emoji: '💎', label: 'Puntos' },
  { emoji: '💼', label: 'Empresarial' },
];

export const MediosPagoTab: React.FC = () => {
  const [mediosPago, setMediosPago] = useState<PaymentMethodDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedio, setEditingMedio] = useState<SavePaymentMethodDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    loadMediosPago();
  }, []);

  const handleOpenCreate = () => {
    setEditingMedio({
      name: '',
      icon: '💵',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mp: PaymentMethodDto) => {
    const isAct = mp.isActive ?? (mp.status === true || mp.status === 'Activo' || mp.status === 'Active');
    setEditingMedio({
      id: mp.id,
      name: mp.name,
      icon: mp.icon || '💳',
      isActive: isAct,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedio || !editingMedio.name?.trim()) return;

    try {
      await mediosPagoService.createOrEditPaymentMethod({
        id: editingMedio.id,
        name: editingMedio.name.trim(),
        icon: editingMedio.icon || '💳',
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
    if (!iconName) return <CreditCard size={18} style={{ color: '#07665e' }} />;

    // Si es un emoji o cadena directa de emoji
    if (/\p{Extended_Pictographic}/u.test(iconName) || iconName.length <= 4) {
      return (
        <span
          style={{
            fontSize: '1.25rem',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {iconName}
        </span>
      );
    }

    switch (iconName.toLowerCase()) {
      case 'banknote':
      case 'cash':
      case 'efectivo':
        return <span style={{ fontSize: '1.25rem' }}>💵</span>;
      case 'qrcode':
      case 'qr':
        return <span style={{ fontSize: '1.25rem' }}>📲</span>;
      case 'smartphone':
      case 'transfer':
      case 'nequi':
      case 'daviplata':
        return <span style={{ fontSize: '1.25rem' }}>📱</span>;
      case 'wallet':
        return <span style={{ fontSize: '1.25rem' }}>👛</span>;
      default:
        return <span style={{ fontSize: '1.25rem' }}>💳</span>;
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

      <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="data-table" style={{ minWidth: '520px' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>MEDIO DE PAGO</th>
              <th>ÍCONO</th>
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
                      <span style={{ whiteSpace: 'nowrap' }}>{mp.name}</span>
                    </td>
                    <td>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(7, 102, 94, 0.08)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                        }}
                      >
                        {getIconComponent(mp.icon || mp.name)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isAct ? 'badge-success' : 'badge-danger'}`}>
                        {isAct ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
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
      </div>

      {/* Modal Crear / Editar Medio de Pago */}
      {isModalOpen && editingMedio && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
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
                  <label>Nombre del Medio de Pago *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. Efectivo, Nequi, Daviplata, Tarjeta Crédito..."
                    value={editingMedio.name}
                    onChange={(e) => setEditingMedio({ ...editingMedio, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Selecciona un Ícono Representativo</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Seleccionado: <strong style={{ fontSize: '1.2rem', marginLeft: '4px' }}>{editingMedio.icon || '💳'}</strong>
                    </span>
                  </label>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      gap: '6px',
                      background: 'var(--bg-secondary, #f8fafc)',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color, #e2e8f0)',
                    }}
                  >
                    {PAYMENT_EMOJIS.map(({ emoji, label }) => {
                      const isSelected = (editingMedio.icon || '💳') === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          title={label}
                          onClick={() => setEditingMedio({ ...editingMedio, icon: emoji })}
                          style={{
                            fontSize: '1.35rem',
                            padding: '8px 4px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #07665e' : '1px solid #e2e8f0',
                            background: isSelected ? 'rgba(7, 102, 94, 0.15)' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          }}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
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
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  {editingMedio.id ? 'Guardar Cambios' : 'Crear Medio de Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
