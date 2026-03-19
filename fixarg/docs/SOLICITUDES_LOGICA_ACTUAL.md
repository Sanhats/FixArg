# Lógica actual de solicitudes (investigación)

Resumen de cómo se manejan las **solicitudes** en el sistema desde ambas partes: **cliente (usuario)** y **trabajador (profesional)**.

---

## Flujo por servicio y presupuestos (nuevo)

1. **Cliente** elige **servicio/rubro** (ej. Plomería) y completa el formulario (descripción, fecha, hora, dirección, etc.). POST con `servicioRubro` (sin elegir trabajador).
2. **Sistema** crea una solicitud en estado `pendiente_presupuestos` con `trabajador_id` NULL. Notifica a los trabajadores del rubro (ordenados por puntos, top N).
3. **Trabajadores** del rubro ven la solicitud en "Solicitudes disponibles" y envían un **presupuesto** (monto + mensaje opcional) vía POST `/api/presupuestos`.
4. **Cliente** ve los presupuestos en el detalle de la solicitud y **aprueba uno**. PATCH con `action: 'approve_presupuesto'` y `presupuestoId`. Se asigna el trabajador a la solicitud y el estado pasa a `confirmada`.
5. El resto del flujo es el mismo: iniciar trabajo, finalizar. Al **completar** el trabajo se suman **puntos** al cliente y al trabajador (prioridad futura).

**Flujo legacy:** el cliente puede seguir eligiendo un trabajador concreto desde la grilla de servicios y enviar una solicitud directa (`trabajadorId`); en ese caso la solicitud se crea en estado `pendiente` y solo ese trabajador la recibe.

---

## 1. Modelo de datos (Supabase)

**Tabla `solicitudes`:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `descripcion` | TEXT | Descripción del trabajo |
| `fecha` | TEXT | Fecha preferida |
| `hora` | TEXT | Hora preferida |
| `trabajador_id` | UUID | FK → trabajadores (nullable hasta aprobar presupuesto) |
| `usuario_id` | UUID | FK → usuarios (cliente) |
| `servicio_rubro` | TEXT | Servicio/rubro elegido (slug; NULL en solicitudes antiguas) |
| `estado` | TEXT | Ver estados abajo |
| `fecha_creacion` | TIMESTAMPTZ | Creación |
| `fecha_actualizacion` | TIMESTAMPTZ | Última actualización |
| `started_at` | TIMESTAMPTZ | Cuando el trabajador marca "Iniciar trabajo" |
| `completed_at` | TIMESTAMPTZ | Cuando el trabajador marca "Finalizar trabajo" |
| `responded_at` | TIMESTAMPTZ | Cuando el trabajador acepta/rechaza |
| `direccion` | TEXT | Dirección del servicio (opcional) |
| `duracion_estimada` | TEXT | Ej. "2 horas" (opcional) |
| `fotos_json` | JSONB | Array de URLs de fotos (opcional) |

**Estados posibles (CHECK):**

- `pendiente` → solicitud directa a un trabajador, esperando aceptar/rechazar
- `pendiente_presupuestos` → solicitud por rubro, esperando presupuestos de trabajadores
- `confirmada` → trabajador aceptó o cliente aprobó un presupuesto
- `rechazada` → trabajador rechazó
- `en_progreso` → trabajador marcó "Iniciar trabajo"
- `completada` → trabajador marcó "Finalizar trabajo"; se suman puntos a cliente y trabajador
- `cancelada_por_trabajador`
- `cancelada_por_cliente`

**Tabla `presupuestos`:**

- `id`, `solicitud_id`, `trabajador_id`, `monto`, `mensaje` (opcional), `estado` (enviado | aprobado | rechazado), `fecha_creacion`, `fecha_actualizacion`. UNIQUE(solicitud_id, trabajador_id).

**Puntos:** columnas `puntos` (INTEGER DEFAULT 0) en `usuarios` y `trabajadores`. Se incrementan al completar un trabajo (ej. +10 cada uno). Usados para prioridad: al notificar trabajadores del rubro se toma top N por puntos; las solicitudes disponibles se ordenan por puntos del cliente.

**Relaciones:**

- Mensajes (`mensajes`) por `solicitud_id` (chat una vez asignado el trabajador).
- Reseñas (`reviews`) por `solicitud_id` (una por solicitud completada).

---

## 2. APIs

### 2.1 Cliente (usuario)

| Método | Ruta | Quién | Descripción |
|--------|------|--------|-------------|
| **POST** | `/api/solicitudes` | Cliente (role `user`) | Crear solicitud. Body: `descripcion`, `fecha`, `hora`; y **o bien** `servicioRubro` (solicitud por rubro, estado `pendiente_presupuestos`) **o bien** `trabajadorId` (solicitud directa, estado `pendiente`). Opcionales: `direccion`, `duracionEstimada`, `fotos`. |
| **GET** | `/api/solicitudes` | Cliente o trabajador | Lista solicitudes: cliente por `usuario_id`, trabajador por `trabajador_id`. Incluye `servicioRubro` y join a `trabajadores` cuando hay asignado. |
| **GET** | `/api/solicitudes/[id]` | Cliente, trabajador asignado o trabajador en rubro (si pendiente_presupuestos) | Detalle con `usuario`, `trabajador` (si asignado) y lista `presupuestos`. |
| **PATCH** | `/api/solicitudes/[id]` | Solo cliente | Cancelar: `{ "action": "cancel" }` (estados pendiente, pendiente_presupuestos o confirmada). Aprobar presupuesto: `{ "action": "approve_presupuesto", "presupuestoId": "..." }` (solo si estado pendiente_presupuestos). |

### 2.2 Presupuestos

| Método | Ruta | Descripción |
|--------|------|-------------|
| **POST** | `/api/presupuestos` | Trabajador envía presupuesto. Body: `solicitudId`, `monto`, `mensaje` (opcional). El trabajador debe estar en el rubro de la solicitud y no tener ya un presupuesto. |

### 2.3 Trabajador

| Método | Ruta | Descripción |
|--------|------|-------------|
| **GET** | `/api/trabajador/solicitudes` | Devuelve `solicitudes` (asignadas a él) y `solicitudesDisponibles` (pendiente_presupuestos en su rubro, ordenadas por puntos del cliente). |
| **GET** | `/api/trabajador/solicitudes/[id]` | Detalle de una solicitud (solo si es del trabajador asignado). |
| **PUT** | `/api/trabajador/solicitudes/[id]` | Acciones: `accept`, `reject`, `start`, `complete`, `cancel`. Al `complete` se suman puntos al cliente y al trabajador. |

**Reglas de acciones (trabajador):**

- **accept**: solo si `estado === 'pendiente'` y dentro del plazo de 24 h desde `fecha_creacion`. → `confirmada`, setea `responded_at`.
- **reject**: solo si `pendiente` y dentro de 24 h. → `rechazada`, setea `responded_at`.
- **start**: solo si `confirmada`. (Ventana horaria desactivada: el trabajador puede iniciar en cualquier momento.) → `en_progreso`, setea `started_at`.
- **complete**: solo si `en_progreso`. → `completada`, setea `completed_at`.
- **cancel**: solo si `pendiente` o `confirmada`. → `cancelada_por_trabajador`.

En todas las transiciones se actualiza `fecha_actualizacion` y se disparan notificaciones (y en algunos casos emails) al cliente.

---

## 3. Flujo en la UI

### 3.1 Lado cliente (usuario)

1. **Crear solicitud**
   - **Dónde:** `/servicios/[id]` (perfil del trabajador).
   - Formulario en página (no usa `SolicitudTrabajoForm` en esa ruta): descripción, fecha, hora, dirección, duración estimada, fotos.
   - POST a `/api/solicitudes` con `trabajadorId` y datos; el backend toma `usuario_id` del JWT.
   - Tras éxito → redirección a `/mis-solicitudes`.

2. **Listar solicitudes**
   - **Dónde:** `/mis-solicitudes`.
   - GET `/api/solicitudes` (cliente ve por `usuario_id`).
   - Se agrupan en “En curso” (pendiente, confirmada, en_progreso) y “Completadas e historial” (completada, rechazada, canceladas).

3. **Detalle y acciones**
   - **Dónde:** `/solicitudes/[id]`.
   - GET `/api/solicitudes/[id]` para detalle (con usuario y trabajador).
   - **Cliente puede:**
     - Cancelar (pendiente o confirmada): PATCH `/api/solicitudes/[id]` con `{ "action": "cancel" }`.
   - Chat: componente `Chat` con `solicitudId`; mensajes vía API de mensajes (asociados a la solicitud).
   - Si estado `completada`, el cliente puede enviar reseña (POST `/api/reviews` con `solicitudId`, `workerId`, rating, comment).

### 3.2 Lado trabajador

1. **Listar solicitudes**
   - **Dónde:** `/trabajador/dashboard`.
   - GET `/api/trabajador/solicitudes`.
   - Se muestran en secciones: “Solicitudes nuevas” (pendiente), “Trabajos confirmados”, “En progreso”, “Historial”.

2. **Acciones en dashboard**
   - En confirmadas: botón “Cancelar solicitud” → PUT `/api/trabajador/solicitudes/[id]` con `action: 'cancel'`.
   - En progreso: “Finalizar trabajo” → `action: 'complete'`.
   - Para aceptar/rechazar se indica “Ver detalle”.

3. **Detalle y acciones**
   - **Dónde:** mismo `/solicitudes/[id]` (la página detecta si es trabajador por `user.role === 'trabajador'` o por `solicitud.trabajadorId === user._id`).
   - GET `/api/solicitudes/[id]` (el backend permite acceso a cliente o trabajador de la solicitud).
   - **Trabajador puede:**
     - Pendiente: “Aceptar” / “Cancelar solicitud” (si no pasaron 24 h desde creación). Plazo mostrado como “Responde antes de: …”.
   - **Rechazar** no está expuesto en la UI del detalle actual (solo Aceptar y Cancelar); el backend sí soporta `reject`.
   - Confirmada: “Iniciar trabajo” (en cualquier momento; ventana horaria desactivada), “Cancelar solicitud”.
   - En progreso: “Finalizar trabajo”.
   - Completada: “Mostrar comprobante” (placeholder).

---

## 4. Puntos a tener en cuenta para cambios

- **Un solo trabajador por solicitud:** cada solicitud tiene un único `trabajador_id` (cliente elige a un profesional concreto desde `/servicios/[id]`).
- **Plazo de 24 h:** el trabajador solo puede aceptar/rechazar dentro de las 24 h desde `fecha_creacion`; pasado eso, el backend devuelve error.
- **Iniciar trabajo:** actualmente sin ventana horaria (el trabajador puede iniciar en cualquier momento).
- **Cancelación:** cliente solo por PATCH en `/api/solicitudes/[id]`; trabajador por PUT en `/api/trabajador/solicitudes/[id]` con `action: 'cancel'`.
- **Componente `solicitud-trabajo-form.jsx`:** existe pero la página de perfil de trabajador (`/servicios/[id]`) no lo usa; tiene su propio formulario inline con más campos (dirección, duración, fotos).
- **Mensajes:** siempre atados a una solicitud (`solicitud_id`); la API de mensajes comprueba que emisor sea parte de la solicitud.
- **Notificaciones y email:** creación de solicitud, aceptación, rechazo, inicio/fin de trabajo y cancelaciones generan notificación y en algunos casos email (lib/notifications, lib/email).

---

## 5. Archivos relevantes

| Área | Archivos |
|------|----------|
| API cliente | `app/api/solicitudes/route.js`, `app/api/solicitudes/[id]/route.js` |
| API trabajador | `app/api/trabajador/solicitudes/route.js`, `app/api/trabajador/solicitudes/[id]/route.js` |
| UI cliente | `app/mis-solicitudes/page.jsx`, `app/solicitudes/[id]/page.jsx`, `app/servicios/[id]/page.jsx` |
| UI trabajador | `app/trabajador/dashboard/page.jsx`, misma `app/solicitudes/[id]/page.jsx` para detalle |
| Formulario (alternativo) | `components/solicitud-trabajo-form.jsx` (solo descripción, fecha, hora) |
| Chat | `components/chat.jsx`, `app/api/mensajes/route.js` |
| Schema / migraciones | `scripts/supabase-schema-complete.sql`, `scripts/migrations/add_solicitudes_*.sql` |

Con esta base se puede plantear cualquier cambio en la lógica de solicitudes (nuevos estados, plazos, permisos, flujos o segundo trabajador, etc.).
