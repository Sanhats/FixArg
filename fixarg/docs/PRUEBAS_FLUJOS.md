# Cómo probar los flujos del sistema FixArg

Todo se prueba desde **http://localhost:3000** con la app en marcha (`npm run dev` en la carpeta `fixarg`).

---

## Antes de empezar

1. **Base de datos**: Ejecutado `scripts/supabase-schema-complete.sql` en Supabase y, para el flujo por servicio/presupuestos/puntos, las migraciones 10–12 de `scripts/migrations/README.md` (servicio_rubro, presupuestos, puntos).
2. **Variables de entorno**: `.env.local` con al menos Supabase, `JWT_SECRET`; opcional Gmail y admin.
3. **Arrancar la app**: `cd fixarg` → `npm run dev`.
4. **URL base para todas las pruebas:**  
   **http://localhost:3000**

**Probar el flujo nuevo (solicitud por rubro → presupuestos → puntos):** ver **Flujo 7** más abajo.

---

## Cómo funciona: el cliente crea una solicitud

En FixArg, una **solicitud** es cuando un **cliente** le pide a un **profesional/trabajador** que haga un trabajo (ej. pintar, mudanza, reparación). El flujo es este:

1. **El cliente entra a Servicios**  
   URL: **http://localhost:3000/servicios**  
   (Tiene que estar logueado como usuario/cliente; si no, la app lo manda a la home.)

2. **Ve una lista de profesionales**  
   La página carga solo trabajadores **aprobados** (los que un admin ya aprobó). Cada uno se muestra en una tarjeta con nombre, rubro, precio por hora, descripción y un botón.

3. **Elige a uno y hace clic en "Contactar"**  
   Ese botón está en cada tarjeta. No dice “Solicitar”: en la interfaz aparece como **“Contactar”**.

4. **Se abre un cuadro (modal) con un formulario**  
   El cliente completa:
   - **Descripción del trabajo** (qué necesita)
   - **Fecha preferida** (selector de fecha)
   - **Hora preferida** (selector de hora)  
   Luego hace clic en **“Enviar solicitud”**.

5. **Qué pasa al enviar**  
   - Se llama a la API `POST /api/solicitudes` con: descripción, fecha, hora, ID del trabajador elegido e ID del cliente (logueado).
   - En la base de datos se crea una fila en la tabla **solicitudes** con estado **pendiente**.
   - Al trabajador se le crea una **notificación** (“Nueva solicitud”) y, si está configurado, un **email**.

6. **Después**  
   El trabajador ve esa solicitud en **http://localhost:3000/trabajador/dashboard** (sección “Solicitudes nuevas”) y puede Aceptar o Rechazar desde ahí o desde la página de detalle de la solicitud.

**Resumen:** Cliente entra a **/servicios** → ve profesionales → clic en **“Contactar”** en uno → rellena descripción, fecha y hora → **“Enviar solicitud”**. Eso es “crear una solicitud”.

---

## Flujo 1: Cliente se registra y pide un servicio

**URLs:** Home → Servicios (mismo dominio).

| Paso | Dónde | URL |
|------|--------|-----|
| 1 | Ir a la home y abrir registro de usuario | **http://localhost:3000** (y clic en Registrarse / botón de registro) |
| 2 | Completar formulario: nombre, apellido, email, teléfono, dirección, contraseña | En el modal/form de la home |
| 3 | Verificación de email (si aplica): enviar código y luego ingresar código | Mismo formulario (código en alert si no hay Gmail configurado) |
| 4 | Iniciar sesión como cliente (si no quedaste logueado) | **http://localhost:3000** → Login en la home |
| 5 | Ir a Servicios | **http://localhost:3000/servicios** |
| 6 | Ver listado de profesionales; elegir uno y hacer clic en **“Contactar”** (se abre el formulario de solicitud) | **http://localhost:3000/servicios** |
| 7 | Completar descripción, fecha, hora → Enviar | En el formulario/modal de solicitud |
| 8 | Comprobar éxito y notificaciones (campana arriba a la derecha) | **http://localhost:3000/servicios** (icono campana en la esquina) |

**Endpoints:** `POST /api/users`, `POST /api/users/login`, `GET /api/trabajadores`, `POST /api/solicitudes`, `GET /api/notifications`.

---

## Flujo 2: Trabajador se registra y lo aprueba un admin

**URLs:** Home → Admin login → Panel admin → Login trabajador.

| Paso | Dónde | URL |
|------|--------|-----|
| 1 | Ir a la home y abrir registro de trabajador | **http://localhost:3000** (clic en “Trabajar como profesional” / registro trabajador) |
| 2 | Completar pasos: datos personales, servicio, verificación de email | En el formulario de registro (misma URL) |
| 3 | El trabajador queda en estado **pending** | — |
| 4 | Ir al login de admin | **http://localhost:3000/admin/login** |
| 5 | Iniciar sesión como admin (usuario y contraseña de .env) | **http://localhost:3000/admin/login** |
| 6 | Ver panel y aprobar el profesional pendiente | **http://localhost:3000/admin** (tras login redirige al panel) |
| 7 | A partir de aquí el trabajador puede iniciar sesión | **http://localhost:3000/trabajador/login** |

**Endpoints:** `POST /api/taskers`, `POST /api/admin/login`, `GET /api/admin/professionals`, `PATCH /api/admin/professionals/[id]`, `POST /api/trabajador/login`.

---

## Flujo 3: Trabajador ve solicitudes y acepta / rechaza / inicia / finaliza

**URLs:** Login trabajador → Dashboard → (opcional) Detalle de solicitud.

| Paso | Dónde | URL |
|------|--------|-----|
| 1 | Iniciar sesión como trabajador | **http://localhost:3000/trabajador/login** |
| 2 | Ir al panel de trabajador | **http://localhost:3000/trabajador/dashboard** |
| 3 | Ver secciones: Solicitudes nuevas, Trabajos confirmados, En progreso, Historial | **http://localhost:3000/trabajador/dashboard** |
| 4 | En una solicitud **pendiente**: Aceptar → pasa a “Trabajos confirmados” | **http://localhost:3000/trabajador/dashboard** |
| 5 | En esa solicitud **confirmada**: Iniciar trabajo → pasa a “En progreso” | **http://localhost:3000/trabajador/dashboard** |
| 6 | En esa solicitud **en progreso**: Finalizar trabajo → pasa a “Historial” (completada) | **http://localhost:3000/trabajador/dashboard** |
| 7 | Ver detalle de una solicitud (mismos botones de acción) | **http://localhost:3000/solicitudes/[id]** (reemplazar `[id]` por el UUID de la solicitud; el enlace “Ver detalle” lleva ahí) |

**Endpoints:** `GET /api/trabajador/solicitudes`, `PUT /api/trabajador/solicitudes/[id]` con `action: accept | reject | start | complete`.

---

## Flujo 4: Cliente y trabajador usan el chat y la página de solicitud

**URLs:** Servicios (cliente) o Dashboard (trabajador) → Detalle de la solicitud.

| Paso | Dónde | URL |
|------|--------|-----|
| 1 | Como **cliente**: ir a Servicios y tener una solicitud (o crearla); abrirla si hay enlace, o ir al detalle | **http://localhost:3000/servicios** → luego **http://localhost:3000/solicitudes/[id]** |
| 2 | Como **trabajador**: en el dashboard, “Ver detalle” de una solicitud | **http://localhost:3000/trabajador/dashboard** → **http://localhost:3000/solicitudes/[id]** |
| 3 | En la página de la solicitud: ver datos, estado y sección Chat; escribir mensaje y enviar | **http://localhost:3000/solicitudes/[id]** |
| 4 | Con el otro usuario (otra pestaña o incógnito), abrir la misma solicitud y comprobar mensajes y respuesta | **http://localhost:3000/solicitudes/[id]** (mismo `[id]`) |

**Endpoints:** `GET /api/solicitudes/[id]`, `GET /api/mensajes?solicitudId=`, `POST /api/mensajes`.

---

## Flujo 5: Cliente califica al trabajador (solicitud completada)

**URLs:** Misma página de detalle de la solicitud completada.

| Paso | Dónde | URL |
|------|--------|-----|
| 1 | Dejar una solicitud en estado **completada** (Flujo 3) | **http://localhost:3000/trabajador/dashboard** |
| 2 | Cerrar sesión del trabajador; iniciar sesión como **cliente** que creó esa solicitud | **http://localhost:3000** (logout) → **http://localhost:3000** (login cliente) |
| 3 | Ir al detalle de esa solicitud (desde notificaciones o enlace directo) | **http://localhost:3000/solicitudes/[id]** |
| 4 | Ver bloque “Calificar al profesional”, puntuación 1–5 y comentario; enviar reseña | **http://localhost:3000/solicitudes/[id]** |
| 5 | Comprobar mensaje de éxito y que no se pueda enviar otra reseña para la misma solicitud | **http://localhost:3000/solicitudes/[id]** |

**Endpoints:** `POST /api/reviews` con `solicitudId`, `workerId`, `rating`, `comment`.

---

## Flujo 6: Notificaciones (campana)

**URLs:** Cualquier página con el usuario logueado; la campana está en el layout.

| Paso | Dónde | URL |
|------|--------|-----|
| 1 | Con cliente o trabajador logueado, abrir la campana de notificaciones | Cualquier página, p. ej. **http://localhost:3000** o **http://localhost:3000/servicios** o **http://localhost:3000/trabajador/dashboard** — icono campana arriba a la derecha |
| 2 | Ver lista (o “No hay notificaciones”) | Dropdown de la campana |
| 3 | Clic en una notificación: se marca leída y, si aplica, navega a la solicitud | Redirige a **http://localhost:3000/solicitudes/[id]** |

**Endpoints:** `GET /api/notifications`, `PATCH /api/notifications/[id]`.

---

## Flujo 7: Solicitud por servicio (rubro) → presupuestos → aprobación → puntos

Este flujo usa el **nuevo** modelo: el cliente elige un **tipo de servicio** (rubro), no un trabajador; el sistema notifica a los trabajadores de ese rubro; cada uno puede enviar un **presupuesto**; el cliente aprueba uno y se asigna el trabajador; al finalizar el trabajo se suman **puntos** a cliente y trabajador.

### Requisitos previos

1. **Migraciones ejecutadas** en Supabase: `add_solicitudes_servicio_rubro_trabajador_null.sql`, `create_presupuestos_table.sql`, `add_puntos_usuarios_trabajadores.sql`.
2. **Al menos un trabajador aprobado** cuyo **occupation** o alguna **skill** en `skills_json` coincida con una categoría del selector (ej. `plomeria`, `limpieza`, `mudanza`, `electricidad`, `pintura`, `carpinteria`, `jardineria`). En la UI las categorías están normalizadas (sin tildes, minúsculas). Si el trabajador tiene `occupation: "Plomería"` o `skills_json: [{ "skill": "Plomería", ... }]`, coincidirá con el slug `plomeria`.
3. **Un cliente** (usuario) registrado y logueado.

### Pasos (flujo completo)

| Paso | Quién | Dónde | Qué hacer |
|------|--------|--------|-----------|
| 1 | Cliente | **http://localhost:3000/servicios** | Iniciar sesión como cliente. En la parte superior verás el botón **“Solicitar servicio (recibir presupuestos)”**. |
| 2 | Cliente | Mismo | Clic en ese botón. Se abre un modal con **Tipo de servicio** (selector: Plomería, Limpieza, Mudanza, etc.), descripción, dirección, duración, fotos, fecha y hora. Elegir un servicio que coincida con al menos un trabajador (ej. Plomería). Completar el resto y **Enviar**. |
| 3 | Sistema | — | Se crea una solicitud en estado **Esperando presupuestos** (`pendiente_presupuestos`). Los trabajadores del rubro (hasta 20, ordenados por puntos) reciben una **notificación** “Nueva solicitud en tu rubro”. |
| 4 | Cliente | Redirección a **http://localhost:3000/solicitudes/[id]** o **Mis solicitudes** | Ver la solicitud creada. Estado: “Esperando presupuestos”. La sección Chat dirá que hay que aprobar un presupuesto para habilitarlo. |
| 5 | Trabajador | **http://localhost:3000/trabajador/login** → **http://localhost:3000/trabajador/dashboard** | Iniciar sesión como un trabajador de ese rubro. En el dashboard debe aparecer la sección **“Solicitudes en tu rubro (enviar presupuesto)”** con la solicitud recién creada. |
| 6 | Trabajador | Dashboard o **Ver detalle** | Clic en **“Enviar presupuesto”**. En el modal: **Monto** (ej. 5000) y **Mensaje** (opcional). Enviar. O bien abrir **Ver detalle** de esa solicitud y enviar el presupuesto desde el formulario en la página. |
| 7 | Cliente | **http://localhost:3000/solicitudes/[id]** | Volver a la solicitud (o abrir desde notificación “Nuevo presupuesto”). Debe aparecer la sección **“Presupuestos recibidos”** con el monto y el nombre del trabajador. Clic en **“Aprobar este presupuesto”** y confirmar. |
| 8 | Sistema | — | La solicitud pasa a estado **Confirmada** y el trabajador queda asignado. El trabajador aprobado recibe notificación “Tu presupuesto fue aceptado”; los demás (si los hubiera) “El cliente eligió otro profesional”. |
| 9 | Trabajador | **http://localhost:3000/trabajador/dashboard** o detalle | La solicitud aparece ahora en **Trabajos confirmados**. **Iniciar trabajo** (en cualquier momento; la ventana horaria está desactivada) → pasa a “En progreso”. |
| 10 | Trabajador | Mismo | En “En progreso”: **Finalizar trabajo** → pasa a “Completada”. |
| 11 | Sistema | — | Se suman **10 puntos** al cliente y al trabajador. Podés comprobar en login (la respuesta de login incluye `puntos`) o en las APIs que devuelven perfil. |

### Verificaciones rápidas

- **Cliente – Mis solicitudes:** **http://localhost:3000/mis-solicitudes**. Las solicitudes “En curso” incluyen las que están en “Esperando presupuestos”. Si no hay trabajador asignado, la tarjeta muestra “Servicio: [rubro]”.
- **Trabajador – Disponibles:** Solo ves “Solicitudes en tu rubro” si tu `occupation` o alguna skill coincide con el `servicio_rubro` de la solicitud (comparación normalizada).
- **Puntos:** Tras completar un trabajo, el siguiente login del cliente o del trabajador puede devolver `puntos: 10` (o más si ya tenían puntos). Las APIs `GET /api/trabajadores` y `GET /api/trabajadores/[id]` incluyen `puntos`.

### Flujo legacy (solicitud directa a un trabajador)

Sigue funcionando: en **http://localhost:3000/servicios** elegir un profesional de la grilla y clic en **“Contratar”**. Se abre el mismo modal pero **sin** selector de tipo de servicio; al enviar se manda `trabajadorId` y la solicitud se crea en estado **Pendiente** para ese único trabajador (aceptar/rechazar en 24 h, etc.). No intervienen presupuestos.

---

## Resumen rápido: URLs por flujo

| Qué probar | URL |
|------------|-----|
| Home (registro/login cliente) | **http://localhost:3000** |
| Servicios (listado, “Solicitar servicio” por rubro o “Contratar” a uno) | **http://localhost:3000/servicios** |
| Mis solicitudes (cliente) | **http://localhost:3000/mis-solicitudes** |
| Login admin | **http://localhost:3000/admin/login** |
| Panel admin (aprobar profesionales) | **http://localhost:3000/admin** |
| Login trabajador | **http://localhost:3000/trabajador/login** |
| Panel trabajador (solicitudes asignadas + disponibles por rubro, enviar presupuesto) | **http://localhost:3000/trabajador/dashboard** |
| Detalle de una solicitud (presupuestos, aprobar, chat, acciones, calificar) | **http://localhost:3000/solicitudes/[id]** |
| Notificaciones | Icono campana en cualquier página (arriba derecha) |

*(En **http://localhost:3000/solicitudes/[id]** reemplaza `[id]` por el UUID real de la solicitud; lo ves en la URL al hacer clic en “Ver detalle” o al abrir una notificación.)*

Si algo falla, revisar **Network** (F12) en el navegador y el **terminal** de `npm run dev` para ver el endpoint y los logs.
