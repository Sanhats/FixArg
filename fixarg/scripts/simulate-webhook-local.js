/**
 * Script para simular un webhook de Twilio localmente
 * 
 * Este script envía una solicitud POST directamente al endpoint del webhook
 * simulando los datos que Twilio enviaría, permitiendo probar la integración
 * sin necesidad de enviar mensajes reales a través de Twilio.
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Verificar argumentos de línea de comandos
const phoneNumber = process.argv[2];
const message = process.argv[3] || 'CONFIRMAR';

if (!phoneNumber) {
  console.error('Error: No se proporcionó un número de teléfono.');
  console.error('Uso: node simulate-webhook-local.js +5491123456789 "CONFIRMAR"');
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

// Función para simular un webhook de Twilio
async function simulateWebhook() {
  try {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log(`📱 Número formateado: ${formattedNumber}`);
    
    // Determinar la URL base
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000';
    const isLocalhost = baseUrl.includes('localhost');
    
    // Construir la URL completa del webhook
    const webhookUrl = isLocalhost
      ? `http://${baseUrl}/api/whatsapp/webhook`
      : `https://${baseUrl}/api/whatsapp/webhook`;
    
    console.log(`📡 Enviando solicitud POST a: ${webhookUrl}`);
    
    // Crear los datos del formulario que Twilio enviaría
    const formData = new URLSearchParams();
    formData.append('Body', message);
    formData.append('From', `whatsapp:${formattedNumber}`);
    formData.append('To', `whatsapp:${process.env.TWILIO_PHONE_NUMBER || '+14155238886'}`);
    formData.append('MessageSid', `SM${Date.now()}${Math.floor(Math.random() * 1000000)}`);
    formData.append('SmsMessageSid', `SM${Date.now()}${Math.floor(Math.random() * 1000000)}`);
    formData.append('AccountSid', process.env.TWILIO_ACCOUNT_SID || 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
    formData.append('NumMedia', '0');
    formData.append('ProfileName', 'Usuario de Prueba');
    formData.append('WaId', formattedNumber.replace('+', ''));
    formData.append('SmsStatus', 'received');
    formData.append('SmsSid', `SM${Date.now()}${Math.floor(Math.random() * 1000000)}`);
    // Añadir campos adicionales que Twilio envía en producción
    formData.append('ApiVersion', '2010-04-01');
    formData.append('NumSegments', '1');
    
    console.log('Datos del formulario:', Object.fromEntries(formData.entries()));
    
    // Enviar la solicitud POST al webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'TwilioProxy/1.1',
        'X-Twilio-Signature': 'simulado'
      },
      body: formData
    });
    
    // Verificar la respuesta
    const responseText = await response.text();
    console.log(`📊 Código de estado: ${response.status}`);
    console.log(`📄 Respuesta del servidor: ${responseText}`);
    
    if (response.status === 200) {
      console.log('✅ Simulación exitosa. El webhook procesó la solicitud correctamente.');
      console.log('\n📋 Instrucciones para verificar:');
      console.log('1. Verifica los logs del servidor para confirmar que el webhook procesó el mensaje.');
      console.log('2. Si el webhook está configurado correctamente, debería haber actualizado la solicitud en la base de datos.');
    } else {
      console.error(`❌ Error en la simulación. Código de estado: ${response.status}`);
      console.error('Verifica los logs del servidor para más detalles.');
    }
  } catch (error) {
    console.error('❌ Error al simular el webhook:', error.message);
  }
}

// Ejecutar la simulación
simulateWebhook().catch(error => {
  console.error('Error no controlado:', error);
  process.exit(1);
});