import React, { useState, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import './UpdatePromptModal.css';

interface ServerVersionInfo {
  version: string;
  buildTime: number;
  timestampIso?: string;
}

export const UpdatePromptModal: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [serverVersionData, setServerVersionData] = useState<ServerVersionInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const currentAppVersion = import.meta.env.VITE_APP_VERSION || '0.0.1 Dev';
  const localBuildTime = typeof __APP_BUILD_TIME__ !== 'undefined' ? Number(__APP_BUILD_TIME__) : 0;

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegistered(registration) {
      if (registration) {
        swRegistrationRef.current = registration;
      }
    },
    onRegisterError(error) {
      console.warn('[PWA Registration Warning]:', error);
    },
  });

  // Función infalible de sondeo al manifiesto version.json
  const checkServerVersion = async () => {
    try {
      const response = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) return;

      const data: ServerVersionInfo = await response.json();
      if (!data || !data.version) return;

      // Comprobación de versión o timestamp más reciente
      const isDifferentVersion = data.version.trim() !== currentAppVersion.trim();
      const isNewerBuild = Boolean(data.buildTime && localBuildTime && data.buildTime > localBuildTime);

      if (isDifferentVersion || isNewerBuild) {
        setServerVersionData(data);
        setShowModal(true);

        // Notificar al Service Worker que descargue los nuevos chunks en segundo plano
        if (swRegistrationRef.current) {
          swRegistrationRef.current.update().catch(() => {});
        }
      }
    } catch (err) {
      console.debug('[PWA Version Check Skipped]:', err);
    }
  };

  // Motor 1: Sondeo en inicio, foco de ventana, cambio de pestaña e intervalo
  useEffect(() => {
    // Sondeo inicial tras 2 segundos de carga inicial
    const initialTimer = setTimeout(() => {
      checkServerVersion();
    }, 2000);

    // Sondeo periódico cada 45 segundos
    const intervalId = setInterval(() => {
      checkServerVersion();
      if (swRegistrationRef.current) {
        swRegistrationRef.current.update().catch(() => {});
      }
    }, 45 * 1000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion();
        if (swRegistrationRef.current) {
          swRegistrationRef.current.update().catch(() => {});
        }
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [currentAppVersion, localBuildTime]);

  // Motor 2: Detección por Service Worker nativo
  useEffect(() => {
    if (needRefresh) {
      setShowModal(true);
    }
  }, [needRefresh]);

  /**
   * Ejecución canónica e infalible de actualización:
   * 1. Activa SKIP_WAITING en el Service Worker
   * 2. Purga CacheStorage local de chunks viejos
   * 3. Ejecuta recarga forzada con timestamp para romper la caché HTTP del navegador/Webview
   */
  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    const triggerHardReload = () => {
      try {
        const url = new URL(window.location.href);
        const nextTimestamp = serverVersionData?.buildTime || Date.now();
        url.searchParams.set('_v', String(nextTimestamp));
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    };

    try {
      if (swRegistrationRef.current?.waiting) {
        swRegistrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      await updateServiceWorker(true);
    } catch (err) {
      console.debug('[SW Update catch]:', err);
    }

    if ('caches' in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      } catch (err) {
        console.debug('[Cache purge catch]:', err);
      }
    }

    setTimeout(triggerHardReload, 400);
  };

  if (!showModal && !needRefresh) {
    return null;
  }

  const nextVersion = serverVersionData?.version || currentAppVersion;

  return (
    <div className="update-modal-overlay">
      <div className="update-modal-card">
        <div className="update-icon-wrapper">
          <div className="update-icon-pulse" />
          <Sparkles size={36} />
        </div>

        <h2 className="update-modal-title">¡Nueva Versión Disponible!</h2>
        <p className="update-modal-description">
          Se han publicado mejoras de estabilidad, rendimiento y seguridad en el sistema. La actualización está lista para aplicarse instantáneamente.
        </p>

        {/* Insignia de Comparativa de Versiones */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '10px 16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Actual
            </span>
            <span style={{ fontSize: '0.92rem', color: '#cbd5e1', fontWeight: 700 }}>
              v{currentAppVersion}
            </span>
          </div>

          <div style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
            <ArrowRight size={18} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Nueva Versión
            </span>
            <span style={{ fontSize: '0.95rem', color: '#10b981', fontWeight: 800 }}>
              v{nextVersion}
            </span>
          </div>
        </div>

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
          <span>Parking Flow PWA • Sistema Actualizable</span>
        </div>
      </div>
    </div>
  );
};
