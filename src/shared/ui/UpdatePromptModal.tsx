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

  // Motor de verificación contra version.json
  const checkForVersionJson = useCallback(async () => {
    // Protección anti-bucle: Si acabamos de actualizar en los últimos 30 segundos, ignorar
    const lastUpdateTimestamp = Number(sessionStorage.getItem('pwa_just_updated') || '0');
    if (Date.now() - lastUpdateTimestamp < 30000) {
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

          // Un build es nuevo si el servidor tiene un timestamp posterior al empaquetado en memoria
          const isNewerBuild = data.buildTime > (localBuildTimeRef.current + 2000);
          const isNewerVersion = Boolean(
            data.version && 
            data.version !== currentAppVersion && 
            data.buildTime >= localBuildTimeRef.current
          );

          if (isNewerBuild || isNewerVersion) {
            console.log('[PWA Tracker] Nueva versión detectada en servidor:', data.version, 'Build:', data.buildTime);
            setHasNewVersion(true);
          }
        }
      }
    } catch {
      // Ignorar fallos transitorios de red
    }
  }, [currentAppVersion]);

  useEffect(() => {
    checkForVersionJson();

    const versionInterval = setInterval(checkForVersionJson, 30 * 1000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForVersionJson();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(versionInterval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [checkForVersionJson]);

  const isUpdateAvailable = needRefresh || hasNewVersion;

  /**
   * Ejecuta la activación limpia y segura del Service Worker + recarga universal móvil
   */
  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    // 1. Marcar timestamp de actualización para evitar re-detecciones inmediatas
    sessionStorage.setItem('pwa_just_updated', Date.now().toString());

    try {
      // 2. Esperar al evento 'controllerchange' para garantizar que el nuevo SW gobierna la página
      const waitForControllerChange = new Promise<void>((resolve) => {
        if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
          resolve();
          return;
        }

        const onControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          console.log('[PWA] Evento controllerchange detectado: Nuevo SW activo.');
          resolve();
        };

        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

        // Fallback de seguridad (timeout de 2.5 segundos)
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          resolve();
        }, 2500);
      });

      // 3. Activar el Service Worker en espera (SKIP_WAITING nativo de vite-plugin-pwa)
      if (typeof updateServiceWorker === 'function') {
        // Enviar skipWaiting sin forzar reload inmediato para controlar nosotros el controllerchange
        await updateServiceWorker(false);
      } else if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }

      // 4. Esperar a que el nuevo worker tome el control
      await waitForControllerChange;

      // 5. Purgar cachés viejas residuales (sin tocar la caché del nuevo worker)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => !key.includes('workbox-precache'))
            .map((key) => caches.delete(key))
        );
      }
    } catch (err) {
      console.warn('[PWA Update Error]:', err);
    }

    // 6. Hard-reload compatible con WebAPKs y iOS Standalone
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_pwa_refresh', Date.now().toString());
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
