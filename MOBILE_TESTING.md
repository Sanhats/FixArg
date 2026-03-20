# Guía de prueba - FixArg Mobile

## Paso 1: Verificar servidor Next.js

Asegurate que el servidor web esté corriendo con acceso externo:

```bash
cd fixarg
npm run dev
# Debe iniciar en 0.0.0.0:3000 (no solo localhost)
```

## Paso 2: Configurar IP en mobile

1. Obtené tu IP local:
   - Windows: `ipconfig` (busca IPv4 de tu red wifi/ethernet)
   - Mac/Linux: `ifconfig` o `ip addr`

2. Crea `apps/mobile/.env`:
   ```bash
   EXPO_PUBLIC_API_URL=http://TU_IP:3000
   ```
   Ejemplo: `EXPO_PUBLIC_API_URL=http://192.168.100.45:3000`

## Paso 3: Instalar dependencias mobile

```bash
npm run install:mobile
# O directamente:
cd apps/mobile && npm install
```

## Paso 4: Iniciar Expo

```bash
npm run dev:mobile
# O desde apps/mobile:
npm start
```

## Paso 5: Probar en dispositivo

### Opción A: Expo Go (más rápido)
1. Instala "Expo Go" en tu teléfono (Android/iOS)
2. Escanea el QR que aparece en la terminal
3. Espera que cargue la app

### Opción B: Emulador Android
```bash
npm run android
```

### Opción C: Simulador iOS (solo Mac)
```bash
npm run ios
```

## Flujo de prueba

### 1. Login
- Email de un usuario cliente existente
- Contraseña
- Debe entrar al Home

### 2. Home → Solicitar servicio
- Pulsa "Solicitar servicio"
- Debe mostrar lista de rubros (Mudanza, Limpieza, etc.)

### 3. Seleccionar rubro → Nueva solicitud
- Pulsa cualquier rubro (ej: "Limpieza")
- Completa el formulario:
  - Descripción: "Limpieza profunda de casa 3 ambientes"
  - Fecha: Hoy o mañana
  - Hora: 10:00
  - Dirección: Prueba "Mi dirección" o "Ubicación actual" (si das permiso GPS)
- Pulsa "Enviar solicitud"
- Debe mostrar Alert de éxito con opciones "Ver mis solicitudes" / "Ver detalle"

### 4. Mis solicitudes
- Desde Home, pulsa "Mis solicitudes"
- Debe mostrar la solicitud recién creada
- Estado: "Pendiente presupuestos"
- Pulsa la solicitud

### 5. Detalle de solicitud
- Debe mostrar:
  - Descripción completa
  - Fecha y hora
  - Dirección
  - Estado
  - Sección "Presupuestos recibidos" (puede estar vacía)

## Verificación en la web

1. Abre `http://localhost:3000/solicitudes-trabajadores`
2. Login como trabajador del rubro (ej: limpieza)
3. Debe aparecer la nueva solicitud
4. El trabajador puede enviar presupuesto
5. Vuelve al mobile y recarga el detalle → debería ver el presupuesto

## Troubleshooting

### Error "Network request failed"
- ✅ Verifica que la IP en `.env` sea correcta
- ✅ Verifica que Next.js esté en `0.0.0.0:3000` (no solo `localhost`)
- ✅ Firewall de Windows: Permite conexiones entrantes en puerto 3000
- ✅ Celular y PC en la misma red WiFi

### Error "Cannot read property 'street' of undefined"
- El usuario no tiene dirección configurada
- Es opcional, deja el campo dirección vacío o usa ubicación actual

### Selector de fecha/hora no funciona en Android
- Ya instalado `@react-native-community/datetimepicker`
- Si persiste, reinstala: `cd apps/mobile && npx expo install @react-native-community/datetimepicker`

### Error de permisos de ubicación
- Android: Configurado `permissions` en `app.json`
- iOS: Configurado `NSLocationWhenInUseUsageDescription` en `app.json`
- Si persiste, desinstala y reinstala la app

## Logs útiles

```bash
# Ver logs detallados de Expo
cd apps/mobile
npx expo start --dev-client --clear

# Ver logs del servidor
cd fixarg
npm run dev
```
