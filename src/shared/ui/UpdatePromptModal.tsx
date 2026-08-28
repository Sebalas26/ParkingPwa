import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import './UpdatePromptModal.css';

export const UpdatePromptModal: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [serverVersion, setServerVersion] = useState<string>('');
  const localBuildTimeRef = useRef<number>(
    typeof __APP_BUILD_TIME__ === 'number' ? __APP_BUILD_TIME__ : Date.now()
  );
  const currentAppVersion = import.meta.env.VITE_APP_VERSION || '0.0.1 Dev';

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // Sondeo proactivo del Service Worker cada 25 segundos
        const swInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 25 * 1000);

        return () => clearInterval(swInterval);
      }
    },
    onRegisterError(error) {
      console.warn('[PWA Registration Warning]:', error);
    },
  });

  // Motor 2: Sondeo al manifiesto de versión (cada 12 segundos)
  const checkForVersionJson = useCallback(async () => {
    // Si acaba de actualizarse en los últimos 15 segundos, evitar re-chequeo transitorio
    const lastUpdateTimestamp = Number(sessionStorage.getItem('pwa_just_updated') || '0');
    if (Date.now() - lastUpdateTimestamp < 15000) {
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
        if (data && typeof data.buildTime === 'number') {
          if (data.version) {
            setServerVersion(data.version);
          }

          // Un build es nuevo ÚNICAMENTE si el servidor tiene un timestamp posterior al de la app en memoria
          const isNewerBuild = data.buildTime > (localBuildTimeRef.current + 2000);
          const isNewerVersion = Boolean(
            data.version && 
            data.version !== currentAppVersion && 
            data.buildTime >= localBuildTimeRef.current
          );

          if (isNewerBuild || isNewerVersion) {
            console.log('[PWA Version Tracker] Nueva versión detectada en servidor:', data.version, 'Build:', data.buildTime);
            setHasNewVersion(true);
          }
        }
      }
    } catch {
      // Ignorar fallos de red temporales
    }
  }, [currentAppVersion]);

  useEffect(() => {
    checkForVersionJson();

    const versionInterval = setInterval(checkForVersionJson, 12 * 1000);

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

  const isUpdateAvailable = needRefresh || hasNewVersion;

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    // Evita bucle en la recarga inmediata
    sessionStorage.setItem('pwa_just_updated', Date.now().toString());

    try {
      // 1. Purgar todo CacheStorage de forma limpia
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // 2. Forzar actualización del Service Worker
      if (typeof updateServiceWorker === 'function') {
        await updateServiceWorker(true);
      }
    } catch (err) {
      console.warn('[PWA Purge Error]:', err);
    }

    // 3. Mantener la pantalla / ruta activa del usuario añadiendo cache-buster
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_v', Date.now().toString());
    window.location.replace(currentUrl.toString());
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
          {serverVersion && serverVersion !== currentAppVersion ? (
            <>
              <span>v{currentAppVersion}</span>
              <span style={{ margin: '0 6px', color: '#10b981' }}>➔</span>
              <strong style={{ color: '#10b981', fontWeight: 700 }}>v{serverVersion}</strong>
            </>
          ) : (
            <span>Parking Flow PWA • v{serverVersion || currentAppVersion}</span>
          )}
        </div>
      </div>
    </div>
  );
};
