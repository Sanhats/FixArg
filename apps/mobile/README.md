# FixArg Mobile

Aplicación móvil React Native (Expo) para clientes de FixArg.

## Características implementadas

### ✅ Autenticación
- Login con email/contraseña
- Almacenamiento seguro de token (expo-secure-store)
- Logout

### ✅ Solicitudes
- **Lista de solicitudes**: Ver todas las solicitudes del usuario
- **Detalle de solicitud**: Ver información completa, estado, presupuestos
- **Nueva solicitud por rubro**:
  - Selección de servicio (mudanza, limpieza, jardinería, etc.)
  - Formulario con descripción, fecha, hora
  - Selector de dirección (casa del usuario o ubicación actual con GPS)
  - Envío automático a profesionales del rubro

### ✅ Navegación
- Stack navigation con React Navigation
- Rutas protegidas (requieren autenticación)

## Estructura de pantallas

```
apps/mobile/screens/
├── LoginScreen.js           # Autenticación
├── HomeScreen.js            # Dashboard principal
├── ServiciosScreen.js       # Lista de rubros/servicios
├── NuevaSolicitudScreen.js  # Formulario nueva solicitud
├── MisSolicitudesScreen.js  # Lista de solicitudes del usuario
├── SolicitudDetailScreen.js # Detalle de una solicitud
└── DebugApiScreen.js        # Health check API
```

## Configuración

### Archivo `.env`

Crea `apps/mobile/.env` con:

```bash
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

**Importante**: En desarrollo local, usa tu IP de red (no `localhost`) para que el teléfono/emulador pueda conectarse al servidor Next.js.

### Permisos

La app solicita:
- **Ubicación** (opcional): Para autocompletar dirección del servicio

## Comandos

```bash
# Instalar dependencias
npm run install:mobile

# Desarrollo
npm run dev:mobile

# Android
npm run android

# iOS
npm run ios
```

## API Client compartido

El paquete `@fixarg/api-client` se comparte entre web y mobile para hacer requests al backend:

```javascript
import { apiRequest, bearerHeaders } from '@fixarg/api-client';

// GET con token
const data = await apiRequest('/api/solicitudes', {
  headers: bearerHeaders(token)
});

// POST
const result = await apiRequest('/api/solicitudes', {
  method: 'POST',
  headers: bearerHeaders(token),
  body: JSON.stringify({ descripcion, fecha, hora, servicioRubro })
});
```

## Próximos pasos

- [ ] Presupuestos: Aceptar/rechazar presupuestos desde mobile
- [ ] Chat: Mensajería con profesionales
- [ ] Notificaciones push
- [ ] Perfil de usuario
- [ ] Historial y valoraciones
