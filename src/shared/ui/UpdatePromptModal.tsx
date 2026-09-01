import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import './UpdatePromptModal.css';

export const UpdatePromptModal: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Sondeo silencioso cada 1 minuto (60,000 ms) sin forzar recargas
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 1000);
      }
    },
  });

  // Condición estricta: si no hay nueva versión, no renderiza nada en el DOM
  if (!needRefresh) {
    return null;
  }

  // La actualización y recarga ocurren ÚNICAMENTE al hacer clic
  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      await updateServiceWorker(true);
    } catch (err) {
      console.warn('[PWA] Error al actualizar:', err);
      window.location.reload();
    }
  };

  const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0 Pro';
  const buildTime = typeof __APP_BUILD_TIME__ !== 'undefined' ? new Date(__APP_BUILD_TIME__).toLocaleString() : '';

  return (
    <div className="update-modal-overlay" role="dialog" aria-modal="true">
      <div className="update-modal-card">
        <div className="update-icon-wrapper">
          <div className="update-icon-pulse" />
          <Sparkles size={36} />
        </div>

        <h2 className="update-modal-title">¡Nueva Versión Disponible!</h2>

        <p className="update-modal-description">
          Se han implementado mejoras importantes en el sistema, correcciones de estabilidad y optimizaciones de rendimiento.
        </p>

        <div className="update-features-list">
          <div className="update-feature-item">
            <span className="update-feature-bullet" />
            <Zap size={15} style={{ color: '#10b981', flexShrink: 0 }} />
            <span>Nuevas funcionalidades y mejoras de sincronización</span>
          </div>
          <div className="update-feature-item">
            <span className="update-feature-bullet" />
            <ShieldCheck size={15} style={{ color: '#06b6d4', flexShrink: 0 }} />
            <span>Correcciones de seguridad y actualización de permisos</span>
          </div>
        </div>

        <button
          type="button"
          className="update-btn-action"
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <div className="update-spinner" />
              <span>Aplicando actualización...</span>
            </>
          ) : (
            <>
              <RefreshCw size={20} />
              <span>Actualizar Ahora</span>
            </>
          )}
        </button>

        <div className="update-version-tag" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div>Parking Flow • Versión {currentVersion}</div>
          <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Build: {buildTime}</div>
        </div>
      </div>
    </div>
  );
};
