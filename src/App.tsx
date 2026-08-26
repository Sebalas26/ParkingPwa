import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/ui/Login';
import { DashboardLayout } from './shared/ui/DashboardLayout';
import { Dashboard } from './features/dashboard/ui/Dashboard';
import { Vehicles } from './features/vehicles/ui/Vehicles';
import { Reports } from './features/reports/ui/Reports';
import { Settings } from './features/settings/ui/Settings';
import { Caja } from './features/caja/ui/Caja';
import { Novedades } from './features/novedades/ui/Novedades';
import { ParqueaderoProvider } from './shared/context/ParqueaderoContext';
import { UpdatePromptModal } from './shared/ui/UpdatePromptModal';
import { authService } from './features/auth/data/authService';

const RootAuthHandler: React.FC = () => {
  if (authService.isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Login />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
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
          </Route>

          {/* Fallback general de rutas desconocidas hacia la raíz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ParqueaderoProvider>
  );
}

export default App;
