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
        // Sondeo periódico cada 5 minutos en producción
        const intervalId = setInterval(() => {
          registration.update().catch(() => {});
        }, 5 * 60 * 1000);

        // Sondeo proactivo al recuperar foco o visibilidad
        const checkUpdateOnActive = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };

        window.addEventListener('focus', checkUpdateOnActive);
        document.addEventListener('visibilitychange', checkUpdateOnActive);

        return () => {
          clearInterval(intervalId);
          window.removeEventListener('focus', checkUpdateOnActive);
          document.removeEventListener('visibilitychange', checkUpdateOnActive);
        };
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Error al registrar Service Worker:', error);
    },
  });

  // Si no hay actualización en espera, no renderizar nada
  if (!needRefresh) {
    return null;
  }

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    if ('serviceWorker' in navigator) {
      let hasReloaded = false;

      const triggerReload = () => {
        if (hasReloaded) return;
        hasReloaded = true;
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', triggerReload, { once: true });

      setTimeout(() => {
        triggerReload();
      }, 2500);

      try {
        await updateServiceWorker(true);
      } catch (err) {
        console.warn('[PWA] Error al invocar updateServiceWorker:', err);
        triggerReload();
      }
    } else {
      window.location.reload();
    }
  };

  const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0';
  const buildTime = new Date(__APP_BUILD_TIME__).toLocaleString();

  return (
    <div className="update-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="update-modal-title">
      <div className="update-modal-card">
        <div className="update-icon-wrapper">
          <div className="update-icon-pulse" />
          <Sparkles size={36} />
        </div>

        <h2 id="update-modal-title" className="update-modal-title">
          ¡Nueva Versión Disponible!
        </h2>

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
