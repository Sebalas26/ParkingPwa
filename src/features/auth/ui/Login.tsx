import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../data/authService';
import { Car, Lock, User as UserIcon } from 'lucide-react';
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
      setError('Invalid credentials. Use admin / admin123');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="bg-gradient"></div>
      
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="logo-container">
            <Car size={40} className="logo-icon" />
          </div>
          <h1>Parking Admin</h1>
          <p className="text-muted">Sign in to manage the parking lot</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <UserIcon className="input-icon" size={20} />
            <input
              type="text"
              className="input-field"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-muted">Secure Access via PWA</p>
        </div>
      </div>
    </div>
  );
};
