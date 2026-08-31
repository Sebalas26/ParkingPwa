import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  CreditCard,
  Users,
  CheckSquare,
  Square,
  Car,
  Bike,
  Truck,
  Settings2,
  UserCheck,
  UserX,
  CheckCircle2,
  Building2,
  Search,
  ChevronDown,
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
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currencyUtils';

const AVATAR_COLORS = [
  { bg: '#e0f2fe', text: '#0369a1' },
  { bg: '#dcfce7', text: '#15803d' },
  { bg: '#fef3c7', text: '#b45309' },
  { bg: '#f3e8ff', text: '#7e22ce' },
  { bg: '#fee2e2', text: '#b91c1c' },
  { bg: '#ccfbf1', text: '#0f766e' },
  { bg: '#ffedd5', text: '#c2410c' },
];

const getAvatarStyle = (index: number) => {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
};

export const ParqueaderosTab: React.FC = () => {
  const { refreshBranches, inspectedCompany } = useBranchContext();
  const currentUser = authService.getCurrentUser();
  const targetCompanyId = inspectedCompany?.id || currentUser?.companyId || undefined;

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedBranchId, setExpandedBranchId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

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
  const [globalTypes, setGlobalTypes] = useState<VehiculoConfigDto[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isEditingRateModal, setIsEditingRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<Partial<SaveVehiculoConfigDto> | null>(null);
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [rateSuccessMsg, setRateSuccessMsg] = useState<string | null>(null);
  const [deletingRate, setDeletingRate] = useState<VehiculoConfigDto | null>(null);
  const [isDeletingRate, setIsDeletingRate] = useState(false);

  useEffect(() => {
    loadBranches();
  }, [inspectedCompany?.id]);

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      let data: BranchDto[] = [];
      if (targetCompanyId) {
        data = await branchesService.getByCompany(targetCompanyId);
      } else {
        data = await branchesService.getAll();
      }
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
        const payload: CreateBranchDto = {
          code: editingBranch.code.trim().toUpperCase(),
          name: editingBranch.name.trim(),
          address: editingBranch.address?.trim() || '',
          phone: editingBranch.phone?.trim(),
          city: editingBranch.city?.trim(),
          totalCapacity: editingBranch.totalCapacity || 100,
          notes: editingBranch.notes?.trim(),
          logoBase64: editingBranch.logoBase64?.trim(),
          companyId: targetCompanyId,
        };
        await branchesService.create(payload);
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
        .filter((bpm: BranchPaymentMethodDto) => bpm.isActive !== false && bpm.isEnabled !== false)
        .map((bpm: BranchPaymentMethodDto) => bpm.paymentMethodId);
      setEnabledPaymentMethodIds(enabledIds);
    } catch (err) {
      console.error('Error cargando medios de pago de sede:', err);
    } finally {
      setIsLoadingPayments(false);
    }

    // Cargar usuarios (solo operadores / no administradores)
    setIsLoadingUsers(true);
    try {
      const [users, assignedBranchUsers] = await Promise.all([
        usuariosService.getUsers(targetCompanyId),
        branchesService.getBranchUsers(branch.id),
      ]);
      const operatorsOnly = (users || []).filter((u: any) => {
        const role = (u.roleName || u.role || u.userRoleDto?.roleName || '').toLowerCase();
        return u.userRoleId !== 1 && role !== 'administrador' && role !== 'admin';
      });
      setAllUsers(operatorsOnly);
      const assignedIds = (assignedBranchUsers || []).map((u: any) => u.id);
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
      const [rates, globals] = await Promise.all([
        vehiculosConfigService.getBranchRates(branchId),
        vehiculosConfigService.getGlobalTypes(),
      ]);
      setBranchRates(rates || []);
      setGlobalTypes(globals || []);
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
    const unassigned = globalTypes.filter(
      (g) => !branchRates.some((r) => r.category.toLowerCase() === g.category.toLowerCase())
    );
    const defaultItem = unassigned.length > 0 ? unassigned[0] : (globalTypes.length > 0 ? globalTypes[0] : null);

    setEditingRate({
      branchId: selectedBranch.id,
      vehicleType: defaultItem ? defaultItem.vehicleType : 0,
      category: defaultItem ? defaultItem.category : '',
      gracePeriodMinutes: 15,
      hourRate: undefined,
      minuteRate: undefined,
      fullDayRate: undefined,
      iconKey: defaultItem ? defaultItem.iconKey : 'IconCar',
      isActive: true,
    });
    setIsEditingRateModal(true);
  };

  const handleOpenEditRate = (rate: VehiculoConfigDto) => {
    setEditingRate({ ...rate });
    setIsEditingRateModal(true);
  };

  const handleOpenDeleteRate = (rate: VehiculoConfigDto) => {
    setDeletingRate(rate);
  };

  const handleConfirmDeleteRate = async () => {
    if (!deletingRate || !selectedBranch) return;
    setIsDeletingRate(true);
    try {
      if (deletingRate.rateId) {
        await vehiculosConfigService.deleteConfig(deletingRate.rateId);
      }
      setBranchRates((prev) => prev.filter((r) => r.rateId !== deletingRate.rateId));
      setRateSuccessMsg(`Tarifa para "${deletingRate.category}" eliminada correctamente.`);
      setTimeout(() => setRateSuccessMsg(null), 3000);
      setDeletingRate(null);
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar la tarifa vehicular.');
    } finally {
      setIsDeletingRate(false);
    }
  };

  const inferVehicleTypeForBranch = (name: string): { type: number; icon: string } => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('moto')) return { type: 1, icon: 'IconMotorcycle' };
    if (lower.includes('camion') || lower.includes('camión') || lower.includes('pesado')) return { type: 2, icon: 'IconTruck' };
    if (lower.includes('furgon') || lower.includes('furgón') || lower.includes('van')) return { type: 3, icon: 'IconVan' };
    if (lower.includes('bici') || lower.includes('cicla')) return { type: 4, icon: 'IconBike' };
    if (lower.includes('suv') || lower.includes('camioneta')) return { type: 5, icon: 'IconCar' };
    return { type: 0, icon: 'IconCar' };
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !editingRate || !editingRate.category || !editingRate.category.trim()) {
      alert('Por favor ingresa el nombre o tipo de vehículo.');
      return;
    }

    const { type, icon } = inferVehicleTypeForBranch(editingRate.category);
    const payload: SaveVehiculoConfigDto = {
      rateId: editingRate.rateId,
      branchId: selectedBranch.id,
      vehicleType: editingRate.vehicleType !== undefined ? editingRate.vehicleType : type,
      category: editingRate.category.trim(),
      hourRate: editingRate.hourRate ?? 0,
      minuteRate: editingRate.minuteRate ?? 0,
      fullDayRate: editingRate.fullDayRate ?? 0,
      gracePeriodMinutes: editingRate.gracePeriodMinutes ?? 0,
      iconKey: editingRate.iconKey || icon,
      isActive: editingRate.isActive ?? true,
    };

    setIsSavingRate(true);
    try {
      await vehiculosConfigService.saveConfig(payload, selectedBranch.id);
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

  const filteredBranches = branches.filter((b) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (b.name || '').toLowerCase().includes(term) ||
      (b.code || '').toLowerCase().includes(term) ||
      (b.city || '').toLowerCase().includes(term) ||
      (b.address || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Sedes (Parqueaderos)</h2>
          <p>Administra las sedes físicas del sistema, parametrizando medios de pago, usuarios autorizados y tarifas por sede.</p>
        </div>
        {authService.hasPermission('branches.create') && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Sede
          </button>
        )}
      </div>

      {/* Barra de Búsqueda */}
      <div className="section-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar sede por nombre, código, ciudad o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 1. VISTA DESKTOP - TABLA DE DATOS */}
      <div className="desktop-table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Sede / Parqueadero</th>
                <th>Ubicación</th>
                <th>Teléfono</th>
                <th>Capacidad</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.length > 0 ? (
                filteredBranches.map((b) => {
                  const isActive = b.isActive ?? true;
                  return (
                    <tr key={b.id}>
                      <td>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#07665e', fontWeight: 800 }}>
                          {b.code}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#e6f4f1',
                              color: '#07665e',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</div>
                            {b.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>
                          {b.city ? <strong>{b.city}</strong> : null}
                          {b.city && b.address ? ' — ' : ''}
                          {b.address || 'N/A'}
                        </div>
                      </td>
                      <td>{b.phone || 'N/A'}</td>
                      <td>
                        <span className="badge badge-info">
                          <Car size={12} style={{ marginRight: 4 }} />
                          {b.totalCapacity} plazas
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            className="btn-action primary"
                            onClick={() => handleOpenConfig(b)}
                            title="Parametrizar Medios de Pago, Usuarios y Tarifas"
                          >
                            <Settings2 size={14} style={{ marginRight: 4 }} /> Parametrizar
                          </button>
                          {authService.hasPermission('branches.edit') && (
                            <button
                              className="btn-action secondary"
                              onClick={() => handleOpenEdit(b)}
                              title="Editar Sede"
                            >
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {isLoading ? 'Cargando sedes...' : 'No se encontraron sedes registradas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. VISTA MOBILE - LISTA DE TARJETAS EXPANDIBLES (ACCORDION) */}
      <div className="mobile-card-list">
        {filteredBranches.length > 0 ? (
          filteredBranches.map((b, idx) => {
            const isActive = b.isActive ?? true;
            const isExpanded = expandedBranchId === b.id;
            const avatarColor = getAvatarStyle(idx);
            const initials = b.code || (b.name ? b.name.substring(0, 2).toUpperCase() : 'SD');

            return (
              <div key={b.id} className={`expandable-card ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="expandable-card-header"
                  onClick={() => setExpandedBranchId(isExpanded ? null : b.id)}
                >
                  <div className="expandable-card-main">
                    <div
                      className="expandable-card-avatar"
                      style={{ background: avatarColor.bg, color: avatarColor.text }}
                    >
                      {initials}
                      <span className={`avatar-status-dot ${isActive ? 'active' : 'inactive'}`} />
                    </div>
                    <div className="expandable-card-info">
                      <span className="expandable-card-title">{b.name}</span>
                      <span className="expandable-card-subtitle">
                        {b.code} • {b.city || 'Sede'} • {b.totalCapacity} plazas
                      </span>
                    </div>
                  </div>
                  <div className={`expandable-card-chevron ${isExpanded ? 'expanded' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="expandable-card-body">
                    <div className="card-details-panel">
                      <div className="card-detail-row">
                        <span className="card-detail-label">Código:</span>
                        <span className="card-detail-value">{b.code}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Nombre de Sede:</span>
                        <span className="card-detail-value">{b.name}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Ubicación / Dirección:</span>
                        <span className="card-detail-value">
                          {b.city ? `${b.city} — ` : ''}{b.address || 'N/A'}
                        </span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Teléfono de Contacto:</span>
                        <span className="card-detail-value">{b.phone || 'N/A'}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Capacidad Total:</span>
                        <span className="card-detail-value"><strong>{b.totalCapacity} plazas</strong></span>
                      </div>
                      {b.notes && (
                        <div className="card-detail-row">
                          <span className="card-detail-label">Observaciones:</span>
                          <span className="card-detail-value" style={{ fontStyle: 'italic' }}>"{b.notes}"</span>
                        </div>
                      )}
                      <div className="card-detail-row">
                        <span className="card-detail-label">Estado:</span>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="expandable-card-actions">
                      <button
                        type="button"
                        className="card-action-btn card-action-btn-primary"
                        onClick={() => handleOpenConfig(b)}
                      >
                        <Settings2 size={14} /> Parametrizar
                      </button>
                      {authService.hasPermission('branches.edit') && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-outline"
                          onClick={() => handleOpenEdit(b)}
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '14px' }}>
            {isLoading ? 'Cargando sedes...' : 'No hay sedes registradas.'}
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR SEDE */}
      {isEditModalOpen && editingBranch && (
        <ModalPortal>
          <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>{editingBranch.id ? 'Editar Sede' : 'Crear Nueva Sede'}</h3>
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
                      value={editingBranch.totalCapacity ?? ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, totalCapacity: e.target.value ? Number(e.target.value) : undefined })}
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
        </ModalPortal>
      )}

      {/* MODAL DE PARAMETRIZACIÓN POR SEDE (MEDIOS DE PAGO, USUARIOS & TARIFAS) */}
      {isConfigModalOpen && selectedBranch && (
        <ModalPortal>
          <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div>
                <h3>Parametrización por Sede</h3>
                <span style={{ fontSize: '0.84rem', color: '#07665e', fontWeight: 700 }}>
                  📍 {selectedBranch.code} — {selectedBranch.name} ({selectedBranch.totalCapacity} plazas)
                </span>
              </div>
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
                    Asocia qué usuarios operadores tienen autorización para operar en esta sede <em>(los administradores tienen acceso global a todas las sedes por defecto)</em>:
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
                                Rol: <strong>{u.roleName || 'Operador'}</strong> • @{u.username} • {u.email || 'Sin correo'}
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
                        No hay operadores registrados
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                        Crea usuarios con rol Operador en la pestaña superior "Usuarios" para asignarlos a esta sede.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TARIFAS VEHICULARES DE LA SEDE */}
              {activeConfigTab === 'rates' && (
                <div>
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
                      </div>

                      <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label>Tipo de Vehículo a Asignar *</label>
                        {globalTypes.length > 0 && !editingRate.rateId ? (
                          <select
                            className="input-field"
                            value={editingRate.category || ''}
                            onChange={(e) => {
                              const cat = e.target.value;
                              const match = globalTypes.find((g) => g.category === cat);
                              setEditingRate({
                                ...editingRate,
                                category: cat,
                                vehicleType: match ? match.vehicleType : editingRate.vehicleType,
                                iconKey: match ? match.iconKey : editingRate.iconKey,
                              });
                            }}
                            required
                          >
                            <option value="">-- Selecciona un tipo del catálogo general --</option>
                            {globalTypes.map((g) => (
                              <option key={g.rateId || g.category} value={g.category}>
                                {g.category}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="input-field"
                            value={editingRate.category || ''}
                            onChange={(e) => setEditingRate({ ...editingRate, category: e.target.value })}
                            placeholder="Ej: Automóvil, Motocicleta, Camión, Bicicleta"
                            required
                            autoFocus
                          />
                        )}
                      </div>

                      <div className="form-row form-grid-rates">
                        <div className="form-group">
                          <label>Valor Hora ($) *</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="0"
                            value={formatCurrencyInput(editingRate.hourRate)}
                            onChange={(e) => setEditingRate({ ...editingRate, hourRate: parseCurrencyInput(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Valor Minuto ($) *</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="0"
                            value={formatCurrencyInput(editingRate.minuteRate)}
                            onChange={(e) => setEditingRate({ ...editingRate, minuteRate: parseCurrencyInput(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Máximo Día ($) *</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="0"
                            value={formatCurrencyInput(editingRate.fullDayRate)}
                            onChange={(e) => setEditingRate({ ...editingRate, fullDayRate: parseCurrencyInput(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Gracia (min) *</label>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="15"
                            value={editingRate.gracePeriodMinutes !== undefined && editingRate.gracePeriodMinutes !== null ? editingRate.gracePeriodMinutes : ''}
                            onChange={(e) => setEditingRate({ ...editingRate, gracePeriodMinutes: e.target.value === '' ? undefined : Number(e.target.value) })}
                            min={0}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setIsEditingRateModal(false)}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} disabled={isSavingRate}>
                          {isSavingRate ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Loader2 size={13} className="spinner" /> Guardando...
                            </span>
                          ) : (
                            'Guardar Tarifa'
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {isLoadingRates ? (
                    <div className="text-center py-8 text-muted">Cargando tarifas vehiculares...</div>
                  ) : branchRates.length > 0 ? (
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
                            <Plus size={14} /> Asignar Tarifa a esta Sede
                          </button>
                        )}
                      </div>

                      <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: '8px' }}>
                        <table className="data-table" style={{ width: '100%', minWidth: '540px' }}>
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
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {Number(r.vehicleType) === 1 ? <Bike size={16} color="#2563eb" /> : Number(r.vehicleType) === 2 ? <Truck size={16} color="#d97706" /> : <Car size={16} color="#07665e" />}
                                    <span>{r.category}</span>
                                  </div>
                                </td>
                                <td style={{ whiteSpace: 'nowrap' }}><strong>${r.hourRate?.toLocaleString('es-CO') || 0}</strong></td>
                                <td style={{ whiteSpace: 'nowrap' }}>${r.minuteRate?.toLocaleString('es-CO') || 0}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>${r.fullDayRate?.toLocaleString('es-CO') || 0}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>{r.gracePeriodMinutes || 0} min</td>
                                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <button
                                    type="button"
                                    className="btn-icon"
                                    style={{ padding: '6px', marginRight: '4px' }}
                                    onClick={() => handleOpenEditRate(r)}
                                    title="Editar Tarifa"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon"
                                    style={{ padding: '6px', color: '#ef4444' }}
                                    onClick={() => handleOpenDeleteRate(r)}
                                    title="Eliminar Tarifa"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    !isEditingRateModal && (
                      <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '28px 20px', textAlign: 'center' }}>
                        <Car size={32} style={{ color: '#94a3b8', margin: '0 auto 10px auto' }} />
                        <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155', margin: '0 0 6px 0' }}>
                          No hay tarifas vehiculares parametrizadas para esta sede
                        </p>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                          Asigna los tipos de vehículos que recibirá este parqueadero y define los precios de cobro para esta sede:
                        </p>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 20px', fontSize: '0.85rem', margin: '0 auto' }}
                          onClick={handleOpenCreateRate}
                        >
                          <Plus size={15} /> Asignar Tarifa a esta Sede
                        </button>
                      </div>
                    )
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
        </ModalPortal>
      )}

      {/* Modal de Confirmación para Eliminar Tarifa Vehicular */}
      {deletingRate && (
        <ModalPortal>
          <div className="confirm-dialog-overlay" style={{ zIndex: 20000 }}>
          <div className="confirm-dialog-card">
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              ¿Eliminar Tarifa Vehicular?
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas eliminar la parametrización de tarifa para <strong>{deletingRate.category}</strong> de esta sede? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => setDeletingRate(null)}
                disabled={isDeletingRate}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                style={{ flex: 1, padding: '10px' }}
                onClick={handleConfirmDeleteRate}
                disabled={isDeletingRate}
              >
                {isDeletingRate ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Loader2 size={14} className="spinner" /> Eliminando...
                  </span>
                ) : (
                  'Sí, Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};
