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

const RootAuthHandler: React.FC = () => {
  const isExpiredParam = window.location.search.includes('expired=');
  if (isExpiredParam) {
    return <Login />;
  }

  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
    if (user?.isSuperAdmin) {
      return <Navigate to="/dashboard/companies" replace />;
    }
    return <Navigate to="/dashboard" replace />;
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
            <Route index element={<Dashboard />} />
            <Route path="caja" element={<Caja />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="reports" element={<Reports />} />
            <Route path="novedades" element={<Novedades />} />
            <Route path="settings" element={<Settings />} />
            <Route path="companies" element={<CompaniesPage />} />
          </Route>

          {/* Fallback general de rutas desconocidas hacia la raíz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ParqueaderoProvider>
  );
}

export default App;
