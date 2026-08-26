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

function App() {
  return (
    <ParqueaderoProvider>
      <UpdatePromptModal />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="caja" element={<Caja />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="reports" element={<Reports />} />
            <Route path="novedades" element={<Novedades />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ParqueaderoProvider>
  );
}

export default App;
