# Configuración del Webhook de Twilio para WhatsApp

## Problema

Cuando un trabajador responde "CONFIRMAR" a un mensaje de WhatsApp, recibe el siguiente mensaje:

```
You said: CONFIRMAR.
Configure your WhatsApp Sandbox's Inbound URL to change this message.
```

Esto indica que Twilio no está procesando correctamente los mensajes entrantes porque no tiene configurada la URL del webhook para recibir estos mensajes.

## Solución

Para solucionar este problema, es necesario configurar correctamente el Webhook URL en el panel de control de Twilio.

### Pasos para configurar el Webhook de Twilio

1. Inicia sesión en tu cuenta de Twilio: [https://www.twilio.com/login](https://www.twilio.com/login)

2. Ve a la sección "Messaging" > "Try it Out" > "Send a WhatsApp Message"

3. En la configuración del Sandbox de WhatsApp, busca la sección "Sandbox Configuration"

4. Configura el campo "WHEN A MESSAGE COMES IN" con la URL de tu webhook:
   ```
   https://tu-dominio.com/api/whatsapp/webhook
   ```
   
   Si estás usando Vercel, la URL sería la URL completa de tu aplicación desplegada seguida de la ruta del webhook:
   ```
   https://tu-proyecto.vercel.app/api/whatsapp/webhook
   ```
   
   **Importante**: Asegúrate de usar la URL exacta de tu aplicación desplegada en Vercel. Puedes encontrar esta URL en el dashboard de Vercel o ejecutando `vercel env pull` para ver la variable `NEXT_PUBLIC_VERCEL_URL`.

5. Asegúrate de que el método HTTP esté configurado como "HTTP POST"

6. Guarda los cambios

## Verificación

Para verificar que la configuración funciona correctamente en un entorno de producción (Vercel):

1. Asegúrate de que todas las variables de entorno estén correctamente configuradas en el panel de Vercel:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER
   - NEXT_PUBLIC_VERCEL_URL

2. Envía un mensaje desde la aplicación a un trabajador usando la interfaz de la aplicación desplegada en Vercel

3. El trabajador debe responder "CONFIRMAR" al número de WhatsApp de Twilio

4. Verifica en los logs de Vercel (sección "Logs" en el dashboard del proyecto) que se recibe el webhook y se procesa correctamente

5. El sistema debe procesar esta respuesta y actualizar el estado de la solicitud a "confirmada" en la base de datos

6. El cliente debe recibir una notificación de confirmación en su WhatsApp

## Solución de problemas

Si después de configurar el webhook sigues teniendo problemas en el entorno de producción (Vercel):

1. Verifica que la URL del webhook sea accesible públicamente y esté correctamente configurada en el panel de Twilio
   - Prueba acceder a la URL del webhook desde un navegador (debería devolver un error 405 Method Not Allowed, lo que indica que la ruta existe pero solo acepta POST)

2. Revisa los logs de la aplicación en el dashboard de Vercel:
   - Ve a tu proyecto en Vercel
   - Haz clic en "Deployments" y selecciona el despliegue actual
   - Haz clic en "Functions" y busca la función `/api/whatsapp/webhook`
   - Revisa los logs para ver si hay errores al procesar los webhooks

3. Verifica que las credenciales de Twilio estén correctamente configuradas en las variables de entorno de Vercel:
   - Ve a la sección "Settings" > "Environment Variables" en tu proyecto de Vercel
   - Comprueba que TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_PHONE_NUMBER estén configurados correctamente

4. Prueba la integración con Twilio usando la consola de Twilio:
   - Ve a la sección "Messaging" > "Try it Out" > "Send a WhatsApp Message"
   - Envía un mensaje de prueba y verifica que se reciba correctamente

5. Asegúrate de que el formato de los datos enviados por Twilio coincida con lo que espera tu aplicación
   - Revisa la documentación de Twilio para asegurarte de que estás procesando correctamente los datos del webhook

## Logs y depuración

Se han añadido logs adicionales en el endpoint del webhook para facilitar la depuración. Estos logs mostrarán:

- La solicitud completa recibida de Twilio
- Todos los campos del formulario enviados por Twilio
- Los datos específicos del mensaje y número de teléfono

Estos logs te ayudarán a identificar cualquier problema en la comunicación entre Twilio y tu aplicación.