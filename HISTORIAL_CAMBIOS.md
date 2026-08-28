# 📜 HISTORIAL DE CAMBIOS Y CONTEXTO TÉCNICO ACUMULADO (PARKING PWA)

> **PROPÓSITO DE ESTE DOCUMENTO**:
> Este archivo es la **Memoria Técnica Obligatoria** de la aplicación web progresiva (Parking PWA). Cada modificación, arquitectura, componente o corrección realizada debe quedar registrada aquí con el formato oficial para preservar el contexto continuo entre diferentes PCs y sesiones de IA.

---

## 📋 Registro Cronológico de Cambios

### [2026-08-28 17:00:00] - [FEATURE] [MULTI-TENANT] [SECURITY] - Propagación Explícita de CompanyId en Gestión de Sedes y Usuarios

#### 💬 Prompt Original del Usuario
> "Verificar que cuando se cree la compañia se guarde en la base de datos el companyid por que no se esta guardando entonces eso no va a generara el desacoplamiento que se necesita para cuadno creemos varias organizaciones por que es la idea del saas multitenat"

#### 🤖 Resumen Técnico para la IA
1. **Propagación de `CompanyId` en PWA (`ParqueaderosTab.tsx`, `BranchesContracts.ts`)**:
   - Se tipó `companyId` y `companyName` en `BranchDto`, `CreateBranchDto` y `UpdateBranchDto`.
   - En `ParqueaderosTab.tsx`, al crear una sede se envía explícitamente el `companyId` del usuario autenticado (`authService.getCurrentUser()?.companyId`) para asegurar que la nueva sede quede vinculada a la empresa correspondiente.
2. **Bump de Versión**:
   - Actualizado `.env` a `0.0.49 Dev`.

#### 📦 Componentes Modificados
- `src/features/settings/model/BranchesContracts.ts` — Inclusión de `companyId` en contratos de sedes
- `src/features/settings/ui/ParqueaderosTab.tsx` — Envío de `companyId` en creación de sede
- `.env` — Versión `0.0.49 Dev`
- `HISTORIAL_CAMBIOS.md`

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (build en 1.20s).

### [2026-08-28 16:51:00] - [UI/UX] [LOGIN] - Eliminación de Botones de Control de Ventana (Minimizar / Cerrar) en Pantalla de Login

#### 💬 Prompt Original del Usuario
> "quita del login estos iconos" (con captura adjunta resaltando los botones de minimizar y cerrar en la esquina superior derecha del login)

#### 🤖 Resumen Técnico para la IA
1. **Limpieza Visual del Login (`Login.tsx` & `Login.css`)**:
   - Se removió el contenedor `<div className="form-side-top-bar">` y los botones `<div className="window-controls">` que ejecutaban `window.blur()` y `window.close()`.
   - Se eliminaron las clases CSS huérfanas `.form-side-top-bar`, `.window-controls`, `.win-btn`, `.win-min` y `.win-close` en [`Login.css`](file:///c:/Users/sebastianredondo/Documents/pwa/ParkingPwa/src/features/auth/ui/Login.css).
   - El formulario de autenticación ahora se centra verticalmente de manera limpia y estética en la columna derecha.
2. **Bump de Versión**:
   - Actualizado `.env` a `0.0.48 Dev` para invalidación del Service Worker.

#### 📦 Componentes Modificados
- `src/features/auth/ui/Login.tsx` — Eliminación de botones de control de ventana
- `src/features/auth/ui/Login.css` — Limpieza de reglas CSS obsoletas
- `.env` — Versión `0.0.48 Dev`
- `HISTORIAL_CAMBIOS.md`

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (build en 624ms).

### [2026-08-28 16:48:00] - [FEATURE] [API] [INTEGRATION] - Conexión Dinámica de Tipos de Vehículos a BD / API en Diálogo de Ingreso de Vehículos

#### 💬 Prompt Original del Usuario
> "ayudame con que en el dialog de ingreso de vehiculo desde el pwa , muestre los tipos de vehiculos que tengo en mi bd y api, actualmente me muestra quemados y esta mal"

#### 🤖 Resumen Técnico para la IA
1. **Desacoplamiento y Jerarquía de Catálogo en `vehiculosConfigService.ts`**:
   - Anteriormente, `vehiculosConfigService.getConfigs(branchId)` filtraba estrictamente por `r.branchId === branchId`. Si la sede no contaba con tarifas específicas sobreescritas a nivel de sede (muy común cuando se opera con el catálogo general de BD con `BranchId = null`), la función retornaba un arreglo vacío `[]`.
   - Se refactorizó `getConfigs` para consultar `/VehicleRates` y combinar inteligentemente las tarifas particulares de la sede con el catálogo general de tipos de vehículos de la empresa / sistema (`r.branchId === null`), utilizando `r.displayName` configurado en base de datos.
2. **Eliminación Total de Opciones Quemadas en `Vehicles.tsx`**:
   - Se removió el bloque de opciones fijas quemadas (`<option value={0}>Auto / Sedán</option>...`) del modal de ingreso.
   - El `<select>` ahora se alimenta exclusivamente de la lista reactiva `vehicleTypesList.map(...)` proveniente de la API y base de datos.
   - Se implementó `handleOpenCheckIn` para forzar la recarga reactiva de los tipos de vehículos al abrir el diálogo y auto-seleccionar el primer tipo activo configurado en BD.
3. **Bump de Versión**:
   - Actualizado `.env` a `0.0.47 Dev` para forzar invalidación de caché del Service Worker en navegadores y móviles.

#### 📦 Componentes Modificados
- `src/features/settings/data/vehiculosConfigService.ts` — Consulta y combinación dinámica de tipos de vehículos y tarifas de BD
- `src/features/vehicles/ui/Vehicles.tsx` — Diálogo de ingreso 100% dinámico y eliminación de opciones quemadas
- `.env` — Versión `0.0.47 Dev`
- `HISTORIAL_CAMBIOS.md`

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (Precache: 31 entries generadas limpiamente).

### [2026-08-28 16:38:00] - [FEAT] [UI/UX] [MOBILE] - Implementación de Tarjetas Expandibles Interactivas (Accordion Cards) en Vistas Móviles

#### 💬 Prompt Original del Usuario
> "Ayudame con algunos ajustes visuales, exitste en mi pwa muchas card en lista que se ven como la imagen que te anexe, sin embargo quisiera que tuviesen un mejor diseño, me gustaria como el de la segunda iamgen que te pase"

#### 🤖 Resumen Técnico para la IA
1. **Arquitectura Responsiva Dual (`desktop-table-view` + `mobile-card-list`)**:
   - Se diseñó un patrón híbrido en [`Settings.css`](file:///c:/Users/sebastianredondo/Documents/pwa/ParkingPwa/src/features/settings/ui/Settings.css): en pantallas de escritorio (`> 768px`) se preservan las tablas de datos amplias y estructuradas (`.desktop-table-view`), mientras que en smartphones y pantallas móviles (`<= 768px`) se ocultan las tablas y se despliegan automáticamente listas de **Tarjetas Expandibles Interactivas (Accordion Cards)** (`.mobile-card-list`).
2. **Diseño Visual de las Tarjetas Expandibles**:
   - **Avatar Dinámico**: Iniciales con paletas de colores armónicas (o ícono temático: escudo, etiqueta, tarjeta, vehículo) e indicador de estado de conexión/actividad (punto verde/rojo).
   - **Jerarquía Tipográfica**: Título en negrita de alta legibilidad, subtítulo con identificador/documento/rol y botón chevron animado con rotación fluida de 180°.
   - **Panel de Detalles Desplegable (`.card-details-panel`)**: Fondo suave con bordes redondeados (`#f8fafc`), cuadrícula de pares clave-valor estructurada y badges oficiales.
   - **Barra de Acciones Ergonómica**: Botones de acción táctiles tipo píldora (`[Editar]`, `[Permisos]`, `[Eliminar]`, `[Inactivar]`).
3. **Módulos Adaptados**:
   - `UsuariosTab.tsx` — Gestión de usuarios con iniciales y detalles de rol/documento/sedes.
   - `RolesTab.tsx` — Roles y matriz con avatar de escudo y conteo de permisos asignados.
   - `ConveniosTab.tsx` — Convenios comerciales con logo/avatar y detalles de descuento y horas máximas.
   - `MediosPagoTab.tsx` — Medios de pago con emoji/ícono representativo y estado en cajas.
   - `ResolucionesTab.tsx` — Resoluciones de facturación DIAN con prefijo y vigencia.
   - `VehiculosConfigTab.tsx` — Catálogo general de vehículos con íconos por clasificación.
4. **Bump de Versión**:
   - Actualizado `.env` a `0.0.46 Dev` para forzar invalidación de caché en el Service Worker.

#### 📦 Componentes Modificados
- `src/features/settings/ui/Settings.css` — Clases CSS del sistema de tarjetas expandibles y media queries
- `src/features/settings/ui/UsuariosTab.tsx` — Vista dual de usuarios
- `src/features/settings/ui/RolesTab.tsx` — Vista dual de roles
- `src/features/settings/ui/ConveniosTab.tsx` — Vista dual de convenios
- `src/features/settings/ui/MediosPagoTab.tsx` — Vista dual de medios de pago
- `src/features/settings/ui/ResolucionesTab.tsx` — Vista dual de resoluciones
- `src/features/settings/ui/VehiculosConfigTab.tsx` — Vista dual de tipos de vehículos
- `.env` — Versión `0.0.46 Dev`
- `HISTORIAL_CAMBIOS.md`

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (Precache: 31 entries generadas limpiamente).

### [2026-08-28 15:32:00] - [FIX] [AUTH] - Corrección de Error 401 en Login (Diferenciación de Credenciales Inválidas vs Concurrencia)

#### 💬 Prompt Original del Usuario
> "otra cosa si coloco mal la contraseña o algo siempre sale el mensaje arriba de usuario  Tu sesion fue cerrada por que inicio sesion con esta cuenta desde otro dispositivo o estacion de trabajo eos no tiene nada que ver con escribir mal la cuenta ese mensaje es solo cuadno de verdad se cierre por que alguien accedio si me explico  ? analisa eso."

#### 🤖 Resumen Técnico para la IA
1. **Diferenciación de Rutas en `handleResponse` (`src/shared/api/apiClient.ts`)**:
   - Anteriormente, cualquier respuesta `HTTP 401 Unauthorized` interceptada por el cliente HTTP guardaba en `sessionStorage` el mensaje `Tu sesión fue cerrada automáticamente porque se inició sesión con esta cuenta desde otro dispositivo...` y redirigía a `/?expired=concurrent`.
   - Como `POST /Auth/login` con contraseña incorrecta devuelve un 401, el usuario recibía falsamente el banner de concurrencia al equivocarse al digitar su clave.
   - Se modificó `handleResponse` para recibir el parámetro `endpoint` y verificar si la petición es hacia `/Auth/login` o si el usuario carecía de una sesión activa (`!localStorage.getItem('auth_token')`).
   - Si el 401 proviene de `/Auth/login`, se propaga únicamente el mensaje de credenciales incorrectas a nivel de formulario sin registrar la alerta de concurrencia.
   - El banner de concurrencia queda estrictamente reservado para cuando un usuario ya autenticado con token activo recibe un 401 en peticiones protegidas.

#### 📦 Componentes Modificados
- `src/shared/api/apiClient.ts` — Detección de endpoint de login y validación de sesión previa en `handleResponse`

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (Precache: 31 entries generadas limpiamente).


### [2026-08-28 15:26:00] - [FIX] [PWA] - Eliminación de Recargas Espontáneas en Bucle mediante registerType: 'prompt'

#### 💬 Prompt Original del Usuario
> "listo lo de actualizar, pero tiene un bucle osea queda abierta pero como cada cierto tiempo se refresca no se que le sucede que tocaste de eso analiza"

#### 🤖 Resumen Técnico para la IA
1. **Desactivación de Auto-Reload No Deseado (`vite.config.ts`)**:
   - `VitePWA` tenía configurado `registerType: 'autoUpdate'`. Este modo inyectaba un manejador de eventos interno en el navegador que forzaba `window.location.reload()` en cuanto el Service Worker se activaba en segundo plano.
   - Se cambió a `registerType: 'prompt'`, delegando el control total y exclusivo de la recarga a la interacción explícita del usuario mediante el botón *"Actualizar Ahora"* de `UpdatePromptModal`.
2. **Optimización de Intervalos de Sondeo (`UpdatePromptModal.tsx`)**:
   - Sondeo de Service Worker ajustado a 25 segundos y sondeo a `version.json` a 12 segundos para estabilidad y ahorro de recursos.
   - La aplicación ahora permanece 100% estable y abierta indefinidamente sin refrescarse sola.

#### 📦 Componentes Modificados
- `vite.config.ts` — `registerType: 'prompt'`
- `src/shared/ui/UpdatePromptModal.tsx` — Optimización de intervalos

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (Precache: 31 entries generadas limpiamente).


### [2026-08-28 15:14:00] - [FEAT] [UI] - Visualización Clara de Transición de Versión en Modal de Actualización (vActual ➔ vNueva)

#### 💬 Prompt Original del Usuario
> "excelente funciono pero cuando aparece la modal de actualziación aparecea abajo la versión en la quye esta osea ahorita mande 0.0.42 pero me aparecia 0.0.41  entonces no es claro a que versión va a subir si me explico ?"

#### 🤖 Resumen Técnico para la IA
- **Visualización de Versión Destino (`UpdatePromptModal.tsx`)**:
  - Se agregó el estado reactivo `serverVersion` que captura la versión reportada por `/version.json`.
  - En la parte inferior de la modal, se reemplazó la etiqueta estática de versión previa por un indicador claro de progresión:
    `v0.0.41 Dev ➔ v0.0.42 Dev` (con la versión destino resaltada en verde esmeralda `#10b981`).
  - Si la versión textual es la misma pero el buildTime es nuevo (un parche/re-compilación), muestra la versión con el identificador del sistema.

#### 📦 Componentes Modificados
- `src/shared/ui/UpdatePromptModal.tsx` — Captura de `serverVersion` y diseño visual de transición

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (Precache: 31 entries generadas limpiamente).


### [2026-08-28 15:05:00] - [FIX] [PWA] - Corrección de Sincronización loadEnv en Vite y Criterio Estricto de Timestamp en Modal

#### 💬 Prompt Original del Usuario
> "pero esxiste un error si cierro la pwa y vuelvo y la abro vuelve a salir lo de actualizar parece que no cambia para que no lo hace ahora vi otro error le doy actualizar listo cierra la modal de actualizar y quedo ay espero como 5 segundo y vuevle a salir lo de actualizar osea no lo hace bien queda algo como pendiente algo que sigue diciendo tiene que actualizar si me explico. analisa eso."

#### 🤖 Resumen Técnico para la IA
1. **Corrección de Lectura `.env` en `vite.config.ts`**:
   - `process.env.VITE_APP_VERSION` no era cargado en Node.js por defecto. Se refactorizó la configuración usando `defineConfig(({ mode }) => { const env = loadEnv(mode, process.cwd(), ''); ... })`.
   - Ahora `versionTrackerPlugin()` escribe en `version.json` exactamente la versión de `.env` (`0.0.40 Dev`), eliminando la discrepancia permanente de versiones entre el servidor y el cliente.
2. **Criterio Unidireccional de Novedad (`UpdatePromptModal.tsx`)**:
   - Se blindó la condición de alerta: sólo activa `setHasNewVersion(true)` si `data.buildTime > (localBuildTimeRef.current + 2000)` o si la versión del servidor es distinta Y su build es posterior/igual.
   - Si el build es igual o menor, el sistema ignora la respuesta silenciosamente, garantizando que tras actualizar o reiniciar la PWA no se vuelva a mostrar la modal.

#### 📦 Componentes Modificados
- `vite.config.ts` — Carga con `loadEnv` y sincronización exacta de `VITE_APP_VERSION`
- `src/shared/ui/UpdatePromptModal.tsx` — Criterio estricto de timestamp más reciente y validación segura
- `public/version.json` y `dist/version.json` — Sincronizados con `0.0.40 Dev`

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (Precache: 31 entries).


### [2026-08-28 14:54:00] - [FEAT] [PWA] - Reactivación de Modal de Actualización Obligatoria con Persistencia de Ruta y Prevención de Bucles

#### 💬 Prompt Original del Usuario
> "si por que la ultima vez que pasaba actualizaba y como que se refrescaba la pagina y volvia a salir lo de actualizar y eso debe salir en cualquier ventana que esrte si estoy en alguna configuracion me sale eso actualzia y yo sigo en la misma pagina de configuración haciendo todo normal si me explico ?"

#### 🤖 Resumen Técnico para la IA
1. **Persistencia de la Ruta Activa (`handleUpdate`)**:
   - En `UpdatePromptModal.tsx`, al pulsar *"Actualizar Ahora"*, se captura la URL completa del usuario (`new URL(window.location.href)`) y se le inyecta el cache-buster `_v=${Date.now()}`.
   - Esto garantiza que si el operador está en `/dashboard/settings`, `/dashboard/vehicles` o `/dashboard/caja`, tras actualizar la aplicación **permanezca en la misma pantalla** sin ser expulsado a `/` o al login.
2. **Eliminación Total de Bucles y Falsos Positivos**:
   - Se reactivó `versionTrackerPlugin()` en `vite.config.ts` para generar `public/version.json` con `buildTime` (timestamp numérico exacto) y la constante global `__APP_BUILD_TIME__`.
   - Se configuró Workbox con `NetworkOnly` para `/version.json` para que nunca quede atrapado en el caché local.
   - En `UpdatePromptModal.tsx`, `checkForVersionJson` verifica `sessionStorage.getItem('pwa_just_updated')` (pausa de 12s post-recarga) y compara `data.buildTime > localBuildTimeRef.current` para garantizar que la app solo alerte cuando el servidor tenga un build realmente posterior al bundle cargado en memoria.
3. **Disponibilidad Global en Toda la App (`App.tsx`)**:
   - Se importó y montó `<UpdatePromptModal />` en la raíz de `App.tsx` (dentro de `ParqueaderoProvider`), permitiendo que el sondeo reactivo (cada 8s y al reenfocar la ventana) funcione de forma omnipresente en cualquier módulo del sistema.

#### 📦 Componentes Modificados
- `vite.config.ts` — `versionTrackerPlugin()`, `define: { __APP_BUILD_TIME__ }`, Workbox `NetworkOnly` para `/version.json`
- `src/vite-env.d.ts` — Declaración global de `__APP_BUILD_TIME__`
- `src/shared/ui/UpdatePromptModal.tsx` — Doble motor reactivo, persistencia de URL activa y purgado de caché
- `src/App.tsx` — Montaje global de `UpdatePromptModal`
- `public/version.json` y `dist/version.json` — Generados automáticamente con el build

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (Precache: 31 entries generadas limpiamente).


### [2026-08-28 12:18:00] - [FIX] [PWA] - Corrección Integral de Íconos PWA para Android (Chrome WebAPK) e iOS (Safari)

#### 💬 Prompt Original del Usuario
> "lo digo desde chorme tambi9en pasa lo probamos en android e igual no toma bien entonces reconsidera bien la respuesta completa."

#### 🤖 Resumen Técnico para la IA
- **Android Maskable Icon (Safe Zone Padding)**:
  - Se regeneró `public/maskable-icon-512x512.png` aplicando un margen interno de seguridad del 25% (Safe Zone del W3C/Android WebAPK), escalando el logotipo al 75% centrado sobre el fondo institucional `#141f31`. Esto previene que los lanzadores adaptativos de Android (Samsung, Xiaomi, Pixel) recorten el logotipo o apliquen la marca de agua de Chrome.
- **Configuración de PWA en `vite.config.ts`**:
  - Se incluyó `apple-touch-icon.png` (180x180) dentro de la matriz `manifest.icons`.
  - Se habilitó `devOptions: { enabled: true, type: 'module' }` para permitir la prueba directa de PWA en red local bajo desarrollo.
  - Se expandió `includeAssets` con todos los recursos gráficos institucionales (`favicon.ico`, `favicon.png`, `favicon.svg`, `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, `maskable-icon-512x512.png`, `logo.png`, `logo-new.png`).
- **Encabezados en `index.html`**:
  - Se declaró explícitamente el `<link rel="manifest" href="/manifest.webmanifest" />`.
  - Se definieron los enlaces `apple-touch-icon` universales (genérico base sin `sizes`, `180x180`, `152x152`, `167x167`, `120x120`, `precomposed`) con parámetro de versión de invalidación de caché `?v=0.0.39`.
- **Servidores Web (`.htaccess`)**:
  - Se añadió la directiva `AddType application/manifest+json .webmanifest` para soporte MIME nativo en Apache.

#### 📦 Componentes Modificados
- `public/maskable-icon-512x512.png` — Regenerado con Safe Zone del 25%
- `public/apple-touch-icon.png` — 180x180 optimizado
- `public/pwa-192x192.png` — 192x192
- `public/pwa-512x512.png` — 512x512
- `public/favicon.png` — 180x180
- `index.html` — Enlaces universales a Apple Touch Icons y Manifest
- `vite.config.ts` — Inclusión de `apple-touch-icon` en manifest, `devOptions` y assets completos
- `public/.htaccess` — MIME mapping para `.webmanifest`
- `.env` — Versión `0.0.39 Dev`

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** (Precache: 30 entries generadas limpiamente).


### [2026-08-28 11:47:00] - [FIX] [PWA] - Corrección de Ícono de Pantalla de Inicio iOS (Apple Touch Icon)

#### 💬 Prompt Original del Usuario
> "Ajustame para que cuando mi pwa la agrege al inicio de mi iphone se vea el logo como te muestro en la primera imagen, dejamela con el logo.png"

#### 🤖 Resumen Técnico para la IA
- El `apple-touch-icon.png` anterior era una imagen diferente al logo oficial (`logo.png`).
- Se regeneraron **todos** los íconos PWA a partir de `logo.png` usando `sharp-cli resize`:
  - `apple-touch-icon.png` → 180x180 (ícono que iOS usa para la pantalla de inicio)
  - `pwa-192x192.png` → 192x192
  - `pwa-512x512.png` → 512x512
  - `maskable-icon-512x512.png` → 512x512
  - `favicon.png` → 180x180
- Se actualizó `index.html` línea 21: se agregó `sizes="180x180"` al `<link rel="apple-touch-icon">` para que iOS seleccione el ícono correcto.
- La configuración del manifest en `vite.config.ts` ya estaba correcta apuntando a los archivos correctos.

#### 📦 Componentes Modificados
- `public/apple-touch-icon.png` — Regenerado desde `logo.png` (180x180)
- `public/pwa-192x192.png` — Regenerado desde `logo.png` (192x192)
- `public/pwa-512x512.png` — Regenerado desde `logo.png` (512x512)
- `public/maskable-icon-512x512.png` — Regenerado desde `logo.png` (512x512)
- `public/favicon.png` — Regenerado desde `logo.png` (180x180)
- `index.html` — Agregado `sizes="180x180"` al apple-touch-icon link

#### ✅ Verificación y Compilación
- `npm run build` → **0 Errores** ✅
- PWA precache: 26 entries generadas correctamente


### [2026-08-28 11:34:00] - [FEAT] [UI] - Reemplazo de Iconos de Inicio y Apple Touch Icon con el Nuevo Logotipo
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Tambien sigo viendo el mismo logo al agregar la pagina de ininicio de IOS, recuerda que la imagen que quiero es la 2da imagen que te pase"*
- **🤖 Resumen Técnico para la IA**:
  1. **Rediseño e Integración del Nuevo Logo**:
     - Se tomó el logotipo de alta resolución provisto por el usuario en el chat (`media_1787934670603.png`, que contiene la letra "P" verde/blanca estilizada sobre fondo azul oscuro).
     - Se creó un script de PowerShell (`resize_icons.ps1`) para realizar el redimensionamiento de alta calidad con Interpolación Bicúbica a las resoluciones estándar oficiales.
     - Se reemplazaron y sobreescribieron los siguientes archivos de recursos PNG en la carpeta `public/`:
       - `apple-touch-icon.png` (180x180 px - Usado por iOS para la pantalla de inicio "Agregar a Inicio").
       - `pwa-192x192.png` y `pwa-512x512.png` (Para PWA en Android/Chrome).
       - `maskable-icon-512x512.png` (Versión adaptativa).
       - `favicon.png` (Favicon del navegador).
       - `logo.png` y `logo-new.png` (Resolución original 512x512 px).
- **📦 Componentes Modificados**:
  - `public/apple-touch-icon.png`
  - `public/pwa-192x192.png`
  - `public/pwa-512x512.png`
  - `public/maskable-icon-512x512.png`
  - `public/favicon.png`
  - `public/logo.png`
  - `public/logo-new.png`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-28 11:30:00] - [FEAT] [SECURITY] [UI] - Ocultar Usuarios Super Administradores en Gestión de Usuarios
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"no pero corrige lo de los usuarios, que tampoco pueda ver los super administradores, si mi rol es administrador"*
- **🤖 Resumen Técnico para la IA**:
  1. **Filtrado de Usuarios Super Administradores**:
     - En `UsuariosTab.tsx` se definió `displayUsers` aplicando un filtro sobre `usuarios`. Si el usuario logueado en la PWA no es Super Administrador, todos los usuarios que posean el rol de "Super Administrador", "Super Admin" o "Superadmin" son excluidos de la lista que se mapea en el cuerpo de la tabla.
     - Esto oculta por completo la existencia de los Super Administradores en la tabla a nivel de interfaz para cualquier administrador o usuario estándar.
  2. **Bump de Versión**:
     - Se incrementó la versión a `0.0.38 Dev` en `.env` para asegurar la invalidación de caché PWA en producción.
- **📦 Componentes Modificados**:
  - `src/features/settings/ui/UsuariosTab.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-28 11:22:00] - [FEAT] [SECURITY] [UI] - Filtro de SuperAdmin y Protección Flexibilizada de Roles del Sistema
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Requiero que cuando tenga en mi pwa un usuario administrador, no me muestre el rol super administrador, adicional que en la accion el rol administrador me salga bloqueado, el podra editar y crear otros roles diferentes a administrador"*
- **🤖 Resumen Técnico para la IA**:
  1. **Filtrado de Rol Super Administrador**:
     - En `UsuariosTab.tsx` se modificó `loadData` para filtrar la lista de roles (`rolesData`). Si el usuario actual de la PWA no es Super Administrador, el rol "Super Administrador" es excluido de las opciones seleccionables y asignables, previniendo visualizaciones cruzadas no deseadas.
  2. **Protección Flexibilizada de Roles Principales**:
     - En `RolesTab.tsx` se refactorizó `handleSaveRole` para evitar el uso del método de búsqueda restrictivo `.includes('admin')`. Ahora se usa validación exacta de nombres normalizados (`'administrador'`, `'admin'`, `'super administrador'`, `'super admin'`, `'superadmin'`).
     - Esto permite que un Administrador estándar cree y edite libremente otros roles personalizados (por ejemplo, *"Auxiliar Administrativo"*) sin ser erróneamente bloqueado.
     - Se mantiene el bloqueo estricto en la columna de acciones para los roles principales del sistema (con candado y sin botones de acción) para usuarios estándar.
- **📦 Componentes Modificados**:
  - `src/features/settings/ui/RolesTab.tsx`
  - `src/features/settings/ui/UsuariosTab.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-28 09:21:00] - [FEAT] [UI] - Responsive Onboarding y Soporte para Imagen de Sede
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"esta dialog no lo estoy viendo responsive en la parte inferior version mobile, adicional podrias agregarle un campo que diga imagen de la sede..."*
- **🤖 Resumen Técnico para la IA**:
  1. **Ajuste Responsive Mobile**: En `ZeroDataOnboardingWizard.css` se añadió una `@media query (max-width: 768px)` que aplica `align-items: flex-start` y espaciados inferiores usando el padding safe area `env(safe-area-inset-bottom)` sobre el `.onboarding-wizard-overlay` para prevenir que la caja del formulario quede centrada y corte los botones finales en dispositivos cortos, forzando así que el contenido superior empiece desde el inicio de la pantalla y todo el flujo se haga scrolleable naturalmente.
  2. **Imagen de la Sede**:
     - Se extendieron los contratos `BranchDto`, `CreateBranchDto` y `UpdateBranchDto` en `BranchesContracts.ts` agregando la propiedad opcional `logoBase64?: string`.
     - En `ZeroDataOnboardingWizard.tsx`, se incluyó la propiedad `logoBase64` al estado inicial del formulario.
     - Se añadió un `<input type="file" accept="image/*">` y la función `handleImageChange` que invoca a un `FileReader` de JS para convertir instantáneamente el archivo en un string base64.
     - El componente ahora pre-visualiza la imagen localmente y adjunta la cadena al enviar los datos a la API (`branchesService.create`).
- **📦 Componentes Modificados**:
  - `src/features/auth/ui/ZeroDataOnboardingWizard.tsx`
  - `src/features/auth/ui/ZeroDataOnboardingWizard.css`
  - `src/features/settings/model/BranchesContracts.ts`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-28 09:05:00] - [BUGFIX] [SECURITY] [UI] - Protección Inmutable del Rol Super Administrador
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"No pero me lo dejaste que el superadministrdor tambien se pudiese editar y esta mal, solo es el rol administrador"*
- **🤖 Resumen Técnico para la IA**:
  1. Se implementó la función `isSuperAdminRole` en [`RolesTab.tsx`](file:///c:/Users/sebastianredondo/Documents/pwa/ParkingPwa/src/features/settings/ui/RolesTab.tsx) para identificar de manera estricta al rol "Super Administrador".
  2. Se separó la lógica de `isAdminRole` para que devuelva verdadero SÓLO para el rol "Administrador", excluyendo al Super Administrador.
  3. Se creó `isProtectedSystemRole` que agrupa visualmente a ambos roles como roles principales del sistema (estilo naranja).
  4. Lógica de Bloqueo Estricto (`isLockedForCurrentUser`):
     - El rol **Super Administrador** queda **TOTALMENTE BLOQUEADO Y ES INMUTABLE** para cualquier persona, incluyendo al propio SuperAdmin logueado.
     - El rol **Administrador** queda bloqueado para los operadores o administradores regulares, pero se **HABILITA** para ser editado y configurado **ÚNICAMENTE** si quien ha iniciado sesión es un `Super Administrador`.
  5. Se actualizaron `handleOpenEditRole` y `handleSaveRole` bloqueando las acciones sobre el Super Administrador desde el controlador del formulario para evitar manipulaciones directas.
- **📦 Componentes Modificados**:
  - `src/features/settings/ui/RolesTab.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-28 08:00:00] - [SECURITY] [RBAC] [MULTI-TENANT] - Aislamiento Estricto de SuperAdmin vs Administrador Tenant y Desacoplamiento de Roles Quemados
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Listo sucede que el superadmin accede y super bien accede al perfil de eso pero cree un administrador y tambien accede al portal del superadmin y eso no deberia ser así creo que esta algo quemado en codigo que sea administrador aparte necesito que revises todo el codigo de todos los 3 proyectos que no tenga cosas quemadas que no deberian estar . analiza completamente todo el desarrollo"*
- **🤖 Resumen Técnico para la IA**:
  1. **Aislamiento de SuperAdmin y Erradicación de Fallbacks Quemados (`authService.ts`)**:
     - Eliminados chequeos basados en cadenas como `username.toLowerCase() === 'admin'`, `roleName === 'Super Administrador'` o `!response.companyId`.
     - `isSuperAdmin` se rige exclusivamente por `Boolean(response.isSuperAdmin)` emitido por la API central.
     - En `getCurrentUser()`, se eliminó la sobreescritura que asignaba `ALL_PWA_PERMISSIONS_LIST` a cualquier usuario con `isAdmin` o rol de Administrador. Ahora solo el `isSuperAdmin` global recibe la lista total. Los administradores e inquilinos reciben la matriz de permisos persistida en base de datos (`user.permissions`).
     - En `hasPermission` y `hasModule`, el bypass total opera únicamente para `user.isSuperAdmin`. Para todos los demás roles (incluyendo administradores de parqueaderos), los accesos se evalúan contra la matriz de permisos y sus alias oficiales.
  2. **Propagación de `companyId` en Gestión de Usuarios (`UsuariosContracts.ts`, `UsuariosTab.tsx`)**:
     - Se añadió `companyId?: number` a `UserDto` y `SaveUserDto`.
     - Al crear o editar un usuario desde el panel del Administrador, se inyecta automáticamente el `companyId` de la sesión activa (`authService.getCurrentUser()?.companyId`), evitando que los nuevos usuarios se creen huérfanos sin empresa.
     - Se reemplazó la validación rígida `userRoleId === 1` por comprobación dinámica de administradores de sede/empresa.
  3. **Desacoplamiento en Layout Principal (`DashboardLayout.tsx`)**:
     - `ZeroDataOnboardingWizard` ahora evalúa `(user?.isAdmin || authService.hasPermission('branches.create')) && !user?.isSuperAdmin` sin depender de IDs de rol quemados.
- **📦 Componentes Modificados**:
  - `src/features/auth/data/authService.ts`
  - `src/features/settings/model/UsuariosContracts.ts`
  - `src/features/settings/ui/UsuariosTab.tsx`
  - `src/shared/ui/DashboardLayout.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 744ms).

### [2026-08-27 23:28:00] - [BUGFIX] [UI/UX] - Corrección de Cálculo Esperado en Caja y Mejora en Diálogo de Cierre de Turno
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"mejorar este dialog , porque no me deja ingresar el dinero y no calcula en las cifras de arriba"* (Captura de pantalla del modal Cierre y Liquidación de Turno con Base Inicial $50.000, Total Recaudado $0 y Esperado en Caja $0)
- **🤖 Resumen Técnico para la IA**:
  1. **Corrección de Cálculo de Dinero Esperado (`Caja.tsx`)**:
     - Se reemplazó la coalescencia nula `0 ?? (base + recaudado)` por la evaluación `(target?.expectedCash && target.expectedCash > 0) ? target.expectedCash : (targetBase + targetCollected)`.
     - Ahora la tarjeta superior *"TOTAL ESPERADO EN CAJA"* y la fila de resumen dentro del modal reflejan correctamente el valor consolidado de la base inicial más los recaudos en efectivo (ej. `$50.000`).
  2. **Flexibilidad en Entrada de Efectivo Contado y Base**:
     - Se ajustaron los estados a `number | string` permitiendo borrar con Backspace y tipear valores con fluidez sin bloqueos de `0`.
  3. **Indicador de Cuadre de Caja en Tiempo Real**:
     - Se integró un badge dinámico en el modal que compara reactivamente `Efectivo Físico Contado` vs `Esperado en Caja`, mostrando:
       - `✓ Cuadre Exacto` ($0)
       - `↑ Sobrante en Caja` (+monto)
       - `↓ Faltante en Caja` (-monto)
  4. **Bump de Versión**:
     - Actualizado `.env` a `0.0.30 Dev`.
- **📦 Componentes Modificados**:
  - `src/features/caja/ui/Caja.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 1.79s).

### [2026-08-27 23:17:00] - [FEATURE] [API] [INTEGRATION] - Implementación de Salida de Vehículos (Check-Out) con Liquidación y Cobro
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"adicional quisiera que ese modulo tuviese la opcion para dar salida a los vehiculos que esten activos, conectate a la api que hay una que permite esa acccion"*
- **🤖 Resumen Técnico para la IA**:
  1. **Acción de Salida en Tabla de Vehículos Activos (`Vehicles.tsx`)**:
     - Se incorporó la columna `ACCIONES` con el botón de acción rápida `[Dar Salida]` en cada fila de vehículo activo.
  2. **Modal Interactivo de Liquidación y Salida**:
     - Muestra la tarjeta del vehículo con placa destacada, número de tiquete, horas transcurridas y tarifa horaria.
     - Calcula en tiempo real el total a pagar (`billableHours * hourlyRate`).
     - Integra el selector de medios de pago activos vía `mediosPagoService.getPaymentMethods()`.
     - Permite ingresar el monto recibido y calcula reactivamente el cambio / vueltas a entregar al cliente.
  3. **Conexión al Endpoint de Salida (`vehicleService.checkOut`)**:
     - Envía la solicitud `POST /Tickets/check-out` con `ticketId`, `paymentMethod`, `amountPaid` y `discountAmount: 0`.
     - Presenta modal de confirmación con el resumen de la liquidación y actualiza reactivamente la tabla de activos (`loadActiveVehicles()`).
  4. **Bump de Versión**:
     - Actualizado `.env` a `0.0.29 Dev`.
- **📦 Componentes Modificados**:
  - `src/features/vehicles/ui/Vehicles.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 1.41s).

### [2026-08-27 23:13:00] - [FEATURE] [API] [INTEGRATION] - Conexión Dinámica de Tipos de Vehículos a BD / API en Registro de Ingreso
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"en el dialog de registrar ingrso de vehiculo, me muestra los tipos de vehiculos, pero veo que esta quemados, ajustalos conectadolos a la api y bd que tengo para los tipos de vehiculos que tengo creados"*
- **🤖 Resumen Técnico para la IA**:
  1. **Integración con API de Tipos de Vehículos (`Vehicles.tsx`)**:
     - Se integró `vehiculosConfigService.getConfigs(selectedParqueaderoId)` para consultar dinámicamente los tipos de vehículos activos en la BD (`/VehicleRates`), respetando la parametrización multi-sede y catálogo global.
  2. **Selector Dinámico en Diálogo Modal de Ingreso**:
     - Se reemplazó la lista estática en `<select>` por el renderizado reactivo de `vehicleTypesList`, mostrando los nombres personalizados configurados en BD (`vt.category`) y asignando su `vehicleType` numérico real.
     - Se configuró la selección por defecto del primer tipo activo de la BD al abrir el diálogo.
  3. **Píldoras de Filtro y Resolución de Nombres Dinámica**:
     - `getVehicleTypeName(type)` y las píldoras de filtrado superior ahora se generan a partir de los tipos de vehículos reales de la BD, con iconos representativos adaptados.
  4. **Bump de Versión**:
     - Actualizado `.env` a `0.0.28 Dev`.
- **📦 Componentes Modificados**:
  - `src/features/vehicles/ui/Vehicles.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 1.99s).

### [2026-08-27 23:06:00] - [UI/UX] - Eliminación de la Columna Acciones en Historial Consolidado de Cajas
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"en el modulo de cajas, elimina la columna acciones del historial , es donde te señale en rojo"* (Captura con el botón Cerrar Caja señalado en rojo dentro de la tabla Historial)
- **🤖 Resumen Técnico para la IA**:
  1. **Ajuste en la Tabla Historial (`Caja.tsx`)**:
     - Se eliminó `<th className="text-right">ACCIONES</th>` del `<thead>` de la tabla de Historial Consolidado de Cajas.
     - Se removió la celda `<td>` de acción en el mapeo de registros históricos.
     - Se actualizó el `colSpan` a `6` para el mensaje de estado sin registros.
     - La tabla de *Turno de Caja Activo* y el botón superior de cierre de turno conservan intacta la funcionalidad operativa de arqueo y cierre.
  2. **Bump de Versión**:
     - Actualizado `.env` a `0.0.27 Dev`.
- **📦 Componentes Modificados**:
  - `src/features/caja/ui/Caja.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 3.88s).

### [2026-08-27 22:58:00] - [UI/UX] - Centrado de Encabezado de Login y Eliminación de Píldora API Central Online
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"eleimina el boton de API Central Online , tambien requiero que el logo-new y Iniciar Sesión queden gravity central"*
- **🤖 Resumen Técnico para la IA**:
  1. **Eliminación de Elemento API Central Online (`Login.tsx`, `Login.css`)**:
     - Se removió la píldora `<div className="api-online-pill">` de la barra superior.
     - Se ajustó `.form-side-top-bar` con `justify-content: flex-end;` para mantener los controles de ventana situados en la esquina superior derecha.
  2. **Centrado del Encabezado (*Gravity Central*) (`Login.css`)**:
     - Se configuró `.form-header-box` con alineación flexible centrada (`display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;`).
     - Se centraron geométricamente `.form-top-logo`, `.form-title` y `.form-subtitle` con `margin: 0 auto; text-align: center;`.
  3. **Bump de Versión**:
     - Actualizado `.env` a `0.0.26 Dev`.
- **📦 Componentes Modificados**:
  - `src/features/auth/ui/Login.tsx`
  - `src/features/auth/ui/Login.css`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 1.87s).

### [2026-08-27 22:55:00] - [UI/UX] [THEME] - Actualización del Color del Menú Lateral a #2a2b2c
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"quiero que ese menu lateral tenga por color #2a2b2c"*
- **🤖 Resumen Técnico para la IA**:
  1. **Actualización de Variables de Color del Sidebar (`index.css`, `DashboardLayout.css`)**:
     - Se actualizó `--bg-sidebar: #2a2b2c;` en `:root` y en `.dashboard-layout` dentro de `src/index.css`.
     - Se actualizó el fallback de `.sidebar` en `src/shared/ui/DashboardLayout.css` a `background: var(--bg-sidebar, #2a2b2c);`.
     - La marca de agua vectorial y los contrastes de navegación heredan reactivamente la variable `--bg-sidebar`.
  2. **Bump de Versión**:
     - Actualizado `.env` a `0.0.25 Dev`.
- **📦 Componentes Modificados**:
  - `src/index.css`
  - `src/shared/ui/DashboardLayout.css`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 1.69s).

### [2026-08-27 22:51:00] - [BUGFIX] [UI/UX] - Eliminación del Botón Invisible en el Menú Lateral
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"en el menu desplegable veo que queda un boton invisible , te lo señale en rojo , eliminalo"* (Captura con el recuadro vacío/invisible sobre el botón de Dashboard)
- **🤖 Resumen Técnico para la IA**:
  1. **Diagnóstico y Corrección en `DashboardLayout.tsx`**:
     - Existía un condicional `{user?.isSuperAdmin && inspectedCompany && (<button className="nav-item" ...></button>)}` sin texto ni icono dentro de `<nav className="nav-menu">`.
     - Esto generaba un botón fantasma/invisible con borde y fondo translúcido antes del botón de *Dashboard*.
     - Se eliminó dicho bloque de código, dado que la salida del modo inspección se gestiona de forma oficial y destacada en el banner superior `.impersonation-bar`.
  2. **Bump de Versión**:
     - Actualizado `.env` a `0.0.24 Dev`.
- **📦 Componentes Modificados**:
  - `src/shared/ui/DashboardLayout.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 1.69s).

### [2026-08-27 22:49:00] - [BUGFIX] [UI/UX] [MOBILE] - Adaptación Elástica, Wrap-Content y Scroll Aislado en Monitoreo y Control de Caja
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"en monitoreo y control de caja veo que las cards que te señale en amarillo tienen un tamaño fijo y no son wrap content , adicional en la version mobile no se ven lo que te señale en amarillo"*
- **🤖 Resumen Técnico para la IA**:
  1. **Cards Elásticas con Auto-Ajuste / Wrap Content (`Caja.tsx`, `Caja.css`)**:
     - Se rediseñó `.caja-stats-grid` como grilla elástica (`repeat(auto-fit, minmax(220px, 1fr))` y `1fr` en pantallas móviles) con `width: 100%`, `min-width: 0` y `box-sizing: border-box`.
     - Las tarjetas `.caja-stat-card` ahora ajustan su contenido fluidamente con `.caja-stat-info` elástica (`word-break: break-word;` y padding compacto de 12px 14px en móvil), previniendo cualquier desbordamiento o tamaño rígido.
  2. **Scroll Lateral Aislado en Tablas de Caja (`.caja-table-wrapper`)**:
     - Se encapsularon ambas tablas (*Turno de Caja Activo* e *Historial Consolidado de Cajas*) dentro de `<div className="caja-table-wrapper">` con `overflow-x: auto; -webkit-overflow-scrolling: touch;`.
     - Esto evita que los `min-width: 640px` de las tablas expandan el contenedor maestro a más de 700px, protegiendo las columnas derechas (Totales en Caja, Botones Cerrar Turno, Estado, Acciones) de quedar cortadas u ocultas fuera de la pantalla en dispositivos móviles.
  3. **Barra de Filtros y Header Adaptables**:
     - Se reorganizó la barra de filtros con `.caja-filters-group` y `.caja-filter-box` para que los selectores de operador, fecha y el botón de exportación a Excel se alineen y se ajusten al ancho de pantalla en smartphones sin desbordar.
  4. **Bump de Versión**:
     - Actualizado `.env` a `0.0.23 Dev`.
- **📦 Componentes Modificados**:
  - `src/features/caja/ui/Caja.css`
  - `src/features/caja/ui/Caja.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 10.77s).

### [2026-08-27 22:38:00] - [BUGFIX] [UI/UX] [MOBILE] - Rediseño Responsive y Ajuste Visual del Centro de Reportes Financieros y Operativos
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"perfecto, vamos bien , ahora cuando entro a centro de reportes y financieros y operativos encuentro que lo que envie y señale en rojo no se ve bien , se cortado, ajustalo"* (Captura con los botones de filtro desbordados a la derecha y cortados en el borde inferior)
- **🤖 Resumen Técnico para la IA**:
  1. **Solución al Desbordamiento de la Barra de Filtros (`Reports.tsx`, `Reports.css`)**:
     - Se reemplazó el contenedor rígido por `.reports-filters-card`, `.reports-filters-row`, `.filter-pills-container` y `.filter-pill`.
     - En pantallas móviles (`<= 768px`), `.filter-pills-container` ocupa el 100% del ancho del card y los botones (`Todos`, `Por Día`, `Rango Fechas`) se distribuyen equitativamente con `flex: 1 1 0; text-align: center;`, eliminando cualquier corte o desbordamiento horizontal.
     - Los selectores de fecha (`.filter-date-box`, `.filter-custom-range`) se adaptan fluidamente debajo de los botones en pantallas móviles.
  2. **Grilla 2x2 para Tarjetas de Métricas (`Reports.css`)**:
     - Se rediseñó `.reports-stats-grid` para que en celulares (`<= 768px`) se organice en una grilla de **2 columnas x 2 filas** (`grid-template-columns: repeat(2, 1fr); gap: 10px;`) con tipografía y paddings optimizados (`.report-stat-card`, `.report-stat-label`, `.report-stat-value`). Esto reduce la altura vertical ocupada y permite ver las 4 métricas de un solo vistazo.
  3. **Scroll Horizontal Aislado en Tabla de Transacciones (`Reports.tsx`, `Reports.css`)**:
     - Se encapsuló la tabla de transacciones en `.reports-table-wrapper` con `overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;` y `min-width: 660px;` en `.reports-table`, protegiendo el layout general de desbordamientos.
  4. **Eliminación de Doble Scroll Container**:
     - Se eliminó el `height: 100%; overflow-y: auto;` redundante en `.reports-container`, permitiendo que el scroll del layout principal (`.main-content`) opere de manera uniforme.
  5. **Bump de Versión**:
     - Actualizado `.env` a `0.0.22 Dev`.
- **📦 Componentes Modificados**:
  - `src/features/reports/ui/Reports.css`
  - `src/features/reports/ui/Reports.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 1.27s).

### [2026-08-27 22:23:00] - [BUGFIX] [ARCHITECTURE] [UI/UX] [MOBILE] - Teleportación Global de Modales a document.body mediante React Portal y Eliminación de Atrapamiento de Stacking Context
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"No pero mira que se sigue viendo el cuadro de los dialogs en la parte superior se ve cortado"* (Captura con la barra superior `top-bar` superpuesta sobre la cabecera del modal)
- **🤖 Resumen Técnico para la IA**:
  1. **Diagnóstico del Atrapamiento de Stacking Context**:
     - En `DashboardLayout.tsx`, la barra superior `<header className="top-bar">` posee `position: relative; z-index: 30;`, mientras que el contenido de las vistas se monta dentro de `<main className="main-content">` (dentro de `<div className="content-wrapper">`, configurado con `overflow: hidden; -webkit-overflow-scrolling: touch;`).
     - En navegadores móviles (especialmente WebKit / iOS Safari), `-webkit-overflow-scrolling: touch` crea un contexto de apilamiento aislado (*isolated stacking context*), haciendo que cualquier elemento `position: fixed` dentro de las vistas hijas quede restringido al nivel 0 de `.main-content`. En consecuencia, la barra superior `.top-bar` (con `z-index: 30`) se pintaba por encima del modal, cubriendo su cabecera y el botón de cierre `X`.
  2. **Arquitectura React Portal (`ModalPortal.tsx`)**:
     - Se creó el componente `ModalPortal` en `src/shared/ui/ModalPortal.tsx` utilizando `createPortal(children, document.body)`.
     - Este componente teleporta el árbol DOM de los modales directamente a la raíz de la página (`<body>`), desvinculándolos de `.content-wrapper`, `.top-bar` y de cualquier contenedor con `overflow` o transformaciones CSS.
     - Se envolvieron todos los modales del sistema en `ModalPortal`:
       - `CompaniesPage.tsx` (Crear empresa, Editar empresa, Ver sedes)
       - `Vehicles.tsx` (Ingreso de vehículo)
       - `Dashboard.tsx` (Detalle de tiquete activo)
       - `Novedades.tsx` (Crear novedad, Resolver novedad, Detalle de novedad, Eliminar novedad)
       - `Caja.tsx` (Apertura de turno, Cierre de turno)
       - `Settings` tabs: `UsuariosTab.tsx`, `ParqueaderosTab.tsx`, `TarifasTab.tsx`, `MediosPagoTab.tsx`, `ResolucionesTab.tsx`, `ConveniosTab.tsx`, `VehiculosConfigTab.tsx`, `RolesTab.tsx`.
  3. **Salvaguarda de Stacking Context en CSS (`DashboardLayout.css`)**:
     - Se añadieron reglas reactivas `.content-wrapper:has(.modal-overlay)` y `.main-content:has(.modal-overlay)` con `z-index: 30000 !important; overflow: visible;`.
  4. **Bump de Versión**:
     - Actualizado `.env` a `0.0.21 Dev`.
- **📦 Componentes Modificados**:
  - `src/shared/ui/ModalPortal.tsx` (NUEVO)
  - `src/shared/ui/DashboardLayout.css`
  - `src/features/companies/ui/CompaniesPage.tsx`
  - `src/features/vehicles/ui/Vehicles.tsx`
  - `src/features/dashboard/ui/Dashboard.tsx`
  - `src/features/novedades/ui/Novedades.tsx`
  - `src/features/caja/ui/Caja.tsx`
  - `src/features/settings/ui/UsuariosTab.tsx`
  - `src/features/settings/ui/ParqueaderosTab.tsx`
  - `src/features/settings/ui/TarifasTab.tsx`
  - `src/features/settings/ui/MediosPagoTab.tsx`
  - `src/features/settings/ui/ResolucionesTab.tsx`
  - `src/features/settings/ui/ConveniosTab.tsx`
  - `src/features/settings/ui/VehiculosConfigTab.tsx`
  - `src/features/settings/ui/RolesTab.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 3.01s).

### [2026-08-27 22:12:00] - [CHORE] [CSS] - Declaración de Propiedad Estándar background-clip para Compatibilidad de Prefijos de Proveedor
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Also define the standard property 'background-clip' for compatibilitycss(vendorPrefix) en dashboard.css"*
- **🤖 Resumen Técnico para la IA**:
  1. Se añadió la propiedad estándar `background-clip: initial;` inmediatamente después de `-webkit-background-clip: initial;` en `.dashboard-hero-title h1` (`src/features/dashboard/ui/Dashboard.css`).
  2. Esto elimina la advertencia de linting de CSS (`vendorPrefix / compatibilitycss`) y asegura compatibilidad total según los estándares W3C.
- **📦 Componentes Modificados**:
  - `src/features/dashboard/ui/Dashboard.css`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron en 1.21s).

### [2026-08-27 22:02:00] - [BUGFIX] [UI/UX] [MOBILE] - Corrección Global Responsive de Modales y Diálogos (Solución Flexbox Scroll Loss & Safe-Areas)
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Me podrias ayudar a dejar que todos los dialogos de mi pwa como por ejemplo la imagen que mostre se vean reponsive , si te das cuenta siempre entrecortan en la parte superior e inferior"*
- **🤖 Resumen Técnico para la IA**:
  1. **Solución Integral al Efecto "Flexbox Scroll Loss" con Formularios (`index.css`, `CompaniesPage.css`, `Settings.css`)**:
     - Se añadió la regla `.modal-card > form, .modal-content > form, .modal-container > form { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; height: 100%; width: 100%; }`.
     - Esto garantiza que el tag `<form>` no actúe como bloque estático sin límite de altura, permitiendo que `.modal-body` gestione su scroll interno (`overflow-y: auto`) mientras que `.modal-header` y `.modal-footer` permanecen siempre fijos, visibles y accesibles en la pantalla.
  2. **Adaptación a Dynamic Viewport (`100dvh`) y Safe-Areas (`index.css`, `CompaniesPage.css`, `Settings.css`)**:
     - Se actualizaron todos los `.modal-overlay` a `z-index: 20000; inset: 0; padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); overflow: hidden;`.
     - Se limitaron las tarjetas modales a `max-height: calc(100dvh - max(32px, env(safe-area-inset-top) + env(safe-area-inset-bottom)))` (y `calc(100dvh - max(16px, ...))` en pantallas móviles), asegurando que ningún elemento quede tapado por las barras de navegación ni de herramientas de Safari iOS o Chrome Android.
  3. **Disposición Fluida en Móvil de Grillas y Botones**:
     - Se adaptaron `.form-grid-2` y `.form-row` a 1 columna en resoluciones `<= 768px`.
     - Se configuró `.modal-footer` con `flex-wrap: wrap` y botones adaptables para que no se corten en anchos reducidos.
  4. **Bump de Versión**:
     - Actualizado `.env` a `0.0.20 Dev`.
- **📦 Componentes Modificados**:
  - `src/index.css`
  - `src/features/companies/ui/CompaniesPage.css`
  - `src/features/settings/ui/Settings.css`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron limpiamente en 1.39s).

### [2026-08-27 21:25:00] - [BUGFIX] [UI/UX] [MOBILE] - Corrección de Desbordamiento y Ajuste Responsive de Tarjetas en Dashboard Móvil
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"ajstuame esa card de ocupacion y capacidad de instalaciones y resumen de heviculos activos de la dashboard en la version mobile, ya que se ve cortada en la derecha"*
- **🤖 Resumen Técnico para la IA**:
  1. **Contención Estricta de Anchos y Grids (`Dashboard.css`)**:
     - Se añadió `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;` a `.dashboard-container`, `.dashboard-main-grid` y `.dashboard-card`. Esto previene que el cálculo de `1fr` en el grid padre se expanda debido a anchos intrínsecos de componentes hijos.
  2. **Scroll Horizontal Aislado en la Tabla de Vehículos Activos (`Dashboard.tsx`, `Dashboard.css`)**:
     - Se envolvió la tabla `.active-stream-table` en un contenedor dedicado `.stream-table-wrapper` con `overflow-x: auto; width: 100%; max-width: 100%; min-width: 0; -webkit-overflow-scrolling: touch;`.
     - Se configuró `min-width: 440px` en la tabla para mantener la legibilidad de todas las columnas ("PLACA / TIQUETE", "CATEGORÍA", "INGRESO", "ESTANCIA", "VER") con scroll lateral suave dentro de su tarjeta, evitando que desborde el layout de la pantalla móvil.
  3. **Optimización de Píldoras de Ocupación y Grilla de Categorías (`Dashboard.css`)**:
     - En `@media (max-width: 768px)` y `@media (max-width: 480px)`, se optimizó el padding de `.dashboard-card` (`1rem` / `0.85rem`) y `.occupancy-meter-container` (`0.9rem` / `0.75rem`).
     - Se ajustó `.occupancy-stats-pills` con `gap: 6px`, `min-width: 0`, texto elipsado en etiquetas (`.occ-pill-label`) y valores numéricos adaptativos, evitando que la píldora de "DISPONIBLES" se corte en el extremo derecho.
     - Se adaptó `.category-breakdown-grid` a `grid-template-columns: repeat(2, 1fr)` con `gap: 8px` para una distribución uniforme de 2x2.
  4. **Clases CSS Responsivas para Secciones de Consolidado y Cajas (`Dashboard.tsx`, `Dashboard.css`)**:
     - Se reemplazaron los estilos inline rígidos con `minmax(320px, ...)` por las clases `.consolidated-summary-card`, `.consolidated-summary-grid` y `.operator-shifts-grid`, garantizando que ninguna sección adyacente empuje el ancho del viewport en dispositivos móviles reducidos.
  5. **Bump de Versión**:
     - Actualizado `.env` a `0.0.19 Dev`.
- **📦 Componentes Modificados**:
  - `src/features/dashboard/ui/Dashboard.css`
  - `src/features/dashboard/ui/Dashboard.tsx`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron exitosamente en 1.19s).

### [2026-08-27 21:15:00] - [FEAT] [UI/UX] [MOBILE] - Eliminación Definitiva del Menú Inferior Móvil (Bottom Navigation Bar)
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"ayudame para que en el pwa en la version moblie, no se deja en ningun lado de la pwa este menu inferior"*
- **🤖 Resumen Técnico para la IA**:
  1. **Eliminación de `<nav className="bottom-nav-bar">` (`DashboardLayout.tsx`)**:
     - Se removió por completo la barra de navegación inferior fija para móviles.
     - Toda la navegación en móvil se centraliza de forma limpia y accesible a través del menú lateral tipo drawer (accesible desde el botón de menú hamburguesa `☰` en la cabecera superior).
  2. **Ajuste de Estilos y Viewport Móvil (`DashboardLayout.css`)**:
     - Se eliminaron las reglas CSS de `.bottom-nav-bar` y `.bottom-nav-item`.
     - Se optimizó el `padding-bottom` de `.main-content` en dispositivos móviles (`@media (max-width: 768px)` y `@media (max-width: 480px)`), reemplazando el margen reservado de `calc(76px + env(safe-area-inset-bottom))` por un espaciado limpio `max(16px, env(safe-area-inset-bottom))`, evitando que se desaproveche espacio vertical o queden espacios en blanco innecesarios.
- **📦 Componentes Modificados**:
  - `src/shared/ui/DashboardLayout.tsx`
  - `src/shared/ui/DashboardLayout.css`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript compilaron exitosamente).

### [2026-08-27 17:46:00] - [FEAT] [UI/UX] - Reemplazo de Logo en Login por logocompleto.jpg
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Quiero que me cargues esta foto como logocompleto.jpg y esta me la pongas en login.tsx aca    <img src="/logo-full.png" alt="Parking Flow" className="hero-main-logo" />"*
- **🤖 Resumen Técnico para la IA**:
  1. Se copió la imagen provista por el usuario bajo el nombre `logocompleto.jpg` en la carpeta `public/` de la PWA.
  2. Se editó `src/features/auth/ui/Login.tsx` para usar `/logocompleto.jpg` en el tag `img` con clase `hero-main-logo`.
- **📦 Componentes Modificados**:
  - `src/features/auth/ui/Login.tsx`
  - `public/logocompleto.jpg` (Imagen nueva)
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-27 16:38:00] - [BUGFIX] [UI/UX] [PWA] - Reubicación de Logos en Layout Móvil y Desktop
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > *"Quedo mal y me entendiste diferente, requiero en esta pantalla que te puse de primeras que es la version mobile, el logo quede mas pequeño y bien responsive... en la web te señale en rojo que el logo que quiero alli es el logo que te anexe y en amarillo el logo que esta en e circulo rojo"*
- **🤖 Resumen Técnico para la IA**:
  1. **Rediseño de Cabecera Móvil y Formulario**: Se eliminó completamente la sección antigua `.mobile-brand-header` que estaba causando que el logo en móviles se cortara y se viera enorme. En su lugar, se inyectó la imagen del icono de Parking Flow (`logo.png`) directamente dentro de `.form-header-box` encima de "Iniciar Sesión" (asignado con la clase `.form-top-logo`).
  2. **Dimensionado Responsive**: A `.form-top-logo` se le asignó un tamaño fijo de `width: 70px` (y `60px` en móviles) para que encaje a la perfección sin deformarse ni ocupar toda la pantalla.
  3. **Corrección de Logo Completo en Desktop (Hero)**: En el panel izquierdo de la versión web (Hero Desktop), se ubicó el nuevo archivo con texto incluido (`logo-full.png`) según las instrucciones marcadas con el círculo rojo por el usuario, completando la disposición solicitada.
- **📦 Componentes Modificados**:
  - `src/features/auth/ui/Login.tsx`
  - `src/features/auth/ui/Login.css`
  - `public/logo-full.png` (Copiado de adjunto)
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-27 15:40:00] - [FEAT] [SAAS] [UX] - Menú Exclusivo SuperAdmin, Impersonación con Persistencia F5, Route Guards y Rediseño Visual
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > _"Listo funciono excelente, pero sabes que veo es que al super admin se le muestra todo el menu como dashboard como caja activos reportes novedades configuracion no deberia ser eso ya con el menu de parqueaderos saas y con lo que se tiene en las opciones que colocaste super bien que no estan de acorde al diseño que se tiene eso si lo creaste horible tu ya tienes los colores entonces corregir eso. aparte debes agregar otra opcion que diga configurar que signifique que yo como super admin pueda ahora si hacer de cuenta que ingrese como administrador si me explico para yo ver todo lo de ese parqueadero pero logico con la opcion de devolverme a mi visual de super admin y cambias asi de parqueaderos si me explico ya que me imagino tienes claro y la BD esta configurada para que todo los medios de pagos tarifas y todo sean independientes a cada parquedero y dentro de cada sede de su parqueadero igual si me hago entender ? analiza"_
- **🤖 Resumen Técnico para la IA**:
  1. **Menú Condicional para SuperAdmin (`DashboardLayout.tsx`)**:
     - En modo global (`user?.isSuperAdmin && !inspectedCompany`), el menú lateral y la barra inferior móvil muestran **únicamente "🏢 Parqueaderos SaaS"**, ocultando completamente los módulos operativos de sede (Caja, Activos, etc.).
  2. **Modo Impersonación / Configurar Parqueadero (`ParqueaderoContext.tsx`, `DashboardLayout.tsx`)**:
     - Se añadieron `inspectedCompany`, `startInspectingCompany(company)` y `stopInspectingCompany()` en `ParqueaderoContext`.
     - Al hacer clic en **"⚙️ Administrar"** en una empresa, se cargan sus sedes mediante `GET /api/Branches/company/{companyId}`, se establece la primera sede como activa y se abre el acceso completo a los módulos operativos de ese cliente.
  3. **Persistencia ante F5 (Page Refresh)**:
     - `inspectedCompany` se almacena en `sessionStorage` (`parkflow_inspected_company`). Al recargar la página, `ParqueaderoContext` restaura automáticamente el contexto de administración del parqueadero sin expulsar al usuario.
  4. **Limpieza Total de Estado al Salir (`stopInspectingCompany`)**:
     - Al salir, se purga `sessionStorage`, se resetea la lista de sedes y la sede activa, y se navega limpiamente a `/dashboard/companies` evitando cualquier data cruzada.
  5. **Protección de Rutas Operativas (Route Guards)**:
     - Si el SuperAdmin está en modo SaaS Global (sin empresa seleccionada) e intenta tipear manualmente `/dashboard/caja`, `/dashboard/vehicles`, etc., es interceptado y redirigido automáticamente a `/dashboard/companies`.
  6. **Banner de Impersonación Superior (`DashboardLayout.tsx`, `DashboardLayout.css`)**:
     - Banner esmeralda superior que indica: `👑 Modo Administración: Gestionando Parqueadero [Nombre] (NIT: [nit])` junto al botón interactivo `🔙 Volver a Plataforma SaaS`.
  7. **Rediseño Visual Integral de `CompaniesPage` (`CompaniesPage.tsx`, `CompaniesPage.css`)**:
     - Adaptado al sistema de diseño oficial de la PWA (`--primary-color: #07665e`, fondos `#f4f7f6` / `#ffffff`, textos `#1e293b` / `#64748b`, bordes `#e2e8f0`).
     - Tarjetas KPI estilizadas, buscador limpio, tabla con badges oficiales de planes (`Basic`, `Pro`, `Enterprise`) y botón primario de acción **"⚙️ Administrar"**.
  8. **Bump de Versión**:
     - Actualizado `.env` a `0.0.16 Dev`.
- **📦 Componentes Modificados**:
  - `src/shared/context/ParqueaderoContext.tsx`
  - `src/shared/ui/DashboardLayout.tsx`
  - `src/shared/ui/DashboardLayout.css`
  - `src/features/companies/ui/CompaniesPage.tsx`
  - `src/features/companies/ui/CompaniesPage.css`
  - `.env`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-27 15:20:00] - [FEAT] [UI/UX] [SUPERADMIN] - Integración /Auth/login, Supresión de Onboarding y Visor de Sedes SaaS
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > _"estoy en estas ramas mira que todo lo que fueras hecho esta en las ramas por que ya se publicto todo y nada es nada me loguee y sigue estando las cosas mal, ya revise la data y todo y esta bien. pero se publico pero no cambia enserio no cambia revisa analiza que todo este en estas ramas."_
- **🤖 Resumen Técnico para la IA**:
  1. **Consumo de Endpoint `/Auth/login` (`authService.ts`)**:
     - Se reemplazó la llamada al endpoint heredado `/Auth/authenticate` por `/Auth/login` (`LoginStandardAsync`), el cual devuelve la carga útil completa `AuthResponseDto` (`isSuperAdmin: true`, `roleName: "Super Administrador"`, `companyId: null`), resolviendo la causa por la cual la PWA trataba al SuperAdmin como un usuario estándar con 0 sedes.
  2. **Desactivación de `ZeroDataOnboardingWizard` para SuperAdmin (`DashboardLayout.tsx`)**:
     - Se añadió la condición `!user?.isSuperAdmin` al asistente inicial de creación de sedes, garantizando que el Super Administrador jamás sea bloqueado al ingresar.
  3. **Redirección Automática al Catálogo SaaS (`Login.tsx`, `App.tsx`)**:
     - Al autenticar un Super Administrador, la PWA navega automáticamente al módulo de gestión de empresas/parqueaderos (`/dashboard/companies`).
  4. **Identificación Canónica del Rol (`authService.ts`, `DashboardLayout.tsx`)**:
     - Se garantiza el display `"👑 Super Administrador"` en el perfil inferior del sidebar y subtítulo de plataforma SaaS global.
  5. **Visor de Sedes por Parqueadero (`CompaniesPage.tsx`)**:
     - Se añadió el botón interactivo de acción **"🏢 Ver Sedes"** en cada fila de la tabla de empresas para consultar `GET /api/Branches/company/{companyId}` con modal dark glassmorphism.
  6. **Incremento de Versión de App (`.env`)**:
     - Versión actualizada a `0.0.15 Dev` para forzar invalidación de caché PWA en navegadores.
- **📦 Componentes Modificados**:
  - `.env`
  - `src/features/auth/data/authService.ts`
  - `src/features/auth/ui/Login.tsx`
  - `src/features/companies/ui/CompaniesPage.tsx`
  - `src/shared/ui/DashboardLayout.tsx`
  - `src/App.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).



### [2026-08-27 13:10:00] - [FEAT] [SAAS] [MULTI-TENANT] - Módulo Central de Gestión de Empresas SaaS y Soporte Multi-Tenant

- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > _"Tengo una consulta, se penso que el sistema es para venderlo pero es un saas completo entonces necesitamos un super admin que nosotros creemos entremos creemos un administrador y le demos ese usuario al man y que le ingrese cree su parqueadero y sus sedes y si le vendemos el producto a otras personas e igual se les cree su usuario administrador y que ingrese registre su parqueadero y sus sedes si me explico como se quiere manejar antes eso si lo entiendes encesito que revises toda la BD si la logica que tenemos si nos da para eso o que tanto se deberia cambiar ? necesito que revises eso y has un analisis completo y el plan completo que se deberia tomar."_
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
  > _"perfecto, asi vamos bien , quiero unos ajustes pequeño como en login, dejamelo asi com mi wpf , ahi te comparto como deberiade quedar y el logo (2da imagen)"_
- **🤖 Resumen Técnico para la IA**:
  1. **Reestructuración Desktop (`Login.tsx`)**: Se limpió la columna izquierda eliminando textos comerciales excesivos para imitar el diseño limpio del WPF. Ahora consta de un fondo oscuro puro, logo centrado ampliado, y títulos con un divisor (`.subtitle-line`). En la parte inferior, se añadió el _pill_ estilo POS.
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
  > _"Noto que ahora en la web se daño en la dashboard lo que te encerre en rojo , tambien cuando en el menu desplegable de lz izquierda, cuando ledoy para ocultarlo, se pierde dejandolo como enla image "_
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
  > _"Quisiera que me mejoraras esto porque al abrir mi pwa en mobile se desajusta cuando quiero crear o editar un usuario , pues no se ven los botones, recuerda que esto no debe afectar la web"_
- **🤖 Resumen Técnico para la IA**:
  1. **Análisis del Problema**: En la vista móvil, el contenedor `.content-wrapper` tenía asignado `z-index: 1; position: relative;`. Esto generaba un _Stacking Context_ que atrapaba al modal (`.modal-overlay` con `z-index: 9000`) dentro de él. Como el _bottom navigation bar_ (`.bottom-nav-bar`) tenía `z-index: 40` y estaba fuera del `.content-wrapper`, este se renderizaba obligatoriamente por encima de cualquier elemento dentro del `.content-wrapper`, ocultando así la parte inferior del modal (los botones de Guardar y Cancelar).
  2. **Solución Implementada (`DashboardLayout.css`)**:
     - Se eliminó la regla `z-index: 1;` del `.content-wrapper` exclusivamente en el `@media (max-width: 768px)`.
     - Esto destruye el _Stacking Context_ innecesario, permitiendo que el modal (`z-index: 9000`) ahora flote correctamente sobre la barra inferior (`z-index: 40`) en dispositivos móviles.
     - **Nota**: El cambio se realizó estrictamente en las directivas de responsividad móvil, asegurando al 100% que la versión web (Desktop) se mantenga completamente inalterada tal como fue requerido.
- **📦 Componentes Modificados**:
  - `src/shared/ui/DashboardLayout.css`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript).

### [2026-08-27 10:20:00] - [FEATURE] [UI/UX] [NOVEDADES] [SIDEBAR] - Puesta en Marcha de Módulo de Novedades (Bloqueo Centralizado de Placas) y Sidebar Colapsable en Desktop Web

- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > _"Ahora ayudame en poner en ejecucion el modulo de novedades, ayudame a conectarla creacion de la novedad, la cual debe de ir por api hacia a BD, para que luego el wpf pueda identificar que existe una placa con novedad y no permita registarle entrada (no toques el wpf), adicional quiero que el menu desplegable de a izquierda en la web permita ocultarse asi como se hace en la version mobile"_
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
  > _"Quisiera que me mejoraras esto porque al abrir mi pwa en mobile se desajusta , adicional veo que no me alcanza a mostrar los botones de cancelar y guardar al editar un usuario"_
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
     - Se optimizó `.dashboard-hero-header` con padding ergonómico (`1.1rem 1.25rem`), `line-height: 1.3`, y `overflow: visible`, eliminando el recorte superior del título _"Dashboard General"_ y alineando la insignia _● EN LÍNEA_ y el botón de actualización.
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
  > _"quita el tema de la modal aun sigue sin funcionar despues lo trabajamos con mas tiempo pro que no esta funcionando como deberia funcionar por que listo ya actualiza y bien pero cada 5 segundo vuelve a salir no tiene ningun sentido ni nada eso no deberia funcionar así no se que le sucede pero debo avanzar y ya hemos realizado demasiados ajustes."_
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
  > _"ahora no es un bucle ahora le di y se quedo hay pensando ahora que será enserio necesito que quede ya funcionando completamente sin tantos cambios analiza"_
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
  > _"Ups ocurrio algo raro ya no me manda a un 404, pero le doy actualizar intenta quedar en el login y boom vuelve a salir el tema de actualización y así un bucle completo que sucede hay ? ya desde que le de actualizar yad eberia saltar eso no ?"_
- **🤖 Resumen Técnico para la IA**:
  1. **Activación Inmediata de Service Worker (`vite.config.ts`)**:
     - Se añadieron `skipWaiting: true` y `clientsClaim: true` en la configuración `workbox` de `VitePWA` para que el nuevo SW reclame los clientes inmediatamente sin retenciones de hilos ni estados _waiting_ residuales.
  2. **Purga, Desregistro y Recarga Limpia (`UpdatePromptModal.tsx`)**:
     - Al presionar _"Actualizar Ahora"_:
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
  > _"Funciono excelente pero tenemos un error sucede que cuando se coloca en el navegador www.parking-flow.com el de una pues ingresa al login osea la ruta queda www.parking-flow.com/login pero cuando le doy click al actualizar ahora el sistema manda a esa ruta y esa ruta no existe en el servidor, el deberia en la rutas no se como se maneja aca en react pero que el login lo redirija a la pantalla www.parking-flow.com si me hago entender se que eso es temas de enrutamiento de la pwa analiza eso y me explicas."_
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
  - `public/web.config` _(NUEVO)_
  - `public/.htaccess` _(NUEVO)_
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Precache y bundle generados exitosamente.
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > _"No me esta lanzando el pop de actualización para que yo como cliente le pueda dar click y actualizar que sucede se quedo pegado hay no llego nada pense que no habia actualizado pero ingrese en otro telefono y si de una quedo bien hiciste lo del movil bien y lo de usuario y contraseña tambien pero lo de que salga el mensaje de actualización requerida nada no sale por que ? si en angular si sucede yo dejo quieta la pagina y si hago cambios el automaticamente en cuestion de segundos como 5 segundos despues de desplegado sale el mensaje. analiza eso."_
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
  > _"quita el llenado automatico lo de usuario y contraseña eso deberia estar vacia, aparte modifica el login para que se vea bien en movil como deberia ser un login en movil por que cuando se instale la aplicacion en un dispositivo se vea perfectamente, aparte tambien agrega la version del sistema eso deberia estar en el .env donde yo le vaya cambiando la version para asi saber que si actualizo y en que version estamos trabajando inica con 0.0.1 Dev analiza esos cambios."_
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
  > _"Necesito hacer un cambio en la pwa de react, sucede que se realiza el despliegue completo bien pero en el navegador se queda pegado el cache entonces necesito que el sistema como es una pwa detecte cuando existe otro cambio en el servidor aparezca una modal que bloquee al usuario o mejor dicho obligue si o si a que actualice eso haga que si o si refrersque todo y elimine cache del navegador o si la tienen instalada si me explico ? dime que tan dificil sería hacer eso ? analiza eso ."_
- **🤖 Resumen Técnico para la IA**:
  1. **Control Reactivo del Ciclo de Vida PWA (`vite.config.ts`)**:
     - Se ajustó `registerType: 'prompt'` en el plugin `VitePWA` para delegar el control de activación al hook interactivo de React.
  2. **Detección Proactiva de Nuevos Despliegues (`UpdatePromptModal.tsx`)**:
     - Implementado con `useRegisterSW` de `virtual:pwa-register/react`.
     - **Sondeo Periódico**: Consulta automática de actualización al Service Worker cada 60 segundos (`registration.update()`).
     - **Sondeo por Foco / Reapertura**: Al recuperar el foco de la ventana o abrir la PWA instalada (`window.addEventListener('focus')`), verifica si existe una nueva versión en el servidor.
  3. **Comportamiento Bloqueante y Purga Total de Caché**:
     - Al detectar `needRefresh === true`, se despliega una modal en pantalla completa (`backdrop-filter: blur(14px)`, `z-index: 9999999`) que impide que el usuario continúe operando con assets obsoletos.
     - Al pulsar _"Actualizar Ahora"_:
       1. Elimina todo el almacenamiento en `window.caches` (`caches.delete(...)`).
       2. Envía orden de activación forzada al nuevo Service Worker (`updateServiceWorker(true)` / `skipWaiting()`).
       3. Ejecuta `window.location.reload()`.
  4. **Montaje Global (`App.tsx`)**:
     - `<UpdatePromptModal />` se encuentra montado en la raíz de la aplicación para proteger todas las vistas y rutas.
- **📦 Componentes Modificados**:
  - `vite.config.ts`
  - `src/vite-env.d.ts`
  - `src/shared/ui/UpdatePromptModal.tsx` _(NUEVO)_
  - `src/shared/ui/UpdatePromptModal.css` _(NUEVO)_
  - `src/App.tsx`
  - `src/main.tsx`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - `npm run build`: **0 Errores** (Vite + TypeScript). Service worker `dist/sw.js` y 21 precache entries generadas exitosamente.
- **Autor**: Antigravity AI Assistant & Frontend Software Architect
- **💬 Prompt Original del Usuario**:
  > _"no veo que este registrando en el log de cambios o el historial de cambios como regla que se habia creado en agent.md"_
- **🤖 Resumen Técnico para la IA**:
  1. **Estandarización Multi-PC**:
     - Se crea formalmente [`AGENTS.md`](file:///c:/Users/miguelagutierrezg/source/pwa/ParkingPwa/AGENTS.md) y [`HISTORIAL_CAMBIOS.md`](file:///c:/Users/miguelagutierrezg/source/pwa/ParkingPwa/HISTORIAL_CAMBIOS.md) en el repositorio raíz de la PWA (`ParkingPwa`), alineándose con los estándares de `ParkingWpf` y `ParkingApi`.
     - Todo cambio futuro en la PWA (React + Vite + TypeScript) deberá registrarse obligatoriamente en este documento y validar compilación exitosa con `npm run build`.
- **📦 Componentes Modificados**:
  - `AGENTS.md`
  - `HISTORIAL_CAMBIOS.md`
- **✅ Verificación y Compilación**:
  - Archivos creados y formateados según el estándar oficial.
