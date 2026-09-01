import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Shield, Trash2, IdCard, Search, Loader2, AlertTriangle, AlertCircle, ChevronDown, Eye, EyeOff } from 'lucide-react';
import type { UserDto, SaveUserDto, GetIdentificationTypeDto, GetUserRoleDto } from '../model/UsuariosContracts';
import type { BranchDto } from '../model/BranchesContracts';
import { usuariosService } from '../data/usuariosService';
import { branchesService } from '../data/branchesService';
import { authService } from '../../auth/data/authService';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';

const getDocTypeLabel = (identification?: string, name?: string) => {
  const code = (identification || '').trim().toUpperCase();
  if (name && name.trim().toUpperCase() !== code && name.trim() !== '') {
    return `${code} - ${name}`;
  }
  switch (code) {
    case 'CC':
      return 'CC - Cédula de Ciudadanía';
    case 'CE':
      return 'CE - Cédula de Extranjería';
    case 'NIT':
      return 'NIT - Número de Identificación Tributaria';
    case 'PAS':
      return 'PAS - Pasaporte';
    case 'PEP':
      return 'PEP - Permiso Especial de Permanencia';
    case 'TI':
      return 'TI - Tarjeta de Identidad';
    default:
      return code || 'Documento';
  }
};

const getAvatarStyle = (index: number) => {
  const palettes = [
    { bg: '#dcfce7', text: '#15803d' }, // Emerald / Green
    { bg: '#dbeafe', text: '#1d4ed8' }, // Blue
    { bg: '#f3e8ff', text: '#7e22ce' }, // Purple
    { bg: '#ffedd5', text: '#c2410c' }, // Orange
    { bg: '#ccfbf1', text: '#0f766e' }, // Teal
    { bg: '#fef3c7', text: '#b45309' }, // Amber
  ];
  return palettes[index % palettes.length];
};

const getInitials = (name?: string, username?: string) => {
  const target = (name || username || 'U').trim();
  const parts = target.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return target.slice(0, 2).toUpperCase();
};

export const UsuariosTab: React.FC = () => {
  const { inspectedCompany } = useParqueaderoContext();
  const currentUser = authService.getCurrentUser();
  const targetCompanyId = useMemo(
    () => inspectedCompany?.id || currentUser?.companyId || undefined,
    [inspectedCompany?.id, currentUser?.companyId]
  );

  const [usuarios, setUsuarios] = useState<UserDto[]>([]);
  const [identTypes, setIdentTypes] = useState<GetIdentificationTypeDto[]>([]);
  const [allUserRoles, setAllUserRoles] = useState<GetUserRoleDto[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<GetUserRoleDto[]>([]);
  const [allBranches, setAllBranches] = useState<BranchDto[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [initialAssignedBranchIds, setInitialAssignedBranchIds] = useState<number[]>([]);
  const [branchSearch, setBranchSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<SaveUserDto | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Estado para el modal de confirmación de eliminación con loader
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  useEffect(() => {
    loadData(targetCompanyId);
  }, [targetCompanyId]);

  const loadData = async (companyId?: number) => {
    setIsLoading(true);
    try {
      const [usersData, typesData, rolesData, branchesData] = await Promise.all([
        usuariosService.getUsers(companyId),
        usuariosService.getIdentificationTypes(),
        usuariosService.getUserRoles(companyId),
        companyId ? branchesService.getByCompany(companyId) : branchesService.getAll(),
      ]);
      setUsuarios(usersData || []);
      setIdentTypes(typesData || []);

      const isUserSuperAdmin = currentUser?.isSuperAdmin === true;

      const filteredRoles = (rolesData || []).filter((r) => {
        const name = (r.roleName || r.role || r.name || '').trim().toLowerCase();
        const isSuperAdmin = name === 'super administrador' || name === 'super admin' || name === 'superadmin';
        return !isSuperAdmin || isUserSuperAdmin;
      });

      setAllUserRoles(filteredRoles);
      setAssignableRoles(filteredRoles);
      setAllBranches(branchesData || []);
    } catch (err) {
      console.error('Error al cargar datos de usuarios y sedes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUserForm = (form: SaveUserDto, branches: number[]): Record<string, string> => {
    const errors: Record<string, string> = {};
    const normIdNum = (form.identificationNumber || '').trim().toLowerCase();
    const normUsername = (form.username || '').trim().toLowerCase();
    const normEmail = (form.email || '').trim().toLowerCase();

    // 1. Identificación
    if (!form.identificationNumber || !form.identificationNumber.trim()) {
      errors.identificationNumber = 'El número de identificación es obligatorio.';
    } else if (form.identificationNumber.trim().length < 3) {
      errors.identificationNumber = 'El documento debe tener al menos 3 caracteres.';
    } else {
      const dupDoc = usuarios.some(
        (u) => u.id !== form.id && (u.identificationNumber || '').trim().toLowerCase() === normIdNum
      );
      if (dupDoc) {
        errors.identificationNumber = 'Este número de identificación ya está registrado en la empresa.';
      }
    }

    // 2. Nombres y Apellidos
    if (!form.firstName || !form.firstName.trim()) {
      errors.firstName = 'El primer nombre es obligatorio.';
    } else if (form.firstName.trim().length < 2) {
      errors.firstName = 'El primer nombre debe tener al menos 2 caracteres.';
    }

    if (!form.firstSurname || !form.firstSurname.trim()) {
      errors.firstSurname = 'El primer apellido es obligatorio.';
    } else if (form.firstSurname.trim().length < 2) {
      errors.firstSurname = 'El primer apellido debe tener al menos 2 caracteres.';
    }

    // 3. Nombre de Usuario
    if (!form.username || !form.username.trim()) {
      errors.username = 'El nombre de usuario es obligatorio.';
    } else if (form.username.trim().length < 3) {
      errors.username = 'El usuario debe tener al menos 3 caracteres.';
    } else {
      const dupUser = usuarios.some(
        (u) => u.id !== form.id && (u.username || '').trim().toLowerCase() === normUsername
      );
      if (dupUser) {
        errors.username = 'Este nombre de usuario ya está registrado en la empresa.';
      }
    }

    // 4. Correo Electrónico
    if (!form.email || !form.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Ingresa un correo electrónico válido (ej: usuario@empresa.com).';
    } else {
      const dupEmail = usuarios.some(
        (u) => u.id !== form.id && (u.email || '').trim().toLowerCase() === normEmail
      );
      if (dupEmail) {
        errors.email = 'Este correo electrónico ya está registrado en la empresa.';
      }
    }

    // 5. Contraseña
    if (!form.id && (!form.password || !form.password.trim())) {
      errors.password = 'La contraseña inicial es requerida para nuevos usuarios.';
    } else if (form.password?.trim() && form.password.trim().length < 4) {
      errors.password = 'La contraseña debe tener al menos 4 caracteres.';
    }

    // 6. Rol del Sistema
    if (!form.userRoleId || form.userRoleId === 0) {
      errors.userRoleId = 'Debes seleccionar un rol para el usuario.';
    }

    // 7. Sedes para operadores no administradores
    const selectedRole = allUserRoles.find((r) => (r.idUserRol ?? r.id) === form.userRoleId);
    const isRoleAdmin = selectedRole?.roleName?.toLowerCase().includes('admin') || form.userRoleId === 1;
    if (!isRoleAdmin && allBranches.length > 0 && branches.length === 0) {
      errors.branches = 'Debes asignar al menos una sede física al operador.';
    }

    return errors;
  };

  const handleFieldChange = (field: keyof SaveUserDto, value: any) => {
    if (!editingUsuario) return;
    const updated = { ...editingUsuario, [field]: value };
    setEditingUsuario(updated);

    // Validación reactiva en caliente
    const allErr = validateUserForm(updated, selectedBranchIds);
    if (!allErr[field]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    } else {
      setFormErrors((prev) => ({ ...prev, [field]: allErr[field] }));
    }
  };

  const handleOpenCreate = () => {
    const defaultTypeId = identTypes.length > 0 ? (identTypes[0].id || 1) : 1;

    setEditingUsuario({
      companyId: targetCompanyId,
      identificationTypeId: defaultTypeId,
      identificationNumber: '',
      firstName: '',
      middleName: '',
      firstSurname: '',
      secondLastName: '',
      fullName: '',
      username: '',
      email: '',
      password: '',
      userRoleId: 0, // Placeholder neutro inicial: obliga a seleccionar un rol
      isActive: true,
    });
    setFormErrors({});
    setSelectedBranchIds([]);
    setInitialAssignedBranchIds([]);
    setBranchSearch('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (u: UserDto) => {
    let assignedBranchIds: number[] = [];
    try {
      const userBranches = await branchesService.getByUser(u.id);
      assignedBranchIds = (userBranches || []).map((b: BranchDto) => b.id);
    } catch (err) {
      console.error('Error al cargar sedes del usuario:', err);
    }

    setEditingUsuario({
      id: u.id,
      companyId: u.companyId || targetCompanyId,
      identificationTypeId: u.identificationTypeId || 1,
      identificationNumber: u.identificationNumber || '',
      firstName: u.firstName || '',
      middleName: u.middleName || '',
      firstSurname: u.firstSurname || '',
      secondLastName: u.secondLastName || '',
      fullName: u.fullName || '',
      username: u.username || '',
      email: u.email || '',
      password: '', // Contraseña en blanco para edición
      userRoleId: u.userRoleId || 0,
      isActive: u.isActive ?? true,
    });

    setFormErrors({});
    setSelectedBranchIds(assignedBranchIds);
    setInitialAssignedBranchIds(assignedBranchIds);
    setBranchSearch('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsuario) return;

    const errors = validateUserForm(editingUsuario, selectedBranchIds);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const computedFullName = editingUsuario.fullName?.trim() ||
      `${editingUsuario.firstName} ${editingUsuario.middleName || ''} ${editingUsuario.firstSurname} ${editingUsuario.secondLastName || ''}`.replace(/\s+/g, ' ').trim();

    setIsSavingUser(true);
    try {
      const payload: SaveUserDto = {
        ...editingUsuario,
        companyId: targetCompanyId || editingUsuario.companyId,
        fullName: computedFullName,
        username: editingUsuario.username.trim() || editingUsuario.email.trim(),
      };

      const savedUser = await usuariosService.saveOrEditUser(payload);
      const targetUserId = savedUser?.id || editingUsuario.id;

      const selectedRole = allUserRoles.find((r) => (r.idUserRol ?? r.id) === editingUsuario.userRoleId);
      const isRoleAdmin = selectedRole?.roleName?.toLowerCase().includes('admin') || editingUsuario.userRoleId === 1;

      // Si el rol NO es Administrador, sincronizar asignaciones de sedes
      if (targetUserId && !isRoleAdmin) {
        // Sedes a asignar
        const toAssign = selectedBranchIds.filter((bId) => !initialAssignedBranchIds.includes(bId));
        // Sedes a desasignar
        const toUnassign = initialAssignedBranchIds.filter((bId) => !selectedBranchIds.includes(bId));

        await Promise.all([
          ...toAssign.map((branchId, idx) =>
            branchesService.assignUser({ branchId, userId: targetUserId, isDefault: idx === 0 })
          ),
          ...toUnassign.map((branchId) =>
            branchesService.unassignUser({ branchId, userId: targetUserId })
          ),
        ]);
      }

      setIsModalOpen(false);
      setEditingUsuario(null);
      const freshUsers = await usuariosService.getUsers(targetCompanyId);
      setUsuarios(freshUsers || []);
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el usuario en la base de datos.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    const targetId = userToDelete.id;

    // 1. Eliminación reactiva instantánea en la UI
    setUsuarios((prev) => prev.filter((u) => u.id !== targetId));

    try {
      await usuariosService.deleteUser(targetId);
      const freshUsers = await usuariosService.getUsers(targetCompanyId);
      setUsuarios(freshUsers || []);
      setUserToDelete(null);
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el usuario de la base de datos.');
      await loadData(targetCompanyId);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const currentUserForFilter = authService.getCurrentUser();
  const isUserSuperAdmin = currentUserForFilter?.isSuperAdmin === true;

  const displayUsers = usuarios.filter((u) => {
    // Si el usuario es el propio usuario autenticado (el Admin logueado), SIEMPRE se incluye
    if (currentUserForFilter?.userId && String(u.id) === String(currentUserForFilter.userId)) {
      return true;
    }

    const roleTitle = u.userRoleDto?.roleName || u.roleName || u.role || '';
    const normRole = roleTitle.trim().toLowerCase();
    const isTargetSuperAdmin = normRole === 'super administrador' || normRole === 'super admin' || normRole === 'superadmin';
    return !isTargetSuperAdmin || isUserSuperAdmin;
  });

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Gestión de Usuarios</h2>
          <p>Administra los operadores, supervisores y administradores con acceso al sistema.</p>
        </div>
        {authService.hasPermission('users.create') && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear Usuario
          </button>
        )}
      </div>

      {/* 1. VISTA DESKTOP - TABLA CLÁSICA */}
      <div className="desktop-table-view">
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ minWidth: '600px' }}>
            <thead>
              <tr>
                <th>NOMBRE COMPLETO</th>
                <th>DOCUMENTO</th>
                <th>USUARIO / CORREO</th>
                <th>ROL</th>
                <th>ESTADO</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.length > 0 ? (
                displayUsers.map((u) => {
                  const docTypeName = u.identificationTypeDto?.name || u.identificationTypeDto?.identification || 'CC';
                  const roleTitle = u.userRoleDto?.roleName || u.roleName || u.role || (u.userRoleId === 1 ? 'Administrador' : 'Operador');
                  const isActive = u.isActive ?? (u.status === true || u.status === 'Activo' || u.status === 'Active');

                  return (
                    <tr key={u.id}>
                      <td className="font-bold">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                          <IdCard size={16} color="#07665e" />
                          <span>{u.fullName || `${u.firstName || ''} ${u.firstSurname || ''}`.trim() || u.username}</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                          <strong>{docTypeName}:</strong> {u.identificationNumber || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{u.username}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.email}</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`badge ${u.userRoleId === 1 || roleTitle.toLowerCase().includes('admin') ? 'badge-primary' : 'badge-info'}`}>
                          <Shield size={12} style={{ marginRight: '4px' }} />
                          {roleTitle}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {authService.hasPermission('users.edit') && (
                            <button className="btn-icon" onClick={() => handleOpenEdit(u)} title="Editar Usuario">
                              <Edit2 size={16} />
                            </button>
                          )}
                          {authService.hasPermission('users.edit') && (
                            <button className="btn-icon danger" onClick={() => setUserToDelete(u)} title="Eliminar Usuario de la BD">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-muted">
                    {isLoading ? 'Cargando usuarios...' : 'No hay usuarios registrados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. VISTA MOBILE - LISTA DE TARJETAS EXPANDIBLES (ACCORDION) */}
      <div className="mobile-card-list">
        {displayUsers.length > 0 ? (
          displayUsers.map((u, idx) => {
            const docTypeName = u.identificationTypeDto?.name || u.identificationTypeDto?.identification || 'CC';
            const roleTitle = u.userRoleDto?.roleName || u.roleName || u.role || (u.userRoleId === 1 ? 'Administrador' : 'Operador');
            const isActive = u.isActive ?? (u.status === true || u.status === 'Activo' || u.status === 'Active');
            const isExpanded = expandedUserId === u.id;
            const displayName = u.fullName || `${u.firstName || ''} ${u.firstSurname || ''}`.trim() || u.username;
            const avatarColor = getAvatarStyle(idx);
            const initials = getInitials(displayName, u.username);

            return (
              <div key={u.id} className={`expandable-card ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="expandable-card-header"
                  onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
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
                      <span className="expandable-card-title">{displayName}</span>
                      <span className="expandable-card-subtitle">
                        {u.username} • {docTypeName}: {u.identificationNumber || 'N/A'}
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
                        <span className="card-detail-label">Documento:</span>
                        <span className="card-detail-value">{docTypeName}: {u.identificationNumber || 'N/A'}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Usuario:</span>
                        <span className="card-detail-value">{u.username}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Correo:</span>
                        <span className="card-detail-value">{u.email || 'N/A'}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Rol Asignado:</span>
                        <span className={`badge ${u.userRoleId === 1 || roleTitle.toLowerCase().includes('admin') ? 'badge-primary' : 'badge-info'}`}>
                          <Shield size={12} style={{ marginRight: '4px' }} />
                          {roleTitle}
                        </span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Estado:</span>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="expandable-card-actions">
                      {authService.hasPermission('users.edit') && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-outline"
                          onClick={() => handleOpenEdit(u)}
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                      )}
                      {authService.hasPermission('users.edit') && (
                        <button
                          type="button"
                          className="card-action-btn card-action-btn-danger"
                          onClick={() => setUserToDelete(u)}
                        >
                          <Trash2 size={14} /> Eliminar
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
            {isLoading ? 'Cargando usuarios...' : 'No hay usuarios registrados.'}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Usuario */}
      {isModalOpen && editingUsuario && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !isSavingUser && setIsModalOpen(false)}>
            <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingUsuario.id ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
              </div>

              <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
                <div className="modal-body">
                  {/* 1. DOCUMENTO DE IDENTIDAD */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo Doc.</label>
                      <select
                        className="input-field"
                        value={editingUsuario.identificationTypeId}
                        onChange={(e) => handleFieldChange('identificationTypeId', Number(e.target.value))}
                        disabled={isSavingUser}
                      >
                        {identTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {getDocTypeLabel(t.identification, t.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={`form-group ${formErrors.identificationNumber ? 'has-error' : ''}`}>
                      <label>
                        Número de Identificación <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={`input-field ${formErrors.identificationNumber ? 'input-error' : ''}`}
                        placeholder="Ej: 1020304050"
                        value={editingUsuario.identificationNumber}
                        onChange={(e) => handleFieldChange('identificationNumber', e.target.value)}
                        disabled={isSavingUser}
                      />
                      {formErrors.identificationNumber && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {formErrors.identificationNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. DATOS PERSONALES */}
                  <h4 style={{ fontSize: '0.82rem', color: '#07665e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    2. Datos Personales
                  </h4>

                  <div className="form-row">
                    <div className={`form-group ${formErrors.firstName ? 'has-error' : ''}`}>
                      <label>
                        Primer Nombre <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={`input-field ${formErrors.firstName ? 'input-error' : ''}`}
                        placeholder="Ej: Carlos"
                        value={editingUsuario.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        disabled={isSavingUser}
                      />
                      {formErrors.firstName && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {formErrors.firstName}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Segundo Nombre</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Opcional"
                        value={editingUsuario.middleName || ''}
                        onChange={(e) => handleFieldChange('middleName', e.target.value)}
                        disabled={isSavingUser}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className={`form-group ${formErrors.firstSurname ? 'has-error' : ''}`}>
                      <label>
                        Primer Apellido <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={`input-field ${formErrors.firstSurname ? 'input-error' : ''}`}
                        placeholder="Ej: Gómez"
                        value={editingUsuario.firstSurname}
                        onChange={(e) => handleFieldChange('firstSurname', e.target.value)}
                        disabled={isSavingUser}
                      />
                      {formErrors.firstSurname && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {formErrors.firstSurname}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Segundo Apellido</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Opcional"
                        value={editingUsuario.secondLastName || ''}
                        onChange={(e) => handleFieldChange('secondLastName', e.target.value)}
                        disabled={isSavingUser}
                      />
                    </div>
                  </div>

                  {/* 3. CREDENCIALES Y PERMISOS */}
                  <h4 style={{ fontSize: '0.82rem', color: '#07665e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    3. Credenciales y Permisos
                  </h4>

                  <div className="form-row">
                    <div className={`form-group ${formErrors.username ? 'has-error' : ''}`}>
                      <label>
                        Nombre de Usuario <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className={`input-field ${formErrors.username ? 'input-error' : ''}`}
                        placeholder="Ej: cgomez"
                        value={editingUsuario.username}
                        onChange={(e) => handleFieldChange('username', e.target.value)}
                        disabled={isSavingUser}
                      />
                      {formErrors.username && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {formErrors.username}
                        </span>
                      )}
                    </div>
                    <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
                      <label>
                        Correo Electrónico <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="email"
                        className={`input-field ${formErrors.email ? 'input-error' : ''}`}
                        placeholder="prueba@parqueadero.com"
                        value={editingUsuario.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        disabled={isSavingUser}
                      />
                      {formErrors.email && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {formErrors.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className={`form-group ${formErrors.password ? 'has-error' : ''}`}>
                      <label>
                        {editingUsuario.id ? (
                          'Nueva Contraseña (Opcional)'
                        ) : (
                          <>
                            Contraseña Inicial <span className="required-asterisk">*</span>
                          </>
                        )}
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`input-field ${formErrors.password ? 'input-error' : ''}`}
                          placeholder="••••••••••••"
                          style={{ paddingRight: '40px' }}
                          value={editingUsuario.password || ''}
                          onChange={(e) => handleFieldChange('password', e.target.value)}
                          disabled={isSavingUser}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                          }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {formErrors.password && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {formErrors.password}
                        </span>
                      )}
                    </div>
                    <div className={`form-group ${formErrors.userRoleId ? 'has-error' : ''}`}>
                      <label>
                        Rol del Sistema <span className="required-asterisk">*</span>
                      </label>
                      <select
                        className={`input-field ${formErrors.userRoleId ? 'input-error' : ''}`}
                        value={editingUsuario.userRoleId || 0}
                        onChange={(e) => handleFieldChange('userRoleId', Number(e.target.value))}
                        disabled={isSavingUser}
                      >
                        <option value={0} disabled>
                          -- Seleccionar Rol del Sistema --
                        </option>
                        {(() => {
                          const isEditingAdmin = editingUsuario.userRoleId === 1;
                          const roleOptions = isEditingAdmin ? allUserRoles : assignableRoles;
                          return roleOptions.map((r) => {
                            const roleId = r.idUserRol ?? r.id ?? 2;
                            const roleTitle = r.roleName || r.role || r.name || 'Operador';
                            return (
                              <option key={roleId} value={roleId}>
                                {roleTitle}
                              </option>
                            );
                          });
                        })()}
                      </select>
                      {formErrors.userRoleId && (
                        <span className="form-field-error">
                          <AlertCircle size={12} /> {formErrors.userRoleId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '8px' }}>
                    <label>Estado de Cuenta</label>
                    <select
                      className="input-field"
                      value={editingUsuario.isActive ? 'true' : 'false'}
                      onChange={(e) => handleFieldChange('isActive', e.target.value === 'true')}
                      disabled={isSavingUser}
                    >
                      <option value="true">Activo (Habilitado para operar)</option>
                      <option value="false">Inactivo (Acceso bloqueado)</option>
                    </select>
                  </div>

                  {/* 4. ASIGNACIÓN DE SEDES (PARQUEADEROS) */}
                  <h4 style={{ fontSize: '0.82rem', color: '#07665e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    4. Sedes Autorizadas (Parqueaderos)
                  </h4>

                  {(() => {
                    const selectedRole = allUserRoles.find((r) => (r.idUserRol ?? r.id) === editingUsuario.userRoleId);
                    const isRoleAdmin = selectedRole?.roleName?.toLowerCase().includes('admin') || editingUsuario.userRoleId === 1;
                    return isRoleAdmin ? (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.84rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={16} color="#16a34a" />
                        <span>
                          <strong>Acceso Global a la Empresa:</strong> Los usuarios con rol <strong>Administrador</strong> tienen acceso automático a todas las sedes de la empresa.
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                            Selecciona las sedes físicas donde este operador podrá operar:
                          </p>
                          <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                            {selectedBranchIds.length} de {allBranches.length} seleccionada(s)
                          </span>
                        </div>

                        {allBranches.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                              <input
                                type="text"
                                className="input-field"
                                placeholder="Buscar sede por nombre, código o ciudad..."
                                value={branchSearch}
                                onChange={(e) => setBranchSearch(e.target.value)}
                                style={{ paddingLeft: '32px', height: '36px', fontSize: '0.84rem' }}
                                disabled={isSavingUser}
                              />
                            </div>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                if (selectedBranchIds.length === allBranches.length) {
                                  setSelectedBranchIds([]);
                                } else {
                                  setSelectedBranchIds(allBranches.map((b) => b.id));
                                  setFormErrors((prev) => {
                                    const copy = { ...prev };
                                    delete copy.branches;
                                    return copy;
                                  });
                                }
                              }}
                              style={{ padding: '0 12px', fontSize: '0.78rem', height: '36px', whiteSpace: 'nowrap' }}
                              disabled={isSavingUser}
                            >
                              {selectedBranchIds.length === allBranches.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                            </button>
                          </div>
                        )}

                        {formErrors.branches && (
                          <div style={{ marginBottom: '8px' }}>
                            <span className="form-field-error">
                              <AlertCircle size={12} /> {formErrors.branches}
                            </span>
                          </div>
                        )}

                        {(() => {
                          const filteredBranches = allBranches.filter((b) => {
                            const query = branchSearch.trim().toLowerCase();
                            if (!query) return true;
                            return (
                              (b.name || '').toLowerCase().includes(query) ||
                              (b.code || '').toLowerCase().includes(query) ||
                              (b.city || '').toLowerCase().includes(query) ||
                              (b.address || '').toLowerCase().includes(query)
                            );
                          });

                          return filteredBranches.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', maxHeight: '170px', overflowY: 'auto', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                              {filteredBranches.map((b) => {
                                const isChecked = selectedBranchIds.includes(b.id);
                                return (
                                  <label
                                    key={b.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      background: isChecked ? 'rgba(7, 102, 94, 0.08)' : '#ffffff',
                                      border: isChecked ? '1px solid #07665e' : '1px solid #e2e8f0',
                                      cursor: isSavingUser ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.15s',
                                      userSelect: 'none',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedBranchIds((prev) => [...prev, b.id]);
                                            setFormErrors((prev) => {
                                              const copy = { ...prev };
                                              delete copy.branches;
                                              return copy;
                                            });
                                          } else {
                                            setSelectedBranchIds((prev) => prev.filter((id) => id !== b.id));
                                          }
                                        }}
                                        disabled={isSavingUser}
                                        style={{ width: '16px', height: '16px', accentColor: '#07665e' }}
                                      />
                                      <div>
                                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                                          📍 {b.code} — {b.name}
                                        </div>
                                        {b.city && (
                                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                            {b.city} {b.address ? `• ${b.address}` : ''}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                      {b.totalCapacity} plazas
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : allBranches.length > 0 ? (
                            <div style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                              No se encontraron sedes con el término "{branchSearch}".
                            </div>
                          ) : (
                            <div style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                              No hay sedes registradas en el sistema.
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSavingUser}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: 'auto' }}
                    disabled={isSavingUser}
                  >
                    {isSavingUser ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        {editingUsuario.id ? 'Guardando...' : 'Creando...'}
                      </>
                    ) : (
                      editingUsuario.id ? 'Guardar Cambios' : 'Crear Usuario'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal / Dialog de Confirmación de Eliminación al estilo PWA */}
      {userToDelete && (
        <ModalPortal>
          <div className="confirm-dialog-overlay">
            <div className="confirm-dialog-card">
              <div style={{ margin: '0 auto 14px auto', width: '52px', height: '52px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={26} />
              </div>

              <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                ¿Eliminar Usuario?
              </h3>

              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Estás a punto de eliminar a <strong style={{ color: '#0f172a' }}>{userToDelete.fullName || `${userToDelete.firstName || ''} ${userToDelete.firstSurname || ''}`.trim() || userToDelete.username}</strong> (<span style={{ color: '#07665e', fontWeight: 600 }}>{userToDelete.username}</span>) de la base de datos.
              </p>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', color: '#991b1b', textAlign: 'left', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.95rem' }}>⚠️</span>
                <span>Esta acción es irreversible y eliminará todos los permisos y asignaciones a sedes de este usuario.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeletingUser}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-danger-confirm"
                  onClick={handleConfirmDelete}
                  disabled={isDeletingUser}
                  style={{ flex: 1 }}
                >
                  {isDeletingUser ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Sí, Eliminar
                    </>
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
