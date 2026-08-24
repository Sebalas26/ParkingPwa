export const PWA_MODULES = {
  DASHBOARD: 'dashboard',
  CHECKIN: 'checkin',
  CHECKOUT: 'checkout',
  SHIFT: 'shift',
  RECENT_ENTRIES: 'recent_entries',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  NOVEDADES: 'novedades',
  PARQUEADEROS: 'settings.parqueaderos',
  TARIFAS: 'settings.tarifas',
  USUARIOS: 'settings.usuarios',
  CONVENIOS: 'settings.convenios',
  VEHICULOS: 'settings.vehiculos',
  MEDIOS_PAGO: 'settings.medios_pago',
  SECURITY: 'security',
} as const;

export const PWA_PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_METRICS: 'dashboard.metrics',
  DASHBOARD_BREAKDOWN: 'dashboard.breakdown',

  // CheckIn
  CHECKIN_VIEW: 'checkin.view',
  CHECKIN_CREATE: 'checkin.create',
  CHECKIN_REPRINT: 'checkin.reprint',

  // CheckOut / Caja
  CHECKOUT_VIEW: 'checkout.view',
  CHECKOUT_SEARCH: 'checkout.search',
  CHECKOUT_APPLY_DISCOUNT: 'checkout.apply_discount',
  CHECKOUT_PROCESS_PAYMENT: 'checkout.process_payment',
  CHECKOUT_REPRINT_RECEIPT: 'checkout.reprint_receipt',
  CHECKOUT_CANCEL: 'checkout.cancel',
  CHECKOUT_MANUAL_BARRIER_OPEN: 'checkout.manual_barrier_open',

  // Control de Turnos
  SHIFT_VIEW: 'shift.view',
  SHIFT_OPEN: 'shift.open',
  SHIFT_CASH_WITHDRAWAL: 'shift.cash_withdrawal',
  SHIFT_CLOSE: 'shift.close',
  SHIFT_HANDOVER: 'shift.handover',
  SHIFT_HISTORY: 'shift.history',

  // Vehículos en Patio
  RECENT_ENTRIES_VIEW: 'recent_entries.view',
  RECENT_ENTRIES_EXPORT: 'recent_entries.export',

  // Analítica & Finanzas
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Reportes
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Novedades
  NOVEDADES_VIEW: 'novedades.view',
  NOVEDADES_CREATE: 'novedades.create',
  NOVEDADES_EDIT: 'novedades.edit',

  // Configuración - Parqueaderos
  SETTINGS_PARQUEADEROS_VIEW: 'settings.parqueaderos.view',
  SETTINGS_PARQUEADEROS_MANAGE: 'settings.parqueaderos.manage',
  SETTINGS_PARQUEADEROS_ASSIGN_PERMISSIONS: 'settings.parqueaderos.assign_permissions',

  // Configuración - Tarifas
  SETTINGS_TARIFAS_VIEW: 'settings.tarifas.view',
  SETTINGS_TARIFAS_MANAGE: 'settings.tarifas.manage',

  // Configuración - Usuarios
  SETTINGS_USUARIOS_VIEW: 'settings.usuarios.view',
  SETTINGS_USUARIOS_MANAGE: 'settings.usuarios.manage',

  // Configuración - Convenios
  SETTINGS_CONVENIOS_VIEW: 'settings.convenios.view',
  SETTINGS_CONVENIOS_MANAGE: 'settings.convenios.manage',

  // Configuración - Vehículos
  SETTINGS_VEHICULOS_VIEW: 'settings.vehiculos.view',
  SETTINGS_VEHICULOS_MANAGE: 'settings.vehiculos.manage',

  // Configuración - Medios de Pago
  SETTINGS_MEDIOS_PAGO_VIEW: 'settings.medios_pago.view',
  SETTINGS_MEDIOS_PAGO_MANAGE: 'settings.medios_pago.manage',

  // Seguridad & Sistema
  SECURITY_VIEW: 'security.view',
  SYSTEM_SYNC: 'system.sync',
} as const;

export const ALL_PWA_PERMISSIONS_LIST: string[] = Object.values(PWA_PERMISSIONS);
export const ALL_PWA_MODULES_LIST: string[] = Object.values(PWA_MODULES);
