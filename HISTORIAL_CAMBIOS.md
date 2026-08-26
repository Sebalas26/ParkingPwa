# 📜 HISTORIAL DE CAMBIOS Y CONTEXTO TÉCNICO ACUMULADO (PARKING PWA)

> **PROPÓSITO DE ESTE DOCUMENTO**:
> Este archivo es la **Memoria Técnica Obligatoria** de la aplicación web progresiva (Parking PWA). Cada modificación, arquitectura, componente o corrección realizada debe quedar registrada aquí con el formato oficial para preservar el contexto continuo entre diferentes PCs y sesiones de IA.

---

## 📋 Registro Cronológico de Cambios

### [2026-08-26 15:39:00] - [FEAT] [PWA] [LIFECYCLE] - Modal Bloqueante de Actualización Obligatoria con Detección Activa y Purga Total de Caché
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Necesito hacer un cambio en la pwa de react, sucede que se realiza el despliegue completo bien pero en el navegador se queda pegado el cache entonces necesito que el sistema como es una pwa detecte cuando existe otro cambio en el servidor aparezca una modal que bloquee al usuario o mejor dicho obligue si o si a que actualice eso haga que si o si refrersque todo y elimine cache del navegador o si la tienen instalada si me explico ? dime que tan dificil sería hacer eso ? analiza eso ."*
- **🤖 Resumen Técnico para la IA**:
  1. **Control Reactivo del Ciclo de Vida PWA (`vite.config.ts`)**:
     - Se ajustó `registerType: 'prompt'` en el plugin `VitePWA` para delegar el control de activación al hook interactivo de React.
  2. **Detección Proactiva de Nuevos Despliegues (`UpdatePromptModal.tsx`)**:
     - Implementado con `useRegisterSW` de `virtual:pwa-register/react`.
     - **Sondeo Periódico**: Consulta automática de actualización al Service Worker cada 60 segundos (`registration.update()`).
     - **Sondeo por Foco / Reapertura**: Al recuperar el foco de la ventana o abrir la PWA instalada (`window.addEventListener('focus')`), verifica si existe una nueva versión en el servidor.
  3. **Comportamiento Bloqueante y Purga Total de Caché**:
     - Al detectar `needRefresh === true`, se despliega una modal en pantalla completa (`backdrop-filter: blur(14px)`, `z-index: 9999999`) que impide que el usuario continúe operando con assets obsoletos.
     - Al pulsar *"Actualizar Ahora"*:
       1. Elimina todo el almacenamiento en `window.caches` (`caches.delete(...)`).
       2. Envía orden de activación forzada al nuevo Service Worker (`updateServiceWorker(true)` / `skipWaiting()`).
       3. Ejecuta `window.location.reload()`.
  4. **Montaje Global (`App.tsx`)**:
     - `<UpdatePromptModal />` se encuentra montado en la raíz de la aplicación para proteger todas las vistas y rutas.
- **📦 Componentes Modificados**:
  - `vite.config.ts`
  - `src/vite-env.d.ts`
  - `src/shared/ui/UpdatePromptModal.tsx` *(NUEVO)*
  - `src/shared/ui/UpdatePromptModal.css` *(NUEVO)*
  - `src/App.tsx`
  - `src/main.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Service worker `dist/sw.js` y 21 precache entries generadas exitosamente.
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"no veo que este registrando en el log de cambios o el historial de cambios como regla que se habia creado en agent.md"*
- **🤖 Resumen Técnico para la IA**:
  1. **Estandarización Multi-PC**:
     - Se crea formalmente [`AGENTS.md`](file:///c:/Users/miguelagutierrezg/source/pwa/ParkingPwa/AGENTS.md) y [`HISTORIAL_CAMBIOS.md`](file:///c:/Users/miguelagutierrezg/source/pwa/ParkingPwa/HISTORIAL_CAMBIOS.md) en el repositorio raíz de la PWA (`ParkingPwa`), alineándose con los estándares de `ParkingWpf` y `ParkingApi`.
     - Todo cambio futuro en la PWA (React + Vite + TypeScript) deberá registrarse obligatoriamente en este documento y validar compilación exitosa con `npm run build`.
- **📦 Componentes Modificados**:
  - `AGENTS.md`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - Archivos creados y formateados según el estándar oficial.
