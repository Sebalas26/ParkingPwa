# 📜 REGLAS ESTRICTAS DE DESARROLLO Y ARQUITECTURA PARA LA IA (PARKING PWA)

Este documento define las **Reglas de Oro y Estándares Obligatorios** para cualquier asistente de IA o desarrollador trabajando en la aplicación web progresiva (Parking PWA - React + Vite + TypeScript). **Estas reglas son inquebrantables.**

---

## 🛑 1. REGLA DE ORO: PLANIFICACIÓN PREVIA OBLIGATORIA
1. **Nunca modificar ni crear código directamente** ante una nueva solicitud o cambio de comportamiento sin antes elaborar un **Plan de Arquitectura e Implementación** detallado (`implementation_plan.md`).
2. **Esperar siempre la aprobación explícita del usuario** antes de ejecutar cualquier edición en los archivos del proyecto o instalar dependencias.

---

## 🎨 2. ESTÁNDARES DE DISEÑO Y ARQUITECTURA PWA
1. **Diseño Dark Glassmorphism y UI Consistente**:
   - Mantener la paleta oficial (`#0b0f19`, `#111827`, acentos `#10b981`, `#06b6d4`, `#6366f1`).
   - Usar íconos oficiales de `lucide-react`.
2. **Control de Ciclo de Vida PWA y Service Worker**:
   - Gestión reactiva del Service Worker (`vite-plugin-pwa`) con detección automática de nuevas versiones y forzado de purga de caché (`CacheStorage`).
3. **Multi-Sede y RBAC**:
   - Respetar el contexto de la sede activa (`useBranchContext`) y los permisos del usuario (`authService.hasPermission`).

---

## 📝 3. PROTOCOLO ESTRICTO DE REGISTRO Y CONTEXTO MULTI-PC
> [!IMPORTANT]
> **PRESERVACIÓN DE CONTEXTO ENTRE COMPUTADORES**: Como el desarrollo se realiza alternando entre diferentes estaciones de trabajo (PCs), este protocolo garantiza que la IA nunca pierda el hilo técnico ni el contexto acumulado.

1. **Registro Obligatorio en Cada Modificación**:
   - Toda modificación, corrección de bug o nueva funcionalidad debe registrarse de inmediato en [`HISTORIAL_CAMBIOS.md`](file:///c:/Users/miguelagutierrezg/source/pwa/ParkingPwa/HISTORIAL_CAMBIOS.md) antes de finalizar el turno.
2. **Estructura Requerida para Cada Entrada**:
   - **`💬 Prompt Original del Usuario`**: Transcripción exacta o requerimiento solicitado por el usuario.
   - **`🤖 Resumen Técnico para la IA`**: Explicación técnica de arquitectura, contratos de datos modificados, DTOs, componentes creados/editados, decisiones tomadas, estado del sistema y advertencias relevantes.
   - **`📦 Componentes Modificados`**: Lista precisa de rutas de archivos modificados, creados o eliminados.
   - **`✅ Verificación y Compilación`**: Resultado de compilación `npm run build` (**0 Errores**) y pruebas funcionales.
3. **Directiva de Reanudación de Sesión (Nuevo PC / Nueva Conversación)**:
   - Cuando el usuario inicie en otro computador o abra un nuevo chat e indique *"Lee el historial de cambios / contexto"* o similar, la IA **DEBE LEER OBLIGATORIAMENTE `HISTORIAL_CAMBIOS.md`** como primer paso antes de elaborar planes o tocar código.
4. **Cero Errores de Compilación**:
   - Todo cambio debe compilar limpiamente con `npm run build` (**0 Errores**) antes de dar por finalizada la tarea.
