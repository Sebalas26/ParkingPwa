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
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Loader2,
  LayoutDashboard,
  Wallet,
  Car,
  BarChart3,
  Bell,
  Settings,
  Building2,
  Users,
  Tag,
  CreditCard,
  FileCheck,
  Building,
} from 'lucide-react';
import type { RoleDto, SaveRoleDto, ActionDto } from '../model/RolesContracts';
import { rolesService } from '../data/rolesService';
import { authService } from '../../auth/data/authService';
import { useAuthSession } from '../../../shared/hooks/useAuthSession';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';

interface PwaSubGroupDef {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  actionSlugs: string[];
}

interface PwaModuleDef {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  actionSlugs?: string[];
  subgroups?: PwaSubGroupDef[];
}

interface RenderedPwaSubGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  actionSlugs: string[];
  actions: ActionDto[];
  totalActionIds: number[];
}

interface RenderedPwaModule {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  actionSlugs?: string[];
  actions?: ActionDto[];
  subgroups?: RenderedPwaSubGroup[];
  totalModuleActionIds: number[];
}

const PWA_MODULES_STRUCTURE: PwaModuleDef[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    subtitle: 'Métricas, analítica y visualización de ocupación en tiempo real',
    icon: LayoutDashboard,
    actionSlugs: ['analytics.view_dashboard', 'analytics.metrics'],
  },
  {
    id: 'caja',
    name: 'Caja y Control de Turnos',
    subtitle: 'Cobros, liquidación de tickets, apertura/cierre de turnos, arqueos y retiros',
    icon: Wallet,
    actionSlugs: [
      'checkout.process_payment',
      'shifts.view_current',
      'shifts.open',
      'shifts.close',
      'shifts.blind_count',
      'shifts.view_history',
      'shifts.reprint_closure',
    ],
  },
  {
    id: 'activos',
    name: 'Activos y Monitoreo de Patio',
    subtitle: 'Patio de vehículos en tiempo real, tickets de ingreso, salida manual y mensualidades',
    icon: Car,
    actionSlugs: [
      'monitoring.view_occupancy',
      'monitoring.search_vehicles',
      'checkin.create',
      'monitoring.force_exit',
      'monitoring.export',
      'subscriptions.view',
      'subscriptions.create',
      'subscriptions.renew',
      'subscriptions.cancel',
    ],
  },
  {
    id: 'reportes',
    name: 'Reportes y Analítica',
    subtitle: 'Reportes financieros, ocupación, auditoría y exportación a Excel / PDF',
    icon: BarChart3,
    actionSlugs: [
      'analytics.income_reports',
      'analytics.occupancy_reports',
      'analytics.audit_reports',
      'analytics.export',
    ],
  },
  {
    id: 'novedades',
    name: 'Novedades y Bloqueos',
    subtitle: 'Registro de incidentes, novedades operativas y bloqueo preventivo de placas',
    icon: Bell,
    actionSlugs: [
      'novedades.view',
      'novedades.create',
      'novedades.edit',
      'novedades.resolve',
    ],
  },
  {
    id: 'configuracion',
    name: 'Configuración del Sistema',
    subtitle: 'Parametrización general de sedes, usuarios, convenios, tarifas y medios de pago',
    icon: Settings,
    subgroups: [
      {
        id: 'branches',
        name: 'Sedes y Parqueaderos',
        icon: Building2,
        actionSlugs: [
          'branches.view',
          'branches.create',
          'branches.edit',
          'branches.delete',
          'branches.assign_users',
        ],
      },
      {
        id: 'users',
        name: 'Usuarios y Operadores',
        icon: Users,
        actionSlugs: [
          'users.view',
          'users.create',
          'users.edit',
          'users.delete',
        ],
      },
      {
        id: 'roles',
        name: 'Roles y Permisos (RBAC)',
        icon: Shield,
        actionSlugs: [
          'roles.view',
          'roles.create',
          'roles.edit',
          'roles.delete',
          'permissions.assign',
        ],
      },
      {
        id: 'agreements',
        name: 'Convenios Comerciales',
        icon: Tag,
        actionSlugs: [
          'agreements.view',
          'agreements.create',
          'agreements.edit',
          'agreements.delete',
        ],
      },
      {
        id: 'rates',
        name: 'Tipos de Vehículos y Tarifas',
        icon: Car,
        actionSlugs: [
          'rates.view',
          'rates.create',
          'rates.edit',
          'rates.delete',
        ],
      },
      {
        id: 'payment_methods',
        name: 'Medios de Pago',
        icon: CreditCard,
        actionSlugs: [
          'payment_methods.view',
          'payment_methods.create',
          'payment_methods.edit',
          'payment_methods.delete',
        ],
      },
      {
        id: 'resolutions',
        name: 'Resoluciones de Facturación DIAN',
        icon: FileCheck,
        actionSlugs: [
          'resolutions.view',
          'resolutions.create',
          'resolutions.edit',
          'resolutions.delete',
        ],
      },
      {
        id: 'companies',
        name: 'Gestión de Empresas SaaS',
        icon: Building,
        actionSlugs: [
          'companies.view',
          'companies.create',
          'companies.edit',
          'companies.delete',
          'companies.assign_limits',
        ],
      },
    ],
  },
];

export const RolesTab: React.FC = () => {
  const { inspectedCompany, activeBranch } = useParqueaderoContext();
  const { user: currentUser, hasPermission } = useAuthSession();
  const isUserSuperAdmin = currentUser?.isSuperAdmin === true;

  const canCreateRole = hasPermission('roles.create');
  const canEditRole = hasPermission('roles.edit');
  const canDeleteRolePerm = hasPermission('roles.delete');
  const canAssignPermissions = hasPermission('permissions.assign') || hasPermission('roles.edit') || currentUser?.isAdmin;

  const targetCompanyId = useMemo(
    () => inspectedCompany?.id || currentUser?.companyId || undefined,
    [inspectedCompany?.id, currentUser?.companyId]
  );
  const targetBranchId = useMemo(
    () => activeBranch?.id || undefined,
    [activeBranch?.id]
  );

  const [roles, setRoles] = useState<RoleDto[]>([]);
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
  const [expandedModuleKey, setExpandedModuleKey] = useState<string | null>('caja');
  const [expandedSubgroupKey, setExpandedSubgroupKey] = useState<string | null>('payment_methods');
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null);

  const loadData = async (companyId?: number, branchId?: number) => {
    setIsLoading(true);
    try {
      const [rolesData, , actionsData] = await Promise.all([
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
    if (isAdminRole(role) && !isUserSuperAdmin) {
      showToast('El rol Administrador cuenta automáticamente con el 100% de los permisos del sistema.', 'warning');
      return;
    }
    const roleId = role.idUserRol ?? role.id ?? 1;
    setTargetRole(role);
    setSelectedActionIds(rolePermissionsMap[roleId] || []);
    setSearchTerm('');
    setExpandedModuleKey('caja');
    setExpandedSubgroupKey('payment_methods');
    setIsPermissionsModalOpen(true);
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

  const toggleModuleAccordion = (moduleKey: string) => {
    setExpandedModuleKey((prev) => (prev === moduleKey ? null : moduleKey));
  };

  const toggleSubgroupAccordion = (subgroupKey: string) => {
    setExpandedSubgroupKey((prev) => (prev === subgroupKey ? null : subgroupKey));
  };

  const handleSavePermissions = async () => {
    if (!targetRole) return;

    if (isAdminRole(targetRole) && !isUserSuperAdmin) {
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

      // Sincronizar reactivamente en tiempo real la sesión y notificar a todas las ventanas abiertas
      await authService.refreshSession();
      authService.broadcastPermissionsChanged();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar los permisos del rol.', 'error');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Módulos y acciones permitidos según el nivel de privilegio (SuperAdmin vs Administrador de Empresa)
  const superAdminOnlyModuleIds = [16]; // 16: Gestión de Empresas SaaS (Exclusivo SuperAdmin)
  const effectiveActions = useMemo(() => {
    if (isUserSuperAdmin) return allActions;
    return allActions.filter(
      (a) =>
        !superAdminOnlyModuleIds.includes(a.moduleId ?? a.module?.id ?? 0) &&
        !a.slug.startsWith('companies.')
    );
  }, [allActions, isUserSuperAdmin]);

  // Filtrado por término de búsqueda y mapeo jerárquico PWA
  const pwaHierarchyRenderData = useMemo<{
    modules: RenderedPwaModule[];
    unmatchedActions: ActionDto[];
  }>(() => {
    const termLower = searchTerm.trim().toLowerCase();
    const searchFilter = (a: ActionDto) => {
      if (!termLower) return true;
      return a.name.toLowerCase().includes(termLower) || a.slug.toLowerCase().includes(termLower);
    };

    const matchedSlugs = new Set<string>();

    const modules: RenderedPwaModule[] = PWA_MODULES_STRUCTURE.map((modDef): RenderedPwaModule => {
      if (modDef.subgroups) {
        // Módulo con subgrupos (Configuración)
        const subgroups: RenderedPwaSubGroup[] = modDef.subgroups
          .filter((sub) => sub.id !== 'companies' || isUserSuperAdmin)
          .map((sub) => {
            const actions = effectiveActions.filter(
              (a) => sub.actionSlugs.includes(a.slug) && searchFilter(a)
            );
            actions.forEach((a) => matchedSlugs.add(a.slug));
            const totalActionIds = effectiveActions
              .filter((a) => sub.actionSlugs.includes(a.slug))
              .map((a) => a.id);
            return {
              id: sub.id,
              name: sub.name,
              icon: sub.icon,
              actionSlugs: sub.actionSlugs,
              actions,
              totalActionIds,
            };
          })
          .filter((sub) => sub.actions.length > 0 || !termLower);

        const totalModuleActionIds = subgroups.flatMap((s) => s.totalActionIds);
        return {
          id: modDef.id,
          name: modDef.name,
          subtitle: modDef.subtitle,
          icon: modDef.icon,
          subgroups,
          totalModuleActionIds,
        };
      } else {
        // Módulo directo (Dashboard, Caja, Activos, Reportes, Novedades)
        const actionSlugs = modDef.actionSlugs || [];
        const actions = effectiveActions.filter(
          (a) => actionSlugs.includes(a.slug) && searchFilter(a)
        );
        actions.forEach((a) => matchedSlugs.add(a.slug));
        const totalModuleActionIds = effectiveActions
          .filter((a) => actionSlugs.includes(a.slug))
          .map((a) => a.id);

        return {
          id: modDef.id,
          name: modDef.name,
          subtitle: modDef.subtitle,
          icon: modDef.icon,
          actionSlugs,
          actions,
          totalModuleActionIds,
        };
      }
    });

    // Acciones adicionales de la BD que no estén contempladas explícitamente
    const unmatchedActions = effectiveActions.filter(
      (a) => !matchedSlugs.has(a.slug) && searchFilter(a)
    );

    return {
      modules,
      unmatchedActions,
    };
  }, [effectiveActions, isUserSuperAdmin, searchTerm]);

  // Lista plana de acciones visibles
  const visibleActionsList = useMemo(() => {
    const list: ActionDto[] = [];
    pwaHierarchyRenderData.modules.forEach((mod: RenderedPwaModule) => {
      if (mod.actions) {
        list.push(...mod.actions);
      }
      if (mod.subgroups) {
        mod.subgroups.forEach((sub: RenderedPwaSubGroup) => list.push(...sub.actions));
      }
    });
    list.push(...pwaHierarchyRenderData.unmatchedActions);
    return list;
  }, [pwaHierarchyRenderData]);

  const handleSelectVisible = (selectAll: boolean) => {
    const visibleActionIds = visibleActionsList.map((a) => a.id);
    if (selectAll) {
      setSelectedActionIds((prev) => Array.from(new Set([...prev, ...visibleActionIds])));
    } else {
      setSelectedActionIds((prev) => prev.filter((id) => !visibleActionIds.includes(id)));
    }
  };

  const allSelectedCount = selectedActionIds.filter((id) =>
    effectiveActions.some((a) => a.id === id)
  ).length;

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
          <p>Administra los roles del sistema y configura detalladamente los permisos operativos para la aplicación Web (PWA).</p>
        </div>
        {canCreateRole && (
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
                            {canAssignPermissions && (
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
                            )}
                            {canEditRole && (
                              <button className="btn-action primary" onClick={() => handleOpenEditRole(r)}>
                                <Edit2 size={14} style={{ marginRight: 4 }} /> Editar
                              </button>
                            )}
                            {canDeleteRole(r) && canDeleteRolePerm && (
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
                          {canAssignPermissions && (
                            <button
                              type="button"
                              className="card-action-btn card-action-btn-primary"
                              onClick={() => handleOpenPermissionsModal(r)}
                            >
                              <Key size={14} /> Permisos
                            </button>
                          )}
                          {canEditRole && (
                            <button
                              type="button"
                              className="card-action-btn card-action-btn-outline"
                              onClick={() => handleOpenEditRole(r)}
                            >
                              <Edit2 size={14} /> Editar
                            </button>
                          )}
                          {canDeleteRole(r) && canDeleteRolePerm && (
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
                {/* Barra de Búsqueda y Acciones Rápidas */}
                <div className="perm-toolbar">
                  <div className="perm-search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      className="perm-search-input"
                      placeholder="Buscar acción o submódulo en la plataforma web (PWA)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="perm-actions-group">
                    <button
                      type="button"
                      className="btn-perm-tool select-all"
                      onClick={() => handleSelectVisible(true)}
                      title="Seleccionar todas las acciones visibles"
                    >
                      <CheckSquare size={14} /> Seleccionar Visibles
                    </button>
                    <button
                      type="button"
                      className="btn-perm-tool deselect-all"
                      onClick={() => handleSelectVisible(false)}
                      title="Desmarcar todas las acciones visibles"
                    >
                      <Square size={14} /> Desmarcar Visibles
                    </button>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="perm-progress-card">
                  <div className="perm-progress-header">
                    <span className="perm-progress-title">
                      Cobertura de Permisos (Plataforma Web PWA)
                    </span>
                    <span className="perm-progress-stats">
                      <strong>{allSelectedCount}</strong> de {effectiveActions.length} permisos ({Math.round((allSelectedCount / Math.max(1, effectiveActions.length)) * 100)}%)
                    </span>
                  </div>
                  <div className="perm-progress-track">
                    <div
                      className="perm-progress-fill"
                      style={{
                        width: `${Math.round((allSelectedCount / Math.max(1, effectiveActions.length)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Lista de los 6 Módulos Oficiales PWA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pwaHierarchyRenderData.modules.map((mod) => {
                    const IconComponent = mod.icon;
                    const isExpanded = searchTerm.trim() !== '' || expandedModuleKey === mod.id;
                    const allModActionIds = mod.totalModuleActionIds;
                    const selectedInModCount = allModActionIds.filter((id) => selectedActionIds.includes(id)).length;
                    const isAllModSelected = allModActionIds.length > 0 && selectedInModCount === allModActionIds.length;
                    const isPartialModSelected = selectedInModCount > 0 && !isAllModSelected;

                    // Si se está buscando y este módulo no tiene acciones coincidentes, omitirlo
                    const hasVisibleContent =
                      (mod.actions && mod.actions.length > 0) ||
                      (mod.subgroups && mod.subgroups.some((s) => s.actions.length > 0));

                    if (searchTerm.trim() && !hasVisibleContent) {
                      return null;
                    }

                    return (
                      <div key={mod.id} className="perm-module-card">
                        {/* Cabecera del Módulo */}
                        <div
                          className="perm-module-header"
                          onClick={() => toggleModuleAccordion(mod.id)}
                        >
                          <div className="perm-module-title-box">
                            {isExpanded ? <ChevronDown size={17} color="var(--primary-color, #07665e)" /> : <ChevronRight size={17} color="#94a3b8" />}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  background: 'rgba(7, 102, 94, 0.1)',
                                  color: 'var(--primary-color, #07665e)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <IconComponent size={16} />
                              </div>
                              <div>
                                <span className="perm-module-name">{mod.name}</span>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                                  {mod.subtitle}
                                </div>
                              </div>
                            </div>
                            <span className={`perm-module-badge ${selectedInModCount > 0 ? 'active' : 'inactive'}`} style={{ marginLeft: 'auto', marginRight: '8px' }}>
                              {selectedInModCount} / {allModActionIds.length} activos
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`perm-module-toggle ${isAllModSelected ? 'all-checked' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleModuleAll(allModActionIds);
                            }}
                            title={isAllModSelected ? "Desmarcar todo el módulo" : "Marcar todo el módulo"}
                          >
                            <input
                              type="checkbox"
                              checked={isAllModSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = isPartialModSelected;
                              }}
                              onChange={() => {}}
                              style={{ pointerEvents: 'none', cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--primary-color, #07665e)' }}
                            />
                            <span>{isAllModSelected ? 'Desmarcar' : 'Marcar Todo'}</span>
                          </button>
                        </div>

                        {/* Contenido Expandible */}
                        {isExpanded && (
                          <>
                            {/* Caso 1: Módulo directo con acciones (Dashboard, Caja, Activos, Reportes, Novedades) */}
                            {mod.actions && mod.actions.length > 0 && (
                              <div className="perm-actions-list">
                                {mod.actions.map((action) => {
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
                                      <span className="perm-item-label">{action.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Caso 2: Módulo con Subgrupos (Configuración) */}
                            {mod.subgroups && mod.subgroups.length > 0 && (
                              <div className="perm-subgroups-container">
                                {mod.subgroups.map((sub) => {
                                  const SubIcon = sub.icon;
                                  const isSubExpanded = searchTerm.trim() !== '' || expandedSubgroupKey === sub.id;
                                  const subActionIds = sub.totalActionIds;
                                  const selectedInSubCount = subActionIds.filter((id) => selectedActionIds.includes(id)).length;
                                  const isAllSubSelected = subActionIds.length > 0 && selectedInSubCount === subActionIds.length;
                                  const isPartialSubSelected = selectedInSubCount > 0 && !isAllSubSelected;

                                  if (searchTerm.trim() && sub.actions.length === 0) {
                                    return null;
                                  }

                                  return (
                                    <div key={sub.id} className="perm-subgroup-card">
                                      <div
                                        className="perm-subgroup-header"
                                        onClick={() => toggleSubgroupAccordion(sub.id)}
                                      >
                                        <div className="perm-subgroup-title-box">
                                          {isSubExpanded ? <ChevronDown size={15} color="#07665e" /> : <ChevronRight size={15} color="#94a3b8" />}
                                          <SubIcon size={15} color="#07665e" />
                                          <span className="perm-subgroup-name">{sub.name}</span>
                                          <span className={`perm-module-badge ${selectedInSubCount > 0 ? 'active' : 'inactive'}`}>
                                            {selectedInSubCount} / {subActionIds.length} activos
                                          </span>
                                        </div>

                                        <button
                                          type="button"
                                          className={`perm-module-toggle ${isAllSubSelected ? 'all-checked' : ''}`}
                                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleModuleAll(subActionIds);
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isAllSubSelected}
                                            ref={(el) => {
                                              if (el) el.indeterminate = isPartialSubSelected;
                                            }}
                                            onChange={() => {}}
                                            style={{ pointerEvents: 'none', cursor: 'pointer', width: '13px', height: '13px', accentColor: 'var(--primary-color, #07665e)' }}
                                          />
                                          <span>{isAllSubSelected ? 'Desmarcar' : 'Marcar'}</span>
                                        </button>
                                      </div>

                                      {isSubExpanded && sub.actions.length > 0 && (
                                        <div className="perm-subgroup-actions-list">
                                          {sub.actions.map((action) => {
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
                                                <span className="perm-item-label">{action.name}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Acciones adicionales de la BD si existen */}
                  {pwaHierarchyRenderData.unmatchedActions.length > 0 && (
                    <div className="perm-module-card">
                      <div
                        className="perm-module-header"
                        onClick={() => toggleModuleAccordion('otras')}
                      >
                        <div className="perm-module-title-box">
                          {expandedModuleKey === 'otras' ? <ChevronDown size={17} color="#07665e" /> : <ChevronRight size={17} color="#94a3b8" />}
                          <ShieldCheck size={16} color="#07665e" />
                          <span className="perm-module-name">Otras Acciones del Sistema</span>
                          <span className="perm-module-badge inactive">
                            {pwaHierarchyRenderData.unmatchedActions.filter((a) => selectedActionIds.includes(a.id)).length} / {pwaHierarchyRenderData.unmatchedActions.length} activos
                          </span>
                        </div>

                        <button
                          type="button"
                          className="perm-module-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleModuleAll(pwaHierarchyRenderData.unmatchedActions.map((a) => a.id));
                          }}
                        >
                          <span>Marcar Todo</span>
                        </button>
                      </div>

                      {expandedModuleKey === 'otras' && (
                        <div className="perm-actions-list">
                          {pwaHierarchyRenderData.unmatchedActions.map((action) => {
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
                                <span className="perm-item-label">{action.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {visibleActionsList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary, #64748b)' }}>
                      <AlertCircle size={28} style={{ opacity: 0.35, margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>No se encontraron acciones que coincidan con la búsqueda.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)' }}>
                  Total asignados: <strong>{allSelectedCount} de {effectiveActions.length}</strong>
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
