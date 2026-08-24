import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../../features/auth/data/authService';
import { Car, LayoutDashboard, BarChart, Settings, LogOut, User, Wallet, BellRing, RefreshCw, Building } from 'lucide-react';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { OfflineBanner } from './OfflineBanner';
import { useParqueaderoContext } from '../context/ParqueaderoContext';
import './DashboardLayout.css';

const WatermarkLogo = () => (
  <div className="sidebar-watermark">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 10 C50 10 20 40 20 80 C20 130 100 190 100 190 C100 190 180 130 180 80 C180 40 150 10 100 10 Z" fill="currentColor" />
      <path d="M80 45 L115 45 C135 45 140 60 140 70 C140 80 135 95 115 95 L95 95 L95 115 L80 115 Z M95 60 L95 80 L115 80 C122 80 122 60 115 60 Z" fill="var(--bg-sidebar)" />
      <path d="M110 115 C125 105 165 105 180 115 L205 145 L205 175 L190 175 L190 190 L160 190 L160 175 L100 175 L100 190 L70 190 L70 175 L55 175 L55 145 Z" fill="var(--bg-sidebar)" />
      <path d="M115 120 C125 110 165 110 175 120 L195 145 L195 170 L185 170 L185 180 L165 180 L165 170 L105 170 L105 180 L85 180 L85 170 L75 170 L75 145 Z" fill="currentColor" />
      <path d="M120 125 L170 125 L185 140 L105 140 Z" fill="var(--bg-sidebar)" />
      <rect x="85" y="150" width="20" height="10" rx="3" fill="var(--bg-sidebar)" />
      <rect x="165" y="150" width="20" height="10" rx="3" fill="var(--bg-sidebar)" />
      <rect x="115" y="155" width="40" height="8" rx="2" fill="var(--bg-sidebar)" />
      <rect x="65" y="135" width="15" height="8" rx="4" fill="currentColor" />
      <rect x="190" y="135" width="15" height="8" rx="4" fill="currentColor" />
    </svg>
  </div>
);

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const { parqueaderosList, selectedParqueaderoId, setSelectedParqueaderoId } = useParqueaderoContext();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const formattedDate = currentTime.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="dashboard-layout">
      <OfflineBanner />

      <aside className="sidebar">
        <WatermarkLogo />
        <div className="sidebar-header">
          <div className="logo-box-small">
            <Car size={20} />
          </div>
          <h2>Admin Estacionamiento</h2>
        </div>
        <nav className="sidebar-nav">
          {(authService.hasPermission('dashboard.view') || authService.hasModule('dashboard')) && (
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> Dashboard
            </a>
          )}
          {(authService.hasPermission('checkout.view') || authService.hasModule('checkout')) && (
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/caja'); }} className={`nav-item ${location.pathname === '/dashboard/caja' ? 'active' : ''}`}>
              <Wallet size={18} /> Caja
            </a>
          )}
          {(authService.hasPermission('checkin.view') || authService.hasModule('checkin')) && (
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/vehicles'); }} className={`nav-item ${location.pathname === '/dashboard/vehicles' ? 'active' : ''}`}>
              <Car size={18} /> Activos
            </a>
          )}
          {(authService.hasPermission('reports.view') || authService.hasModule('reports')) && (
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/reports'); }} className={`nav-item ${location.pathname === '/dashboard/reports' ? 'active' : ''}`}>
              <BarChart size={18} /> Reportes
            </a>
          )}
          {(authService.hasPermission('novedades.view') || authService.hasModule('novedades')) && (
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/novedades'); }} className={`nav-item ${location.pathname === '/dashboard/novedades' ? 'active' : ''}`}>
              <BellRing size={18} /> Novedades
            </a>
          )}
          {(authService.hasPermission('settings.parqueaderos.view') || authService.hasPermission('settings.tarifas.view') || authService.hasPermission('settings.usuarios.view') || authService.hasModule('settings')) && (
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard/settings'); }} className={`nav-item ${location.pathname === '/dashboard/settings' ? 'active' : ''}`}>
              <Settings size={18} /> Configuración
            </a>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="profile-avatar">
            <User size={16} />
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.fullName || user?.username || 'Usuario'}</div>
            <div className="profile-role">{user?.roleName || 'Operador'}</div>
          </div>
          <button onClick={handleLogout} className="btn-logout-icon" title="Cerrar Sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="header-actions">
            {/* Selector Global de Parqueadero (Oculto en módulo de Configuración) */}
            {!location.pathname.includes('/settings') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card, rgba(255,255,255,0.9))', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Building size={16} style={{ color: '#07665e' }} />
                <select
                  value={selectedParqueaderoId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedParqueaderoId(val === 'all' ? 'all' : Number(val));
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    color: 'var(--text-primary, #1e293b)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">🌐 Todos los Parqueaderos</option>
                  {parqueaderosList.map((p) => (
                    <option key={p.id} value={p.id}>
                      🏢 {p.name} {p.isMainImage ? '⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <PwaInstallPrompt />
            <button className="btn-action primary" style={{ height: '36px', padding: '0 16px', background: '#07665e' }} onClick={() => window.location.reload()}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} /> Actualizar Datos
            </button>
            <div className="date-display">
              <strong>{formattedDate}</strong><br />{formattedTime}
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};
