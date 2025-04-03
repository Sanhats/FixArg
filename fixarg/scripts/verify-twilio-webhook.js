/**
 * Script para verificar la configuración del webhook de Twilio en producción
 * 
 * Este script realiza una solicitud HTTP a la URL del webhook para verificar
 * que esté accesible y configurada correctamente.
 */

require('dotenv').config();
const fetch = require('node-fetch');

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

// Función para verificar la accesibilidad del webhook
async function checkWebhookAccessibility() {
  if (!checkEnvironmentVariables()) {
    return;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  const webhookUrl = `https://${baseUrl}/api/whatsapp/webhook`;
  
  console.log(`🔍 Verificando accesibilidad del webhook: ${webhookUrl}`);
  
  try {
    // Intentar acceder al webhook con GET (debería devolver 405 Method Not Allowed)
    const response = await fetch(webhookUrl);
    
    if (response.status === 405) {
      console.log('✅ El webhook está accesible y configurado correctamente (responde con 405 Method Not Allowed para GET).');
      console.log('\n📋 Instrucciones para verificar la integración completa:');
      console.log('1. Asegúrate de que la URL del webhook esté configurada en el panel de Twilio:');
      console.log(`   ${webhookUrl}`);
      console.log('2. Envía un mensaje de prueba usando el script test-twilio-webhook.js:');
      console.log('   node scripts/test-twilio-webhook.js +5491123456789');
      console.log('3. Responde "CONFIRMAR" al mensaje recibido en WhatsApp.');
      console.log('4. Verifica los logs en Vercel para confirmar que el webhook recibió la respuesta.');
    } else {
      console.error(`❌ El webhook no está configurado correctamente. Código de estado: ${response.status}`);
      console.error('Verifica que la ruta del webhook exista en tu aplicación.');
    }
  } catch (error) {
    console.error('❌ Error al verificar el webhook:', error.message);
    console.error('Verifica que la URL sea accesible y que no haya problemas de red.');
  }
}

// Ejecutar la verificación
checkWebhookAccessibility().catch(error => {
  console.error('❌ Error en la ejecución del script:', error);
  process.exit(1);
});