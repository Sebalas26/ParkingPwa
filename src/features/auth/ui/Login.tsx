import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../data/authService';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState(() => localStorage.getItem('remembered_username') || '');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(() => Boolean(localStorage.getItem('remembered_username')));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNoAccessModal, setShowNoAccessModal] = useState(false);
  const navigate = useNavigate();

  const appVersion = import.meta.env.VITE_APP_VERSION || '0.0.1 Dev';

  useEffect(() => {
    const reason = sessionStorage.getItem('session_terminated_reason');
    if (reason) {
      setWarningMessage(reason);
      sessionStorage.removeItem('session_terminated_reason');
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('expired') === 'concurrent') {
        setWarningMessage('Tu sesión fue cerrada porque se inició sesión con esta cuenta desde otro dispositivo o estación de trabajo.');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor ingrese su usuario y contraseña.');
      return;
    }

    setError('');
    setWarningMessage('');
    setIsLoading(true);

    try {
      const session = await authService.login({ username: username.trim(), password });

      if (rememberUser) {
        localStorage.setItem('remembered_username', username.trim());
      } else {
        localStorage.removeItem('remembered_username');
      }

      // Validar si el usuario tiene acceso a la PWA (módulos o permisos)
      if (!session.isSuperAdmin && (!session.permissions || session.permissions.length === 0) && (!session.modules || session.modules.length === 0)) {
        authService.logout();
        setShowNoAccessModal(true);
        setIsLoading(false);
        return;
      }

      if (session.isSuperAdmin) {
        navigate('/dashboard/companies');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Usuario o contraseña incorrectos. Por favor verifique sus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* Columna Izquierda: Presentación Institucional Desktop (Estilo WPF) */}
      <div className="login-hero-side">
        <div className="hero-center-content">
          <div className="hero-logo-wrapper">
            <img src="/logocompleto.jpg" alt="Parking Flow" className="hero-main-logo" />
          </div>

          <div className="hero-pos-pill">
            <span className="pos-pill-dot"></span> Terminal WEB • Control de Acceso y Recaudación
          </div>
        </div>

        <div className="hero-bottom-footer">
          <span>© Parking Flow • Tu punto de llegada</span>
        </div>
      </div>

      {/* Columna Derecha / Móvil: Formulario de Autenticación */}
      <div className="login-form-side">
        <div className="login-form-wrapper">
          <div className="form-header-box">
            <img src="/logo-new.png" alt="Parking Flow Icon" className="form-top-logo" />
            <h2 className="form-title">Iniciar Sesión</h2>
            <p className="form-subtitle">Ingrese sus credenciales de operador para iniciar estación</p>
          </div>

          {warningMessage && (
            <div className="login-warning-alert">
              <ShieldAlert size={20} style={{ flexShrink: 0 }} />
              <span>{warningMessage}</span>
            </div>
          )}

          {error && (
            <div className="login-error-alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-input-form" autoCapitalize="none" autoComplete="off">
            <div className="login-field-group">
              <label htmlFor="username">Usuario / ID</label>
              <div className="input-with-icon-wrapper">
                <input
                  id="username"
                  type="text"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="login-field-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-with-icon-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input with-suffix"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-suffix-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-options-row">
              <label className="remember-user-label">
                <input
                  type="checkbox"
                  checked={rememberUser}
                  onChange={(e) => setRememberUser(e.target.checked)}
                  className="remember-user-checkbox"
                />
                <span>Recordar usuario</span>
              </label>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="btn-spinner" />
                  <span>Ingresando...</span>
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <div className="login-form-footer">
          <div className="footer-security-text">
            <span>Protegido por Control de Acceso • PARKING FLOW</span>
          </div>
          <div className="footer-version-tag">
            Versión del Sistema: <strong>v{appVersion}</strong>
          </div>
        </div>
      </div>

      {/* Modal de Acceso Denegado a PWA */}
      {showNoAccessModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: '0' }}>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '50%' }}>
                <ShieldAlert size={48} color="#ef4444" />
              </div>
            </div>
            <div className="modal-body" style={{ paddingTop: '16px', paddingBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
                Acceso Denegado
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Su usuario no tiene permisos configurados para acceder a la plataforma Web.
                <br /><br />
                Por favor, contacte al administrador de su sede o utilice el terminal POS si corresponde.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: '0' }}>
              <button 
                type="button" 
                className="login-submit-btn" 
                onClick={() => setShowNoAccessModal(false)}
                style={{ width: '100%', maxWidth: '200px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
