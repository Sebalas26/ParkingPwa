import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import './OfflineBanner.css';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className={`pwa-network-banner ${!isOnline ? 'offline' : 'online'}`}>
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          <span>Modo Offline: Sin conexión a internet. La PWA continuará funcionando con datos cacheados.</span>
        </>
      ) : (
        <>
          <Wifi size={16} />
          <span>Conexión restablecida con el servidor.</span>
        </>
      )}
    </div>
  );
};
