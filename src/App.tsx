import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/ui/Login';
import { DashboardLayout } from './shared/ui/DashboardLayout';
import { Dashboard } from './features/dashboard/ui/Dashboard';
import { Vehicles } from './features/vehicles/ui/Vehicles';
import { ParkingMap } from './features/parkingMap/ui/ParkingMap';
import { EntryExitLog } from './features/logs/ui/EntryExitLog';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="map" element={<ParkingMap />} />
          <Route path="logs" element={<EntryExitLog />} />
          <Route path="reports" element={<div className="loading-screen">Reports Module (Coming Soon)</div>} />
          <Route path="settings" element={<div className="loading-screen">Settings Module (Coming Soon)</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
