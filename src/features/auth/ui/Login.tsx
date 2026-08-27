import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../data/authService';
import { Car, Check, Receipt, BarChart2, Eye, EyeOff, Lock, User, ShieldCheck, ShieldAlert } from 'lucide-react';
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
      await authService.login({ username: username.trim(), password });

      if (rememberUser) {
        localStorage.setItem('remembered_username', username.trim());
      } else {
        localStorage.removeItem('remembered_username');
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Usuario o contraseña incorrectos. Por favor verifique sus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* Columna Izquierda: Presentación Institucional Desktop */}
      <div className="login-hero-side">
        <div className="brand-header">
          <div className="brand-logo-icon">
            <Car size={26} color="#ffffff" />
          </div>
          <div className="brand-title-group">
            <h2 className="brand-name">PARK CONTROL</h2>
            <span className="brand-tagline">TU PUNTO DE LLEGADA</span>
          </div>
        </div>

        <div className="hero-center-content">
          <h1 className="hero-main-title">
            Sistema Integral de Control de Acceso y Recaudación de Parqueadero
          </h1>
          <p className="hero-description">
            Agilice el registro de entradas, liquidación en caja, control de cupos en tiempo real, convenios comerciales y arqueos de turno.
          </p>

          <div className="hero-feature-pills">
            <div className="feature-pill">
              <div className="pill-icon-teal">
                <Check size={18} />
              </div>
              <span className="pill-text">Control de Ocupación y Bahías en Tiempo Real</span>
            </div>

            <div className="feature-pill">
              <div className="pill-icon-teal">
                <Receipt size={18} />
              </div>
              <span className="pill-text">Liquidación Automática y Convenios Comerciales</span>
            </div>

            <div className="feature-pill">
              <div className="pill-icon-amber">
                <BarChart2 size={18} />
              </div>
              <span className="pill-text">Control de Turnos Operativos y Arqueo de Caja</span>
            </div>
          </div>
        </div>

        <div className="hero-bottom-footer">
          <span>PARK CONTROL • Tu punto de llegada</span>
          <span className="hero-version-pill">v{appVersion}</span>
        </div>
      </div>

      {/* Columna Derecha / Móvil: Formulario de Autenticación */}
      <div className="login-form-side">
        {/* Cabecera Móvil Compacta */}
        <div className="mobile-brand-header">
          <div className="mobile-logo-icon">
            <Car size={24} color="#ffffff" />
          </div>
          <div className="mobile-brand-texts">
            <h2 className="mobile-brand-name">PARK CONTROL</h2>
            <span className="mobile-brand-tagline">TU PUNTO DE LLEGADA</span>
          </div>
        </div>

        <div className="login-form-wrapper">
          <div className="form-header-box">
            <h2 className="form-title">Iniciar Sesión</h2>
            <p className="form-subtitle">Ingrese sus credenciales de operador para acceder al sistema</p>
          </div>

          {warningMessage && (
            <div className="login-warning-alert" style={{
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              color: '#fbbf24',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
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
              <label htmlFor="username">Usuario o Identificación</label>
              <div className="input-with-icon-wrapper">
                <User size={18} className="input-prefix-icon" />
                <input
                  id="username"
                  type="text"
                  className="login-input with-prefix"
                  placeholder="Ingrese su usuario o correo"
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
                <Lock size={18} className="input-prefix-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input with-prefix with-suffix"
                  placeholder="Ingrese su contraseña"
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
            <ShieldCheck size={14} />
            <span>Control de Acceso Seguro • PARK CONTROL</span>
          </div>
          <div className="footer-version-tag">
            Versión del Sistema: <strong>v{appVersion}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
