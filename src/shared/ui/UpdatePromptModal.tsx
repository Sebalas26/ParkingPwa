import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import './UpdatePromptModal.css';

export const UpdatePromptModal: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // 1. Chequeo proactivo cada 60 segundos
        const intervalId = setInterval(() => {
          registration.update().catch((err) => {
            console.warn('[PWA Update Check] Error al consultar nueva versión:', err);
          });
        }, 60 * 1000);

        // 2. Chequeo proactivo cuando el usuario vuelve a enfocar la pestaña
        const handleFocus = () => {
          registration.update().catch((err) => {
            console.warn('[PWA Focus Check] Error al consultar nueva versión:', err);
          });
        };

        window.addEventListener('focus', handleFocus);

        return () => {
          clearInterval(intervalId);
          window.removeEventListener('focus', handleFocus);
        };
      }
    },
    onRegisterError(error) {
      console.error('[PWA Registration Error]:', error);
    },
  });

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      // 1. Purgar todo el almacenamiento en caché del navegador (CacheStorage)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.map((key) => {
            console.log('[PWA Cache Purge] Eliminando caché obsoleta:', key);
            return caches.delete(key);
          })
        );
      }

      // 2. Notificar al Service Worker para activar la nueva versión (skipWaiting)
      await updateServiceWorker(true);
    } catch (error) {
      console.error('[PWA Update Execution Error]:', error);
    } finally {
      // 3. Forzar recarga total limpia de la aplicación
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  // Si no hay nueva versión en cola, no renderizar nada
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
          Se ha publicado una actualización importante en el servidor. Para continuar operando de forma segura y aplicar las últimas mejoras, es necesario actualizar la aplicación.
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
            <span>Purga automática de archivos temporales obsoletos</span>
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
              <span>Actualizando y limpiando caché...</span>
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
          ParkControl PWA • Actualización de Sistema
        </div>
      </div>
    </div>
  );
};
