import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../data/authService';
import { Car, Check, Receipt, BarChart2 } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin2026*');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login({ username: username.trim(), password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Usuario o contraseña incorrectos. Por favor verifique sus datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* Left Column: Dark Brand & Feature Presentation */}
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
            Agilice el registro de entradas, cálculo en caja, seguimiento de cupos en tiempo real, convenios comerciales y arqueo de turnos.
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
          PARK CONTROL • Tu punto de llegada
        </div>
      </div>

      {/* Right Column: Clean White Login Form */}
      <div className="login-form-side">
        <div className="login-form-wrapper">
          <h2 className="form-title">Iniciar Sesión</h2>
          <p className="form-subtitle">Ingrese sus credenciales de operador para iniciar estación</p>

          {error && (
            <div className="login-error-alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-input-form">
            <div className="login-field-group">
              <label htmlFor="username">Usuario / ID de Operador</label>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="login-field-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? 'Accediendo...' : 'Acceder a Estación de Trabajo'}
            </button>
          </form>
        </div>

        <div className="login-form-footer">
          Protegido por Control de Acceso • PARK CONTROL
        </div>
      </div>
    </div>
  );
};
