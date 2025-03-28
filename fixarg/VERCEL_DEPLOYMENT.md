

## Variables de Entorno

Para que la aplicación funcione correctamente en Vercel, es necesario configurar las siguientes variables de entorno en el panel de control de Vercel:

1. **MONGODB_URI**: La URL de conexión a MongoDB Atlas
   - Asegúrate de que la IP de Vercel esté en la lista blanca de MongoDB Atlas
   - Formato: `mongodb+srv://usuario:contraseña@cluster.mongodb.net/basededatos?retryWrites=true&w=majority`

2. **JWT_SECRET**: Clave secreta para firmar tokens JWT

3. **ADMIN_USERNAME**: Nombre de usuario para el administrador

4. **ADMIN_PASSWORD_HASH**: Hash de la contraseña del administrador

5. **GMAIL_USER**: Correo electrónico para envío de notificaciones

6. **GMAIL_PASS**: Contraseña de aplicación para el correo electrónico

7. **TWILIO_ACCOUNT_SID**: SID de la cuenta de Twilio

8. **TWILIO_AUTH_TOKEN**: Token de autenticación de Twilio

9. **TWILIO_PHONE_NUMBER**: Número de teléfono de Twilio

## Configuración de MongoDB Atlas

1. Inicia sesión en [MongoDB Atlas](https://cloud.mongodb.com/)
2. Ve a tu clúster y haz clic en "Connect"
3. Selecciona "Connect your application"
4. Copia la cadena de conexión
5. Ve a "Network Access" y añade la IP de Vercel (0.0.0.0/0 para permitir todas las IPs)

## Verificación de Conexión

Para verificar que la conexión a MongoDB funciona correctamente:

1. Ve al panel de control de Vercel
2. Selecciona tu proyecto
3. Ve a la pestaña "Logs"
4. Busca mensajes relacionados con la conexión a MongoDB

Si ves errores de conexión, verifica:

- Que la cadena de conexión sea correcta
- Que las IPs estén correctamente configuradas en MongoDB Atlas
- Que las variables de entorno estén correctamente configuradas en Vercel