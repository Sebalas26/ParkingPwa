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
            <img src="/logo-new.png" alt="Parking Flow" className="hero-main-logo" />
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
        {/* Barra superior estilo ventana WPF (Desktop) */}
        <div className="form-side-top-bar">
          <div className="api-online-pill">
            <span className="api-dot"></span> API Central Online
          </div>
          <div className="window-controls">
            <button type="button" className="win-btn win-min" tabIndex={-1} aria-label="Minimizar" onClick={() => window.blur()}>
              <svg viewBox="0 0 10 1" width="10" height="1"><rect width="10" height="1" fill="currentColor" /></svg>
            </button>
            <button type="button" className="win-btn win-close" tabIndex={-1} aria-label="Cerrar" onClick={() => window.close()}>
              <svg viewBox="0 0 10 10" width="10" height="10"><path d="M1 1l8 8m0-8L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        {/* Cabecera Móvil Compacta */}
        <div className="mobile-brand-header">
          <div className="mobile-logo-icon">
            <img src="/logo-new.png" alt="Parking Flow" className="mobile-logo-img" />
          </div>
        </div>

        <div className="login-form-wrapper">
          <div className="form-header-box">
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
    </div>
  );
};
