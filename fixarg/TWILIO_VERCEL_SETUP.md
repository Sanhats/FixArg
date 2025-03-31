# Configuración de Twilio para WhatsApp en Vercel

Este documento proporciona instrucciones detalladas para configurar correctamente Twilio para el envío de mensajes de WhatsApp en un entorno serverless de Vercel.

## Requisitos previos

1. Una cuenta de Twilio activa
2. Un número de teléfono de Twilio habilitado para WhatsApp
3. Una cuenta de Vercel

## Configuración de variables de entorno en Vercel

Para que la integración con Twilio funcione correctamente en Vercel, debes configurar las siguientes variables de entorno en tu proyecto de Vercel:

1. **TWILIO_ACCOUNT_SID**: El SID de tu cuenta de Twilio
2. **TWILIO_AUTH_TOKEN**: El token de autenticación de tu cuenta de Twilio
3. **TWILIO_PHONE_NUMBER**: Tu número de teléfono de Twilio (con formato internacional, ej: +14155238886)

### Pasos para configurar las variables de entorno en Vercel

1. Inicia sesión en tu cuenta de Vercel
2. Selecciona tu proyecto
3. Ve a la pestaña "Settings"
4. Haz clic en "Environment Variables"
5. Agrega cada una de las variables mencionadas anteriormente con sus respectivos valores
6. Haz clic en "Save" para guardar los cambios

## Optimización para entorno serverless

Las funciones serverless tienen algunas limitaciones que debes tener en cuenta:

1. **Tiempo de ejecución limitado**: Las funciones tienen un tiempo máximo de ejecución (configurado a 60 segundos para las rutas de WhatsApp en este proyecto)
2. **Memoria limitada**: Las funciones tienen una cantidad limitada de memoria (configurado a 1024MB)
3. **Cold starts**: Las funciones pueden experimentar "cold starts" si no se utilizan con frecuencia

### Recomendaciones para optimizar el rendimiento

1. **Manejo de errores robusto**: Implementa un manejo de errores adecuado para capturar y registrar cualquier problema con Twilio
2. **Logging adecuado**: Utiliza logging para depurar problemas en producción
3. **Reintentos**: Implementa una lógica de reintentos para manejar errores temporales

## Verificación de la configuración

Para verificar que la integración con Twilio funciona correctamente después del despliegue:

1. Envía un mensaje de prueba utilizando la aplicación
2. Verifica los logs en Vercel para asegurarte de que no hay errores
3. Confirma que el mensaje se haya enviado correctamente a través de WhatsApp

## Solución de problemas comunes

### Error de autenticación

Si recibes un error de autenticación (código 20003), verifica que las credenciales de Twilio (ACCOUNT_SID y AUTH_TOKEN) estén correctamente configuradas en las variables de entorno de Vercel.

### Número de teléfono no válido

Si recibes un error de número de teléfono no válido (código 21211), asegúrate de que el número esté en formato internacional (+549XXXXXXXX para Argentina) y que sea un número válido para WhatsApp.

### Número de teléfono de origen no válido

Si recibes un error indicando que el número de teléfono de origen no es válido (código 21608), verifica que tu número de Twilio esté habilitado para WhatsApp y correctamente configurado en las variables de entorno.

### Tiempo de espera agotado

Si la función se agota por tiempo, considera aumentar el valor de `maxDuration` en el archivo `vercel.json` o optimizar el código para que se ejecute más rápido.

## Recursos adicionales

- [Documentación de Twilio para WhatsApp](https://www.twilio.com/docs/whatsapp/api)
- [Documentación de Vercel para funciones serverless](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Guía de optimización de funciones serverless](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes)