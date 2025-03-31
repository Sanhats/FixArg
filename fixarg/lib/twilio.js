const twilio = require('twilio');

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  throw new Error('Please add your Twilio credentials to .env.local');
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Función para validar y formatear el número de teléfono
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Eliminar espacios y caracteres especiales
  let cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Asegurarse de que el número comience con el código de país
  if (!cleaned.startsWith('+')) {
    // Si comienza con 0, quitarlo antes de agregar el código de país
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Manejar números argentinos que comienzan con 15
    // En Argentina, los números móviles a veces se escriben como 15XXXXXXXX
    // pero para el formato internacional deben ser +54 9 XXXXXXXX
    if (cleaned.startsWith('15')) {
      cleaned = cleaned.substring(2);
      // Agregar código de país de Argentina y el 9 para móviles
      cleaned = `+549${cleaned}`;
    } else {
      // Asumir que todos los números son móviles en Argentina
      // y agregar el código de país +549 para WhatsApp
      cleaned = `+549${cleaned}`;
    }
  } else if (cleaned.startsWith('+54') && !cleaned.startsWith('+549')) {
    // Si ya tiene código de país +54 pero no tiene el 9 para móviles, agregarlo
    cleaned = `+549${cleaned.substring(3)}`;
  }
  
  // Verificar que el número tenga al menos 10 dígitos (sin contar el código de país)
  if (cleaned.replace(/[^\d]/g, '').length < 10) {
    console.warn('Número de teléfono posiblemente inválido:', phoneNumber);
  }
  
  console.log('Número formateado para WhatsApp:', cleaned);
  return cleaned;
};

// Función para enviar mensaje de WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
    const formattedNumber = formatPhoneNumber(to);
    
    if (!formattedNumber) {
      console.error('Número de teléfono inválido:', to);
      return {
        success: false,
        error: 'Número de teléfono inválido'
      };
    }
    
    console.log('Enviando mensaje de WhatsApp a:', formattedNumber);
    
    // Verificar que las credenciales de Twilio estén configuradas
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Faltan credenciales de Twilio');
      return {
        success: false,
        error: 'Configuración de Twilio incompleta'
      };
    }
    
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    });

    console.log('Respuesta de Twilio:', response.sid, response.status);
    
    return {
      success: true,
      messageId: response.sid,
      status: response.status
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    
    // Manejo específico de errores de Twilio para entorno serverless
    let errorMessage = 'Error al enviar el mensaje de WhatsApp';
    
    if (error.code) {
      // Códigos de error específicos de Twilio
      switch (error.code) {
        case 20003: // Authentication Error
          errorMessage = 'Error de autenticación con Twilio. Verifique las credenciales.';
          break;
        case 20404: // Resource not found
          errorMessage = 'Recurso no encontrado en Twilio. Verifique el número de teléfono.';
          break;
        case 21211: // Invalid phone number
          errorMessage = 'Número de teléfono inválido o no compatible con WhatsApp.';
          break;
        case 21608: // The From phone number is not a valid, SMS-capable inbound phone number
          errorMessage = 'El número de teléfono de origen no es válido para WhatsApp.';
          break;
        case 21610: // Message body is required
          errorMessage = 'El cuerpo del mensaje es requerido.';
          break;
        case 21612: // The 'To' phone number is not currently reachable
          errorMessage = 'El número de teléfono de destino no está disponible actualmente.';
          break;
        default:
          errorMessage = `Error de Twilio: ${error.message}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message
    };
  }
}

module.exports = {
  sendWhatsAppMessage,
  formatPhoneNumber
};