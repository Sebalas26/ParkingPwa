import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, RefreshCw, KeyRound } from 'lucide-react';
import { authService } from '../../features/auth/data/authService';

interface NoPermissionsViewProps {
  moduleName?: string;
}

export const NoPermissionsView: React.FC<NoPermissionsViewProps> = ({ moduleName }) => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/', { replace: true });
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '36px 28px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            margin: '0 auto 20px auto',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(217, 119, 6, 0.12)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(217, 119, 6, 0.3)',
          }}
        >
          <ShieldAlert size={34} />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
          Acceso Restringido
        </h2>

        <p style={{ fontSize: '0.92rem', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Hola, <strong style={{ color: '#0f172a' }}>{user?.fullName || user?.username || 'Usuario'}</strong>. Tu rol de{' '}
          <span style={{ color: '#07665e', fontWeight: 700 }}>{user?.roleName || 'Usuario'}</span> no cuenta con los permisos necesarios para acceder {moduleName ? `al módulo de ${moduleName}` : 'a esta sección'}.
        </p>

        <div
          style={{
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'left',
            fontSize: '0.84rem',
            color: '#873800',
            marginBottom: '24px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <KeyRound size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
          <span>
            <strong>¿Cómo solicitar acceso?</strong> Contacta al Administrador de tu empresa para que asigne los permisos operativos correspondientes a tu rol desde la pestaña de <em>Configuración → Roles y Permisos</em>.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-action primary"
            onClick={handleLogout}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>

          <button
            type="button"
            className="btn-action primary"
            onClick={handleReload}
            style={{
              background: '#07665e',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={16} />
            Actualizar Permisos
          </button>
        </div>
      </div>
    </div>
  );
};
