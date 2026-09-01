import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, RefreshCw, Zap, ShieldCheck, Activity } from 'lucide-react';
import './UpdatePromptModal.css';

export const UpdatePromptModal: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);
  const [lastCheck, setLastCheck] = useState<string>('Iniciando...');
  const [checkCount, setCheckCount] = useState<number>(0);
  const [checkStatus, setCheckStatus] = useState<string>('Esperando');

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        setSwReg(registration);
        setLastCheck(new Date().toLocaleTimeString());

        // Sondeo proactivo cada 10 segundos para diagnóstico rápido
        const intervalId = setInterval(() => {
          setCheckStatus('Comprobando...');
          registration
            .update()
            .then(() => {
              setCheckStatus('OK');
              setLastCheck(new Date().toLocaleTimeString());
              setCheckCount((c) => c + 1);
            })
            .catch((err) => {
              setCheckStatus(`Error: ${err.message || 'Fallo'}`);
            });
        }, 10 * 1000);

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
      setCheckStatus('Error de Registro');
    },
  });

  const handleManualCheck = async () => {
    if (!swReg) {
      setCheckStatus('SW no disponible');
      return;
    }
    setCheckStatus('Forzando check...');
    try {
      await swReg.update();
      setLastCheck(new Date().toLocaleTimeString());
      setCheckCount((c) => c + 1);
      setCheckStatus('Check manual completado');
    } catch (e: any) {
      setCheckStatus(`Error: ${e.message || 'Fallo'}`);
    }
  };

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
    <>
      {/* Panel de Diagnóstico Visual en Vivo */}
      <div
        style={{
          position: 'fixed',
          bottom: '12px',
          left: '12px',
          zIndex: 99999999,
          background: 'rgba(11, 15, 25, 0.95)',
          border: `1px solid ${needRefresh ? '#f59e0b' : '#10b981'}`,
          borderRadius: '10px',
          padding: '10px 14px',
          color: needRefresh ? '#fbbf24' : '#10b981',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '11px',
          lineHeight: '1.45',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          maxWidth: '300px',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
          <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={13} /> PWA SW Diagnostics
          </span>
          <span style={{ fontSize: '9px', background: needRefresh ? '#ef4444' : '#047857', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
            {needRefresh ? 'UPDATE READY' : 'IDLE'}
          </span>
        </div>
        <div><strong>needRefresh:</strong> <span style={{ color: needRefresh ? '#ef4444' : '#34d399', fontWeight: 'bold' }}>{String(needRefresh)}</span></div>
        <div><strong>SW Status:</strong> {swReg ? (swReg.waiting ? '🟡 Waiting (Nuevo SW listo)' : swReg.active ? '🟢 Activo' : 'Instalando...') : '🔴 No Registrado'}</div>
        <div><strong>Último Check:</strong> {lastCheck} (#{checkCount})</div>
        <div><strong>Estado Check:</strong> {checkStatus}</div>
        <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>v{currentVersion} • Build: {buildTime}</div>
        <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={handleManualCheck}
            style={{
              background: '#10b981',
              color: '#0b0f19',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            🔄 Forzar Check
          </button>
          {needRefresh && (
            <button
              type="button"
              onClick={handleUpdate}
              style={{
                background: '#f59e0b',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🚀 Actualizar
            </button>
          )}
        </div>
      </div>

      {/* Modal Bloqueante Oficial (solo cuando needRefresh es true) */}
      {needRefresh && (
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
      )}
    </>
  );
};
