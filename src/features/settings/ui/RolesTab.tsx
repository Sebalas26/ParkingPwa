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
  const { inspectedCompany } = useParqueaderoContext();
  const currentUser = authService.getCurrentUser();
  const targetCompanyId = useMemo(
    () => inspectedCompany?.id || currentUser?.companyId || undefined,
    [inspectedCompany?.id, currentUser?.companyId]
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

  // Modal Configuración de Permisos
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<RoleDto | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePlatform, setActivePlatform] = useState<PlatformTab>('all');
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null);

  const loadData = async (companyId?: number) => {
    setIsLoading(true);
    try {
      const [rolesData, modulesData, actionsData] = await Promise.all([
        rolesService.getRoles(companyId),
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
    loadData(targetCompanyId);
  }, [targetCompanyId]);

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
      await loadData(targetCompanyId);
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

  const handleOpenCreateRole = () => {
    setEditingRole({
      roleName: '',
      isActive: true,
    });
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
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editingRole.roleName?.trim()) return;

    const currentUser = authService.getCurrentUser();
    const isSuperAdmin = currentUser?.isSuperAdmin === true;

    // Normalizar el nombre ingresado para validar si se intenta crear/modificar como un rol del sistema
    const normalizedInputName = editingRole.roleName.trim().toLowerCase();
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

    try {
      await rolesService.saveOrEditRole({
        idUserRol: editingRole.idUserRol,
        roleName: editingRole.roleName.trim(),
        isActive: editingRole.isActive ?? true,
        companyId: targetCompanyId,
      });
      setIsRoleModalOpen(false);
      setEditingRole(null);
      showToast('Rol guardado exitosamente.', 'success');
      await loadData(targetCompanyId);
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar el rol.', 'error');
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

  const handlePlatformSelectAll = (platform: PlatformTab, selectAll: boolean) => {
    const platformActions = allActions.filter((a) => {
      const mod = allModules.find((m) => m.id === (a.moduleId ?? a.module?.id));
      return mod ? isModuleInPlatform(mod, platform) : true;
    });
    const platformActionIds = platformActions.map((a) => a.id);

    if (selectAll) {
      setSelectedActionIds((prev) => Array.from(new Set([...prev, ...platformActionIds])));
    } else {
      setSelectedActionIds((prev) => prev.filter((id) => !platformActionIds.includes(id)));
    }
  };

  const handleGlobalSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedActionIds(allActions.map((a) => a.id));
    } else {
      setSelectedActionIds([]);
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
          <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{editingRole.idUserRol ? `Editar Rol (#${editingRole.idUserRol})` : 'Crear Nuevo Rol'}</h3>
            </div>

            <form onSubmit={handleSaveRole}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Rol</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Auditor / Supervisor de Patio"
                    value={editingRole.roleName || ''}
                    onChange={(e) => setEditingRole({ ...editingRole, roleName: e.target.value })}
                    required
                  />
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
                <button type="button" className="btn-secondary" onClick={() => setIsRoleModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  {editingRole.idUserRol ? 'Guardar Cambios' : 'Crear Rol'}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} style={{ color: 'var(--primary-color, #07665e)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                    Configurar Permisos: {targetRole.roleName || targetRole.role}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Administra selectivamente los módulos operativos de Escritorio y Web
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', gap: '1rem', paddingBottom: '1.5rem' }}>
              {/* Pestañas de Plataforma */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--bg-secondary, #f1f5f9)',
                  padding: '4px',
                  borderRadius: '10px',
                  gap: '6px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSwitchPlatform('all')}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activePlatform === 'all' ? '#ffffff' : 'transparent',
                    color: activePlatform === 'all' ? 'var(--primary-color, #07665e)' : '#64748b',
                    fontWeight: activePlatform === 'all' ? 700 : 500,
                    boxShadow: activePlatform === 'all' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Globe size={16} />
                  <span>🌐 Todos los Módulos</span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.72rem',
                      background: activePlatform === 'all' ? 'rgba(7, 102, 94, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                      color: activePlatform === 'all' ? '#07665e' : '#64748b',
                    }}
                  >
                    {allSelectedCount} / {allActions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchPlatform('pwa')}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activePlatform === 'pwa' ? '#ffffff' : 'transparent',
                    color: activePlatform === 'pwa' ? 'var(--primary-color, #07665e)' : '#64748b',
                    fontWeight: activePlatform === 'pwa' ? 700 : 500,
                    boxShadow: activePlatform === 'pwa' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Globe size={16} />
                  <span>📱 Módulos Web (PWA)</span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.72rem',
                      background: activePlatform === 'pwa' ? 'rgba(7, 102, 94, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                      color: activePlatform === 'pwa' ? '#07665e' : '#64748b',
                    }}
                  >
                    {pwaSelectedCount} / {pwaTotalActions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchPlatform('wpf')}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activePlatform === 'wpf' ? '#ffffff' : 'transparent',
                    color: activePlatform === 'wpf' ? 'var(--primary-color, #07665e)' : '#64748b',
                    fontWeight: activePlatform === 'wpf' ? 700 : 500,
                    boxShadow: activePlatform === 'wpf' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Monitor size={16} />
                  <span>🖥️ Terminal POS (WPF)</span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.72rem',
                      background: activePlatform === 'wpf' ? 'rgba(7, 102, 94, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                      color: activePlatform === 'wpf' ? '#07665e' : '#64748b',
                    }}
                  >
                    {wpfSelectedCount} / {wpfTotalActions.length}
                  </span>
                </button>
              </div>

              {/* Barra de Búsqueda y Acciones Rápidas */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder={`Buscar permiso en ${activePlatform === 'wpf' ? 'Escritorio (WPF)' : 'Web (PWA)'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '32px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handlePlatformSelectAll(activePlatform, true)}
                    style={{
                      background: '#07665e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '7px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckSquare size={13} /> Marcar Plataforma
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlatformSelectAll(activePlatform, false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: '6px',
                      padding: '7px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Square size={13} /> Desmarcar Plataforma
                  </button>
                </div>
              </div>

              {/* Resumen Global de Asignación */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-secondary, #f8fafc)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Filtro activo:{' '}
                    <strong>
                      {activePlatform === 'all'
                        ? '🌐 Todos los Módulos'
                        : activePlatform === 'pwa'
                        ? '📱 Módulos Web (PWA)'
                        : '🖥️ Terminal POS (WPF)'}
                    </strong>
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Total Global: <strong>{selectedActionIds.length} / {allActions.length}</strong> permisos
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleGlobalSelectAll(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#07665e',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Marcar Todo Global
                  </button>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <button
                    type="button"
                    onClick={() => handleGlobalSelectAll(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Limpiar Todo
                  </button>
                </div>
              </div>

              {/* Lista de Módulos y Acciones de la Plataforma Activa */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentGroupedModules.length > 0 ? (
                  currentGroupedModules.map(({ module: mod, actions }) => {
                    const moduleActionIds = actions.map((a) => a.id);
                    const selectedInModuleCount = actions.filter((a) => selectedActionIds.includes(a.id)).length;
                    const isAllModuleSelected = actions.length > 0 && selectedInModuleCount === actions.length;
                    const isExpanded = searchTerm.trim() !== '' || expandedModuleId === mod.id;

                    return (
                      <div
                        key={mod.id}
                        style={{
                          border: '1px solid var(--border-color, #e2e8f0)',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: 'var(--bg-card, #ffffff)',
                        }}
                      >
                        {/* Cabecera del Módulo */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'var(--table-header-bg, #f8fafc)',
                            cursor: 'pointer',
                            borderBottom: isExpanded ? '1px solid var(--border-color, #e2e8f0)' : 'none',
                          }}
                        >
                          <div
                            onClick={() => toggleModuleAccordion(mod.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {mod.name}
                            </span>
                            <span
                              className="badge badge-success"
                              style={{
                                fontSize: '0.72rem',
                                background: selectedInModuleCount > 0 ? 'rgba(7, 102, 94, 0.12)' : 'rgba(100,116,139,0.1)',
                                color: selectedInModuleCount > 0 ? '#07665e' : '#64748b',
                              }}
                            >
                              {selectedInModuleCount} / {actions.length} Habilitados
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleModuleAll(moduleActionIds);
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: isAllModuleSelected ? '#ef4444' : '#07665e',
                            }}
                          >
                            {isAllModuleSelected ? 'Desmarcar Módulo' : 'Marcar Módulo'}
                          </button>
                        </div>

                        {/* Lista de Acciones del Módulo */}
                        {isExpanded && (
                          <div
                            style={{
                              padding: '8px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              background: 'var(--bg-card, #ffffff)',
                            }}
                          >
                            {actions.map((action) => {
                              const isChecked = selectedActionIds.includes(action.id);

                              return (
                                <div
                                  key={action.id}
                                  onClick={() => handleToggleAction(action.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '9px 14px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: isChecked ? 'rgba(7, 102, 94, 0.06)' : 'transparent',
                                    border: isChecked ? '1px solid rgba(7, 102, 94, 0.25)' : '1px solid transparent',
                                    transition: 'all 0.12s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => { }}
                                      style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                        {action.name}
                                      </span>
                                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                        {action.slug}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No se encontraron acciones en esta plataforma que coincidan con la búsqueda.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsPermissionsModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleSavePermissions}
                disabled={isSavingPermissions}
              >
                <Check size={16} /> {isSavingPermissions ? 'Guardando...' : 'Guardar Permisos'}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Modal de Confirmación de Eliminación de Rol */}
      {roleToDelete && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={() => !isDeletingRole && setRoleToDelete(null)}>
            <div
              className="modal-container modal-md"
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
