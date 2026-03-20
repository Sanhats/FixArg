# Nuevas funciones implementadas en la app móvil

## 1. Gestión de perfil de usuario

- **GET /api/users/me**: Obtener datos actualizados del perfil
- **PATCH /api/users/me**: Actualizar campos del perfil (nombre, teléfono, dirección, etc.)
- **Pantalla PerfilScreen**: Formulario editable para modificar los datos personales

## 2. Cancelar solicitud

- **PATCH /api/solicitudes/[id]** con `action: "cancel"`: El cliente puede cancelar solicitudes pendientes o confirmadas
- Botón "Cancelar solicitud" en `SolicitudDetailScreen` con confirmación

## 3. Chat entre cliente y profesional

- **GET /api/mensajes**: Listar mensajes de una solicitud
- **POST /api/mensajes**: Enviar un mensaje
- **Pantalla ChatScreen**: UI de mensajería en tiempo real (polling cada 3s)
- Botón "Enviar mensaje al profesional" en `SolicitudDetailScreen` cuando el estado es `confirmada` o `en_progreso`

## 4. Notificaciones push (Expo)

- **Migración SQL**: `scripts/migrations/add_expo_push_token_usuarios.sql` añade columna `expo_push_token` a `usuarios`
- **registerExpoPush.js**: Solicita permisos, obtiene el token de Expo y lo guarda en el servidor
- **fixarg/lib/expoPush.js**: Envía push vía Expo Push API
- **fixarg/lib/notifications.js**: Integrado con `createNotification` para enviar push automáticamente a clientes
- El token se registra al hacer login y al montar la app

## 5. Adjuntar fotos en solicitudes

- **expo-image-picker**: Integrado en `NuevaSolicitudScreen`
- Botón "Agregar foto" para seleccionar imágenes de la galería
- Las fotos se codifican en base64 y se envían en el array `fotos` del `POST /api/solicitudes`

---

## Cómo probar

1. **Migración opcional**:
   - Si querés notificaciones push, ejecutá el script SQL en Supabase: `fixarg/scripts/migrations/add_expo_push_token_usuarios.sql`

2. **Instalar dependencias**:
   ```bash
   cd apps/mobile
   npm install
   ```

3. **Iniciar Expo**:
   ```bash
   npx expo start
   ```

4. **Probar funciones**:
   - Editar perfil → Home → "Mi perfil"
   - Chat → Ir a una solicitud confirmada → "Enviar mensaje al profesional"
   - Cancelar → En detalle de solicitud → "Cancelar solicitud"
   - Fotos → Al crear una nueva solicitud → "Agregar foto"

---

## Rutas API nuevas/actualizadas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users/me` | Perfil del cliente autenticado |
| PATCH | `/api/users/me` | Actualizar perfil (incluye `expoPushToken`) |
| PATCH | `/api/solicitudes/[id]` | `action: "cancel"` para cancelar, `action: "approve_presupuesto"` para aceptar presupuesto |
| GET | `/api/mensajes?solicitudId=X` | Mensajes de una solicitud |
| POST | `/api/mensajes` | Enviar un mensaje |

---

## Archivos creados/modificados

### Nuevos archivos
- `fixarg/app/api/users/me/route.js`
- `fixarg/scripts/migrations/add_expo_push_token_usuarios.sql`
- `fixarg/lib/expoPush.js`
- `apps/mobile/screens/PerfilScreen.js`
- `apps/mobile/screens/ChatScreen.js`
- `apps/mobile/lib/registerExpoPush.js`

### Archivos modificados
- `fixarg/lib/notifications.js` (envía push al crear notificación)
- `apps/mobile/context/AuthContext.js` (añadido `refreshUser`, `updateProfile`, registro de push token)
- `apps/mobile/screens/SolicitudDetailScreen.js` (botones de chat y cancelar)
- `apps/mobile/screens/NuevaSolicitudScreen.js` (selector de fotos)
- `apps/mobile/screens/HomeScreen.js` (botón "Mi perfil")
- `apps/mobile/navigation/AppNavigator.js` (rutas `Perfil` y `Chat`)
- `apps/mobile/package.json` (dependencias: `expo-notifications`, `expo-device`, `expo-image-picker`, `expo-constants`)
