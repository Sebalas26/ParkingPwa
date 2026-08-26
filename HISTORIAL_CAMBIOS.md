# 📜 HISTORIAL DE CAMBIOS Y CONTEXTO TÉCNICO ACUMULADO (PARKING PWA)

> **PROPÓSITO DE ESTE DOCUMENTO**:
> Este archivo es la **Memoria Técnica Obligatoria** de la aplicación web progresiva (Parking PWA). Cada modificación, arquitectura, componente o corrección realizada debe quedar registrada aquí con el formato oficial para preservar el contexto continuo entre diferentes PCs y sesiones de IA.

---

## 📋 Registro Cronológico de Cambios

### [2026-08-26 15:55:00] - [FEAT] [PWA] [INSTANT-UPDATE] - Doble Motor de Detección Instantánea de Actualizaciones (5-10s Estilo Angular SwUpdate) y Generación de version.json
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"No me esta lanzando el pop de actualización para que yo como cliente le pueda dar click y actualizar que sucede se quedo pegado hay no llego nada pense que no habia actualizado pero ingrese en otro telefono y si de una quedo bien hiciste lo del movil bien y lo de usuario y contraseña tambien pero lo de que salga el mensaje de actualización requerida nada no sale por que ? si en angular si sucede yo dejo quieta la pagina y si hago cambios el automaticamente en cuestion de segundos como 5 segundos despues de desplegado sale el mensaje. analiza eso."*
- **🤖 Resumen Técnico para la IA**:
  1. **Generación Automática de `version.json` en Build (`vite.config.ts`)**:
     - Plugin `versionTrackerPlugin()` que genera `public/version.json` con `version`, `buildTime` (timestamp numérico exacto) y `timestampIso`.
     - Se definió la constante global `__APP_BUILD_TIME__` para que la app en memoria conozca su propio timestamp de compilación.
     - Se configuró Workbox con `NetworkOnly` para `/version.json` para asegurar que nunca quede atrapado en el caché local del Service Worker.
  2. **Doble Motor de Detección en `UpdatePromptModal.tsx`**:
     - **Motor SW Proactivo**: `registration.update()` cada 10 segundos.
     - **Motor Manifest HTTP (Estilo Angular SwUpdate)**: Consulta a `/version.json?_t={Date.now()}` sin caché (`cache: 'no-store'`) cada 10 segundos y en eventos de foco / visibilidad de pestaña.
     - Si `serverBuildTime > localBuildTime` o cambia la versión, activa `setShowModal(true)` en ~5 a 10 segundos tras el despliegue.
- **📦 Componentes Modificados**:
  - `vite.config.ts`
  - `src/vite-env.d.ts`
  - `src/shared/ui/UpdatePromptModal.tsx`
  - `public/version.json`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Precache con 22 recursos empaquetados.
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"quita el llenado automatico lo de usuario y contraseña eso deberia estar vacia, aparte modifica el login para que se vea bien en movil como deberia ser un login en movil por que cuando se instale la aplicacion en un dispositivo se vea perfectamente, aparte tambien agrega la version del sistema eso deberia estar en el .env donde yo le vaya cambiando la version para asi saber que si actualizo y en que version estamos trabajando inica con 0.0.1 Dev analiza esos cambios."*
- **🤖 Resumen Técnico para la IA**:
  1. **Credenciales Vacías por Defecto (`Login.tsx`)**:
     - Se eliminaron los valores hardcodeados de usuario (`admin`) y contraseña (`Admin2026*`). Los estados ahora inicializan en blanco `""` con placeholders limpios.
     - Se incorporó alternancia de visibilidad de contraseña (`Eye` / `EyeOff` de `lucide-react`) para mejorar la ergonomía táctil en smartphones.
  2. **Diseño Mobile-First para PWA Instalada (`Login.css`)**:
     - Contenedor con `min-height: 100dvh` y soporte de safe areas (`safe-area-inset-bottom`) para evitar saltos o elementos cortados por la barra del navegador o teclado virtual.
     - En pantallas móviles (`<= 960px` y `<= 480px`), el hero institucional se condensa en un encabezado de marca compacto ("PARK CONTROL • TU PUNTO DE LLEGADA") y el formulario se adapta como tarjeta centrada con inputs táctiles de 48px+.
  3. **Versión Dinámica del Sistema (`.env` -> `VITE_APP_VERSION`)**:
     - Variable de entorno `VITE_APP_VERSION="0.0.1 Dev"` configurada en `.env`.
     - Integrada dinámicamente con fallback (`import.meta.env.VITE_APP_VERSION || '0.0.1 Dev'`) en:
       - Pie de página del Login (`v0.0.1 Dev`).
       - Barra lateral del Dashboard (`sidebar-footer`).
       - Modal bloqueante de actualización (`UpdatePromptModal.tsx`).
- **📦 Componentes Modificados**:
  - `.env`
  - `src/features/auth/ui/Login.tsx`
  - `src/features/auth/ui/Login.css`
  - `src/shared/ui/DashboardLayout.tsx`
  - `src/shared/ui/UpdatePromptModal.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Generación correcta de bundle y Service Worker precache.
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
