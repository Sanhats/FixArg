/**
 * Script para simular un webhook de Twilio y probar la integración localmente
 * 
 * Este script envía una solicitud POST al endpoint del webhook simulando
 * los datos que Twilio enviaría cuando un trabajador responde a un mensaje.
 */

require('dotenv').config();
// Importar node-fetch de manera compatible con ESM y CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');

// Función para verificar las variables de entorno
function checkEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_VERCEL_URL'
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

// Función para simular una respuesta de WhatsApp
async function simulateWhatsAppResponse(phoneNumber, message) {
  if (!phoneNumber) {
    console.error('❌ Error: Debes proporcionar un número de teléfono como argumento.');
    console.error('Uso: node simulate-twilio-webhook.js +5491123456789 "CONFIRMAR"');
    return;
  }
  
  if (!message) {
    console.error('❌ Error: Debes proporcionar un mensaje como argumento.');
    console.error('Uso: node simulate-twilio-webhook.js +5491123456789 "CONFIRMAR"');
    return;
  }
  
  // Formatear el número de teléfono para WhatsApp
  const whatsappNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
  
  console.log(`🔄 Simulando respuesta de WhatsApp desde ${whatsappNumber} con mensaje: "${message}"`);
  
  // Verificar la URL del webhook
  if (!checkEnvironmentVariables()) {
    return;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  let webhookUrl;
  
  // Determinar si estamos en desarrollo local o en Vercel
  if (baseUrl.startsWith('http')) {
    webhookUrl = `${baseUrl}/api/whatsapp/webhook`;
  } else {
    // Eliminar la barra final si existe para evitar doble barra
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    webhookUrl = `https://${cleanBaseUrl}/api/whatsapp/webhook`;
  }
  
  console.log(`📡 Enviando solicitud POST a: ${webhookUrl}`);
  
  // Crear un objeto FormData para simular los datos que envía Twilio
  const formData = new FormData();
  formData.append('From', whatsappNumber);
  formData.append('Body', message);
  formData.append('SmsMessageSid', `SIMULATED_${Date.now()}`);
  formData.append('NumMedia', '0');
  
  try {
    // Enviar la solicitud POST al webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      headers: {
        // No es necesario establecer Content-Type, FormData lo hace automáticamente
      }
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ Solicitud enviada correctamente. Código de estado: ${response.status}`);
      console.log('Respuesta del servidor:', responseText);
      console.log('\n📋 Pasos siguientes:');
      console.log('1. Verifica los logs en Vercel para confirmar que el webhook procesó la respuesta.');
      console.log('2. Verifica en la base de datos que el estado de la solicitud se haya actualizado.');
      console.log('3. Verifica que el cliente haya recibido la notificación correspondiente.');
    } else {
      console.error(`❌ Error en la solicitud. Código de estado: ${response.status}`);
      console.error('Respuesta del servidor:', responseText);
    }
  } catch (error) {
    console.error('❌ Error al enviar la solicitud:', error.message);
    console.error('Verifica que la URL sea accesible y que no haya problemas de red.');
  }
}

// Ejecutar la simulación
const phoneNumber = process.argv[2];
const message = process.argv[3];
simulateWhatsAppResponse(phoneNumber, message).catch(error => {
  console.error('❌ Error en la ejecución del script:', error);
  process.exit(1);
});