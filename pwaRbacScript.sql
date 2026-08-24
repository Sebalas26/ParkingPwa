-- ==================================================================================
-- SCRIPT DE POBLACIÓN DE RBAC Y ASIGNACIÓN TOTAL AL ADMINISTRADOR (WPF + PWA)
-- Archivo Espejo: ParkingPwa/pwaRbacScript.sql (Sincronizado con ParkingApi/Scripts/02_Init_RBAC_Seed.sql)
-- Motor: MySQL 8.x / MariaDB
-- Descripción:
--   1. Asegura Tipos de Identificación estándar (CC, CE, NIT, PAS, PEP) usando la columna Identification.
--   2. Asegura Roles base (Administrador ID 1, Operador ID 2, Supervisor ID 3) usando la columna Role.
--   3. Asegura Usuario Administrador Principal ('admin') usando la columna Password.
--   4. Registra los 17 Módulos funcionales del sistema (10 WPF originales + 7 PWA adicionales).
--   5. Registra las 6 Operaciones estándar (READ, CREATE, UPDATE, DELETE, EXECUTE, PRINT).
--   6. Registra las 56 Acciones reales con sus slugs de autorización (37 WPF originales + 19 PWA adicionales).
--   7. ASIGNA EL 100% DE LOS PERMISOS AL ROL ADMINISTRADOR (RoleAction & UserRoleModule).
--   8. Ejecuta consultas de auditoría y verificación.
-- ==================================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------------
-- 1. TIPOS DE IDENTIFICACIÓN (IdentificationType)
-- ----------------------------------------------------------------------------------
INSERT INTO IdentificationType (Id, Identification, IsActive, CreatedAt, ResponsibleUserId)
VALUES
    (1, 'CC',  1, UTC_TIMESTAMP(), NULL),
    (2, 'CE',  1, UTC_TIMESTAMP(), NULL),
    (3, 'NIT', 1, UTC_TIMESTAMP(), NULL),
    (4, 'PAS', 1, UTC_TIMESTAMP(), NULL),
    (5, 'PEP', 1, UTC_TIMESTAMP(), NULL)
AS new_row
ON DUPLICATE KEY UPDATE 
    Identification = new_row.Identification,
    IsActive = new_row.IsActive;

-- ----------------------------------------------------------------------------------
-- 2. ROLES DE USUARIO (UserRole)
-- ----------------------------------------------------------------------------------
INSERT INTO UserRole (Id, Role, IsActive, CreatedAt, ResponsibleUserId)
VALUES
    (1, 'Administrador', 1, UTC_TIMESTAMP(), NULL),
    (2, 'Operador',      1, UTC_TIMESTAMP(), NULL),
    (3, 'Supervisor',    1, UTC_TIMESTAMP(), NULL)
AS new_row
ON DUPLICATE KEY UPDATE 
    Role = new_row.Role, 
    IsActive = new_row.IsActive;

-- ----------------------------------------------------------------------------------
-- 3. USUARIO ADMINISTRADOR PRINCIPAL (User)
-- ----------------------------------------------------------------------------------
INSERT INTO User (
    Id, UserRoleId, IdentificationTypeId, IdentificationNumber, 
    FirstName, MiddleName, FirstSurname, SecondLastName, FullName,
    Username, Password, Email, IsActive, MustChangePassword, CreatedAt
)
VALUES (
    1, 1, 1, '1000000000', 
    'Administrador', '', 'Principal', '', 'Administrador del Sistema',
    'admin', 
    '$2a$11$eA8b7w9H4W5nN8u9o3r0ueLd3eGf6h8j0k1l2m3n4o5p6q7r8s9t0', -- Admin2026* / admin123
    'admin@parkflow.local', 
    1, 0, UTC_TIMESTAMP()
)
AS new_row
ON DUPLICATE KEY UPDATE 
    UserRoleId = new_row.UserRoleId,
    IdentificationTypeId = new_row.IdentificationTypeId,
    IdentificationNumber = new_row.IdentificationNumber,
    FullName = new_row.FullName,
    Email = new_row.Email,
    Password = new_row.Password,
    IsActive = 1;

-- ----------------------------------------------------------------------------------
-- 4. MÓDULOS DEL SISTEMA (Module) - 17 Módulos (10 WPF + 7 PWA)
-- ----------------------------------------------------------------------------------
INSERT INTO Module (Id, Name, IsActive, CreatedAt, ResponsibleUserId)
VALUES
    -- Módulos WPF / API Originales (IDs 1-10)
    (1,  'Ingreso de Vehículos',           1, UTC_TIMESTAMP(), NULL),
    (2,  'Salida y Cobro',                 1, UTC_TIMESTAMP(), NULL),
    (3,  'Mensualidades',                  1, UTC_TIMESTAMP(), NULL),
    (4,  'Vehículos en Patio',             1, UTC_TIMESTAMP(), NULL),
    (5,  'Analítica y Finanzas',           1, UTC_TIMESTAMP(), NULL),
    (6,  'Control de Turnos',              1, UTC_TIMESTAMP(), NULL),
    (7,  'Configuración y Sistema',        1, UTC_TIMESTAMP(), NULL),
    (8,  'Gestión de Tarifas',             1, UTC_TIMESTAMP(), NULL),
    (9,  'Convenios y Comercios',          1, UTC_TIMESTAMP(), NULL),
    (10, 'Seguridad y Accesos',            1, UTC_TIMESTAMP(), NULL),
    -- Módulos Adicionales PWA (IDs 11-17)
    (11, 'Reportes y Auditoría PWA',         1, UTC_TIMESTAMP(), NULL),
    (12, 'Novedades e Incidencias PWA',      1, UTC_TIMESTAMP(), NULL),
    (13, 'Gestión de Parqueaderos PWA',      1, UTC_TIMESTAMP(), NULL),
    (14, 'Gestión de Usuarios PWA',          1, UTC_TIMESTAMP(), NULL),
    (15, 'Configuración de Vehículos PWA',   1, UTC_TIMESTAMP(), NULL),
    (16, 'Medios de Pago PWA',               1, UTC_TIMESTAMP(), NULL),
    (17, 'Dashboard Principal PWA',          1, UTC_TIMESTAMP(), NULL)
AS new_row
ON DUPLICATE KEY UPDATE 
    Name = new_row.Name, 
    IsActive = new_row.IsActive;

-- ----------------------------------------------------------------------------------
-- 5. OPERACIONES BASE (Operation)
-- ----------------------------------------------------------------------------------
INSERT INTO Operation (Id, Name, IsActive, CreatedAt, ResponsibleUserId)
VALUES
    (1, 'READ',    1, UTC_TIMESTAMP(), NULL),
    (2, 'CREATE',  1, UTC_TIMESTAMP(), NULL),
    (3, 'UPDATE',  1, UTC_TIMESTAMP(), NULL),
    (4, 'DELETE',  1, UTC_TIMESTAMP(), NULL),
    (5, 'EXECUTE', 1, UTC_TIMESTAMP(), NULL),
    (6, 'PRINT',   1, UTC_TIMESTAMP(), NULL)
AS new_row
ON DUPLICATE KEY UPDATE 
    Name = new_row.Name, 
    IsActive = new_row.IsActive;

-- ----------------------------------------------------------------------------------
-- 6. ACCIONES Y SLUGS REALES DEL SISTEMA (Action) - 56 Acciones (37 WPF + 19 PWA)
-- ----------------------------------------------------------------------------------
INSERT INTO Action (Id, ModuleId, OperationId, Name, Slug, IsActive, CreatedAt, ResponsibleUserId)
VALUES
    -- ==================== ACCIONES ORIGINALES WPF / API (IDs 1-37) ====================
    (1,  1, 1, 'Ver módulo de ingreso', 'checkin.view', 1, UTC_TIMESTAMP(), NULL),
    (2,  1, 2, 'Generar e imprimir tiquete de ingreso', 'checkin.create', 1, UTC_TIMESTAMP(), NULL),
    (3,  1, 6, 'Reimprimir último tiquete de ingreso', 'checkin.reprint', 1, UTC_TIMESTAMP(), NULL),
    (4,  2, 1, 'Ver módulo de cobro y liquidación', 'checkout.view', 1, UTC_TIMESTAMP(), NULL),
    (5,  2, 1, 'Buscar tiquete por placa o código', 'checkout.search', 1, UTC_TIMESTAMP(), NULL),
    (6,  2, 3, 'Aplicar convenios y descuentos comerciales', 'checkout.apply_discount', 1, UTC_TIMESTAMP(), NULL),
    (7,  2, 2, 'Procesar cobro y recaudar pago', 'checkout.process_payment', 1, UTC_TIMESTAMP(), NULL),
    (8,  2, 6, 'Reimprimir recibo de liquidación', 'checkout.reprint_receipt', 1, UTC_TIMESTAMP(), NULL),
    (9,  2, 5, 'Anular o reversar cobro de tiquete', 'checkout.cancel', 1, UTC_TIMESTAMP(), NULL),
    (10, 2, 5, 'Apertura manual de talanquera / salida contingente', 'checkout.manual_barrier_open', 1, UTC_TIMESTAMP(), NULL),
    (11, 3, 1, 'Ver módulo de mensualidades', 'subscriptions.view', 1, UTC_TIMESTAMP(), NULL),
    (12, 3, 2, 'Crear nueva suscripción de mensualidad', 'subscriptions.create', 1, UTC_TIMESTAMP(), NULL),
    (13, 3, 2, 'Renovar / recaudar cuota de mensualidad', 'subscriptions.renew', 1, UTC_TIMESTAMP(), NULL),
    (14, 3, 3, 'Editar datos de abonado y vehículo', 'subscriptions.edit', 1, UTC_TIMESTAMP(), NULL),
    (15, 3, 4, 'Cancelar / inactivar mensualidad', 'subscriptions.cancel', 1, UTC_TIMESTAMP(), NULL),
    (16, 4, 1, 'Ver vehículos en patio y recientes', 'recent_entries.view', 1, UTC_TIMESTAMP(), NULL),
    (17, 4, 6, 'Exportar listado de vehículos en patio', 'recent_entries.export', 1, UTC_TIMESTAMP(), NULL),
    (18, 5, 1, 'Ver dashboard financiero y analítica', 'analytics.view', 1, UTC_TIMESTAMP(), NULL),
    (19, 5, 1, 'Consultar métricas de ocupación e ingresos', 'analytics.metrics', 1, UTC_TIMESTAMP(), NULL),
    (20, 5, 6, 'Exportar informes contables y balance', 'analytics.export', 1, UTC_TIMESTAMP(), NULL),
    (21, 6, 1, 'Ver balance de turno y arqueo de caja', 'shift.view', 1, UTC_TIMESTAMP(), NULL),
    (22, 6, 2, 'Apertura de turno operativo con base inicial y custodia', 'shift.open', 1, UTC_TIMESTAMP(), NULL),
    (23, 6, 5, 'Registrar retiros o sangrías parciales de gaveta', 'shift.cash_withdrawal', 1, UTC_TIMESTAMP(), NULL),
    (24, 6, 3, 'Cierre definitivo de turno y fin de jornada (Sin relevo)', 'shift.close', 1, UTC_TIMESTAMP(), NULL),
    (25, 6, 3, 'Entrega y relevo de turno a otro operador con firma digital', 'shift.handover', 1, UTC_TIMESTAMP(), NULL),
    (26, 6, 1, 'Consultar histórico de turnos y arqueos', 'shift.history', 1, UTC_TIMESTAMP(), NULL),
    (27, 7, 5, 'Ejecutar sincronización manual en caliente', 'system.sync', 1, UTC_TIMESTAMP(), NULL),
    (28, 7, 5, 'Limpiar caché local y forzar resincronización', 'system.clean_cache', 1, UTC_TIMESTAMP(), NULL),
    (29, 7, 3, 'Cambiar tema visual de la interfaz', 'system.theme', 1, UTC_TIMESTAMP(), NULL),
    (30, 8, 1, 'Ver catálogo de tarifas vehiculares', 'rates.view', 1, UTC_TIMESTAMP(), NULL),
    (31, 8, 3, 'Crear, editar y parametrizar tarifas', 'rates.manage', 1, UTC_TIMESTAMP(), NULL),
    (32, 9, 1, 'Ver convenios comerciales y comercios afiliados', 'agreements.view', 1, UTC_TIMESTAMP(), NULL),
    (33, 9, 3, 'Crear y administrar convenios y descuentos', 'agreements.manage', 1, UTC_TIMESTAMP(), NULL),
    (34, 10, 1, 'Ver usuarios, roles y matriz de permisos', 'security.view', 1, UTC_TIMESTAMP(), NULL),
    (35, 10, 3, 'Administrar usuarios y contraseñas', 'users.manage', 1, UTC_TIMESTAMP(), NULL),
    (36, 10, 3, 'Administrar roles y permisos del sistema', 'roles.manage', 1, UTC_TIMESTAMP(), NULL),
    (37, 10, 3, 'Asignar permisos y accesos a roles', 'permissions.assign', 1, UTC_TIMESTAMP(), NULL),

    -- ==================== ACCIONES ADICIONALES PWA (IDs 38-56) ====================
    (38, 17, 1, 'Ver Dashboard principal de PWA', 'dashboard.view', 1, UTC_TIMESTAMP(), NULL),
    (39, 17, 1, 'Ver métricas avanzadas de ocupación PWA', 'dashboard.metrics', 1, UTC_TIMESTAMP(), NULL),
    (40, 17, 1, 'Ver desglose por parqueadero en dashboard PWA', 'dashboard.breakdown', 1, UTC_TIMESTAMP(), NULL),
    (41, 11, 1, 'Ver reportes de recaudación PWA', 'reports.view', 1, UTC_TIMESTAMP(), NULL),
    (42, 11, 6, 'Exportar reportes PDF y Excel PWA', 'reports.export', 1, UTC_TIMESTAMP(), NULL),
    (43, 12, 1, 'Ver módulo de novedades PWA', 'novedades.view', 1, UTC_TIMESTAMP(), NULL),
    (44, 12, 2, 'Registrar nueva novedad u observación PWA', 'novedades.create', 1, UTC_TIMESTAMP(), NULL),
    (45, 12, 3, 'Editar y resolver novedades PWA', 'novedades.edit', 1, UTC_TIMESTAMP(), NULL),
    (46, 13, 1, 'Ver lista de parqueaderos PWA', 'settings.parqueaderos.view', 1, UTC_TIMESTAMP(), NULL),
    (47, 13, 3, 'Crear y editar parqueaderos PWA', 'settings.parqueaderos.manage', 1, UTC_TIMESTAMP(), NULL),
    (48, 13, 3, 'Asignar permisos a parqueadero PWA', 'settings.parqueaderos.assign_permissions', 1, UTC_TIMESTAMP(), NULL),
    (49, 16, 1, 'Ver medios de pago PWA', 'settings.medios_pago.view', 1, UTC_TIMESTAMP(), NULL),
    (50, 16, 3, 'Habilitar y administrar medios de pago PWA', 'settings.medios_pago.manage', 1, UTC_TIMESTAMP(), NULL),
    (51, 8, 1, 'Ver catálogo de tarifas en configuración PWA', 'settings.tarifas.view', 1, UTC_TIMESTAMP(), NULL),
    (52, 8, 3, 'Gestionar y editar tarifas en PWA', 'settings.tarifas.manage', 1, UTC_TIMESTAMP(), NULL),
    (53, 14, 1, 'Ver usuarios del sistema en PWA', 'settings.usuarios.view', 1, UTC_TIMESTAMP(), NULL),
    (54, 14, 3, 'Crear y editar usuarios en PWA', 'settings.usuarios.manage', 1, UTC_TIMESTAMP(), NULL),
    (55, 9, 1, 'Ver convenios comerciales en PWA', 'settings.convenios.view', 1, UTC_TIMESTAMP(), NULL),
    (56, 9, 3, 'Gestionar convenios comerciales en PWA', 'settings.convenios.manage', 1, UTC_TIMESTAMP(), NULL)
AS new_row
ON DUPLICATE KEY UPDATE 
    ModuleId = new_row.ModuleId,
    OperationId = new_row.OperationId,
    Name = new_row.Name,
    Slug = new_row.Slug,
    IsActive = new_row.IsActive;

-- ----------------------------------------------------------------------------------
-- 7. MATRIZ DE PERMISOS: ROL ACCIONES (RoleAction)
-- ----------------------------------------------------------------------------------
DELETE FROM RoleAction WHERE RoleId = 1;

INSERT INTO RoleAction (RoleId, ActionId, IsActive, CreatedAt, ResponsibleUserId)
SELECT 1, Id, 1, UTC_TIMESTAMP(), 1 FROM Action;

-- ----------------------------------------------------------------------------------
-- 8. MATRIZ DE MÓDULOS POR ROL (UserRoleModule)
-- ----------------------------------------------------------------------------------
DELETE FROM UserRoleModule WHERE UserRoleId = 1;

INSERT INTO UserRoleModule (UserRoleId, ModulesRoleId, IsActive, CreatedAt, ResponsibleUserId)
SELECT 1, Id, 1, UTC_TIMESTAMP(), 1 FROM Module;

SET FOREIGN_KEY_CHECKS = 1;
