import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/ui/Login';
import { Dashboard } from './features/dashboard/ui/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
