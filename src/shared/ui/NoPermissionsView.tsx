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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f19',
        padding: '24px 16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          background: 'linear-gradient(145deg, #18181b 0%, #27272a 100%)',
          borderRadius: '20px',
          padding: '40px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(217, 119, 6, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          textAlign: 'center',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div
          style={{
            margin: '0 auto 22px auto',
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'rgba(217, 119, 6, 0.15)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
          }}
        >
          <ShieldAlert size={36} />
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
          Acceso Restringido
        </h2>

        <p style={{ fontSize: '0.94rem', color: '#94a3b8', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Hola, <strong style={{ color: '#f8fafc' }}>{user?.fullName || user?.username || 'Usuario'}</strong>. Tu usuario con el rol de{' '}
          <span style={{ color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            {user?.roleName || 'Usuario'}
          </span> no cuenta con permisos asignados para acceder {moduleName ? `al módulo de ${moduleName}` : 'a esta sección del sistema'}.
        </p>

        <div
          style={{
            background: 'rgba(217, 119, 6, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'left',
            fontSize: '0.84rem',
            color: '#fef3c7',
            marginBottom: '28px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            lineHeight: 1.5,
          }}
        >
          <KeyRound size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#f59e0b' }} />
          <span>
            <strong style={{ color: '#fbbf24' }}>¿Cómo solicitar acceso?</strong> Contacta al Administrador de tu empresa para que asigne los permisos operativos a tu rol.
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
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'transform 0.15s, background-color 0.15s',
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
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.15s',
            }}
          >
            <RefreshCw size={16} />
            Refrescar pantalla
          </button>
        </div>
      </div>
    </div>
  );
};
