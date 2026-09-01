import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit2,
  X,
  Shield,
  Key,
  CheckSquare,
  Square,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  Monitor,
  Globe,
  Laptop,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { RoleDto, SaveRoleDto, ActionDto, ModuleDto } from '../model/RolesContracts';
import { rolesService } from '../data/rolesService';
import { authService } from '../../auth/data/authService';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';

type PlatformTab = 'all' | 'pwa' | 'wpf';

export const RolesTab: React.FC = () => {
  const { inspectedCompany, activeBranch } = useParqueaderoContext();
  const currentUser = authService.getCurrentUser();
  const targetCompanyId = useMemo(
    () => inspectedCompany?.id || currentUser?.companyId || undefined,
    [inspectedCompany?.id, currentUser?.companyId]
  );
  const targetBranchId = useMemo(
    () => activeBranch?.id || undefined,
    [activeBranch?.id]
  );

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allModules, setAllModules] = useState<ModuleDto[]>([]);
  const [allActions, setAllActions] = useState<ActionDto[]>([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<number, number[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Modal Crear / Editar Rol
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<SaveRoleDto> | null>(null);
  const [roleFormError, setRoleFormError] = useState<string | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Modal Configuración de Permisos
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<RoleDto | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePlatform, setActivePlatform] = useState<PlatformTab>('all');
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null);

  const loadData = async (companyId?: number, branchId?: number) => {
    setIsLoading(true);
    try {
      const [rolesData, modulesData, actionsData] = await Promise.all([
        rolesService.getRoles(companyId, branchId),
        rolesService.getModules(),
        rolesService.getActions(),
      ]);

      // Deduplicar roles por ID único (idUserRol) como salvaguarda
      const uniqueRolesMap = new Map<number, RoleDto>();
      (rolesData || []).forEach((r) => {
        const id = r.idUserRol ?? r.id ?? 1;
        if (!uniqueRolesMap.has(id)) {
          uniqueRolesMap.set(id, r);
        }
      });
      const uniqueRoles = Array.from(uniqueRolesMap.values());

      setRoles(uniqueRoles);
      setAllModules(modulesData || []);
      setAllActions(actionsData || []);

      // Cargar permisos asignados a cada rol
      const permsMap: Record<number, number[]> = {};
      await Promise.all(
        (rolesData || []).map(async (r) => {
          const roleId = r.idUserRol ?? r.id ?? 1;
          const perms = await rolesService.getRolePermissions(roleId);
          permsMap[roleId] = perms.map((p) => p.actionId);
        })
      );
      setRolePermissionsMap(permsMap);
    } catch (err) {
      console.error('Error al cargar datos de roles y permisos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(targetCompanyId, targetBranchId);
  }, [targetCompanyId, targetBranchId]);

  // Modal de confirmación de eliminación de rol
  const [roleToDelete, setRoleToDelete] = useState<RoleDto | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const isSuperAdminRole = (role?: RoleDto | null): boolean => {
    if (!role) return false;
    const name = (role.roleName || role.role || role.name || '').trim().toLowerCase();
    return name === 'super administrador' || name === 'super admin' || name === 'superadmin';
  };

  const isAdminRole = (role?: RoleDto | null): boolean => {
    if (!role) return false;
    const roleId = role.idUserRol ?? role.id;
    const name = (role.roleName || role.role || role.name || '').trim().toLowerCase();
    return (roleId === 1 || name === 'administrador' || name === 'admin') && !isSuperAdminRole(role);
  };

  const isProtectedSystemRole = (role?: RoleDto | null): boolean => {
    return isSuperAdminRole(role) || isAdminRole(role);
  };

  const currentUserForPerms = authService.getCurrentUser();
  const isUserSuperAdmin = currentUserForPerms?.isSuperAdmin === true;

  const canDeleteRole = (role?: RoleDto | null): boolean => {
    if (!role) return false;
    if (isSuperAdminRole(role)) return false; // NUNCA se permite eliminar el rol Super Administrador
    if (isAdminRole(role) && !isUserSuperAdmin) return false; // Un usuario Administrador NO puede eliminar el rol Administrador
    return true;
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    const roleId = roleToDelete.idUserRol ?? roleToDelete.id;
    if (!roleId) return;

    setIsDeletingRole(true);
    try {
      await rolesService.deleteRole(roleId);
      showToast('Rol eliminado exitosamente.', 'success');
      setRoleToDelete(null);
      await loadData(targetCompanyId, targetBranchId);
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar el rol de la base de datos.', 'error');
    } finally {
      setIsDeletingRole(false);
    }
  };

  // Clasificador de módulos por plataforma
  const isModuleInPlatform = (mod: ModuleDto, platform: PlatformTab): boolean => {
    if (platform === 'all') return true;
    if (platform === 'pwa') {
      // Módulos Web PWA: incluye operativos (Ingreso, Caja, Patio/Activos, Turnos) y administrativos
      // Módulo 13 (Hardware / Periféricos locales de escritorio) es exclusivo de WPF
      return mod.id !== 13;
    }
    if (platform === 'wpf') {
      // Terminal POS WPF (Ingreso, Cobro, Patio, Turnos, Sistema, Tarifas, Resoluciones, Medios Pago)
      return [1, 2, 4, 5, 8, 9, 13, 14].includes(mod.id);
    }
    return true;
  };

  const checkRoleNameError = (name: string, roleIdToExclude?: number): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'El nombre del rol es obligatorio.';
    }
    if (trimmed.length < 2) {
      return 'El nombre del rol debe tener al menos 2 caracteres.';
    }
    const normalized = trimmed.toLowerCase();
    if (normalized === 'super administrador' || normalized === 'super admin' || normalized === 'superadmin') {
      return 'El rol Super Administrador es reservado por el sistema.';
    }
    const isDuplicate = roles.some((r) => {
      const rId = r.idUserRol ?? r.id;
      if (roleIdToExclude && rId === roleIdToExclude) return false;
      const rName = (r.roleName || r.role || r.name || '').trim().toLowerCase();
      return rName === normalized;
    });
    if (isDuplicate) {
      return 'Este rol ya existe en la empresa. Por favor elige otro nombre.';
    }
    return null;
  };

  const handleRoleNameChange = (val: string) => {
    setEditingRole((prev) => (prev ? { ...prev, roleName: val } : prev));
    if (val.trim()) {
      const error = checkRoleNameError(val, editingRole?.idUserRol);
      setRoleFormError(error);
    } else {
      setRoleFormError('El nombre del rol es obligatorio.');
    }
  };

  const handleOpenCreateRole = () => {
    setEditingRole({
      roleName: '',
      isActive: true,
    });
    setRoleFormError(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: RoleDto) => {
    if (isSuperAdminRole(role)) {
      showToast('El rol Super Administrador es inmutable y no se puede editar.', 'warning');
      return;
    }

    const currentUser = authService.getCurrentUser();
    const isSuperAdmin = currentUser?.isSuperAdmin === true;

    if (isAdminRole(role) && !isSuperAdmin) {
      showToast('El rol Administrador es un rol del sistema protegido y no se puede editar.', 'warning');
      return;
    }
    setEditingRole({
      idUserRol: role.idUserRol ?? role.id,
      roleName: role.roleName || role.role || '',
      isActive: role.isActive,
    });
    setRoleFormError(null);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    const nameError = checkRoleNameError(editingRole.roleName || '', editingRole.idUserRol);
    if (nameError) {
      setRoleFormError(nameError);
      return;
    }
    setRoleFormError(null);

    const currentUser = authService.getCurrentUser();
    const isSuperAdmin = currentUser?.isSuperAdmin === true;

    // Normalizar el nombre ingresado para validar si se intenta crear/modificar como un rol del sistema
    const normalizedInputName = (editingRole.roleName || '').trim().toLowerCase();
    const isInputSuperAdmin = normalizedInputName === 'super administrador' || normalizedInputName === 'super admin' || normalizedInputName === 'superadmin';
    const isInputAdmin = normalizedInputName === 'administrador' || normalizedInputName === 'admin';

    // El Super Administrador no puede ser modificado o simulado bajo ninguna circunstancia
    if (isInputSuperAdmin) {
      showToast('No está permitido crear o modificar el rol Super Administrador.', 'warning');
      return;
    }

    // El Administrador del sistema no puede ser creado o modificado por un usuario regular
    if (isInputAdmin && !isSuperAdmin) {
      showToast('No está permitido crear o modificar el rol Administrador.', 'warning');
      return;
    }

    // Si se está editando un rol existente, validar que no sea un rol protegido si no es SuperAdmin
    if (editingRole.idUserRol && !isSuperAdmin) {
      const originalRole = roles.find((r) => (r.idUserRol ?? r.id) === editingRole.idUserRol);
      if (originalRole && isProtectedSystemRole(originalRole)) {
        showToast('No está permitido modificar los roles principales del sistema.', 'warning');
        return;
      }
    }

    setIsSavingRole(true);
    try {
      await rolesService.saveOrEditRole({
        idUserRol: editingRole.idUserRol,
        roleName: (editingRole.roleName || '').trim(),
        isActive: editingRole.isActive ?? true,
        companyId: targetCompanyId,
        branchId: targetBranchId,
      });
      setIsRoleModalOpen(false);
      setEditingRole(null);
      showToast('Rol guardado exitosamente.', 'success');
      await loadData(targetCompanyId, targetBranchId);
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar el rol.', 'error');
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleOpenPermissionsModal = (role: RoleDto) => {
    const currentUser = authService.getCurrentUser();
    const isSuperAdmin = currentUser?.isSuperAdmin === true;

    if (isAdminRole(role) && !isSuperAdmin) {
      showToast('El rol Administrador cuenta automáticamente con el 100% de los permisos del sistema.', 'warning');
      return;
    }
    const roleId = role.idUserRol ?? role.id ?? 1;
    setTargetRole(role);
    setSelectedActionIds(rolePermissionsMap[roleId] || []);
    setSearchTerm('');
    setActivePlatform('all');

    // Abrir el primer módulo
    setExpandedModuleId(allModules.length > 0 ? allModules[0].id : null);
    setIsPermissionsModalOpen(true);
  };

  const handleSwitchPlatform = (platform: PlatformTab) => {
    setActivePlatform(platform);
    const targetMods = allModules.filter((m) => isModuleInPlatform(m, platform));
    setExpandedModuleId(targetMods.length > 0 ? targetMods[0].id : null);
  };

  const handleToggleAction = (actionId: number) => {
    setSelectedActionIds((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const handleToggleModuleAll = (moduleActionIds: number[]) => {
    const allSelected = moduleActionIds.length > 0 && moduleActionIds.every((id) => selectedActionIds.includes(id));
    if (allSelected) {
      setSelectedActionIds((prev) => prev.filter((id) => !moduleActionIds.includes(id)));
    } else {
      setSelectedActionIds((prev) => Array.from(new Set([...prev, ...moduleActionIds])));
    }
  };

  const handleSelectVisible = (selectAll: boolean) => {
    const visibleActionIds = currentGroupedModules.flatMap((g) => g.actions.map((a) => a.id));
    if (selectAll) {
      setSelectedActionIds((prev) => Array.from(new Set([...prev, ...visibleActionIds])));
    } else {
      setSelectedActionIds((prev) => prev.filter((id) => !visibleActionIds.includes(id)));
    }
  };

  const toggleModuleAccordion = (moduleId: number) => {
    setExpandedModuleId((prev) => (prev === moduleId ? null : moduleId));
  };

  const handleSavePermissions = async () => {
    if (!targetRole) return;

    const currentUser = authService.getCurrentUser();
    const isSuperAdmin = currentUser?.isSuperAdmin === true;

    if (isAdminRole(targetRole) && !isSuperAdmin) {
      showToast('No está permitido modificar los permisos del Administrador.', 'warning');
      return;
    }
    const roleId = targetRole.idUserRol ?? targetRole.id ?? 1;

    setIsSavingPermissions(true);
    try {
      await rolesService.assignRolePermissions(roleId, selectedActionIds);
      setRolePermissionsMap((prev) => ({ ...prev, [roleId]: selectedActionIds }));
      setIsPermissionsModalOpen(false);
      setTargetRole(null);
      showToast('¡Permisos del rol actualizados correctamente!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar los permisos del rol.', 'error');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Filtrado por término de búsqueda
  const filteredActions = allActions.filter((a) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(term) ||
      a.slug.toLowerCase().includes(term) ||
      (a.module?.name || '').toLowerCase().includes(term)
    );
  });

  // Módulos con sus acciones correspondientes
  const groupedModules = allModules
    .map((mod) => {
      const actions = filteredActions.filter((a) => (a.moduleId ?? a.module?.id) === mod.id);
      return {
        module: mod,
        actions,
      };
    })
    .filter((g) => g.actions.length > 0);

  // Separación por plataforma
  const allGrouped = groupedModules;
  const pwaGrouped = groupedModules.filter((g) => isModuleInPlatform(g.module, 'pwa'));
  const wpfGrouped = groupedModules.filter((g) => isModuleInPlatform(g.module, 'wpf'));

  const pwaTotalActions = allActions.filter((a) => {
    const mod = allModules.find((m) => m.id === (a.moduleId ?? a.module?.id));
    return mod ? isModuleInPlatform(mod, 'pwa') : true;
  });
  const wpfTotalActions = allActions.filter((a) => {
    const mod = allModules.find((m) => m.id === (a.moduleId ?? a.module?.id));
    return mod ? isModuleInPlatform(mod, 'wpf') : false;
  });

  const allSelectedCount = selectedActionIds.length;
  const pwaSelectedCount = pwaTotalActions.filter((a) => selectedActionIds.includes(a.id)).length;
  const wpfSelectedCount = wpfTotalActions.filter((a) => selectedActionIds.includes(a.id)).length;

  const currentGroupedModules =
    activePlatform === 'all'
      ? allGrouped
      : activePlatform === 'pwa'
        ? pwaGrouped
        : wpfGrouped;

  const currentUserRoleMatch = (r: RoleDto): boolean => {
    const roleId = r.idUserRol ?? r.id;
    if (isUserSuperAdmin && isSuperAdminRole(r)) return true;
    if (currentUser?.userRoleId && roleId === currentUser.userRoleId) return true;
    const currentRoleName = (currentUser?.roleName || '').trim().toLowerCase();
    const rName = (r.roleName || r.role || r.name || '').trim().toLowerCase();
    return Boolean(currentRoleName && rName && currentRoleName === rName);
  };

  const displayRoles = roles
    .filter((r) => {
      if (isSuperAdminRole(r) && !isUserSuperAdmin) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aIsCurrent = currentUserRoleMatch(a);
      const bIsCurrent = currentUserRoleMatch(b);
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;

      const aProtected = isProtectedSystemRole(a);
      const bProtected = isProtectedSystemRole(b);
      if (aProtected && !bProtected) return -1;
      if (!aProtected && bProtected) return 1;

      return (a.idUserRol ?? a.id ?? 0) - (b.idUserRol ?? b.id ?? 0);
    });

  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-header-titles">
          <h2>Roles y Matriz de Permisos</h2>
          <p>Administra los roles del sistema y configura detalladamente los permisos operativos para la aplicación de Escritorio (WPF) y Web (PWA).</p>
        </div>
        {(authService.hasPermission('settings.roles.manage') || authService.hasPermission('roles.manage') || authService.hasPermission('settings.usuarios.manage')) && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleOpenCreateRole}>
            <Plus size={16} /> Crear Rol
          </button>
        )}
      </div>

      {/* 1. VISTA DESKTOP - TABLA CLÁSICA */}
      <div className="desktop-table-view">
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ minWidth: '580px' }}>
            <thead>
              <tr>
                <th>NOMBRE DEL ROL</th>
                <th>PERMISOS ASIGNADOS</th>
                <th>ESTADO</th>
                <th className="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {displayRoles.length > 0 ? (
                displayRoles.map((r) => {
                  const roleId = r.idUserRol ?? r.id ?? 1;
                  const assignedCount = rolePermissionsMap[roleId]?.length || 0;
                  const roleTitle = r.roleName || r.role || r.name || `Rol #${roleId}`;

                  const isRoleSuperAdmin = isSuperAdminRole(r);
                  const isRoleAdmin = isAdminRole(r);
                  const isProtected = isProtectedSystemRole(r);

                  const currentUser = authService.getCurrentUser();
                  const isUserSuperAdmin = currentUser?.isSuperAdmin === true;

                  // El Super Administrador SIEMPRE está bloqueado para edición de permisos o configuración
                  // El Administrador está bloqueado a menos que el usuario logueado sea Super Administrador
                  const isLockedForCurrentUser = isRoleSuperAdmin || (isRoleAdmin && !isUserSuperAdmin);

                  return (
                    <tr key={roleId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: isProtected ? 'rgba(217, 119, 6, 0.12)' : 'rgba(7, 102, 94, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isProtected ? '#d97706' : 'var(--primary-color, #07665e)',
                            }}
                          >
                            {isProtected ? <ShieldCheck size={16} /> : <Shield size={16} />}
                          </div>
                          <div>
                            <span className="font-bold">{roleTitle}</span>
                            {isProtected && (
                              <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>
                                Rol Principal del Sistema
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isProtected ? (
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(217, 119, 6, 0.12)',
                              color: '#d97706',
                              fontWeight: 700,
                              border: '1px solid rgba(217, 119, 6, 0.3)',
                            }}
                          >
                            <ShieldCheck size={12} style={{ marginRight: 4 }} />
                            100% Acceso Total
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              background: assignedCount > 0 ? 'rgba(7, 102, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                              color: assignedCount > 0 ? '#07665e' : '#64748b',
                              fontWeight: 600,
                            }}
                          >
                            <Key size={12} style={{ marginRight: 4 }} />
                            {assignedCount} / {allActions.length} Permisos Asignados
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {r.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                        {isLockedForCurrentUser ? (
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={12} /> Protegido
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              className="btn-action primary"
                              style={{
                                background: 'var(--primary-color, #07665e)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                              }}
                              onClick={() => handleOpenPermissionsModal(r)}
                            >
                              <Key size={13} style={{ marginRight: 4 }} /> Configurar Permisos
                            </button>
                            <button className="btn-action primary" onClick={() => handleOpenEditRole(r)}>
                              <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                            </button>
                            {canDeleteRole(r) && (
                              <button
                                className="btn-action danger"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                }}
                                onClick={() => setRoleToDelete(r)}
                              >
                                <Trash2 size={14} style={{ marginRight: 4 }} /> Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {isLoading ? (
                      <div className="loader-container">
                        <div className="spinner"></div>
                        <span>Cargando roles desde la API...</span>
                      </div>
                    ) : 'No se encontraron roles registrados en el sistema.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. VISTA MOBILE - LISTA DE TARJETAS EXPANDIBLES (ACCORDION) */}
      <div className="mobile-card-list">
        {displayRoles.length > 0 ? (
          displayRoles.map((r) => {
            const roleId = r.idUserRol ?? r.id ?? 1;
            const assignedCount = rolePermissionsMap[roleId]?.length || 0;
            const roleTitle = r.roleName || r.role || r.name || `Rol #${roleId}`;
            const isRoleSuperAdmin = isSuperAdminRole(r);
            const isRoleAdmin = isAdminRole(r);
            const isProtected = isProtectedSystemRole(r);
            const currentUser = authService.getCurrentUser();
            const isUserSuperAdmin = currentUser?.isSuperAdmin === true;
            const isLockedForCurrentUser = isRoleSuperAdmin || (isRoleAdmin && !isUserSuperAdmin);
            const isExpanded = expandedRoleId === roleId;

            return (
              <div key={roleId} className={`expandable-card ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="expandable-card-header"
                  onClick={() => setExpandedRoleId(isExpanded ? null : roleId)}
                >
                  <div className="expandable-card-main">
                    <div
                      className="expandable-card-avatar"
                      style={{
                        background: isProtected ? '#fef3c7' : '#ccfbf1',
                        color: isProtected ? '#b45309' : '#0f766e',
                      }}
                    >
                      {isProtected ? <ShieldCheck size={20} /> : <Shield size={20} />}
                      <span className={`avatar-status-dot ${r.isActive ? 'active' : 'inactive'}`} />
                    </div>
                    <div className="expandable-card-info">
                      <span className="expandable-card-title">{roleTitle}</span>
                      <span className="expandable-card-subtitle">
                        ID #{roleId} • {isProtected ? 'Rol del Sistema' : `${assignedCount} permisos`}
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
                        <span className="card-detail-label">Identificador:</span>
                        <span className="card-detail-value">#{roleId}</span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Tipo de Rol:</span>
                        <span className="card-detail-value" style={{ color: isProtected ? '#d97706' : '#07665e' }}>
                          {isProtected ? 'Rol Principal del Sistema' : 'Rol Personalizado'}
                        </span>
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Permisos Asignados:</span>
                        {isProtected ? (
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(217, 119, 6, 0.12)',
                              color: '#d97706',
                              fontWeight: 700,
                              border: '1px solid rgba(217, 119, 6, 0.3)',
                            }}
                          >
                            <ShieldCheck size={12} style={{ marginRight: 4 }} />
                            100% Acceso Total
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              background: assignedCount > 0 ? 'rgba(7, 102, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                              color: assignedCount > 0 ? '#07665e' : '#64748b',
                              fontWeight: 600,
                            }}
                          >
                            <Key size={12} style={{ marginRight: 4 }} />
                            {assignedCount} / {allActions.length} Permisos
                          </span>
                        )}
                      </div>
                      <div className="card-detail-row">
                        <span className="card-detail-label">Estado:</span>
                        <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {r.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="expandable-card-actions">
                      {isLockedForCurrentUser ? (
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={13} /> Rol Protegido por el Sistema
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="card-action-btn card-action-btn-primary"
                            onClick={() => handleOpenPermissionsModal(r)}
                          >
                            <Key size={14} /> Permisos
                          </button>
                          <button
                            type="button"
                            className="card-action-btn card-action-btn-outline"
                            onClick={() => handleOpenEditRole(r)}
                          >
                            <Edit2 size={14} /> Editar
                          </button>
                          {canDeleteRole(r) && (
                            <button
                              type="button"
                              className="card-action-btn card-action-btn-outline"
                              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              onClick={() => setRoleToDelete(r)}
                            >
                              <Trash2 size={14} /> Eliminar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '14px' }}>
            {isLoading ? 'Cargando roles...' : 'No se encontraron roles registrados.'}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Rol */}
      {isRoleModalOpen && editingRole && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !isSavingRole && setIsRoleModalOpen(false)}>
            <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingRole.idUserRol ? 'Editar Rol' : 'Crear Nuevo Rol'}</h3>
              </div>

              <form onSubmit={handleSaveRole} noValidate>
                <div className="modal-body">
                  <div className={`form-group ${roleFormError ? 'has-error' : ''}`}>
                    <label>
                      Nombre del Rol <span className="required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      className={`input-field ${roleFormError ? 'input-error' : ''}`}
                      placeholder="Ej: Auditor / Supervisor de Patio"
                      value={editingRole.roleName || ''}
                      onChange={(e) => handleRoleNameChange(e.target.value)}
                    />
                    {roleFormError && (
                      <span className="form-field-error">
                        <AlertCircle size={12} /> {roleFormError}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Estado</label>
                    <select
                      className="input-field"
                      value={editingRole.isActive ? 'true' : 'false'}
                      onChange={(e) => setEditingRole({ ...editingRole, isActive: e.target.value === 'true' })}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsRoleModalOpen(false)} disabled={isSavingRole}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: 'auto' }}
                    disabled={isSavingRole}
                  >
                    {isSavingRole ? <Loader2 size={16} className="animate-spin" /> : editingRole.idUserRol ? 'Guardar Cambios' : 'Crear Rol'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Matriz de Permisos por Rol con Separación de Plataformas */}
      {isPermissionsModalOpen && targetRole && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '840px', maxHeight: '92vh' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(7, 102, 94, 0.1)',
                      color: 'var(--primary-color, #07665e)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                      Configurar Permisos: {targetRole.roleName || targetRole.role}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                      Habilita o restringe las acciones operativas y administrativas para este rol
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-body" style={{ overflowY: 'auto', gap: '1rem', paddingBottom: '1.25rem' }}>
                {/* Selector de Plataforma */}
                <div className="perm-platform-tabs">
                  <button
                    type="button"
                    className={`perm-platform-tab ${activePlatform === 'all' ? 'active' : ''}`}
                    onClick={() => handleSwitchPlatform('all')}
                  >
                    <Globe size={15} />
                    <span>Todos los Módulos</span>
                    <span className="perm-platform-badge">
                      {allSelectedCount} / {allActions.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`perm-platform-tab ${activePlatform === 'pwa' ? 'active' : ''}`}
                    onClick={() => handleSwitchPlatform('pwa')}
                  >
                    <Laptop size={15} />
                    <span>Módulos Web (PWA)</span>
                    <span className="perm-platform-badge">
                      {pwaSelectedCount} / {pwaTotalActions.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`perm-platform-tab ${activePlatform === 'wpf' ? 'active' : ''}`}
                    onClick={() => handleSwitchPlatform('wpf')}
                  >
                    <Monitor size={15} />
                    <span>Terminal POS (WPF)</span>
                    <span className="perm-platform-badge">
                      {wpfSelectedCount} / {wpfTotalActions.length}
                    </span>
                  </button>
                </div>

                {/* Barra de Búsqueda y Acciones Rápidas */}
                <div className="perm-toolbar">
                  <div className="perm-search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      className="perm-search-input"
                      placeholder={`Buscar acción o módulo en ${activePlatform === 'wpf' ? 'Terminal POS' : activePlatform === 'pwa' ? 'Web' : 'todos'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="perm-actions-group">
                    <button
                      type="button"
                      className="btn-perm-tool select-all"
                      onClick={() => handleSelectVisible(true)}
                      title="Seleccionar todas las acciones visibles en la lista"
                    >
                      <CheckSquare size={14} /> Seleccionar Visibles
                    </button>
                    <button
                      type="button"
                      className="btn-perm-tool deselect-all"
                      onClick={() => handleSelectVisible(false)}
                      title="Desmarcar todas las acciones visibles en la lista"
                    >
                      <Square size={14} /> Desmarcar Visibles
                    </button>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="perm-progress-card">
                  <div className="perm-progress-header">
                    <span className="perm-progress-title">
                      {activePlatform === 'all'
                        ? 'Cobertura Global'
                        : activePlatform === 'pwa'
                          ? 'Cobertura Plataforma Web'
                          : 'Cobertura Terminal POS'}
                    </span>
                    <span className="perm-progress-stats">
                      <strong>
                        {activePlatform === 'all'
                          ? allSelectedCount
                          : activePlatform === 'pwa'
                            ? pwaSelectedCount
                            : wpfSelectedCount}
                      </strong>{' '}
                      de{' '}
                      {activePlatform === 'all'
                        ? allActions.length
                        : activePlatform === 'pwa'
                          ? pwaTotalActions.length
                          : wpfTotalActions.length}{' '}
                      permisos ({Math.round(((activePlatform === 'all' ? allSelectedCount : activePlatform === 'pwa' ? pwaSelectedCount : wpfSelectedCount) / Math.max(1, (activePlatform === 'all' ? allActions.length : activePlatform === 'pwa' ? pwaTotalActions.length : wpfTotalActions.length))) * 100)}%)
                    </span>
                  </div>
                  <div className="perm-progress-track">
                    <div
                      className="perm-progress-fill"
                      style={{
                        width: `${Math.round(((activePlatform === 'all' ? allSelectedCount : activePlatform === 'pwa' ? pwaSelectedCount : wpfSelectedCount) / Math.max(1, (activePlatform === 'all' ? allActions.length : activePlatform === 'pwa' ? pwaTotalActions.length : wpfTotalActions.length))) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Lista de Módulos y Acciones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentGroupedModules.length > 0 ? (
                    currentGroupedModules.map(({ module: mod, actions }) => {
                      const moduleActionIds = actions.map((a) => a.id);
                      const selectedInModuleCount = actions.filter((a) => selectedActionIds.includes(a.id)).length;
                      const isAllModuleSelected = actions.length > 0 && selectedInModuleCount === actions.length;
                      const isPartialModuleSelected = selectedInModuleCount > 0 && !isAllModuleSelected;
                      const isExpanded = searchTerm.trim() !== '' || expandedModuleId === mod.id;

                      return (
                        <div key={mod.id} className="perm-module-card">
                          {/* Cabecera del Módulo */}
                          <div
                            className="perm-module-header"
                            onClick={() => toggleModuleAccordion(mod.id)}
                          >
                            <div className="perm-module-title-box">
                              {isExpanded ? <ChevronDown size={17} color="var(--primary-color, #07665e)" /> : <ChevronRight size={17} color="#94a3b8" />}
                              <span className="perm-module-name">{mod.name}</span>
                              <span className={`perm-module-badge ${selectedInModuleCount > 0 ? 'active' : 'inactive'}`}>
                                {selectedInModuleCount} / {actions.length} activos
                              </span>
                            </div>

                            <button
                              type="button"
                              className={`perm-module-toggle ${isAllModuleSelected ? 'all-checked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleModuleAll(moduleActionIds);
                              }}
                              title={isAllModuleSelected ? "Desmarcar todas las acciones de este módulo" : "Marcar todas las acciones de este módulo"}
                            >
                              <input
                                type="checkbox"
                                checked={isAllModuleSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = isPartialModuleSelected;
                                }}
                                onChange={() => {}}
                                style={{ pointerEvents: 'none', cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--primary-color, #07665e)' }}
                              />
                              <span>{isAllModuleSelected ? 'Desmarcar' : 'Marcar Todo'}</span>
                            </button>
                          </div>

                          {/* Lista de Acciones del Módulo */}
                          {isExpanded && (
                            <div className="perm-actions-list">
                              {actions.map((action) => {
                                const isChecked = selectedActionIds.includes(action.id);

                                return (
                                  <div
                                    key={action.id}
                                    className={`perm-item-row ${isChecked ? 'checked' : ''}`}
                                    onClick={() => handleToggleAction(action.id)}
                                  >
                                    <div className="perm-custom-checkbox">
                                      {isChecked && <Check size={13} strokeWidth={3} />}
                                    </div>
                                    <span className="perm-item-label">
                                      {action.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary, #64748b)' }}>
                      <AlertCircle size={28} style={{ opacity: 0.35, margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>No se encontraron acciones que coincidan con la búsqueda.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)' }}>
                  Total asignados: <strong>{selectedActionIds.length} de {allActions.length}</strong>
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsPermissionsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleSavePermissions}
                    disabled={isSavingPermissions}
                  >
                    <CheckCircle2 size={16} /> {isSavingPermissions ? 'Guardando...' : 'Guardar Permisos'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Confirmación de Eliminación de Rol */}
      {roleToDelete && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !isDeletingRole && setRoleToDelete(null)}>
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '440px', padding: '24px' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <AlertTriangle size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  ¿Eliminar Rol del Sistema?
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  ¿Estás seguro de que deseas eliminar permanentemente el rol{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    "{roleToDelete.roleName || roleToDelete.role || roleToDelete.name}"
                  </strong>
                  ? Esta acción no se puede deshacer.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isDeletingRole}
                  onClick={() => setRoleToDelete(null)}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={isDeletingRole}
                  onClick={handleConfirmDeleteRole}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '10px 16px',
                    cursor: 'pointer',
                  }}
                >
                  {isDeletingRole ? (
                    <>
                      <Loader2 size={16} className="spinner" /> Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> Confirmar Eliminación
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`settings-toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0 }} />}
          {toast.type === 'warning' && <AlertTriangle size={22} color="#ca8a04" style={{ flexShrink: 0 }} />}
          {toast.type === 'error' && <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0 }} />}
          <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4 }}>
            {toast.message}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              opacity: 0.6,
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
