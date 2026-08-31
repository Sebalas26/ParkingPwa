import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import './UpdatePromptModal.css';

export const UpdatePromptModal: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const currentAppVersion = import.meta.env.VITE_APP_VERSION || '0.0.1 Dev';

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegistered(registration) {
      if (registration) {
        // 1. Sondeo periódico de nuevas versiones cada 60 segundos
        const swInterval = setInterval(() => {
          registration.update().catch((err) => {
            console.debug('[PWA Update Check Skipped]:', err);
          });
        }, 60 * 1000);

        // 2. Sondeo al recuperar el foco de la ventana o reactivar la PWA
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };

        window.addEventListener('focus', handleVisibilityChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          clearInterval(swInterval);
          window.removeEventListener('focus', handleVisibilityChange);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
    },
    onRegisterError(error) {
      console.warn('[PWA Registration Warning]:', error);
    },
  });

  /**
   * Flujo canónico de actualización:
   * 1. Escucha activa de 'controllerchange' ({ once: true }) para recargar en cuanto el nuevo SW tome el control.
   * 2. Envío de SKIP_WAITING mediante updateServiceWorker().
   * 3. Fallback con timeout de 2000ms para asegurar la recarga universal.
   */
  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    let isReloading = false;
    const triggerReload = () => {
      if (!isReloading) {
        isReloading = true;
        window.location.reload();
      }
    };

    // 1. Enlazar listener nativo de controllerchange
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', triggerReload, { once: true });
    }

    try {
      // 2. Notificar al nuevo Service Worker que active skipWaiting
      await updateServiceWorker(true);
    } catch (err) {
      console.error('[PWA Update Error]:', err);
    }

    // 3. Fallback de seguridad por si controllerchange ya disparó o tarda en responder
    setTimeout(triggerReload, 2000);
  };

  // El modal se muestra ÚNICAMENTE cuando Workbox confirma que los nuevos chunks
  // están 100% precacheados y el nuevo Service Worker está en estado 'waiting'
  if (!needRefresh) {
    return null;
  }

  return (
    <div className="update-modal-overlay">
      <div className="update-modal-card">
        <div className="update-icon-wrapper">
          <div className="update-icon-pulse" />
          <Sparkles size={36} />
        </div>

        <h2 className="update-modal-title">¡Nueva Versión Disponible!</h2>
        <p className="update-modal-description">
          Se han publicado mejoras de estabilidad, rendimiento y seguridad en el servidor. La actualización se encuentra lista para aplicarse instantáneamente.
        </p>

        <div className="update-features-list">
          <div className="update-feature-item">
            <span className="update-feature-bullet" />
            <span>Nuevas características y ajustes de seguridad</span>
          </div>
          <div className="update-feature-item">
            <span className="update-feature-bullet" />
            <span>Sincronización y optimización de rendimiento</span>
          </div>
          <div className="update-feature-item">
            <span className="update-feature-bullet" />
            <span>Carga instantánea optimizada desde caché local</span>
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
              <RefreshCw size={19} />
              <span>Actualizar Ahora</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="update-version-tag">
          <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          <span>Parking Flow PWA • v{currentAppVersion}</span>
        </div>
      </div>
    </div>
  );
};
