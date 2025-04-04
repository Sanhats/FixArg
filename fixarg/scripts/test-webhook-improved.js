/**
 * Script mejorado para probar el webhook de Twilio
 * 
 * Este script envía un mensaje de prueba a Twilio y verifica
 * que la configuración del webhook esté funcionando correctamente.
 */

require('dotenv').config();
const twilio = require('twilio');
const fetch = require('node-fetch');

// Verificar que las variables de entorno estén configuradas
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'NEXT_PUBLIC_VERCEL_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: La variable de entorno ${envVar} no está configurada.`);
    console.error('Por favor, configura todas las variables de entorno necesarias en el archivo .env.local');
    process.exit(1);
  }
}

// Obtener el número de teléfono del argumento de línea de comandos
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error('Error: No se proporcionó un número de teléfono.');
  console.error('Uso: node test-webhook-improved.js +5491123456789');
  process.exit(1);
}

// Función para formatear el número de teléfono
function formatPhoneNumber(number) {
  // Eliminar espacios y caracteres especiales
  let cleaned = number.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Asegurarse de que el número comience con el código de país
  if (!cleaned.startsWith('+')) {
    // Si comienza con 0, quitarlo antes de agregar el código de país
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Manejar números argentinos que comienzan con 15
    if (cleaned.startsWith('15')) {
      cleaned = cleaned.substring(2);
      cleaned = `+549${cleaned}`;
    } else {
      cleaned = `+549${cleaned}`;
    }
  } else if (cleaned.startsWith('+54') && !cleaned.startsWith('+549')) {
    // Si ya tiene código de país +54 pero no tiene el 9 para móviles, agregarlo
    cleaned = `+549${cleaned.substring(3)}`;
  }
  
  return cleaned;
}

// Función para verificar la accesibilidad del webhook
async function checkWebhookAccessibility() {
  try {
    // Determinar la URL base
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000';
    const isLocalhost = baseUrl.includes('localhost');
    
    // Construir la URL completa del webhook
    const webhookUrl = isLocalhost
      ? `http://${baseUrl}/api/whatsapp/webhook`
      : `https://${baseUrl}/api/whatsapp/webhook`;
    
    console.log(`🔍 Verificando accesibilidad del webhook: ${webhookUrl}`);
    
    // Intentar acceder al webhook con GET
    const response = await fetch(webhookUrl);
    
    if (response.status === 200) {
      console.log('✅ El webhook está accesible y configurado correctamente.');
      const responseText = await response.text();
      console.log('Respuesta del servidor:', responseText);
      return true;
    } else {
      console.error(`❌ El webhook no está configurado correctamente. Código de estado: ${response.status}`);
      console.error('Verifica que la ruta del webhook exista en tu aplicación.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar el webhook:', error.message);
    return false;
  }
}

// Función para enviar un mensaje de prueba
async function sendTestMessage(phoneNumber) {
  try {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log(`📱 Número formateado: ${formattedNumber}`);
    
    // Crear cliente de Twilio
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Mensaje de prueba
    const message = 
      'Este es un mensaje de prueba para verificar la configuración del webhook. ' +
      'Por favor, responde "CONFIRMAR" para verificar que el webhook está funcionando correctamente.';
    
    console.log(`📤 Enviando mensaje de prueba a: ${formattedNumber}`);
    
    // Enviar mensaje
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    });
    
    console.log(`✅ Mensaje enviado correctamente. SID: ${response.sid}`);
    console.log(`📊 Estado del mensaje: ${response.status}`);
    
    console.log('\n📋 Instrucciones para completar la prueba:');
    console.log('1. Verifica que hayas recibido el mensaje en WhatsApp.');
    console.log('2. Responde "CONFIRMAR" al mensaje recibido.');
    console.log('3. Verifica los logs en Vercel para confirmar que el webhook recibió la respuesta.');
    console.log('4. Si el webhook está configurado correctamente, deberías recibir una respuesta automática.');
    
    return true;
  } catch (error) {
    console.error('❌ Error al enviar el mensaje:', error.message);
    
    if (error.code === 21608) {
      console.error('El número de teléfono de origen no está configurado correctamente en Twilio.');
      console.error('Asegúrate de haber configurado correctamente el sandbox de WhatsApp en Twilio.');
    } else if (error.code === 21211) {
      console.error('El número de teléfono de destino no es válido.');
      console.error('Asegúrate de proporcionar un número de teléfono válido con el formato correcto.');
    }
    
    return false;
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando prueba del webhook de Twilio para WhatsApp...');
    
    // Verificar accesibilidad del webhook
    const webhookAccessible = await checkWebhookAccessibility();
    if (!webhookAccessible) {
      console.error('❌ No se puede continuar con la prueba porque el webhook no está accesible.');
      process.exit(1);
    }
    
    // Enviar mensaje de prueba
    const messageSent = await sendTestMessage(phoneNumber);
    if (!messageSent) {
      console.error('❌ No se pudo enviar el mensaje de prueba.');
      process.exit(1);
    }
    
    console.log('\n✅ Prueba iniciada correctamente.');
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  console.error('Error no controlado:', error);
  process.exit(1);
});