# Configuración de la base de datos en Supabase

## Crear el proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto (o usa uno existente).
2. En **Project Settings → API** copia (no confundas las claves con la URL):
   - **Project URL** (ej. `https://abcdefgh.supabase.co`) → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (clave larga tipo JWT) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (clave larga tipo JWT) → `SUPABASE_SERVICE_ROLE_KEY` (no exponer en el cliente)

Importante: `NEXT_PUBLIC_SUPABASE_URL` debe ser **solo la URL** que empieza por `https://`, no la clave "publishable" ni "anon". Si ves un error "Invalid URL" al verificar email o al usar Supabase, revisa que la URL sea exactamente la de **Project URL**.

## Crear todas las tablas (base desde cero)

1. En el dashboard de Supabase: **SQL Editor**.
2. Abre el archivo `scripts/supabase-schema-complete.sql` de este repo.
3. Copia todo su contenido y pégalo en el editor.
4. Ejecuta el script (Run).

Eso crea en este orden:

- `usuarios` – clientes
- `trabajadores` – profesionales
- `solicitudes` – trabajos (con `started_at`, `completed_at`)
- `reviews` – reseñas (con `solicitud_id` opcional)
- `mensajes` – chat por solicitud
- `notifications` – notificaciones in-app
- `verification_codes` – códigos de verificación de email
- Función `update_worker_rating(worker_id)` para el promedio de estrellas

No se crea la tabla `whatsapp_messages` (el sistema ya no usa WhatsApp).

## Otras variables de entorno recomendadas

En `.env.local` (o en Vercel) conviene tener además:

- `JWT_SECRET` – clave para los tokens de sesión (genera una aleatoria).
- `GMAIL_USER` y `GMAIL_PASS` – para envío de emails (verificación, notificaciones).
- `ADMIN_USERNAME` – para el login del panel de administración.
- `NEXT_PUBLIC_VERCEL_URL` – URL pública de la app (para enlaces en emails).

Las variables de Twilio (`TWILIO_ACCOUNT_SID`, etc.) ya no son necesarias.
