import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../../features/auth/data/authService';
import { Car, LayoutDashboard, Map, List, BarChart, Settings, LogOut, Search, User } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import './DashboardLayout.css';

const WatermarkLogo = () => (
  <div className="sidebar-watermark">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* Map Pin */}
      <path d="M100 10 C50 10 20 40 20 80 C20 130 100 190 100 190 C100 190 180 130 180 80 C180 40 150 10 100 10 Z" fill="currentColor" />
      {/* Cutout P */}
      <path d="M80 45 L115 45 C135 45 140 60 140 70 C140 80 135 95 115 95 L95 95 L95 115 L80 115 Z M95 60 L95 80 L115 80 C122 80 122 60 115 60 Z" fill="var(--bg-sidebar)" />
      
      {/* Car overlap outline (to create the cutout effect) */}
      <path d="M110 115 C125 105 165 105 180 115 L205 145 L205 175 L190 175 L190 190 L160 190 L160 175 L100 175 L100 190 L70 190 L70 175 L55 175 L55 145 Z" fill="var(--bg-sidebar)" />
      
      {/* Actual Car */}
      <path d="M115 120 C125 110 165 110 175 120 L195 145 L195 170 L185 170 L185 180 L165 180 L165 170 L105 170 L105 180 L85 180 L85 170 L75 170 L75 145 Z" fill="currentColor" />
      {/* Car windshield */}
      <path d="M120 125 L170 125 L185 140 L105 140 Z" fill="var(--bg-sidebar)" />
      {/* Car Headlights */}
      <rect x="85" y="150" width="20" height="10" rx="3" fill="var(--bg-sidebar)" />
      <rect x="165" y="150" width="20" height="10" rx="3" fill="var(--bg-sidebar)" />
      {/* Grill */}
      <rect x="115" y="155" width="40" height="8" rx="2" fill="var(--bg-sidebar)" />
      {/* Mirrors */}
      <rect x="65" y="135" width="15" height="8" rx="4" fill="currentColor" />
      <rect x="190" y="135" width="15" height="8" rx="4" fill="currentColor" />
    </svg>
  </div>
);

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('parking_pwa_theme') || 'blanco-empresarial';
  });

  const handleSelectTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('parking_pwa_theme', themeId);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/dashboard': return 'Panel Principal';
      case '/dashboard/vehicles': return 'Vehículos Activos';
      case '/dashboard/map': return 'Mapa del Estacionamiento';
      case '/dashboard/logs': return 'Registro de Entradas y Salidas';
      case '/dashboard/reports': return 'Reportes y Analíticas';
      case '/dashboard/settings': return 'Configuración';
      default: return 'Panel Principal';
    }
  };

  return (
    <div className="dashboard-layout" data-theme={currentTheme}>
      <aside className="sidebar">
        <WatermarkLogo />
        <div className="sidebar-header">
          <div className="logo-box-small">
            <Car size={20} />
          </div>
          <h2>Admin Estacionamiento</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Panel Principal
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/vehicles'); }} className={`nav-item ${location.pathname === '/dashboard/vehicles' ? 'active' : ''}`}>
            <Car size={18} /> Vehículos
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/map'); }} className={`nav-item ${location.pathname === '/dashboard/map' ? 'active' : ''}`}>
            <Map size={18} /> Mapa del Estacionamiento
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/logs'); }} className={`nav-item ${location.pathname === '/dashboard/logs' ? 'active' : ''}`}>
            <List size={18} /> Entradas / Salidas
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/reports'); }} className={`nav-item ${location.pathname === '/dashboard/reports' ? 'active' : ''}`}>
            <BarChart size={18} /> Reportes
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/settings'); }} className={`nav-item ${location.pathname === '/dashboard/settings' ? 'active' : ''}`}>
            <Settings size={18} /> Configuración
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="profile-avatar">
            <User size={16} />
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.username || 'Marcos Vance'}</div>
            <div className="profile-role">{user?.role || 'Gerente de Operaciones'}</div>
          </div>
          <button onClick={handleLogout} className="btn-logout-icon" title="Cerrar Sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="header-titles">
            <h1>{getPageTitle()}</h1>
            <p className="text-muted">Terminal Principal • Configuración Lotes A-D</p>
          </div>
          <div className="header-actions">
            <ThemeSelector currentTheme={currentTheme} onSelectTheme={handleSelectTheme} />
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Buscar placa, espacio o propietario..." className="search-input" />
            </div>
            <div className="date-display">
              <strong>19 Ago 2026</strong><br/>14:32:05 PM
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};
