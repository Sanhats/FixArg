# Solución de Problemas con el Webhook de Twilio para WhatsApp

Este documento proporciona una guía para solucionar problemas comunes con la integración de Twilio WhatsApp en la aplicación FixArg.

## Mejoras Implementadas

### 1. Soporte para Método GET

Se ha añadido soporte para el método GET en el endpoint del webhook. Esto permite que Twilio verifique la disponibilidad del webhook durante la configuración inicial y las pruebas de conectividad.

### 2. Mejor Manejo de Formatos de Números Telefónicos

Se ha mejorado el procesamiento de números telefónicos para manejar diferentes formatos que Twilio puede enviar:
- Números con y sin prefijo `whatsapp:`
- Números con y sin código de país
- Variantes específicas para números argentinos (con y sin el 9 para móviles)

### 3. Procesamiento Robusto de Datos del Formulario

Se ha mejorado la extracción de datos del formulario para manejar diferentes campos que Twilio puede enviar, dependiendo de la configuración:
- Soporte para múltiples nombres de campo para el cuerpo del mensaje
- Soporte para múltiples nombres de campo para el número de teléfono
- Manejo mejorado de errores al procesar el formulario

### 4. Respuesta Mejorada a Twilio

Se ha optimizado la respuesta que se envía a Twilio para asegurar que se procese correctamente:
- Formato TwiML válido
- Encabezados HTTP adecuados
- Información de depuración adicional en los encabezados

## Herramientas de Prueba

Se han creado dos nuevos scripts para facilitar la prueba del webhook:

### 1. Script de Prueba Mejorado

```bash
node scripts/test-webhook-improved.js +5491123456789
```

Este script verifica la accesibilidad del webhook y envía un mensaje de prueba a través de Twilio.

### 2. Script de Simulación Local

```bash
node scripts/simulate-webhook-local.js +5491123456789 "CONFIRMAR"
```

Este script simula una solicitud POST de Twilio directamente al webhook, sin necesidad de enviar mensajes reales a través de Twilio.

## Pasos para Verificar la Configuración

1. **Verificar la URL del Webhook en Twilio**
   - Inicia sesión en tu cuenta de Twilio
   - Ve a la sección "Messaging" > "Try it Out" > "Send a WhatsApp Message"
   - Verifica que el campo "WHEN A MESSAGE COMES IN" tenga la URL correcta:
     ```
     https://tu-proyecto.vercel.app/api/whatsapp/webhook
     ```

2. **Verificar la Accesibilidad del Webhook**
   - Ejecuta el script de verificación mejorado:
     ```
     node scripts/test-webhook-improved.js +5491123456789
     ```
   - El script debería indicar si el webhook está accesible y configurado correctamente

3. **Probar el Procesamiento de Mensajes**
   - Ejecuta el script de simulación local:
     ```
     node scripts/simulate-webhook-local.js +5491123456789 "CONFIRMAR"
     ```
   - Verifica los logs del servidor para confirmar que el webhook procesó el mensaje correctamente

## Solución de Problemas Comunes

### 1. Error "fetch is not a function"

Este error ocurre cuando se ejecutan los scripts de prueba y node-fetch no está instalado correctamente o no se importa de la manera adecuada según la versión.

**Solución:**
- Para node-fetch v2 (CommonJS):
  ```bash
  npm install node-fetch@2
  ```
- Para node-fetch v3 (ESM):
  ```bash
  npm install node-fetch@3
  ```

Los scripts han sido actualizados para manejar ambas versiones automáticamente.

### 2. URL duplicada (https://https://...)

Si la variable de entorno NEXT_PUBLIC_VERCEL_URL ya incluye el protocolo (https://), los scripts pueden generar URLs incorrectas con protocolos duplicados.

**Solución:** Los scripts han sido actualizados para detectar y corregir automáticamente este problema. Si sigues teniendo problemas, asegúrate de que la variable NEXT_PUBLIC_VERCEL_URL no incluya el protocolo.

### 3. Mensaje "Configure your WhatsApp Sandbox's Inbound URL"

Si al responder a un mensaje de WhatsApp recibes este mensaje, significa que Twilio no está procesando correctamente los mensajes entrantes porque no tiene configurada la URL del webhook.

**Solución:** Verifica la configuración del webhook en el panel de Twilio como se indica en el paso 1 de "Pasos para Verificar la Configuración".

### 2. No se Reciben Mensajes en el Webhook

**Posibles causas y soluciones:**
- **URL incorrecta:** Verifica que la URL configurada en Twilio sea exactamente igual a la URL de tu aplicación desplegada
- **Problemas de red:** Asegúrate de que tu servidor sea accesible públicamente
- **Errores en el código:** Revisa los logs para identificar posibles errores

### 3. Se Reciben Mensajes pero No se Procesan Correctamente

**Posibles causas y soluciones:**
- **Formato de datos incorrecto:** Verifica que el código del webhook esté procesando correctamente los datos enviados por Twilio
- **Errores en la base de datos:** Revisa los logs para identificar posibles errores al interactuar con la base de datos
- **Problemas con las credenciales:** Asegúrate de que las credenciales de Twilio y Supabase estén correctamente configuradas

### 4. Problemas con el Formato de Números Telefónicos

**Solución:** El webhook ahora maneja múltiples formatos de números telefónicos, incluyendo variantes específicas para números argentinos. Si sigues teniendo problemas, verifica los logs para ver cómo se está procesando el número.

## Logs y Depuración

Se han añadido logs detallados en el endpoint del webhook para facilitar la depuración. Estos logs muestran:

- La solicitud completa recibida de Twilio
- Todos los campos del formulario enviados por Twilio
- Los datos específicos del mensaje y número de teléfono
- El proceso de búsqueda de mensajes previos
- El proceso de actualización de la solicitud
- El resultado final del procesamiento

Estos logs te ayudarán a identificar cualquier problema en la comunicación entre Twilio y tu aplicación.