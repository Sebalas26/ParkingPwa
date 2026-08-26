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
        // 1. Sondeo del Service Worker cada 10 segundos
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

  // 2. Motor 2: Sondeo directo a /version.json (Estilo Angular SwUpdate)
  const checkForVersionJson = useCallback(async () => {
    // Si acaba de actualizarse en los últimos 8 segundos, evitar re-chequeo transitorio
    const lastUpdateTimestamp = Number(sessionStorage.getItem('pwa_just_updated') || '0');
    if (Date.now() - lastUpdateTimestamp < 8000) {
      return;
    }

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
          // Detectar si el servidor tiene un build más reciente o versión diferente
          const isNewerBuild = data.buildTime > localBuildTimeRef.current;
          const isDifferentVersion = data.version && data.version !== currentAppVersion;

          if (isNewerBuild || isDifferentVersion) {
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
    // Chequeo inicial
    checkForVersionJson();

    // Chequeo periódico cada 10 segundos
    const versionInterval = setInterval(checkForVersionJson, 10 * 1000);

    // Chequeo al reenfocar
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

    // Marcar marca de tiempo para prevenir bucle en la recarga
    sessionStorage.setItem('pwa_just_updated', Date.now().toString());

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

      // 2. Desregistrar Service Workers activos viejos para liberar index.html
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // 3. Forzar activación con skipWaiting
      await updateServiceWorker(true);
    } catch (error) {
      console.error('[PWA Update Execution Error]:', error);
    } finally {
      // 4. Redirección forzada sin caché hacia la raíz limpia
      setTimeout(() => {
        window.location.replace(`/?_v=${Date.now()}`);
      }, 300);
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
