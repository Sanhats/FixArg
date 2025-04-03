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
   
   Si estás usando Vercel, la URL sería:
   ```
   https://tu-proyecto.vercel.app/api/whatsapp/webhook
   ```

5. Asegúrate de que el método HTTP esté configurado como "HTTP POST"

6. Guarda los cambios

## Verificación

Para verificar que la configuración funciona correctamente:

1. Envía un mensaje desde la aplicación a un trabajador
2. El trabajador debe responder "CONFIRMAR"
3. El sistema debe procesar esta respuesta y actualizar el estado de la solicitud a "confirmada"
4. El cliente debe recibir una notificación de confirmación

## Solución de problemas

Si después de configurar el webhook sigues teniendo problemas:

1. Verifica que la URL del webhook sea accesible públicamente
2. Revisa los logs de la aplicación para ver si hay errores al procesar los webhooks
3. Asegúrate de que el formato de los datos enviados por Twilio coincida con lo que espera tu aplicación
4. Verifica que las credenciales de Twilio estén correctamente configuradas en tu archivo .env

## Logs y depuración

Se han añadido logs adicionales en el endpoint del webhook para facilitar la depuración. Estos logs mostrarán:

- La solicitud completa recibida de Twilio
- Todos los campos del formulario enviados por Twilio
- Los datos específicos del mensaje y número de teléfono

Estos logs te ayudarán a identificar cualquier problema en la comunicación entre Twilio y tu aplicación.