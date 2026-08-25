import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  X,
  Building2,
  CreditCard,
  Users,
  CheckSquare,
  Square,
  Sparkles,
  MapPin,
  Phone,
  Car,
  Settings2,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Trash2,
} from 'lucide-react';
import type {
  BranchDto,
  CreateBranchDto,
  UpdateBranchDto,
  BranchPaymentMethodDto,
} from '../model/BranchesContracts';
import { branchesService } from '../data/branchesService';
import { mediosPagoService } from '../data/mediosPagoService';
import { usuariosService } from '../data/usuariosService';
import { vehiculosConfigService } from '../data/vehiculosConfigService';
import type { PaymentMethodDto } from '../model/MediosPagoContracts';
import type { UserDto } from '../model/UsuariosContracts';
import type { VehiculoConfigDto, SaveVehiculoConfigDto } from '../model/VehiculosConfigContracts';
import { useBranchContext } from '../../../shared/context/ParqueaderoContext';
import { authService } from '../../auth/data/authService';

export const ParqueaderosTab: React.FC = () => {
  const { refreshBranches, activeBranchId, setActiveBranchId } = useBranchContext();
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal Crear / Editar Sede
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<(Partial<UpdateBranchDto> & { id?: number }) | null>(null);
  const [isSavingBranch, setIsSavingBranch] = useState(false);

  // Modal Parametrización por Sede
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchDto | null>(null);
  const [activeConfigTab, setActiveConfigTab] = useState<'payments' | 'users' | 'rates'>('payments');

  // Estado Medios de Pago por Sede
  const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethodDto[]>([]);
  const [enabledPaymentMethodIds, setEnabledPaymentMethodIds] = useState<number[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isSavingPayments, setIsSavingPayments] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Estado Asignación de Usuarios a Sede
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);

  // Estado Tarifas Vehiculares de la Sede
  const [branchRates, setBranchRates] = useState<VehiculoConfigDto[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isEditingRateModal, setIsEditingRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<Partial<SaveVehiculoConfigDto> | null>(null);
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [rateSuccessMsg, setRateSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      const data = await branchesService.getAll();
      setBranches(data || []);
    } catch (err) {
      console.error('Error al cargar sedes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBranch({
      code: `SEDE-0${branches.length + 1}`,
      name: '',
      address: '',
      phone: '',
      city: '',
      totalCapacity: 100,
      notes: '',
      isActive: true,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (b: BranchDto) => {
    setEditingBranch({
      id: b.id,
      code: b.code,
      name: b.name,
      address: b.address || '',
      phone: b.phone || '',
      city: b.city || '',
      totalCapacity: b.totalCapacity || 100,
      notes: b.notes || '',
      isActive: b.isActive ?? true,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.code || !editingBranch.name) {
      alert('Por favor completa el código y nombre de la sede.');
      return;
    }

    setIsSavingBranch(true);
    try {
      if (editingBranch.id) {
        await branchesService.update(editingBranch.id, editingBranch as UpdateBranchDto);
      } else {
        await branchesService.create(editingBranch as CreateBranchDto);
      }
      setIsEditModalOpen(false);
      setEditingBranch(null);
      await loadBranches();
      await refreshBranches();
    } catch (err: any) {
      alert(err?.message || 'Error al guardar la sede.');
    } finally {
      setIsSavingBranch(false);
    }
  };

  // Apertura del modal de configuración por sede
  const handleOpenConfig = async (branch: BranchDto) => {
    setSelectedBranch(branch);
    setActiveConfigTab('payments');
    setIsConfigModalOpen(true);
    setPaymentSuccessMsg(null);
    setUserSuccessMsg(null);
    setRateSuccessMsg(null);
    setIsEditingRateModal(false);

    // Cargar medios de pago
    setIsLoadingPayments(true);
    try {
      const [methods, configured] = await Promise.all([
        mediosPagoService.getMediosPago(),
        branchesService.getBranchPaymentMethods(branch.id),
      ]);
      setAllPaymentMethods(methods || []);
      const enabledIds = (configured || [])
        .filter((bpm: BranchPaymentMethodDto) => bpm.isEnabled)
        .map((bpm: BranchPaymentMethodDto) => bpm.paymentMethodId);
      setEnabledPaymentMethodIds(enabledIds);
    } catch (err) {
      console.error('Error cargando medios de pago de sede:', err);
    } finally {
      setIsLoadingPayments(false);
    }

    // Cargar usuarios
    setIsLoadingUsers(true);
    try {
      const [users, branchDetails] = await Promise.all([
        usuariosService.getUsuarios(),
        branchesService.getById(branch.id),
      ]);
      setAllUsers(users || []);
      const assignedIds = (branchDetails?.userBranches || []).map((ub: any) => ub.userId);
      setAssignedUserIds(assignedIds);
    } catch (err) {
      console.error('Error cargando usuarios asignados:', err);
    } finally {
      setIsLoadingUsers(false);
    }

    // Cargar tarifas de la sede
    await loadBranchRates(branch.id);
  };

  const loadBranchRates = async (branchId: number) => {
    setIsLoadingRates(true);
    try {
      const rates = await vehiculosConfigService.getConfigs(branchId);
      setBranchRates(rates || []);
    } catch (err) {
      console.error('Error cargando tarifas de sede:', err);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const togglePaymentMethod = (methodId: number) => {
    setEnabledPaymentMethodIds((prev) =>
      prev.includes(methodId) ? prev.filter((id) => id !== methodId) : [...prev, methodId]
    );
  };

  const handleSavePayments = async () => {
    if (!selectedBranch) return;
    setIsSavingPayments(true);
    setPaymentSuccessMsg(null);
    try {
      await branchesService.configurePaymentMethods({
        branchId: selectedBranch.id,
        paymentMethodIds: enabledPaymentMethodIds,
      });
      setPaymentSuccessMsg('Medios de pago configurados exitosamente para esta sede.');
      setTimeout(() => setPaymentSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error al guardar medios de pago.');
    } finally {
      setIsSavingPayments(false);
    }
  };

  const handleToggleUserAssignment = async (userId: number, isCurrentlyAssigned: boolean) => {
    if (!selectedBranch) return;
    try {
      if (isCurrentlyAssigned) {
        await branchesService.unassignUser({ branchId: selectedBranch.id, userId });
        setAssignedUserIds((prev) => prev.filter((id) => id !== userId));
        setUserSuccessMsg('Usuario desasignado de esta sede.');
      } else {
        await branchesService.assignUser({ branchId: selectedBranch.id, userId, isDefault: false });
        setAssignedUserIds((prev) => [...prev, userId]);
        setUserSuccessMsg('Usuario asignado a esta sede exitosamente.');
      }
      setTimeout(() => setUserSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error al modificar asignación de usuario.');
    }
  };

  // Manejadores de Tarifas Vehiculares por Sede
  const handleOpenCreateRate = () => {
    if (!selectedBranch) return;
    setEditingRate({
      branchId: selectedBranch.id,
      vehicleType: 0,
      category: 'Automóvil / Carro',
      gracePeriodMinutes: 15,
      hourRate: 4000,
      minuteRate: 70,
      fullDayRate: 35000,
      iconKey: 'IconCar',
      isActive: true,
    });
    setIsEditingRateModal(true);
  };

  const handleOpenEditRate = (rate: VehiculoConfigDto) => {
    setEditingRate({ ...rate });
    setIsEditingRateModal(true);
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
      defaultName = 'Furgón / Minibús';
      defaultIcon = 'IconVan';
    } else if (typeVal === 4) {
      defaultName = 'Bicicleta';
      defaultIcon = 'IconBike';
    } else if (typeVal === 5) {
      defaultName = 'Camioneta / SUV';
      defaultIcon = 'IconCar';
    }

    setEditingRate((prev) => ({
      ...prev,
      vehicleType: typeVal,
      category: prev?.category && prev.category !== 'Automóvil / Carro' && prev.category !== 'Motocicleta' && prev.category !== 'Camión / Vehículo Pesado' && prev.category !== 'Furgón / Minibús' && prev.category !== 'Bicicleta' && prev.category !== 'Camioneta / SUV' ? prev.category : defaultName,
      iconKey: defaultIcon,
    }));
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !editingRate || !editingRate.category) return;

    setIsSavingRate(true);
    try {
      await vehiculosConfigService.saveConfig(editingRate as SaveVehiculoConfigDto, selectedBranch.id);
      setIsEditingRateModal(false);
      setEditingRate(null);
      setRateSuccessMsg('Tarifa vehicular guardada exitosamente para esta sede.');
      await loadBranchRates(selectedBranch.id);
      setTimeout(() => setRateSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error al guardar tarifa vehicular.');
    } finally {
      setIsSavingRate(false);
    }
  };

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Sedes (Parqueaderos)</h2>
          <p>Administra las sedes físicas del sistema, parametrizando medios de pago, usuarios autorizados y tarifas por sede.</p>
        </div>
        {authService.hasPermission('branches.create') && (
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Sede
          </button>
        )}
      </div>

      {/* Grid de Sedes Físicas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
        {branches.length > 0 ? (
          branches.map((b) => {
            const isActive = b.isActive ?? true;
            return (
              <div
                key={b.id}
                style={{
                  background: '#ffffff',
                  border: activeBranchId === b.id ? '2px solid #07665e' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge" style={{ background: '#f1f5f9', color: '#07665e', fontWeight: 800 }}>
                      {b.code}
                    </span>
                    <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                      {isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    {b.name}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.84rem', color: '#64748b', marginBottom: '10px' }}>
                    {b.city && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#64748b" />
                        <span>{b.city} {b.address ? `— ${b.address}` : ''}</span>
                      </div>
                    )}
                    {b.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="#64748b" />
                        <span>{b.phone}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Car size={14} color="#64748b" />
                      <span>Capacidad: <strong>{b.totalCapacity} plazas</strong></span>
                    </div>
                  </div>

                  {b.notes && (
                    <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', margin: '8px 0' }}>
                      "{b.notes}"
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => handleOpenConfig(b)}
                    title="Parametrizar Medios de Pago, Usuarios y Tarifas"
                  >
                    <Settings2 size={14} color="#07665e" />
                    <span>Parametrizar</span>
                  </button>

                  <button
                    className="btn-icon"
                    style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    onClick={() => handleOpenEdit(b)}
                    title="Editar Sede"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
            {isLoading ? 'Cargando sedes registradas...' : 'No hay sedes registradas en la base de datos. Haz clic en "Crear Sede" para registrar tu primer parqueadero.'}
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR SEDE */}
      {isEditModalOpen && editingBranch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>{editingBranch.id ? 'Editar Sede' : 'Crear Nueva Sede'}</h3>
              <button className="btn-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBranch}>
              <div className="modal-body">
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Código de Sede *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editingBranch.code || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })}
                      placeholder="SEDE-01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombre de la Sede *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editingBranch.name || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                      placeholder="Sede Principal Centro"
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editingBranch.city || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, city: e.target.value })}
                      placeholder="Bogotá D.C."
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacidad Total (Plazas) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingBranch.totalCapacity || 1}
                      onChange={(e) => setEditingBranch({ ...editingBranch, totalCapacity: Number(e.target.value) })}
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingBranch.address || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                    placeholder="Carrera 10 # 20-30"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingBranch.phone || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    placeholder="3001234567"
                  />
                </div>

                <div className="form-group">
                  <label>Notas / Descripción</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    value={editingBranch.notes || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, notes: e.target.value })}
                    placeholder="Observaciones de la sede..."
                  />
                </div>

                {editingBranch.id && (
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editingBranch.isActive ?? true}
                        onChange={(e) => setEditingBranch({ ...editingBranch, isActive: e.target.checked })}
                      />
                      <span>Sede Activa en Operación</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSavingBranch}>
                  {isSavingBranch ? 'Guardando...' : 'Guardar Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PARAMETRIZACIÓN POR SEDE (MEDIOS DE PAGO, USUARIOS & TARIFAS) */}
      {isConfigModalOpen && selectedBranch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div>
                <h3>Parametrización por Sede</h3>
                <span style={{ fontSize: '0.84rem', color: '#07665e', fontWeight: 700 }}>
                  📍 {selectedBranch.code} — {selectedBranch.name} ({selectedBranch.totalCapacity} plazas)
                </span>
              </div>
              <button className="btn-close" onClick={() => setIsConfigModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Segmented Control Subtabs */}
            <div className="modal-subtabs-nav">
              <button
                className={`modal-subtab-btn ${activeConfigTab === 'payments' ? 'active' : ''}`}
                onClick={() => { setActiveConfigTab('payments'); setIsEditingRateModal(false); }}
              >
                <CreditCard size={16} /> Medios de Pago
              </button>
              <button
                className={`modal-subtab-btn ${activeConfigTab === 'users' ? 'active' : ''}`}
                onClick={() => { setActiveConfigTab('users'); setIsEditingRateModal(false); }}
              >
                <Users size={16} /> Asignación de Usuarios
              </button>
              <button
                className={`modal-subtab-btn ${activeConfigTab === 'rates' ? 'active' : ''}`}
                onClick={() => { setActiveConfigTab('rates'); setIsEditingRateModal(false); }}
              >
                <Car size={16} /> Tarifas Vehiculares
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '480px', overflowY: 'auto' }}>
              {/* TAB 1: MEDIOS DE PAGO */}
              {activeConfigTab === 'payments' && (
                <div>
                  <p style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.4 }}>
                    Selecciona qué medios de pago del catálogo maestro acepta y tiene habilitados esta sede para cobros en caja:
                  </p>

                  {paymentSuccessMsg && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} color="#059669" /> {paymentSuccessMsg}
                    </div>
                  )}

                  {isLoadingPayments ? (
                    <div className="text-center py-8 text-muted">Cargando medios de pago...</div>
                  ) : allPaymentMethods.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                      {allPaymentMethods.map((pm) => {
                        const isChecked = enabledPaymentMethodIds.includes(pm.id);
                        return (
                          <div
                            key={pm.id}
                            onClick={() => togglePaymentMethod(pm.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: isChecked ? '2px solid #07665e' : '1px solid #e2e8f0',
                              background: isChecked ? 'rgba(7, 102, 94, 0.05)' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <CreditCard size={18} color={isChecked ? '#07665e' : '#94a3b8'} />
                              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>
                                {pm.name}
                              </span>
                            </div>
                            {isChecked ? (
                              <CheckSquare size={20} color="#07665e" />
                            ) : (
                              <Square size={20} color="#cbd5e1" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '28px 20px', textAlign: 'center' }}>
                      <CreditCard size={32} style={{ color: '#94a3b8', margin: '0 auto 10px auto' }} />
                      <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155', margin: '0 0 6px 0' }}>
                        No hay medios de pago en el catálogo maestro
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                        Crea primero los medios de pago en la pestaña superior <strong>"Medios de Pago"</strong> para habilitarlos en esta sede.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ASIGNACIÓN DE USUARIOS */}
              {activeConfigTab === 'users' && (
                <div>
                  <p style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.4 }}>
                    Asocia qué usuarios (operadores, supervisores o administradores) tienen autorización para operar en esta sede:
                  </p>

                  {userSuccessMsg && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} color="#059669" /> {userSuccessMsg}
                    </div>
                  )}

                  {isLoadingUsers ? (
                    <div className="text-center py-8 text-muted">Cargando usuarios...</div>
                  ) : allUsers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {allUsers.map((u) => {
                        const isAssigned = assignedUserIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '11px 16px',
                              borderRadius: '10px',
                              border: isAssigned ? '2px solid #07665e' : '1px solid #e2e8f0',
                              background: isAssigned ? 'rgba(7, 102, 94, 0.05)' : '#ffffff',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                                {u.fullName || u.username}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                Rol: <strong>{u.roleName || (u.userRoleId === 1 ? 'Administrador' : 'Operador')}</strong> • @{u.username} • {u.email || 'Sin correo'}
                              </div>
                            </div>

                            <button
                              type="button"
                              className={isAssigned ? 'btn-secondary' : 'btn-primary'}
                              style={{ padding: '6px 14px', fontSize: '0.8rem', width: 'auto' }}
                              onClick={() => handleToggleUserAssignment(u.id, isAssigned)}
                            >
                              {isAssigned ? (
                                <><UserX size={14} /> Desasignar</>
                              ) : (
                                <><UserCheck size={14} /> Asignar a Sede</>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '28px 20px', textAlign: 'center' }}>
                      <Users size={32} style={{ color: '#94a3b8', margin: '0 auto 10px auto' }} />
                      <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155', margin: '0 0 6px 0' }}>
                        No hay usuarios registrados
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                        Crea usuarios en la pestaña superior "Usuarios" para asignarlos a esta sede.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TARIFAS VEHICULARES DE LA SEDE */}
              {activeConfigTab === 'rates' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                    <p style={{ fontSize: '0.86rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                      Tarifas de cobro por tiempo (hora/minuto/día) parametrizadas exclusivamente para esta sede:
                    </p>
                    {!isEditingRateModal && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        onClick={handleOpenCreateRate}
                      >
                        <Plus size={14} /> Agregar Tarifa a esta Sede
                      </button>
                    )}
                  </div>

                  {rateSuccessMsg && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} color="#059669" /> {rateSuccessMsg}
                    </div>
                  )}

                  {/* Formulario Inline para Crear/Editar Tarifa */}
                  {isEditingRateModal && editingRate && (
                    <form onSubmit={handleSaveRate} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                          {editingRate.rateId ? 'Editar Tarifa Vehicular' : 'Nueva Tarifa para esta Sede'}
                        </h4>
                        <button type="button" className="btn-close" onClick={() => setIsEditingRateModal(false)}>
                          <X size={16} />
                        </button>
                      </div>

                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                        <div className="form-group">
                          <label>Tipo de Vehículo</label>
                          <select
                            className="input-field"
                            value={editingRate.vehicleType ?? 0}
                            onChange={(e) => handleVehicleTypePresetChange(Number(e.target.value))}
                          >
                            <option value={0}>🚗 Automóvil / Carro</option>
                            <option value={1}>🏍️ Motocicleta</option>
                            <option value={2}>🚚 Camión / Pesado</option>
                            <option value={3}>🚐 Furgón / Minibús</option>
                            <option value={4}>🚲 Bicicleta</option>
                            <option value={5}>🚙 Camioneta / SUV</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Nombre / Categoría *</label>
                          <input
                            type="text"
                            className="input-field"
                            value={editingRate.category || ''}
                            onChange={(e) => setEditingRate({ ...editingRate, category: e.target.value })}
                            placeholder="Ej. Automóvil / Sedán"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                        <div className="form-group">
                          <label>Valor Hora ($) *</label>
                          <input
                            type="number"
                            className="input-field"
                            value={editingRate.hourRate || 0}
                            onChange={(e) => setEditingRate({ ...editingRate, hourRate: Number(e.target.value) })}
                            min={0}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Valor Minuto ($)</label>
                          <input
                            type="number"
                            className="input-field"
                            value={editingRate.minuteRate || 0}
                            onChange={(e) => setEditingRate({ ...editingRate, minuteRate: Number(e.target.value) })}
                            min={0}
                          />
                        </div>
                        <div className="form-group">
                          <label>Máximo Día ($)</label>
                          <input
                            type="number"
                            className="input-field"
                            value={editingRate.fullDayRate || 0}
                            onChange={(e) => setEditingRate({ ...editingRate, fullDayRate: Number(e.target.value) })}
                            min={0}
                          />
                        </div>
                        <div className="form-group">
                          <label>Gracia (min)</label>
                          <input
                            type="number"
                            className="input-field"
                            value={editingRate.gracePeriodMinutes || 0}
                            onChange={(e) => setEditingRate({ ...editingRate, gracePeriodMinutes: Number(e.target.value) })}
                            min={0}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setIsEditingRateModal(false)}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} disabled={isSavingRate}>
                          {isSavingRate ? 'Guardando...' : 'Guardar Tarifa'}
                        </button>
                      </div>
                    </form>
                  )}

                  {isLoadingRates ? (
                    <div className="text-center py-8 text-muted">Cargando tarifas vehiculares...</div>
                  ) : branchRates.length > 0 ? (
                    <table className="data-table" style={{ width: '100%', marginTop: '8px' }}>
                      <thead>
                        <tr>
                          <th>Categoría / Tipo</th>
                          <th>Valor Hora</th>
                          <th>Valor Minuto</th>
                          <th>Máximo Día</th>
                          <th>Gracia</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branchRates.map((r) => (
                          <tr key={r.rateId}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                <Car size={16} color="#07665e" />
                                <span>{r.category}</span>
                              </div>
                            </td>
                            <td><strong>${r.hourRate?.toLocaleString('es-CO') || 0}</strong></td>
                            <td>${r.minuteRate?.toLocaleString('es-CO') || 0}</td>
                            <td>${r.fullDayRate?.toLocaleString('es-CO') || 0}</td>
                            <td>{r.gracePeriodMinutes || 0} min</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ padding: '6px' }}
                                onClick={() => handleOpenEditRate(r)}
                                title="Editar Tarifa"
                              >
                                <Edit2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '28px 20px', textAlign: 'center' }}>
                      <Car size={32} style={{ color: '#94a3b8', margin: '0 auto 10px auto' }} />
                      <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155', margin: '0 0 6px 0' }}>
                        No hay tarifas vehiculares parametrizadas para esta sede
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
                        Haz clic en el botón inferior para configurar las tarifas de cobro por hora/minuto en esta sede.
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        onClick={handleOpenCreateRate}
                      >
                        <Plus size={15} /> Parametrizar Primera Tarifa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsConfigModalOpen(false)}>
                Cerrar
              </button>
              {activeConfigTab === 'payments' && allPaymentMethods.length > 0 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSavePayments}
                  disabled={isSavingPayments}
                >
                  {isSavingPayments ? 'Guardando...' : 'Guardar Medios de Pago'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
