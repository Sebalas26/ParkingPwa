import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../data/authService';
import { ParkingCircle, Mail, Lock, UserCheck } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas. Usa admin / admin123');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-box">
            <ParkingCircle size={32} />
          </div>
          <h1>ParkControl</h1>
          <p className="text-muted">Sistema de Gestión y Operaciones de Estacionamiento</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-box">{error}</div>}
          
          <div className="input-group">
            <label>Correo Electrónico</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="soporte@parkcontrol.cl"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
              Recordarme
            </label>
            <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="divider">
          <span>O</span>
        </div>

        <button type="button" className="btn-secondary">
          <UserCheck size={18} />
          Acceder con Clave Única
        </button>

        <div className="login-footer">
          <p className="text-muted">ParkControl v2.4.0 — Soporte Técnico: +56 2 2345 6789</p>
        </div>
      </div>
    </div>
  );
};
