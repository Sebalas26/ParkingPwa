export const PWA_MODULES = {
  DASHBOARD: 'dashboard',
  CHECKIN: 'checkin',
  CHECKOUT: 'checkout',
  SHIFT: 'shift',
  RECENT_ENTRIES: 'recent_entries',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  NOVEDADES: 'novedades',
  BRANCHES: 'branches',
  PARQUEADEROS: 'settings.parqueaderos',
  RATES: 'rates',
  TARIFAS: 'settings.tarifas',
  USERS: 'users',
  USUARIOS: 'settings.usuarios',
  AGREEMENTS: 'agreements',
  CONVENIOS: 'settings.convenios',
  VEHICULOS: 'settings.vehiculos',
  PAYMENT_METHODS: 'payment_methods',
  MEDIOS_PAGO: 'settings.medios_pago',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  SUBSCRIPTIONS: 'subscriptions',
  SECURITY: 'security',
} as const;

export const PWA_PERMISSIONS = {
  // Dashboard & Analytics
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_METRICS: 'dashboard.metrics',
  DASHBOARD_BREAKDOWN: 'dashboard.breakdown',
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Sedes (Branches)
  BRANCHES_VIEW: 'branches.view',
  BRANCHES_CREATE: 'branches.create',
  BRANCHES_EDIT: 'branches.edit',
  BRANCHES_DELETE: 'branches.delete',
  BRANCHES_ASSIGN_USERS: 'branches.assign_users',
  BRANCHES_CONFIGURE_PAYMENTS: 'branches.configure_payments',

  // Tarifas Vehiculares (Rates)
  RATES_VIEW: 'rates.view',
  RATES_CREATE: 'rates.create',
  RATES_EDIT: 'rates.edit',
  RATES_DELETE: 'rates.delete',

  // Medios de Pago (Payment Methods)
  PAYMENT_METHODS_VIEW: 'payment_methods.view',
  PAYMENT_METHODS_CREATE: 'payment_methods.create',
  PAYMENT_METHODS_EDIT: 'payment_methods.edit',
  PAYMENT_METHODS_DELETE: 'payment_methods.delete',

  // Comercios y Convenios (Agreements)
  AGREEMENTS_VIEW: 'agreements.view',
  AGREEMENTS_CREATE: 'agreements.create',
  AGREEMENTS_EDIT: 'agreements.edit',
  AGREEMENTS_DELETE: 'agreements.delete',

  // Usuarios y Roles
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',

  // Permisos
  PERMISSIONS_VIEW: 'permissions.view',
  PERMISSIONS_ASSIGN: 'permissions.assign',

  // CheckIn & CheckOut
  CHECKIN_VIEW: 'checkin.view',
  CHECKIN_CREATE: 'checkin.create',
  CHECKIN_REPRINT: 'checkin.reprint',
  CHECKOUT_VIEW: 'checkout.view',
  CHECKOUT_SEARCH: 'checkout.search',
  CHECKOUT_APPLY_DISCOUNT: 'checkout.apply_discount',
  CHECKOUT_PROCESS_PAYMENT: 'checkout.process_payment',
  CHECKOUT_REPRINT_RECEIPT: 'checkout.reprint_receipt',
  CHECKOUT_CANCEL: 'checkout.cancel',
  CHECKOUT_MANUAL_BARRIER_OPEN: 'checkout.manual_barrier_open',

  // Control de Turnos & Caja
  SHIFT_VIEW: 'shift.view',
  SHIFT_OPEN: 'shift.open',
  SHIFT_CASH_WITHDRAWAL: 'shift.cash_withdrawal',
  SHIFT_CLOSE: 'shift.close',
  SHIFT_HANDOVER: 'shift.handover',
  SHIFT_HISTORY: 'shift.history',

  // Mensualidades & Vehículos
  SUBSCRIPTIONS_VIEW: 'subscriptions.view',
  RECENT_ENTRIES_VIEW: 'recent_entries.view',
  RECENT_ENTRIES_EXPORT: 'recent_entries.export',

  // Reportes & Novedades
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  NOVEDADES_VIEW: 'novedades.view',
  NOVEDADES_CREATE: 'novedades.create',
  NOVEDADES_EDIT: 'novedades.edit',

  // Compatibilidad legacy
  SETTINGS_PARQUEADEROS_VIEW: 'settings.parqueaderos.view',
  SETTINGS_PARQUEADEROS_MANAGE: 'settings.parqueaderos.manage',
  SETTINGS_TARIFAS_VIEW: 'settings.tarifas.view',
  SETTINGS_TARIFAS_MANAGE: 'settings.tarifas.manage',
  SETTINGS_USUARIOS_VIEW: 'settings.usuarios.view',
  SETTINGS_USUARIOS_MANAGE: 'settings.usuarios.manage',
  SETTINGS_CONVENIOS_VIEW: 'settings.convenios.view',
  SETTINGS_CONVENIOS_MANAGE: 'settings.convenios.manage',
  SETTINGS_VEHICULOS_VIEW: 'settings.vehiculos.view',
  SETTINGS_VEHICULOS_MANAGE: 'settings.vehiculos.manage',
  SETTINGS_MEDIOS_PAGO_VIEW: 'settings.medios_pago.view',
  SETTINGS_MEDIOS_PAGO_MANAGE: 'settings.medios_pago.manage',
  SECURITY_VIEW: 'security.view',
  SYSTEM_SYNC: 'system.sync',
} as const;

export const ALL_PWA_PERMISSIONS_LIST: string[] = Array.from(new Set(Object.values(PWA_PERMISSIONS)));
export const ALL_PWA_MODULES_LIST: string[] = Array.from(new Set(Object.values(PWA_MODULES)));
