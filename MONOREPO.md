# Monorepo FixArg (web + movil)

## Estructura

- fixarg/ — Next.js, backend /api + web
- apps/mobile/ — Expo (Android / iOS)
- packages/api-client/ — getApiBaseUrl() + apiRequest()

## App movil (implementado)

- React Navigation: Login | Home, Mis solicitudes, Detalle, Debug /api/health
- Auth: expo-secure-store + POST /api/users/login
- GET /api/solicitudes y GET /api/solicitudes/[id] con Bearer

## Por donde seguir

- Registro, nueva solicitud, mensajes
- Login trabajador (otro flujo o app)

## React 18 (Next) vs React 19 (Expo)

- `apps/mobile` **no** está en workspaces: su propio `node_modules` con React 19.
- En la raíz, **`overrides`** fuerzan `react` y `react-dom` **18.3.1** para `fixarg` (Radix/Heroicons pedían React 19 y rompían Next con `Missing ActionQueueContext`).

## Comandos (raiz)

```bash
npm install
npm run install:mobile   # instala deps del subproyecto móvil
npm run dev:web
npm run dev:mobile
```

## Movil en LAN

Copia apps/mobile/.env.example a .env y pon EXPO_PUBLIC_API_URL=http://IP:3000

## Vercel

Root del deploy Next: fixarg/

