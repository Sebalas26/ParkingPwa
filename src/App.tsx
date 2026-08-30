import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/ui/Login';
import { DashboardLayout } from './shared/ui/DashboardLayout';
import { Dashboard } from './features/dashboard/ui/Dashboard';
import { Vehicles } from './features/vehicles/ui/Vehicles';
import { Reports } from './features/reports/ui/Reports';
import { Settings } from './features/settings/ui/Settings';
import { Caja } from './features/caja/ui/Caja';
import { Novedades } from './features/novedades/ui/Novedades';
import { CompaniesPage } from './features/companies/ui/CompaniesPage';
import { ParqueaderoProvider } from './shared/context/ParqueaderoContext';
import { authService } from './features/auth/data/authService';
import { apiClient } from './shared/api/apiClient';
import { UpdatePromptModal } from './shared/ui/UpdatePromptModal';

import { NoPermissionsView } from './shared/ui/NoPermissionsView';

const SessionHeartbeat: React.FC = () => {
  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    const checkSession = async () => {
      if (!authService.isAuthenticated()) return;
      try {
        await apiClient.get('/Auth/validate-session');
      } catch {
        // apiClient handleResponse captura 401 y expulsa al usuario
      }
    };

    const handleFocus = () => {
      checkSession();
    };

    window.addEventListener('focus', handleFocus);
    const intervalId = setInterval(checkSession, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  return null;
};

const hasUserAnyModulePermission = (): boolean => {
  const user = authService.getCurrentUser();
  if (user?.isSuperAdmin) return true;

  if (authService.hasPermission('dashboard.view')) return true;
  if (authService.hasPermission('checkout.view') || authService.hasPermission('shift.view')) return true;
  if (authService.hasPermission('recent_entries.view')) return true;
  if (authService.hasPermission('reports.view')) return true;
  if (authService.hasPermission('novedades.view')) return true;

  const canAccessSettings =
    authService.hasPermission('settings.parqueaderos.view') ||
    authService.hasPermission('settings.usuarios.view') ||
    authService.hasPermission('settings.roles.view') ||
    authService.hasPermission('settings.tarifas.view') ||
    authService.hasPermission('settings.medios_pago.view') ||
    authService.hasPermission('settings.convenios.view') ||
    authService.hasPermission('settings.resoluciones.view');

  return canAccessSettings;
};

const getDefaultLandingPath = (): string => {
  const user = authService.getCurrentUser();
  if (user?.isSuperAdmin) return '/dashboard/companies';

  if (authService.hasPermission('dashboard.view')) return '/dashboard';
  if (authService.hasPermission('checkout.view') || authService.hasPermission('shift.view')) return '/dashboard/caja';
  if (authService.hasPermission('recent_entries.view')) return '/dashboard/vehicles';
  if (authService.hasPermission('reports.view')) return '/dashboard/reports';
  if (authService.hasPermission('novedades.view')) return '/dashboard/novedades';

  const canAccessSettings =
    authService.hasPermission('settings.parqueaderos.view') ||
    authService.hasPermission('settings.usuarios.view') ||
    authService.hasPermission('settings.roles.view') ||
    authService.hasPermission('settings.tarifas.view') ||
    authService.hasPermission('settings.medios_pago.view') ||
    authService.hasPermission('settings.convenios.view') ||
    authService.hasPermission('settings.resoluciones.view');

  if (canAccessSettings) return '/dashboard/settings';

  return '/dashboard/no-permissions';
};

const RootAuthHandler: React.FC = () => {
  const isExpiredParam = window.location.search.includes('expired=');
  if (isExpiredParam) {
    return <Login />;
  }

  if (authService.isAuthenticated()) {
    const landing = getDefaultLandingPath();
    return <Navigate to={landing} replace />;
  }
  return <Login />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return (
    <>
      <SessionHeartbeat />
      {children}
    </>
  );
};

const GuardedRoute: React.FC<{
  permission?: string | string[];
  moduleName?: string;
  element: React.ReactElement;
}> = ({ permission, moduleName, element }) => {
  const user = authService.getCurrentUser();
  if (user?.isSuperAdmin) return element;

  if (!hasUserAnyModulePermission()) {
    return <NoPermissionsView moduleName={moduleName} />;
  }

  if (!permission) return element;

  const permissions = Array.isArray(permission) ? permission : [permission];
  const isAllowed = permissions.some((p) => authService.hasPermission(p));

  if (!isAllowed) {
    const fallbackPath = getDefaultLandingPath();
    if (fallbackPath === '/dashboard/no-permissions') {
      return <NoPermissionsView moduleName={moduleName} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return element;
};

function App() {
  return (
    <ParqueaderoProvider>
      <UpdatePromptModal />
      <Router>
        <Routes>
          {/* Ruta raíz limpia: Muestra el Login directamente o Dashboard si ya inició sesión */}
          <Route path="/" element={<RootAuthHandler />} />
          
          {/* Redirección retrocompatible de /login hacia la raíz limpia */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          
          {/* Rutas protegidas del Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <GuardedRoute
                  permission="dashboard.view"
                  element={<Dashboard />}
                />
              }
            />
            <Route
              path="caja"
              element={
                <GuardedRoute
                  permission={['checkout.view', 'shift.view']}
                  element={<Caja />}
                />
              }
            />
            <Route
              path="vehicles"
              element={
                <GuardedRoute
                  permission="recent_entries.view"
                  element={<Vehicles />}
                />
              }
            />
            <Route
              path="reports"
              element={
                <GuardedRoute
                  permission="reports.view"
                  element={<Reports />}
                />
              }
            />
            <Route
              path="novedades"
              element={
                <GuardedRoute
                  permission="novedades.view"
                  element={<Novedades />}
                />
              }
            />
            <Route
              path="settings"
              element={
                <GuardedRoute
                  permission={[
                    'settings.parqueaderos.view',
                    'settings.usuarios.view',
                    'settings.roles.view',
                    'settings.tarifas.view',
                    'settings.medios_pago.view',
                    'settings.convenios.view',
                    'settings.resoluciones.view',
                  ]}
                  element={<Settings />}
                />
              }
            />
            <Route
              path="companies"
              element={
                <GuardedRoute
                  permission="companies.view"
                  element={<CompaniesPage />}
                />
              }
            />
            <Route path="no-permissions" element={<NoPermissionsView />} />
          </Route>

          {/* Fallback general de rutas desconocidas hacia la raíz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ParqueaderoProvider>
  );
}

export default App;
