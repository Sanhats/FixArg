# Guía para Probar la Integración de Twilio en Vercel

Esta guía proporciona instrucciones detalladas para probar la integración de Twilio WhatsApp en un entorno de producción desplegado en Vercel.

## Requisitos Previos

1. Acceso a la cuenta de Twilio
2. Acceso al dashboard de Vercel donde está desplegada la aplicación
3. Un teléfono con WhatsApp para probar la integración
4. Node.js instalado localmente para ejecutar los scripts de prueba

## Verificación de la Configuración

### 1. Verificar Variables de Entorno en Vercel

Asegúrate de que las siguientes variables de entorno estén correctamente configuradas en Vercel:

- `TWILIO_ACCOUNT_SID`: El SID de tu cuenta de Twilio
- `TWILIO_AUTH_TOKEN`: El token de autenticación de tu cuenta de Twilio
- `TWILIO_PHONE_NUMBER`: Tu número de teléfono de Twilio (con formato internacional, ej: +14155238886)
- `NEXT_PUBLIC_VERCEL_URL`: La URL de tu aplicación desplegada en Vercel

Para verificar estas variables:

1. Inicia sesión en tu cuenta de Vercel
2. Selecciona tu proyecto
3. Ve a la pestaña "Settings" > "Environment Variables"
4. Verifica que todas las variables estén presentes y correctamente configuradas

### 2. Verificar Configuración del Webhook en Twilio

1. Inicia sesión en tu cuenta de Twilio: [https://www.twilio.com/login](https://www.twilio.com/login)
2. Ve a la sección "Messaging" > "Try it Out" > "Send a WhatsApp Message"
3. En la configuración del Sandbox de WhatsApp, verifica que el campo "WHEN A MESSAGE COMES IN" tenga la URL correcta:
   ```
   https://tu-proyecto.vercel.app/api/whatsapp/webhook
   ```
   **Importante**: Reemplaza `tu-proyecto.vercel.app` con la URL real de tu aplicación desplegada en Vercel.
4. Asegúrate de que el método HTTP esté configurado como "HTTP POST"

## Pruebas Paso a Paso

### 1. Prueba de Accesibilidad del Webhook

Verifica que la URL del webhook sea accesible públicamente:

1. Clona el repositorio localmente (si aún no lo has hecho)
2. Crea un archivo `.env.local` con las variables de entorno necesarias:
   ```
   TWILIO_ACCOUNT_SID=tu_account_sid
   TWILIO_AUTH_TOKEN=tu_auth_token
   TWILIO_PHONE_NUMBER=+14155238886
   NEXT_PUBLIC_VERCEL_URL=tu-proyecto.vercel.app
   ```
3. Instala las dependencias necesarias:
   ```
   npm install node-fetch form-data
   ```
4. Ejecuta el script de verificación del webhook:
   ```
   node scripts/verify-twilio-webhook.js
   ```
5. El script debería indicar si el webhook está accesible y configurado correctamente

### 2. Prueba de Envío de Mensajes

Prueba el envío de mensajes desde la aplicación:

1. Ejecuta el script de prueba de Twilio:
   ```
   node scripts/test-twilio-webhook.js +549XXXXXXXXX
   ```
   (Reemplaza +549XXXXXXXXX con tu número de teléfono)
2. Deberías recibir un mensaje de WhatsApp en tu teléfono
3. Responde "CONFIRMAR" al mensaje recibido

### 3. Verificación de Logs en Vercel

Verifica que el webhook esté recibiendo y procesando correctamente las respuestas:

1. Inicia sesión en tu cuenta de Vercel
2. Selecciona tu proyecto
3. Ve a la pestaña "Deployments" y selecciona el despliegue actual
4. Haz clic en "Functions" y busca la función `/api/whatsapp/webhook`
5. Revisa los logs para ver si hay errores al procesar los webhooks

### 4. Simulación de Webhook (Opcional)

Si quieres probar el webhook sin enviar mensajes reales:

1. Ejecuta el script de simulación del webhook:
   ```
   node scripts/simulate-twilio-webhook.js +549XXXXXXXXX "CONFIRMAR"
   ```
   (Reemplaza +549XXXXXXXXX con el número de teléfono del trabajador)
2. El script enviará una solicitud POST al webhook simulando una respuesta de WhatsApp
3. Verifica los logs en Vercel para confirmar que el webhook procesó la respuesta

## Solución de Problemas Comunes

### 1. Mensaje "Configure your WhatsApp Sandbox's Inbound URL"

Si al responder "CONFIRMAR" recibes el mensaje:
```
You said: CONFIRMAR.
Configure your WhatsApp Sandbox's Inbound URL to change this message.
```

Esto indica que la URL del webhook no está correctamente configurada en Twilio. Sigue estos pasos:

1. Verifica que la URL del webhook en Twilio sea exactamente igual a la URL de tu aplicación desplegada en Vercel
2. Asegúrate de que la ruta del webhook sea `/api/whatsapp/webhook`
3. Verifica que el método HTTP esté configurado como "HTTP POST"

### 2. No se Reciben Mensajes en el Webhook

Si los mensajes no llegan al webhook:

1. Verifica que la URL del webhook sea accesible públicamente
2. Asegúrate de que no haya firewalls o restricciones de red que bloqueen las solicitudes de Twilio
3. Revisa los logs de Vercel para identificar posibles errores en el código del webhook

### 3. Se Reciben Mensajes pero No se Procesan Correctamente

Si los mensajes llegan al webhook pero no se procesan correctamente:

1. Verifica que el código del webhook esté procesando correctamente los datos enviados por Twilio
2. Revisa los logs para identificar posibles errores al interactuar con la base de datos
3. Asegúrate de que las credenciales de Twilio estén correctamente configuradas

### 4. No se Envían Mensajes de Respuesta

Si no se envían mensajes de respuesta:

1. Verifica que las credenciales de Twilio estén correctamente configuradas
2. Asegúrate de que los números de teléfono estén en el formato correcto (con código de país)
3. Verifica que no hayas alcanzado los límites de tu cuenta de Twilio

## Recursos Adicionales

- [Documentación de Twilio para WhatsApp](https://www.twilio.com/docs/whatsapp/api)
- [Documentación de Vercel para funciones serverless](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Guía de optimización de funciones serverless](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes)

## Contacto de Soporte

Si después de seguir todos estos pasos sigues teniendo problemas, contacta al soporte de Twilio:

- [Soporte de Twilio](https://www.twilio.com/help/contact)