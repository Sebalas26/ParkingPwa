import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../../features/auth/data/authService';
import { Car, LayoutDashboard, BarChart, Settings, LogOut, User, Wallet, BellRing, RefreshCw, Building2, Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react';
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
    inspectedCompany,
    stopInspectingCompany,
  } = useBranchContext();

  const isSuperAdminGlobal = Boolean(user?.isSuperAdmin && !inspectedCompany);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Route guard: si SuperAdmin está en modo global y entra a una ruta que no sea /dashboard/companies, redirigir
  useEffect(() => {
    if (isSuperAdminGlobal && location.pathname !== '/dashboard/companies') {
      navigate('/dashboard/companies', { replace: true });
    }
  }, [isSuperAdminGlobal, location.pathname, navigate]);

  const mainContentRef = React.useRef<HTMLElement>(null);

  // Cerrar menú móvil y resetear scroll al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/', { replace: true });
  };

  const handleNavigate = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsDesktopSidebarCollapsed((prev) => !prev);
    }
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
      {hasZeroBranches && (user?.isAdmin || user?.userRoleId === 1) && !user?.isSuperAdmin && (
        <ZeroDataOnboardingWizard />
      )}

      <OfflineBanner />

      {/* Backdrop overlay para cerrar menú en mobile */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''} ${isDesktopSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo.png" alt="Parking Flow" className="sidebar-logo-img" />
          </div>
          <div className="app-title-group">
            <span className="app-name">Parking Flow</span>
            <span className="app-subtitle">{user?.isSuperAdmin ? (inspectedCompany ? `Admin: ${inspectedCompany.name}` : 'Plataforma SaaS Global') : 'Gestión Multi-Sede'}</span>
          </div>
          <button
            type="button"
            className="btn-collapse-sidebar-desktop"
            onClick={() => setIsDesktopSidebarCollapsed(true)}
            title="Ocultar menú lateral"
            aria-label="Ocultar menú lateral"
          >
            <PanelLeftClose size={18} />
          </button>
          <button
            type="button"
            className="btn-close-sidebar"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <WatermarkLogo />

        <nav className="nav-menu">
          {/* MODO SUPERADMIN GLOBAL: Solo ve Parqueaderos SaaS */}
          {isSuperAdminGlobal ? (
            <button
              type="button"
              className={`nav-item ${location.pathname.startsWith('/dashboard/companies') ? 'active' : ''}`}
              onClick={() => handleNavigate('/dashboard/companies')}
            >
              <Building2 size={20} />
              <span>Parqueaderos SaaS</span>
            </button>
          ) : (
            <>
              {/* Si es SuperAdmin en modo inspección, botón destacado para salir */}
              {user?.isSuperAdmin && inspectedCompany && (
                <button
                  type="button"
                  className="nav-item"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    marginBottom: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    fontWeight: 700
                  }}
                  onClick={() => {
                    stopInspectingCompany();
                    handleNavigate('/dashboard/companies');
                  }}
                  title="Volver al catálogo global de empresas SaaS"
                >
                  <LogOut size={18} />
                  <span>🔙 Volver a SaaS</span>
                </button>
              )}

              {authService.hasPermission('dashboard.view') && (
                <button
                  type="button"
                  className={`nav-item ${location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}`}
                  onClick={() => handleNavigate('/dashboard')}
                >
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </button>
              )}
              {authService.hasPermission('checkout.view') && (
                <button
                  type="button"
                  className={`nav-item ${location.pathname.startsWith('/dashboard/caja') ? 'active' : ''}`}
                  onClick={() => handleNavigate('/dashboard/caja')}
                >
                  <Wallet size={20} />
                  <span>Caja</span>
                </button>
              )}
              {authService.hasPermission('recent_entries.view') && (
                <button
                  type="button"
                  className={`nav-item ${location.pathname.startsWith('/dashboard/vehicles') ? 'active' : ''}`}
                  onClick={() => handleNavigate('/dashboard/vehicles')}
                >
                  <Car size={20} />
                  <span>Activos</span>
                </button>
              )}
              {authService.hasPermission('reports.view') && (
                <button
                  type="button"
                  className={`nav-item ${location.pathname.startsWith('/dashboard/reports') ? 'active' : ''}`}
                  onClick={() => handleNavigate('/dashboard/reports')}
                >
                  <BarChart size={20} />
                  <span>Reportes</span>
                </button>
              )}
              {authService.hasPermission('novedades.view') && (
                <button
                  type="button"
                  className={`nav-item ${location.pathname.startsWith('/dashboard/novedades') ? 'active' : ''}`}
                  onClick={() => handleNavigate('/dashboard/novedades')}
                >
                  <BellRing size={20} />
                  <span>Novedades</span>
                </button>
              )}
              {(authService.hasPermission('settings.parqueaderos.view') || authService.hasPermission('branches.view') || authService.hasPermission('users.view') || authService.hasPermission('rates.view') || authService.hasPermission('payment_methods.view') || authService.hasPermission('agreements.view')) && (
                <button
                  type="button"
                  className={`nav-item ${location.pathname.startsWith('/dashboard/settings') ? 'active' : ''}`}
                  onClick={() => handleNavigate('/dashboard/settings')}
                >
                  <Settings size={20} />
                  <span>Configuración</span>
                </button>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar">
            <User size={16} />
          </div>
          <div className="profile-info">
            <div className="profile-name">{user?.fullName || user?.username || 'Usuario'}</div>
            <div className="profile-role" style={{ color: user?.isSuperAdmin ? '#10b981' : undefined, fontWeight: user?.isSuperAdmin ? 700 : undefined }}>
              {user?.isSuperAdmin ? '👑 Super Administrador' : user?.roleName || 'Operador'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>v{import.meta.env.VITE_APP_VERSION || '0.0.1 Dev'}</div>
          </div>
          <button type="button" onClick={handleLogout} className="btn-logout-icon" title="Cerrar Sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="content-wrapper">
        {user?.isSuperAdmin && inspectedCompany && (
          <div className="impersonation-bar">
            <div className="impersonation-bar-left">
              <span className="impersonation-badge">👑 Modo Administración</span>
              <span className="impersonation-title">
                Gestionando Parqueadero: <strong>{inspectedCompany.name}</strong> {inspectedCompany.nit ? `(NIT: ${inspectedCompany.nit})` : ''}
              </span>
            </div>
            <button
              type="button"
              className="btn-exit-impersonation"
              onClick={() => {
                stopInspectingCompany();
                navigate('/dashboard/companies');
              }}
              title="Finalizar gestión y volver al catálogo global de empresas"
            >
              <LogOut size={15} />
              <span>Volver a Plataforma SaaS</span>
            </button>
          </div>
        )}

        <header className="top-bar">
          <div className="top-bar-left">
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={toggleSidebar}
              aria-label={isDesktopSidebarCollapsed ? "Mostrar Menú" : "Ocultar Menú"}
              title={isDesktopSidebarCollapsed ? "Mostrar Menú Lateral" : "Ocultar Menú Lateral"}
            >
              {isDesktopSidebarCollapsed ? <PanelLeft size={20} /> : <Menu size={20} />}
            </button>
            <div className="header-brand-info">
              <img src="/logo.png" alt="Parking Flow" className="header-brand-logo-img" />
              <span className="header-brand-title">Parking Flow</span>
            </div>
          </div>

          <div className="header-actions">
            {isSuperAdminGlobal ? (
              <div className="global-saas-badge">
                <Building2 size={16} />
                <span>👑 Plataforma SaaS Global</span>
              </div>
            ) : (
              !location.pathname.startsWith('/dashboard/settings') && branchesList.length > 0 && (
                <div className="branch-selector-pill">
                  <Building2 size={16} style={{ color: '#07665e', flexShrink: 0 }} />
                  {branchesList.length > 1 ? (
                    <select
                      value={activeBranchId ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveBranchId(val ? Number(val) : null);
                      }}
                      className="branch-select-native"
                    >
                      {branchesList.map((b) => (
                        <option key={b.id} value={b.id}>
                          📍 {b.code} — {b.name} ({b.totalCapacity} pl)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="branch-name-single">
                      📍 {activeBranch?.code} — {activeBranch?.name}
                    </span>
                  )}
                </div>
              )
            )}

            <PwaInstallPrompt />
            <button
              type="button"
              className="btn-action primary btn-refresh-compact"
              onClick={() => window.location.reload()}
              title="Actualizar Datos"
            >
              <RefreshCw size={15} />
              <span className="btn-refresh-text">Actualizar</span>
            </button>
            <div className="date-display">
              <strong>{formattedDate}</strong><br />{formattedTime}
            </div>
          </div>
        </header>

        <main ref={mainContentRef} className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
