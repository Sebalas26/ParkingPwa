import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.tsx';

// Registro automático e inmediato del Service Worker de la PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión de la PWA disponible');
  },
  onOfflineReady() {
    console.log('Aplicación PWA lista para operar sin conexión a internet');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
