import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../data/authService';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState(() => localStorage.getItem('remembered_username') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

      localStorage.setItem('remembered_username', username.trim());

      navigate('/dashboard');
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
            <img src="/logo.png" alt="Parking Flow" className="hero-main-logo" />
            <div className="hero-brand-text-container">
              <h1 className="hero-brand-title">PARKING FLOW</h1>
              <div className="hero-brand-subtitle">
                <span className="subtitle-line"></span>
                <span>TU PUNTO DE LLEGADA</span>
                <span className="subtitle-line"></span>
              </div>
            </div>
          </div>
          
          <div className="hero-pos-pill">
            <span className="pos-pill-dot"></span> Terminal POS • Control de Acceso y Recaudación
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
              <svg viewBox="0 0 10 1" width="10" height="1"><rect width="10" height="1" fill="currentColor"/></svg>
            </button>
            <button type="button" className="win-btn win-close" tabIndex={-1} aria-label="Cerrar" onClick={() => window.close()}>
              <svg viewBox="0 0 10 10" width="10" height="10"><path d="M1 1l8 8m0-8L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Cabecera Móvil Compacta (Oculta en Desktop) */}
        <div className="mobile-brand-header">
          <div className="mobile-logo-icon">
            <img src="/logo.png" alt="Parking Flow" className="mobile-logo-img" />
          </div>
          <div className="mobile-brand-texts">
            <h2 className="mobile-brand-name">PARKING FLOW</h2>
            <span className="mobile-brand-tagline">GESTIÓN INTELIGENTE DE PARQUEADEROS</span>
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
              <label htmlFor="username">Usuario / ID de Operador</label>
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

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="btn-spinner" />
                  <span>Ingresando...</span>
                </>
              ) : (
                'Acceder a Estación de Trabajo'
              )}
            </button>
          </form>
        </div>

        <div className="login-form-footer">
          <div className="footer-security-text">
            <span>Protegido por Control de Acceso • PARKING FLOW</span>
          </div>
        </div>
      </div>
    </div>
  );
};
