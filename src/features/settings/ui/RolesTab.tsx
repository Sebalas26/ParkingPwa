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
  Monitor,
  Globe,
  Laptop,
  Ticket,
  Receipt,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';
import type { RoleDto, SaveRoleDto, ActionDto } from '../model/RolesContracts';
import { rolesService } from '../data/rolesService';
import { authService } from '../../auth/data/authService';
import { useAuthSession } from '../../../shared/hooks/useAuthSession';
import { ModalPortal } from '../../../shared/ui/ModalPortal';
import { useParqueaderoContext } from '../../../shared/context/ParqueaderoContext';

type PlatformTab = 'all' | 'pwa' | 'wpf';

interface SubGroupDef {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  actionSlugs: string[];
}

interface ModuleGroupDef {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  platform: 'pwa' | 'wpf' | 'both';
  actionSlugs?: string[];
  subgroups?: SubGroupDef[];
}

interface RenderedSubGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  actionSlugs: string[];
  actions: ActionDto[];
  totalActionIds: number[];
}

interface RenderedModule {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  platform: 'pwa' | 'wpf' | 'both';
  actionSlugs?: string[];
  actions?: ActionDto[];
  subgroups?: RenderedSubGroup[];
  totalModuleActionIds: number[];
}

// Diccionario de nombres dicientes, descriptivos y profesionales en español
const ACTION_DESCRIPTIVE_NAMES: Record<string, string> = {
  // CheckIn
  'checkin.view': 'Ver pantalla de ingreso de vehículos',
  'checkin.create': 'Generar e imprimir tiquete de ingreso con código de barras / QR',
  'checkin.reprint': 'Reimprimir último tiquete de ingreso generado',
  'checkin.edit_plate': 'Editar o corregir placa en tiquete de entrada',
  'checkin.manual_barrier': 'Abrir barrera de entrada manualmente desde el terminal',

  // CheckOut
  'checkout.view': 'Ver pantalla de cobro y liquidación',
  'checkout.process_payment': 'Liquidar, cobrar y timbrar tiquetes de estacionamiento',
  'checkout.apply_discount': 'Aplicar convenios y descuentos comerciales con escaneo',
  'checkout.waive_fee': 'Exonerar cobro de tiquete o autorizar cortesía',
  'checkout.reprint_receipt': 'Reimprimir factura o comprobante térmico de salida',
  'checkout.manual_barrier': 'Abrir barrera de salida manualmente desde caja',

  // Subscriptions
  'subscriptions.view': 'Ver catálogo de mensualidades y abonados',
  'subscriptions.create': 'Registrar nuevo abonado / mensualidad',
  'subscriptions.renew': 'Renovar mensualidad y recibir pago de cuota',
  'subscriptions.print_receipt': 'Imprimir recibo térmico de pago de mensualidad',
  'subscriptions.edit': 'Editar datos de abonado, vigencia o vehículo',
  'subscriptions.cancel': 'Cancelar o inactivar suscripción de abonado',

  // Monitoring
  'monitoring.view_occupancy': 'Visualizar mapa de ocupación y cupos en tiempo real',
  'monitoring.search_vehicles': 'Búsqueda rápida de placas adentro del parqueadero',
  'monitoring.force_exit': 'Forzar salida manual de vehículo en patio',
  'monitoring.export': 'Exportar listado de vehículos activos a Excel / PDF',

  // Shifts
  'shifts.view_current': 'Ver estado del turno actual y balance de efectivo en caja',
  'shifts.open': 'Apertura de turno de estación con base de efectivo',
  'shifts.blind_count': 'Retiro parcial de efectivo / Arqueo ciego en turno',
  'shifts.close': 'Cerrar turno de caja y generar comprobante de corte Z',
  'shifts.view_history': 'Ver historial de turnos y arqueos anteriores',
  'shifts.reprint_closure': 'Reimprimir comprobante de cierre de turno',

  // Analytics
  'analytics.view_dashboard': 'Ver panel ejecutivo de analítica y KPIs en tiempo real',
  'analytics.metrics': 'Consultar métricas operativas y gráficas de afluencia',
  'analytics.income_reports': 'Consultar reportes de ingresos financieros y recaudos',
  'analytics.occupancy_reports': 'Consultar reportes de ocupación y rotación de vehículos',
  'analytics.audit_reports': 'Consultar auditoría de anulaciones, cortesías y descuentos',
  'analytics.export': 'Exportar reportes analíticos a Excel / PDF',

  // Branches
  'branches.view': 'Ver listado de sedes y parqueaderos',
  'branches.create': 'Crear nueva sede o parqueadero',
  'branches.edit': 'Editar datos, capacidad y parametrización de sede',
  'branches.delete': 'Inactivar sede o parqueadero',
  'branches.assign_users': 'Asignar operadores y administradores a la sede',

  // Rates
  'rates.view': 'Ver catálogo de tarifas por tipo de vehículo',
  'rates.create': 'Crear nueva tarifa y tipo de vehículo',
  'rates.edit': 'Editar precios por hora, minuto, día y periodos de gracia',
  'rates.delete': 'Inactivar tarifa de vehículo',

  // Payment Methods
  'payment_methods.view': 'Ver catálogo de medios de pago maestros',
  'payment_methods.create': 'Crear nuevo medio de pago',
  'payment_methods.edit': 'Editar medio de pago e ícono representativo',
  'payment_methods.delete': 'Inactivar medio de pago maestro',

  // Agreements
  'agreements.view': 'Ver convenios comerciales y comercios aliados',
  'agreements.create': 'Crear nuevo convenio comercial o comercio aliado',
  'agreements.edit': 'Editar reglas y porcentaje de descuento de convenio',
  'agreements.delete': 'Inactivar convenio comercial',

  // Users & Roles
  'users.view': 'Ver usuarios registrados en el sistema',
  'users.create': 'Crear nuevo usuario operador / administrador',
  'users.edit': 'Editar datos de usuario y restablecer contraseñas',
  'users.delete': 'Inactivar usuario del sistema',
  'roles.view': 'Ver catálogo de roles del sistema',
  'roles.create': 'Crear nuevo rol de usuario',
  'roles.edit': 'Editar nombre y estado de rol',
  'roles.delete': 'Inactivar o eliminar rol de usuario',
  'permissions.view': 'Ver matriz de permisos por rol',
  'permissions.assign': 'Configurar y asignar permisos de acceso a roles',

  // System
  'system.sync': 'Forzar sincronización manual de datos con la nube',
  'system.clean_cache': 'Limpiar base de datos local SQLite y resincronizar',

  // Resolutions
  'resolutions.view': 'Ver catálogo de resoluciones de facturación DIAN / POS',
  'resolutions.create': 'Crear nueva resolución de facturación DIAN / POS',
  'resolutions.edit': 'Editar rangos, prefijos y vigencias de resolución',
  'resolutions.delete': 'Inactivar resolución de facturación',

  // Incidents
  'novedades.view': 'Ver historial de novedades e incidencias de vehículos',
  'novedades.create': 'Registrar novedad o bloqueo restrictivo de placa',
  'novedades.edit': 'Editar notas u observaciones de novedad',
  'novedades.resolve': 'Resolver novedad y autorizar salida de vehículo',
  'novedades.delete': 'Eliminar registro de novedad',

  // Companies SaaS
  'companies.view': 'Ver empresas clientes registradas en la plataforma',
  'companies.create': 'Crear nueva empresa cliente y su administrador inicial',
  'companies.edit': 'Editar datos, sedes máximas y planes de empresa',
  'companies.suspend': 'Suspender o reactivar empresa cliente por suscripción',
  'companies.delete': 'Eliminar empresa del sistema SaaS',
  'companies.assign_limits': 'Asignar límites de sedes y capacidad SaaS',
};

// 1. Módulos de Plataforma Web (PWA)
const PWA_MODULES_DEFINITIONS: ModuleGroupDef[] = [
  {
    id: 'pwa_dashboard',
    name: 'Dashboard y Analítica Web',
    subtitle: 'Métricas, KPIs ejecutivos y visualización de afluencia en tiempo real',
    icon: LayoutDashboard,
    platform: 'pwa',
    actionSlugs: ['analytics.view_dashboard', 'analytics.metrics'],
  },
  {
    id: 'pwa_caja',
    name: 'Caja y Control de Turnos Web',
    subtitle: 'Cobros, liquidación de tickets, apertura/cierre de turnos y arqueos',
    icon: Wallet,
    platform: 'pwa',
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
    id: 'pwa_activos',
    name: 'Activos y Monitoreo de Patio',
    subtitle: 'Patio en vivo, ingreso web de vehículos y gestión de mensualidades',
    icon: Car,
    platform: 'pwa',
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
    id: 'pwa_reportes',
    name: 'Reportes y Analítica Financiera',
    subtitle: 'Reportes de ingresos, ocupación, auditoría y exportación a Excel / PDF',
    icon: BarChart3,
    platform: 'pwa',
    actionSlugs: [
      'analytics.income_reports',
      'analytics.occupancy_reports',
      'analytics.audit_reports',
      'analytics.export',
    ],
  },
  {
    id: 'pwa_novedades',
    name: 'Novedades y Bloqueo de Placas',
    subtitle: 'Registro de incidentes, novedades operativas y bloqueo preventivo de placas',
    icon: Bell,
    platform: 'pwa',
    actionSlugs: [
      'novedades.view',
      'novedades.create',
      'novedades.edit',
      'novedades.resolve',
    ],
  },
  {
    id: 'pwa_configuracion',
    name: 'Configuración del Sistema Web',
    subtitle: 'Parametrización general de sedes, usuarios, convenios, tarifas y medios de pago',
    icon: Settings,
    platform: 'pwa',
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
        name: 'Medios de Pago Maestros',
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

// 2. Módulos de Terminal POS de Escritorio (WPF)
const WPF_MODULES_DEFINITIONS: ModuleGroupDef[] = [
  {
    id: 'wpf_checkin',
    name: 'Ingreso de Vehículos (CheckIn POS)',
    subtitle: 'Impresión de tiquetes, lectura de placas y apertura de barrera de entrada',
    icon: Ticket,
    platform: 'wpf',
    actionSlugs: [
      'checkin.create',
      'checkin.reprint',
      'checkin.manual_barrier',
      'checkin.edit_plate',
      'checkin.view',
    ],
  },
  {
    id: 'wpf_checkout',
    name: 'Cobro y Liquidación en Caja (CheckOut POS)',
    subtitle: 'Liquidación de tarifas, convenios con escaneo, exoneraciones y corte térmico',
    icon: Receipt,
    platform: 'wpf',
    actionSlugs: [
      'checkout.process_payment',
      'checkout.apply_discount',
      'checkout.waive_fee',
      'checkout.reprint_receipt',
      'checkout.manual_barrier',
      'checkout.view',
    ],
  },
  {
    id: 'wpf_monitoring',
    name: 'Monitoreo de Patio y Plazas en Vivo',
    subtitle: 'Visualización de cupos disponibles y vehículos estacionados en tiempo real',
    icon: Car,
    platform: 'wpf',
    actionSlugs: [
      'monitoring.view_occupancy',
      'monitoring.search_vehicles',
      'monitoring.force_exit',
      'monitoring.export',
    ],
  },
  {
    id: 'wpf_shifts',
    name: 'Control de Turnos y Caja POS',
    subtitle: 'Apertura de turno con base, arqueos ciegos, entrega de turno y corte Z',
    icon: Wallet,
    platform: 'wpf',
    actionSlugs: [
      'shifts.view_current',
      'shifts.open',
      'shifts.blind_count',
      'shifts.close',
      'shifts.view_history',
      'shifts.reprint_closure',
    ],
  },
  {
    id: 'wpf_subscriptions',
    name: 'Mensualidades y Abonados en Terminal',
    subtitle: 'Cobro y renovación de cuotas mensuales en caja con recibo térmico',
    icon: CalendarCheck,
    platform: 'wpf',
    actionSlugs: [
      'subscriptions.view',
      'subscriptions.create',
      'subscriptions.renew',
      'subscriptions.print_receipt',
      'subscriptions.edit',
      'subscriptions.cancel',
    ],
  },
  {
    id: 'wpf_novedades',
    name: 'Novedades y Bloqueo de Placas en Estación',
    subtitle: 'Registro de incidentes en terminal y alertas preventivas al ingreso/salida',
    icon: Bell,
    platform: 'wpf',
    actionSlugs: [
      'novedades.view',
      'novedades.create',
      'novedades.edit',
      'novedades.resolve',
      'novedades.delete',
    ],
  },
  {
    id: 'wpf_system',
    name: 'Sincronización y Configuración Local',
    subtitle: 'Sincronización en caliente con la nube y mantenimiento de base local SQLite',
    icon: RefreshCw,
    platform: 'wpf',
    actionSlugs: [
      'system.sync',
      'system.clean_cache',
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
  const [activePlatform, setActivePlatform] = useState<PlatformTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModuleKey, setExpandedModuleKey] = useState<string | null>('pwa_caja');
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

  // Listas de slugs según la plataforma para cálculo preciso de métricas
  const pwaActionSlugs = useMemo(() => {
    const slugs = new Set<string>();
    PWA_MODULES_DEFINITIONS.forEach((m) => {
      m.actionSlugs?.forEach((s) => slugs.add(s));
      m.subgroups?.forEach((sub) => sub.actionSlugs.forEach((s) => slugs.add(s)));
    });
    return slugs;
  }, []);

  const wpfActionSlugs = useMemo(() => {
    const slugs = new Set<string>();
    WPF_MODULES_DEFINITIONS.forEach((m) => {
      m.actionSlugs?.forEach((s) => slugs.add(s));
      m.subgroups?.forEach((sub) => sub.actionSlugs.forEach((s) => slugs.add(s)));
    });
    return slugs;
  }, []);

  const pwaEffectiveActions = useMemo(
    () => effectiveActions.filter((a) => pwaActionSlugs.has(a.slug)),
    [effectiveActions, pwaActionSlugs]
  );

  const wpfEffectiveActions = useMemo(
    () => effectiveActions.filter((a) => wpfActionSlugs.has(a.slug)),
    [effectiveActions, wpfActionSlugs]
  );

  const pwaSelectedCount = selectedActionIds.filter((id) =>
    pwaEffectiveActions.some((a) => a.id === id)
  ).length;

  const wpfSelectedCount = selectedActionIds.filter((id) =>
    wpfEffectiveActions.some((a) => a.id === id)
  ).length;

  const allSelectedCount = selectedActionIds.filter((id) =>
    effectiveActions.some((a) => a.id === id)
  ).length;

  // Filtrado por término de búsqueda y mapeo jerárquico según plataforma activa
  const hierarchyRenderData = useMemo<{
    modules: RenderedModule[];
    unmatchedActions: ActionDto[];
  }>(() => {
    const termLower = searchTerm.trim().toLowerCase();
    const searchFilter = (a: ActionDto) => {
      if (!termLower) return true;
      const descriptive = ACTION_DESCRIPTIVE_NAMES[a.slug] || '';
      return (
        a.name.toLowerCase().includes(termLower) ||
        a.slug.toLowerCase().includes(termLower) ||
        descriptive.toLowerCase().includes(termLower)
      );
    };

    let baseDefs: ModuleGroupDef[] = [];
    if (activePlatform === 'pwa') {
      baseDefs = PWA_MODULES_DEFINITIONS;
    } else if (activePlatform === 'wpf') {
      baseDefs = WPF_MODULES_DEFINITIONS;
    } else {
      baseDefs = [...PWA_MODULES_DEFINITIONS, ...WPF_MODULES_DEFINITIONS];
    }

    const matchedSlugs = new Set<string>();

    const modules: RenderedModule[] = baseDefs.map((modDef): RenderedModule => {
      if (modDef.subgroups) {
        // Módulo con subgrupos (Configuración)
        const subgroups: RenderedSubGroup[] = modDef.subgroups
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
          platform: modDef.platform,
          subgroups,
          totalModuleActionIds,
        };
      } else {
        // Módulo directo
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
          platform: modDef.platform,
          actionSlugs,
          actions,
          totalModuleActionIds,
        };
      }
    });

    // Acciones adicionales de la BD que no estén contempladas explícitamente en la vista
    const unmatchedActions =
      activePlatform === 'all'
        ? effectiveActions.filter((a) => !matchedSlugs.has(a.slug) && searchFilter(a))
        : [];

    return {
      modules,
      unmatchedActions,
    };
  }, [activePlatform, effectiveActions, isUserSuperAdmin, searchTerm]);

  // Lista plana de acciones visibles para selección rápida
  const visibleActionsList = useMemo(() => {
    const list: ActionDto[] = [];
    hierarchyRenderData.modules.forEach((mod: RenderedModule) => {
      if (mod.actions) {
        list.push(...mod.actions);
      }
      if (mod.subgroups) {
        mod.subgroups.forEach((sub: RenderedSubGroup) => list.push(...sub.actions));
      }
    });
    list.push(...hierarchyRenderData.unmatchedActions);
    return list;
  }, [hierarchyRenderData]);

  const handleSelectVisible = (selectAll: boolean) => {
    const visibleActionIds = visibleActionsList.map((a) => a.id);
    if (selectAll) {
      setSelectedActionIds((prev) => Array.from(new Set([...prev, ...visibleActionIds])));
    } else {
      setSelectedActionIds((prev) => prev.filter((id) => !visibleActionIds.includes(id)));
    }
  };

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
            <div className="modal-card" style={{ maxWidth: '860px', maxHeight: '92vh' }}>
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
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => !isSavingPermissions && setIsPermissionsModalOpen(false)}
                  title="Cerrar modal"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                    borderRadius: '6px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ overflowY: 'auto', gap: '1rem', paddingBottom: '1.25rem' }}>
                {/* 1. Selector de Plataforma (Tabs) */}
                <div
                  className="perm-platform-tabs"
                  style={{
                    display: 'flex',
                    gap: '8px',
                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                    paddingBottom: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className={`perm-platform-tab ${activePlatform === 'all' ? 'active' : ''}`}
                    onClick={() => setActivePlatform('all')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: activePlatform === 'all' ? '1.5px solid #07665e' : '1px solid #e2e8f0',
                      background: activePlatform === 'all' ? 'rgba(7, 102, 94, 0.09)' : '#fff',
                      color: activePlatform === 'all' ? '#07665e' : '#64748b',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Globe size={15} />
                    <span>Todos los Módulos</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: activePlatform === 'all' ? '#07665e' : '#e2e8f0',
                        color: activePlatform === 'all' ? '#fff' : '#475569',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        marginLeft: '3px',
                        fontWeight: 700,
                      }}
                    >
                      {allSelectedCount} / {effectiveActions.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`perm-platform-tab ${activePlatform === 'pwa' ? 'active' : ''}`}
                    onClick={() => setActivePlatform('pwa')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: activePlatform === 'pwa' ? '1.5px solid #07665e' : '1px solid #e2e8f0',
                      background: activePlatform === 'pwa' ? 'rgba(7, 102, 94, 0.09)' : '#fff',
                      color: activePlatform === 'pwa' ? '#07665e' : '#64748b',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Laptop size={15} />
                    <span>Plataforma Web (PWA)</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: activePlatform === 'pwa' ? '#07665e' : '#e2e8f0',
                        color: activePlatform === 'pwa' ? '#fff' : '#475569',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        marginLeft: '3px',
                        fontWeight: 700,
                      }}
                    >
                      {pwaSelectedCount} / {pwaEffectiveActions.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`perm-platform-tab ${activePlatform === 'wpf' ? 'active' : ''}`}
                    onClick={() => setActivePlatform('wpf')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: activePlatform === 'wpf' ? '1.5px solid #07665e' : '1px solid #e2e8f0',
                      background: activePlatform === 'wpf' ? 'rgba(7, 102, 94, 0.09)' : '#fff',
                      color: activePlatform === 'wpf' ? '#07665e' : '#64748b',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Monitor size={15} />
                    <span>Terminal POS (WPF)</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: activePlatform === 'wpf' ? '#07665e' : '#e2e8f0',
                        color: activePlatform === 'wpf' ? '#fff' : '#475569',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        marginLeft: '3px',
                        fontWeight: 700,
                      }}
                    >
                      {wpfSelectedCount} / {wpfEffectiveActions.length}
                    </span>
                  </button>
                </div>

                {/* 2. Barra de Búsqueda y Acciones Rápidas */}
                <div className="perm-toolbar">
                  <div className="perm-search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      className="perm-search-input"
                      placeholder={
                        activePlatform === 'wpf'
                          ? 'Buscar acción en Terminal POS de Escritorio...'
                          : activePlatform === 'pwa'
                          ? 'Buscar acción en Plataforma Web (PWA)...'
                          : 'Buscar acción o módulo en el sistema...'
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="perm-actions-group">
                    <button
                      type="button"
                      className="btn-perm-tool select-all"
                      onClick={() => handleSelectVisible(true)}
                      title="Seleccionar todas las acciones visibles en la pestaña activa"
                    >
                      <CheckSquare size={14} /> Seleccionar Visibles
                    </button>
                    <button
                      type="button"
                      className="btn-perm-tool deselect-all"
                      onClick={() => handleSelectVisible(false)}
                      title="Desmarcar todas las acciones visibles en la pestaña activa"
                    >
                      <Square size={14} /> Desmarcar Visibles
                    </button>
                  </div>
                </div>

                {/* 3. Barra de Progreso Dinámica */}
                {(() => {
                  const currentSelected =
                    activePlatform === 'pwa'
                      ? pwaSelectedCount
                      : activePlatform === 'wpf'
                      ? wpfSelectedCount
                      : allSelectedCount;
                  const currentTotal =
                    activePlatform === 'pwa'
                      ? pwaEffectiveActions.length
                      : activePlatform === 'wpf'
                      ? wpfEffectiveActions.length
                      : effectiveActions.length;
                  const currentPct = Math.round((currentSelected / Math.max(1, currentTotal)) * 100);
                  const progressLabel =
                    activePlatform === 'pwa'
                      ? 'Cobertura en Plataforma Web (PWA)'
                      : activePlatform === 'wpf'
                      ? 'Cobertura en Terminal POS de Escritorio (WPF)'
                      : 'Cobertura Global del Sistema';

                  return (
                    <div className="perm-progress-card">
                      <div className="perm-progress-header">
                        <span className="perm-progress-title">{progressLabel}</span>
                        <span className="perm-progress-stats">
                          <strong>{currentSelected}</strong> de {currentTotal} permisos ({currentPct}%)
                        </span>
                      </div>
                      <div className="perm-progress-track">
                        <div
                          className="perm-progress-fill"
                          style={{
                            width: `${currentPct}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Lista de Módulos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {hierarchyRenderData.modules.map((mod) => {
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="perm-module-name">{mod.name}</span>
                                  {activePlatform === 'all' && (
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        background: mod.platform === 'wpf' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: mod.platform === 'wpf' ? '#2563eb' : '#059669',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {mod.platform === 'wpf' ? 'WPF POS' : 'PWA WEB'}
                                    </span>
                                  )}
                                </div>
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
                            {/* Caso 1: Módulo directo con acciones */}
                            {mod.actions && mod.actions.length > 0 && (
                              <div className="perm-actions-list">
                                {mod.actions.map((action) => {
                                  const isChecked = selectedActionIds.includes(action.id);
                                  const friendlyName = ACTION_DESCRIPTIVE_NAMES[action.slug] || action.name;

                                  return (
                                    <div
                                      key={action.id}
                                      className={`perm-item-row ${isChecked ? 'checked' : ''}`}
                                      onClick={() => handleToggleAction(action.id)}
                                    >
                                      <div className="perm-custom-checkbox">
                                        {isChecked && <Check size={13} strokeWidth={3} />}
                                      </div>
                                      <span className="perm-item-label">{friendlyName}</span>
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
                                            const friendlyName = ACTION_DESCRIPTIVE_NAMES[action.slug] || action.name;

                                            return (
                                              <div
                                                key={action.id}
                                                className={`perm-item-row ${isChecked ? 'checked' : ''}`}
                                                onClick={() => handleToggleAction(action.id)}
                                              >
                                                <div className="perm-custom-checkbox">
                                                  {isChecked && <Check size={13} strokeWidth={3} />}
                                                </div>
                                                <span className="perm-item-label">{friendlyName}</span>
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
                  {hierarchyRenderData.unmatchedActions.length > 0 && (
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
                            {hierarchyRenderData.unmatchedActions.filter((a) => selectedActionIds.includes(a.id)).length} / {hierarchyRenderData.unmatchedActions.length} activos
                          </span>
                        </div>

                        <button
                          type="button"
                          className="perm-module-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleModuleAll(hierarchyRenderData.unmatchedActions.map((a) => a.id));
                          }}
                        >
                          <span>Marcar Todo</span>
                        </button>
                      </div>

                      {expandedModuleKey === 'otras' && (
                        <div className="perm-actions-list">
                          {hierarchyRenderData.unmatchedActions.map((action) => {
                            const isChecked = selectedActionIds.includes(action.id);
                            const friendlyName = ACTION_DESCRIPTIVE_NAMES[action.slug] || action.name;

                            return (
                              <div
                                key={action.id}
                                className={`perm-item-row ${isChecked ? 'checked' : ''}`}
                                onClick={() => handleToggleAction(action.id)}
                              >
                                <div className="perm-custom-checkbox">
                                  {isChecked && <Check size={13} strokeWidth={3} />}
                                </div>
                                <span className="perm-item-label">{friendlyName}</span>
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
