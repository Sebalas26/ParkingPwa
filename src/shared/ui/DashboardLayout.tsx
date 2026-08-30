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
    <img 
      src="/marcaAgua.png" 
      alt="Watermark" 
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain', 
        opacity: 0.15
      }} 
    />
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

  const displayCompanyName = user?.isSuperAdmin
    ? (inspectedCompany ? inspectedCompany.name : 'Plataforma SaaS Global')
    : (user?.companyName || activeBranch?.companyName || (branchesList.length > 0 ? branchesList[0]?.companyName : null) || 'Parking Flow');

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

  const canAccessSettings =
    authService.hasPermission('settings.parqueaderos.view') ||
    authService.hasPermission('settings.usuarios.view') ||
    authService.hasPermission('settings.roles.view') ||
    authService.hasPermission('settings.tarifas.view') ||
    authService.hasPermission('settings.medios_pago.view') ||
    authService.hasPermission('settings.convenios.view') ||
    authService.hasPermission('settings.resoluciones.view');

  return (
    <div className="dashboard-layout">
      {hasZeroBranches && (user?.isAdmin || authService.hasPermission('branches.create')) && !user?.isSuperAdmin && (
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
            <img src="/logo-new.png" alt="Parking Flow" className="sidebar-logo-img" />
          </div>
          <div className="app-title-group">
            <span className="app-name">Parking Flow</span>
            <span className="app-subtitle">{user?.isSuperAdmin ? (inspectedCompany ? `Admin: ${inspectedCompany.name}` : 'Plataforma SaaS Global') : displayCompanyName}</span>
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
              {(authService.hasPermission('checkout.view') || authService.hasPermission('shift.view')) && (
                <button
                  type="button"
                  className={`nav-item ${location.pathname.startsWith('/dashboard/caja') ? 'active' : ''}`}
                  onClick={() => handleNavigate('/dashboard/caja')}
                >
                  <Wallet size={20} />
                  <span>Caja</span>
                </button>
              )}
              {(authService.hasPermission('recent_entries.view') || authService.hasPermission('monitoring.view_occupancy') || authService.hasPermission('checkin.view')) && (
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
              {canAccessSettings && (
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
              <span className="header-brand-title">
                {displayCompanyName}
              </span>
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
