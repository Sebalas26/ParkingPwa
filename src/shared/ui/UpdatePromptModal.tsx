import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import './UpdatePromptModal.css';

export const UpdatePromptModal: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;
    let pollInterval: any = null;

    const attachToInstallingWorker = (worker: ServiceWorker) => {
      worker.addEventListener('statechange', () => {
        // Cuando el nuevo SW termina de instalarse y ya hay una app corriendo
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorkerRef.current = worker;
          setNeedRefresh(true);
        }
      });
    };

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      registration = reg;

      // 1. Caso en el que el nuevo Service Worker ya estaba en espera (waiting)
      if (reg.waiting && navigator.serviceWorker.controller) {
        waitingWorkerRef.current = reg.waiting;
        setNeedRefresh(true);
      }

      // 2. Caso en el que el Service Worker se está instalando al iniciar
      if (reg.installing) {
        attachToInstallingWorker(reg.installing);
      }

      // 3. Caso en el que se detecta una nueva versión en tiempo de ejecución
      reg.addEventListener('updatefound', () => {
        if (reg.installing) {
          attachToInstallingWorker(reg.installing);
        }
      });

      // 4. Sondeo silencioso cada 30 segundos (sin ninguna recarga de página)
      pollInterval = setInterval(() => {
        reg.update().catch(() => {});
      }, 30 * 1000);
    }).catch((err) => {
      console.warn('[PWA] Error al registrar Service Worker:', err);
    });

    // 5. Comprobación reactiva al cambiar de pestaña o retomar el iPad
    const handleActiveState = () => {
      if (document.visibilityState === 'visible' && registration) {
        registration.update().catch(() => {});
      }
    };

    window.addEventListener('focus', handleActiveState);
    document.addEventListener('visibilitychange', handleActiveState);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener('focus', handleActiveState);
      document.removeEventListener('visibilitychange', handleActiveState);
    };
  }, []);

  // Si no hay actualización en espera, no renderiza nada en el DOM
  if (!needRefresh) {
    return null;
  }

  // La actualización y recarga ocurren ÚNICAMENTE al hacer clic en el botón
  const handleUpdate = () => {
    if (isUpdating) return;
    setIsUpdating(true);

    const waitingWorker = waitingWorkerRef.current;
    if (waitingWorker) {
      // Escuchar el cambio de controlador para recargar limpiamente a la nueva versión
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });

      // Indicar al Service Worker que se active
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });

      // Fallback de seguridad si controllerchange no dispara
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } else {
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
