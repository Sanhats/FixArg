/**
 * Script para probar la integración de Twilio en el entorno de producción
 * 
 * Este script permite enviar un mensaje de prueba a un número específico y verificar
 * que la configuración del webhook de Twilio esté funcionando correctamente.
 */

require('dotenv').config();
const { sendWhatsAppMessage } = require('../lib/twilio');

// Función para verificar las variables de entorno
function checkEnvironmentVariables() {
  const requiredVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Error: Faltan las siguientes variables de entorno:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPor favor, configura estas variables en tu archivo .env o en las variables de entorno de Vercel.');
    return false;
  }
  
  console.log('✅ Variables de entorno configuradas correctamente.');
  return true;
}

// Función para enviar un mensaje de prueba
async function sendTestMessage(phoneNumber) {
  if (!phoneNumber) {
    console.error('❌ Error: Debes proporcionar un número de teléfono como argumento.');
    console.error('Uso: node test-twilio-webhook.js +5491123456789');
    return;
  }
  
  console.log(`📱 Enviando mensaje de prueba a ${phoneNumber}...`);
  
  try {
    const message = '🔄 Este es un mensaje de prueba para verificar la integración de Twilio. ' +
                   'Por favor, responde "CONFIRMAR" para verificar que el webhook está funcionando correctamente.';
    
    const result = await sendWhatsAppMessage(phoneNumber, message);
    
    if (result.success) {
      console.log(`✅ Mensaje enviado correctamente. ID: ${result.messageId}`);
      console.log('\n📋 Instrucciones para completar la prueba:');
      console.log('1. Deberías recibir el mensaje de prueba en el número proporcionado.');
      console.log('2. Responde "CONFIRMAR" al mensaje recibido.');
      console.log('3. Verifica los logs en Vercel para confirmar que el webhook recibió la respuesta.');
      console.log('4. Si el webhook está configurado correctamente, deberías recibir una respuesta automática.');
    } else {
      console.error(`❌ Error al enviar el mensaje: ${result.error}`);
      if (result.details) {
        console.error(`   Detalles: ${result.details}`);
      }
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Función principal
async function main() {
  console.log('🔍 Verificando configuración de Twilio...');
  
  if (!checkEnvironmentVariables()) {
    return;
  }
  
  const phoneNumber = process.argv[2];
  await sendTestMessage(phoneNumber);
}

// Ejecutar el script
main().catch(error => {
  console.error('❌ Error en la ejecución del script:', error);
  process.exit(1);
});