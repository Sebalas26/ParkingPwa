import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import './UpdatePromptModal.css';

export const UpdatePromptModal: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const localBuildTimeRef = useRef<number>(
    typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : Date.now()
  );
  const currentAppVersion = import.meta.env.VITE_APP_VERSION || '0.0.1 Dev';

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // 1. Sondeo ultrarrápido del Service Worker cada 10 segundos
        const swInterval = setInterval(() => {
          registration.update().catch((err) => {
            console.warn('[PWA SW Update] Verificación de Service Worker:', err);
          });
        }, 10 * 1000);

        return () => clearInterval(swInterval);
      }
    },
    onRegisterError(error) {
      console.error('[PWA Registration Error]:', error);
    },
  });

  // 2. Motor 2: Sondeo directo a /version.json (Estilo Angular SwUpdate instantáneo)
  const checkForVersionJson = useCallback(async () => {
    try {
      const response = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.buildTime) {
          if (data.buildTime > localBuildTimeRef.current || (data.version && data.version !== currentAppVersion)) {
            console.log('[PWA Version Tracker] Nueva versión detectada en servidor:', data);
            setHasNewVersion(true);
          }
        }
      }
    } catch {
      // Sin conexión o fallo temporal
    }
  }, [currentAppVersion]);

  useEffect(() => {
    // Chequeo inicial inmediato tras montar
    checkForVersionJson();

    // Chequeo periódico cada 10 segundos
    const versionInterval = setInterval(checkForVersionJson, 10 * 1000);

    // Chequeo inmediato al reenfocar la ventana o volver a la app
    const handleFocus = () => {
      checkForVersionJson();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(versionInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [checkForVersionJson]);

  // Si cualquiera de los dos motores detecta nueva versión, activar modal
  const isUpdateAvailable = needRefresh || hasNewVersion;

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
      }, 250);
    }
  };

  if (!isUpdateAvailable) {
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
          Se ha publicado una actualización en el servidor. Para continuar operando de forma segura y aplicar las últimas mejoras, es necesario actualizar la aplicación.
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
          ParkControl PWA • v{currentAppVersion}
        </div>
      </div>
    </div>
  );
};
