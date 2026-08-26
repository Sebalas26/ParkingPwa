import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../../features/auth/data/authService';
import { Car, LayoutDashboard, BarChart, Settings, LogOut, User, Wallet, BellRing, RefreshCw, Building2 } from 'lucide-react';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { OfflineBanner } from './OfflineBanner';
import { useBranchContext } from '../context/ParqueaderoContext';
import { ZeroDataOnboardingWizard } from '../../features/auth/ui/ZeroDataOnboardingWizard';
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
  const {
    branchesList,
    activeBranchId,
    activeBranch,
    setActiveBranchId,
    hasZeroBranches,
  } = useBranchContext();

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
      {hasZeroBranches && (user?.isAdmin || user?.userRoleId === 1) && (
        <ZeroDataOnboardingWizard />
      )}

      <OfflineBanner />

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <Car size={24} className="logo-icon" />
          </div>
          <div className="app-title-group">
            <span className="app-name">ParkFlow</span>
            <span className="app-subtitle">Gestión Multi-Sede</span>
          </div>
        </div>

        <WatermarkLogo />

        <nav className="nav-menu">
          {authService.hasPermission('dashboard.view') && (
            <button
              className={`nav-item ${location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
          )}
          {authService.hasPermission('checkout.view') && (
            <button
              className={`nav-item ${location.pathname.startsWith('/dashboard/caja') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard/caja')}
            >
              <Wallet size={20} />
              <span>Caja</span>
            </button>
          )}
          {authService.hasPermission('recent_entries.view') && (
            <button
              className={`nav-item ${location.pathname.startsWith('/dashboard/vehicles') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard/vehicles')}
            >
              <Car size={20} />
              <span>Activos</span>
            </button>
          )}
          {authService.hasPermission('reports.view') && (
            <button
              className={`nav-item ${location.pathname.startsWith('/dashboard/reports') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard/reports')}
            >
              <BarChart size={20} />
              <span>Reportes</span>
            </button>
          )}
          {authService.hasPermission('novedades.view') && (
            <button
              className={`nav-item ${location.pathname.startsWith('/dashboard/novedades') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard/novedades')}
            >
              <BellRing size={20} />
              <span>Novedades</span>
            </button>
          )}
          {(authService.hasPermission('settings.parqueaderos.view') || authService.hasPermission('branches.view') || authService.hasPermission('users.view') || authService.hasPermission('rates.view') || authService.hasPermission('payment_methods.view') || authService.hasPermission('agreements.view')) && (
            <button
              className={`nav-item ${location.pathname.startsWith('/dashboard/settings') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard/settings')}
            >
              <Settings size={20} />
              <span>Configuración</span>
            </button>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="profile-avatar">
            <User size={16} />
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.fullName || user?.username || 'Usuario'}</div>
            <div className="profile-role">{user?.roleName || 'Operador'}</div>
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>v{import.meta.env.VITE_APP_VERSION || '0.0.1 Dev'}</div>
          </div>
          <button onClick={handleLogout} className="btn-logout-icon" title="Cerrar Sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="header-actions">
            {!location.pathname.startsWith('/dashboard/settings') && branchesList.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card, rgba(255,255,255,0.9))', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border-color, #cbd5e1)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <Building2 size={16} style={{ color: '#07665e' }} />
                {branchesList.length > 1 ? (
                  <select
                    value={activeBranchId ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveBranchId(val ? Number(val) : null);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: 'var(--text-primary, #0f172a)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {branchesList.map((b) => (
                      <option key={b.id} value={b.id}>
                        📍 {b.code} — {b.name} ({b.totalCapacity} pl)
                      </option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary, #0f172a)' }}>
                    📍 {activeBranch?.code} — {activeBranch?.name}
                  </span>
                )}
              </div>
            )}

            <PwaInstallPrompt />
            <button className="btn-action primary" style={{ height: '36px', padding: '0 16px', background: '#2b2c2cff' }} onClick={() => window.location.reload()}>
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
