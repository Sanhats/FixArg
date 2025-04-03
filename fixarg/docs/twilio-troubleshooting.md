# Diagnóstico de Problemas con Twilio en Producción

Este documento proporciona pasos detallados para diagnosticar y solucionar problemas con la integración de Twilio WhatsApp en un entorno de producción desplegado en Vercel.

## Verificación de Configuración

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
4. Asegúrate de que el método HTTP esté configurado como "HTTP POST"

## Pruebas de Diagnóstico

### 1. Prueba de Accesibilidad del Webhook

Verifica que la URL del webhook sea accesible públicamente:

1. Abre un navegador e intenta acceder a la URL del webhook:
   ```
   https://tu-proyecto.vercel.app/api/whatsapp/webhook
   ```
2. Deberías recibir un error 405 Method Not Allowed, lo que indica que la ruta existe pero solo acepta POST

### 2. Prueba de Envío de Mensajes

Prueba el envío de mensajes desde la aplicación:

1. Inicia sesión en tu aplicación desplegada en Vercel
2. Crea una nueva solicitud de servicio
3. Verifica en los logs de Vercel que se envíe el mensaje correctamente

### 3. Prueba de Recepción de Mensajes

Prueba la recepción de mensajes desde WhatsApp:

1. Envía un mensaje "CONFIRMAR" desde el teléfono del trabajador al número de WhatsApp de Twilio
2. Verifica en los logs de Vercel que se reciba el webhook y se procese correctamente

## Análisis de Logs

### 1. Logs de Vercel

Para revisar los logs de tu aplicación en Vercel:

1. Inicia sesión en tu cuenta de Vercel
2. Selecciona tu proyecto
3. Ve a la pestaña "Deployments" y selecciona el despliegue actual
4. Haz clic en "Functions" y busca la función `/api/whatsapp/webhook`
5. Revisa los logs para ver si hay errores al procesar los webhooks

### 2. Logs de Twilio

Para revisar los logs de Twilio:

1. Inicia sesión en tu cuenta de Twilio
2. Ve a la sección "Monitor" > "Logs"
3. Filtra los logs por "WhatsApp" para ver los mensajes enviados y recibidos
4. Busca errores o mensajes de advertencia relacionados con tu aplicación

## Soluciones Comunes

### 1. Problema: No se reciben mensajes en el webhook

**Posibles causas y soluciones:**

- **URL del webhook incorrecta**: Verifica que la URL configurada en Twilio sea exactamente igual a la URL de tu aplicación desplegada en Vercel
- **Problemas de red**: Asegúrate de que no haya firewalls o restricciones de red que bloqueen las solicitudes de Twilio
- **Errores en el código**: Revisa los logs de Vercel para identificar posibles errores en el código del webhook

### 2. Problema: Se reciben mensajes pero no se procesan correctamente

**Posibles causas y soluciones:**

- **Formato de datos incorrecto**: Verifica que el código del webhook esté procesando correctamente los datos enviados por Twilio
- **Errores en la base de datos**: Revisa los logs para identificar posibles errores al interactuar con la base de datos
- **Problemas con las credenciales**: Asegúrate de que las credenciales de Twilio estén correctamente configuradas

### 3. Problema: No se envían mensajes de respuesta

**Posibles causas y soluciones:**

- **Problemas con las credenciales**: Verifica que las credenciales de Twilio estén correctamente configuradas
- **Formato de número incorrecto**: Asegúrate de que los números de teléfono estén en el formato correcto (con código de país)
- **Límites de la cuenta de Twilio**: Verifica que no hayas alcanzado los límites de tu cuenta de Twilio

## Contacto de Soporte

Si después de seguir todos estos pasos sigues teniendo problemas, contacta al soporte de Twilio:

- **Soporte de Twilio**: [https://www.twilio.com/help/contact](https://www.twilio.com/help/contact)
- **Documentación de Twilio para WhatsApp**: [https://www.twilio.com/docs/whatsapp/api](https://www.twilio.com/docs/whatsapp/api)