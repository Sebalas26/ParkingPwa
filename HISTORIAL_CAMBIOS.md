# 📜 HISTORIAL DE CAMBIOS Y CONTEXTO TÉCNICO ACUMULADO (PARKING PWA)

> **PROPÓSITO DE ESTE DOCUMENTO**:
> Este archivo es la **Memoria Técnica Obligatoria** de la aplicación web progresiva (Parking PWA). Cada modificación, arquitectura, componente o corrección realizada debe quedar registrada aquí con el formato oficial para preservar el contexto continuo entre diferentes PCs y sesiones de IA.

---

## 📋 Registro Cronológico de Cambios

### [2026-08-27 13:10:00] - [FEAT] [SAAS] [MULTI-TENANT] - Módulo Central de Gestión de Empresas SaaS y Soporte Multi-Tenant
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Tengo una consulta, se penso que el sistema es para venderlo pero es un saas completo entonces necesitamos un super admin que nosotros creemos entremos creemos un administrador y le demos ese usuario al man y que le ingrese cree su parqueadero y sus sedes y si le vendemos el producto a otras personas e igual se les cree su usuario administrador y que ingrese registre su parqueadero y sus sedes si me explico como se quiere manejar antes eso si lo entiendes encesito que revises toda la BD si la logica que tenemos si nos da para eso o que tanto se deberia cambiar ? necesito que revises eso y has un analisis completo y el plan completo que se deberia tomar."*
- **🤖 Resumen Técnico para la IA**:
  1. **Contratos y Servicio de Empresas (`CompanyContracts.ts`, `companyService.ts`)**:
     - Definición de tipos `CompanyDto`, `CreateCompanyDto`, `UpdateCompanyDto`.
     - Creación de servicio con operaciones `getAll`, `getActive`, `getById`, `create`, `update`, `toggleStatus`.
  2. **Interfaz de Gestión de Empresas SaaS (`CompaniesPage.tsx`, `CompaniesPage.css`)**:
     - Panel SaaS Dark Glassmorphism con 4 KPI Cards: Empresas Registradas, Suscripciones Activas, Sedes en Red y Usuarios Globales.
     - Tabla interactiva con badges de plan (`Basic`, `Pro`, `Enterprise`), indicadores de estado activo/suspendido, y acciones de edición y alternancia de estado.
     - Modal de Aprovisionamiento: Permite al SuperAdmin registrar una nueva empresa junto con las credenciales del Administrador inicial.
     - Modal de Edición: Ajuste de límites de sedes, plan contratado y datos de contacto.
  3. **Control de Sesión y Navegación (`authService.ts`, `AuthContracts.ts`, `DashboardLayout.tsx`, `App.tsx`)**:
     - Soporte para `companyId`, `companyName` e `isSuperAdmin` en el estado de autenticación.
     - Botón de navegación dinámico "🏢 Empresas SaaS" en el sidebar visible para SuperAdmins o usuarios con permiso `companies.view`.
     - Registro de ruta protegida `/dashboard/companies`.
  4. **Método `patch` en `apiClient.ts`**:
     - Agregado soporte para peticiones HTTP PATCH.
- **📦 Componentes Modificados**:
  - `src/features/companies/model/CompanyContracts.ts` (Nuevo)
  - `src/features/companies/data/companyService.ts` (Nuevo)
  - `src/features/companies/ui/CompaniesPage.tsx` (Nuevo)
  - `src/features/companies/ui/CompaniesPage.css` (Nuevo)
  - `src/features/auth/model/AuthContracts.ts`
  - `src/features/auth/data/authService.ts`
  - `src/shared/api/apiClient.ts`
  - `src/shared/ui/DashboardLayout.tsx`
  - `src/App.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).


### [2026-08-27 11:55:00] - [FEAT] [UI/UX] [PWA] - Rediseño de Vista Login al estilo WPF
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"perfecto, asi vamos bien , quiero unos ajustes pequeño como en login, dejamelo asi com mi wpf  , ahi te comparto como deberiade quedar y el logo (2da imagen)"*
- **🤖 Resumen Técnico para la IA**:
  1. **Reestructuración Desktop (`Login.tsx`)**: Se limpió la columna izquierda eliminando textos comerciales excesivos para imitar el diseño limpio del WPF. Ahora consta de un fondo oscuro puro, logo centrado ampliado, y títulos con un divisor (`.subtitle-line`). En la parte inferior, se añadió el *pill* estilo POS.
  2. **Columna Derecha y Botones de Ventana**: Se emuló el control de ventanas (Minimizar, Cerrar) en la barra superior derecha, junto al indicador verde "API Central Online".
  3. **Estilos y Componentes (`Login.css`)**: Se ajustaron los colores del fondo derecho a `#f8fafc`, las entradas de texto sin iconos internos pero con bordes definidos, alineadas con la imagen de referencia. Se reordenó Flexbox y `gap` para coincidir perfectamente con la estructura y los paddings originales.
  4. **Responsividad Móvil**: Se mantuvo intacto el diseño para móvil bajo el Media Query `(max-width: 960px)` para asegurar que las funcionalidades base de la PWA no se afecten.
- **📦 Componentes Modificados**:
  - `src/features/auth/ui/Login.tsx`
  - `src/features/auth/ui/Login.css`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-27 11:03:00] - [BUGFIX] [UI/UX] [DESKTOP] [PWA] - Corrección de Sidebar Colapsable y Filtros Cortados en Dashboard Web
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Noto que ahora en la web se daño en la dashboard lo que te encerre en rojo  , tambien cuando en el menu desplegable de lz izquierda, cuando ledoy para ocultarlo, se pierde dejandolo como enla image "*
- **🤖 Resumen Técnico para la IA**:
  1. **Análisis de Sidebar Colapsable**: La clase `.sidebar.collapsed` en Desktop tenía `width: 0 !important;` y además `margin-left: -250px !important;`. En un contenedor Flexbox (`.dashboard-layout`), asignar margen negativo a un elemento de ancho cero provocaba que éste tirara del contenedor adyacente (`.content-wrapper`) hacia la izquierda por -250px, desplazándolo completamente fuera de la pantalla (lo que ocultaba el botón de menú hamburguesa y descuadraba la vista).
  2. **Solución Sidebar**: Se eliminó `margin-left: -250px !important;` de `.sidebar.collapsed`. Al conservar `width: 0`, el menú simplemente se retrae de forma nativa en Flexbox sin romper la geometría del contenedor principal.
  3. **Análisis de Filtros Cortados (Slicers Bar)**: El contenedor `.dashboard-container` en `Dashboard.css` contaba con `min-height: 100%`, pero al ser un elemento Flex (`flex-shrink: 1` por defecto) anidado en una columna de altura determinada (`.main-content`), el motor de renderizado forzaba su reducción (shrink) para ajustarse, lo que ocasionaba que sus hijos (como `.slicers-bar-container` que posee `overflow: hidden`) colapsaran su altura, cortando los botones de filtros horizontalmente por la mitad.
  4. **Solución Slicers**: Se añadió `flex-shrink: 0;` explícitamente tanto a `.dashboard-container` como a `.slicers-bar-container` para prohibir la deformación vertical, garantizando que respeten siempre la altura de su contenido (min-content) obligando al contenedor padre a habilitar el scroll si es necesario.
- **📦 Componentes Modificados**:
  - `src/shared/ui/DashboardLayout.css`
  - `src/features/dashboard/ui/Dashboard.css`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-27 10:45:00] - [BUGFIX] [UI/UX] [MOBILE] [PWA] - Corrección de Z-Index en Modal de Usuarios Oculto por Bottom Navigation
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Quisiera que me mejoraras esto porque al abrir mi pwa en mobile se desajusta cuando quiero crear o editar un usuario , pues no se ven los botones, recuerda que esto no debe afectar la web"*
- **🤖 Resumen Técnico para la IA**:
  1. **Análisis del Problema**: En la vista móvil, el contenedor `.content-wrapper` tenía asignado `z-index: 1; position: relative;`. Esto generaba un *Stacking Context* que atrapaba al modal (`.modal-overlay` con `z-index: 9000`) dentro de él. Como el *bottom navigation bar* (`.bottom-nav-bar`) tenía `z-index: 40` y estaba fuera del `.content-wrapper`, este se renderizaba obligatoriamente por encima de cualquier elemento dentro del `.content-wrapper`, ocultando así la parte inferior del modal (los botones de Guardar y Cancelar).
  2. **Solución Implementada (`DashboardLayout.css`)**: 
     - Se eliminó la regla `z-index: 1;` del `.content-wrapper` exclusivamente en el `@media (max-width: 768px)`.
     - Esto destruye el *Stacking Context* innecesario, permitiendo que el modal (`z-index: 9000`) ahora flote correctamente sobre la barra inferior (`z-index: 40`) en dispositivos móviles.
     - **Nota**: El cambio se realizó estrictamente en las directivas de responsividad móvil, asegurando al 100% que la versión web (Desktop) se mantenga completamente inalterada tal como fue requerido.
- **📦 Componentes Modificados**:
  - `src/shared/ui/DashboardLayout.css`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-27 10:20:00] - [FEATURE] [UI/UX] [NOVEDADES] [SIDEBAR] - Puesta en Marcha de Módulo de Novedades (Bloqueo Centralizado de Placas) y Sidebar Colapsable en Desktop Web
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Ahora ayudame en poner en ejecucion el modulo de novedades, ayudame a conectarla creacion de la novedad, la cual debe de ir por api hacia a BD, para que luego el wpf pueda identificar que existe una placa con novedad y no permita registarle entrada (no toques el wpf), adicional quiero que el menu desplegable de a izquierda en la web permita ocultarse asi como se hace en la version mobile"*
- **🤖 Resumen Técnico para la IA**:
  1. **Menú Lateral Izquierdo Colapsable en Web Desktop (`DashboardLayout.tsx` & `DashboardLayout.css`)**:
     - Se implementó el estado `isDesktopSidebarCollapsed` junto con el botón toggle unificado en `.top-bar-left` (`menu-toggle-btn`).
     - Al hacer clic en el botón de hamburguesa / panel en pantallas grandes (>768px), el sidebar se contrae suavemente hacia la izquierda (`margin-left: -250px; opacity: 0; width: 0`) permitiendo que el área de contenido (`.content-wrapper`) se expanda al 100% de la pantalla para máxima visibilidad de tablas, dashboards y reportes.
     - Se añadió el botón de colapso rápido `.btn-collapse-sidebar-desktop` en el encabezado del menú lateral.
     - En dispositivos móviles (<768px), el botón conmuta limpiamente el menú lateral desplegable tipo drawer sin interferir con la experiencia táctil.
  2. **Módulo de Novedades e Incidencias Conectado a API y BD (`Novedades.tsx` & `novedadesService.ts`)**:
     - Conectividad completa con los endpoints del backend (`/api/VehicleIncidents`): listar, crear, editar, resolver (desbloquear) y eliminar novedades.
     - Formulario modal optimizado con switch destacado de bloqueo de ingreso (`isBlocked`), selector dinámico de sedes, tipos de incidencia predefinidos y personalizados, y estados asíncronos con spinner (`isSaving`, `isResolving`, `isDeleting`).
     - Diálogo de confirmación para eliminar incidencias (`incidentToDelete`).
     - Sistema de modales responsivo con pie sticky (`.modal-footer`) y soporte de safe areas.
- **📦 Componentes Modificados**:
  - `src/shared/ui/DashboardLayout.tsx`
  - `src/shared/ui/DashboardLayout.css`
  - `src/features/novedades/ui/Novedades.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Precache con 24 recursos empaquetados.

### [2026-08-27 09:48:00] - [FEATURE] [UI/UX] [MOBILE] [PWA] - Corrección Integral de Layout Mobile y Botones Sticky en Modales (Usuarios, Dashboard y Navegación)
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Quisiera que me mejoraras esto porque al abrir mi pwa en mobile se desajusta , adicional veo que no me alcanza a mostrar los botones de cancelar y guardar al editar un usuario"*
- **🤖 Resumen Técnico para la IA**:
  1. **Ajuste de Capas y Jerarquía Z-Index (`DashboardLayout.css`)**:
     - Se ajustó el `z-index` de `.bottom-nav-bar` a `40` (estaba en `999`), evitando que se sobreponga a los diálogos modales y permitiendo que cualquier modal (`z-index: 9000`) se superponga limpiamente sobre la barra de navegación inferior.
     - Se fijó `.top-bar` con `z-index: 30` y safe-area superior, asegurando proporciones táctiles y truncado dinámico para selectores de sedes y botones en pantallas de menos de 400px.
     - Se eliminó el bloqueo de altura rígida anidada en `.content-wrapper` permitiendo scroll inercial táctil fluido en `.main-content` con `padding-bottom: calc(76px + env(safe-area-inset-bottom))`.
  2. **Sistema Global de Modales con Pie Sticky (`index.css` & `Settings.css`)**:
     - `.modal-overlay` configurado globalmente con `position: fixed; inset: 0; z-index: 9000; backdrop-filter: blur(6px)`.
     - `.modal-content` / `.modal-card` con `max-height: calc(100dvh - 16px)` y `display: flex; flex-direction: column`.
     - `.modal-body` con `flex: 1 1 auto; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch`.
     - `.modal-footer` fijado con `position: sticky; bottom: 0; z-index: 10; background: #ffffff; padding-bottom: max(12px, env(safe-area-inset-bottom)); box-shadow: 0 -4px 12px rgba(0,0,0,0.05)`, garantizando que los botones **Cancelar** y **Guardar Cambios** permanezcan siempre 100% visibles, anclados y accesibles.
  3. **Corrección de Encabezado Hero en Mobile (`Dashboard.css`)**:
     - Se optimizó `.dashboard-hero-header` con padding ergonómico (`1.1rem 1.25rem`), `line-height: 1.3`, y `overflow: visible`, eliminando el recorte superior del título *"Dashboard General"* y alineando la insignia *● EN LÍNEA* y el botón de actualización.
  4. **Formularios Responsivos en Gestión de Usuarios (`UsuariosTab.tsx`)**:
     - Se removieron los estilos rígidos `gridTemplateColumns: '1fr 1fr'` en favor de `.form-row` responsivo (1 columna en smartphones, 2 columnas en tablets/desktop).
- **📦 Componentes Modificados**:
  - `src/shared/ui/DashboardLayout.css`
  - `src/features/dashboard/ui/Dashboard.css`
  - `src/features/settings/ui/Settings.css`
  - `src/features/settings/ui/UsuariosTab.tsx`
  - `src/index.css`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Precache con 24 recursos empaquetados exitosamente.

### [2026-08-26 16:24:00] - [CLEANUP] [PWA] [LIFECYCLE] - Remoción Completa de Modal de Actualización y Restauración de PWA Estándar (autoUpdate)
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"quita el tema de la modal aun sigue sin funcionar despues lo trabajamos con mas tiempo pro que no esta funcionando como deberia funcionar por que listo ya actualiza y bien pero cada 5 segundo vuelve a salir no tiene ningun sentido ni nada eso no deberia funcionar así no se que le sucede pero debo avanzar y ya hemos realizado demasiados ajustes."*
- **🤖 Resumen Técnico para la IA**:
  1. **Remoción de Modal (`App.tsx` y `UpdatePromptModal.tsx`)**:
     - Se eliminó `<UpdatePromptModal />` del árbol de componentes en `App.tsx`.
     - `UpdatePromptModal.tsx` se neutralizó retornando `null` y eliminando todo sondeo de fondo.
  2. **Restauración de PWA Estándar (`vite.config.ts`)**:
     - Se configuró `registerType: 'autoUpdate'` con `injectRegister: 'auto'` para la gestión nativa y silenciosa del ciclo de vida del Service Worker.
  3. **Preservación de Mejoras Consolidadas**:
     - Login en la raíz limpia `/` con protección de rutas (`RootAuthHandler` y `ProtectedRoute`).
     - Formulario de autenticación con campos limpios `""`, diseño Mobile-First (`100dvh`), botón ver/ocultar contraseña y soporte de safe areas.
     - Versión del sistema (`v0.0.2 Dev`) leída desde `.env` en footer y dashboard.
     - Reglas de servidor [`public/web.config`](file:///c:/Users/miguelagutierrezg/source/pwa/ParkingPwa/public/web.config) y `public/.htaccess`.
- **📦 Componentes Modificados**:
  - `src/App.tsx`
  - `src/shared/ui/UpdatePromptModal.tsx`
  - `src/vite-env.d.ts`
  - `vite.config.ts`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Precache con 21 recursos empaquetados.
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"ahora no es un bucle ahora le di y se quedo hay pensando ahora que será enserio necesito que quede ya funcionando completamente sin tantos cambios analiza"*
- **🤖 Resumen Técnico para la IA**:
  1. **Causa del Congelamiento**:
     - Tras desregistrar los Service Workers con `reg.unregister()`, la invocación a `await updateServiceWorker(true)` quedaba esperando indefinidamente un mensaje de respuesta de un worker destruido, bloqueando el hilo y evitando que la recarga se ejecutara.
  2. **Solución Implementada (`UpdatePromptModal.tsx`)**:
     - Se eliminó la promesa bloqueante `updateServiceWorker(true)`.
     - `handleUpdate` ahora ejecuta de forma inmediata:
       1. Purga total de `window.caches` (`CacheStorage`).
       2. Desregistro de los Service Workers viejos (`navigator.serviceWorker.getRegistrations() -> unregister()`).
       3. Navegación forzada inmediata sin esperas asíncronas: `window.location.replace('/?_v=' + Date.now())`.
     - Sondeo reactivo optimizado a 8 segundos para detección instantánea de cambios en `version.json` o `VITE_APP_VERSION`.
- **📦 Componentes Modificados**:
  - `src/shared/ui/UpdatePromptModal.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Precache y bundle generados exitosamente.
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Ups ocurrio algo raro ya no me manda a un 404, pero le doy actualizar intenta quedar en el login y boom vuelve a salir el tema de actualización y así un bucle completo que sucede hay ? ya desde que le de actualizar yad eberia saltar eso no ?"*
- **🤖 Resumen Técnico para la IA**:
  1. **Activación Inmediata de Service Worker (`vite.config.ts`)**:
     - Se añadieron `skipWaiting: true` y `clientsClaim: true` en la configuración `workbox` de `VitePWA` para que el nuevo SW reclame los clientes inmediatamente sin retenciones de hilos ni estados *waiting* residuales.
  2. **Purga, Desregistro y Recarga Limpia (`UpdatePromptModal.tsx`)**:
     - Al presionar *"Actualizar Ahora"*:
       1. Guarda marca de tiempo en `sessionStorage` (`pwa_just_updated`) para evitar re-disparos accidentales transitorios durante los primeros 8 segundos de carga.
       2. Purgar todas las claves de `CacheStorage` (`window.caches.delete`).
       3. Desregistrar explícitamente todos los Service Workers existentes (`navigator.serviceWorker.getRegistrations() -> unregister()`) para asegurar que liberen el `index.html` anterior.
       4. Invocar `updateServiceWorker(true)`.
       5. Reemplazar la URL forzando una petición HTTP limpia sin caché: `window.location.replace('/?_v=' + Date.now())`.
- **📦 Componentes Modificados**:
  - `vite.config.ts`
  - `src/shared/ui/UpdatePromptModal.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Precache y bundle generados exitosamente.
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Funciono excelente pero tenemos un error sucede que cuando se coloca en el navegador www.parking-flow.com el de una pues ingresa al login osea la ruta queda www.parking-flow.com/login pero cuando le doy click al actualizar ahora el sistema manda a esa ruta y esa ruta no existe en el servidor, el deberia en la rutas no se como se maneja aca en react pero que el login lo redirija a la pantalla www.parking-flow.com si me hago entender se que eso es temas de enrutamiento de la pwa analiza eso y me explicas."*
- **🤖 Resumen Técnico para la IA**:
  1. **Enrutamiento Raíz Limpio (`App.tsx`)**:
     - Se configuró `<RootAuthHandler />` en la ruta `/`: Si no hay sesión, renderiza directamente `<Login />` en `https://www.parking-flow.com/` sin alterar la URL. Si ya existe sesión, redirige fluidamente a `/dashboard`.
     - La ruta virtual `/login` ahora redirige con `replace` a `/` para mantener siempre la URL limpia.
     - `ProtectedRoute` protege las subrutas del `/dashboard`, enviando usuarios no autenticados a `/`.
     - En `DashboardLayout.tsx`, `handleLogout` redirige a `/`.
  2. **Actualización Segura (`UpdatePromptModal.tsx`)**:
     - `handleUpdate` verifica la URL actual y, si se encontraba en `/login`, fuerza la navegación y recarga limpia sobre la raíz `https://www.parking-flow.com/`.
  3. **Reglas de Reescritura del Servidor Web (SPA Fallback)**:
     - [`public/web.config`](file:///c:/Users/miguelagutierrezg/source/pwa/ParkingPwa/public/web.config): Regla de reescritura para servidores Windows / IIS (SmarterASP.NET, Plesk, Azure) que redirige rutas virtuales no físicas hacia `index.html`.
     - [`public/.htaccess`](file:///c:/Users/miguelagutierrezg/source/pwa/ParkingPwa/public/.htaccess): Regla de reescritura para servidores Apache/Linux.
- **📦 Componentes Modificados**:
  - `src/App.tsx`
  - `src/shared/ui/DashboardLayout.tsx`
  - `src/shared/ui/UpdatePromptModal.tsx`
  - `public/web.config` *(NUEVO)*
  - `public/.htaccess` *(NUEVO)*
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Precache y bundle generados exitosamente.
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
