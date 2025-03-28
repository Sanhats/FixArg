import { sendWhatsAppMessage } from '@/lib/twilio';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { phoneNumber, message, trabajadorId, solicitudId, clienteNombre, clienteTelefono, fecha, hora } = await request.json();

    // Validar que todos los campos requeridos estén presentes y tengan el formato correcto
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Número de teléfono inválido' }), { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Descripción del trabajo requerida' }), { status: 400 });
    }
    if (!trabajadorId || typeof trabajadorId !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'ID del trabajador inválido' }), { status: 400 });
    }
    if (!solicitudId || typeof solicitudId !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'ID de solicitud inválido' }), { status: 400 });
    }
    if (!clienteNombre || typeof clienteNombre !== 'string' || clienteNombre.trim().length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Nombre del cliente requerido' }), { status: 400 });
    }
    if (!clienteTelefono || typeof clienteTelefono !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Teléfono del cliente inválido' }), { status: 400 });
    }
    if (!fecha || !hora) {
      return new Response(JSON.stringify({ success: false, error: 'Fecha y hora requeridas' }), { status: 400 });
    }
    
    // Formatear el mensaje con los datos del cliente y la solicitud
    // Formatear el mensaje con un diseño más claro y profesional
    const mensajeFormateado = `🔔 *NUEVA SOLICITUD DE SERVICIO*

👤 *Datos del Cliente:*
• Nombre: ${clienteNombre}
• Teléfono: ${clienteTelefono}

📝 *Detalles del Trabajo:*
${message}

📅 *Fecha y Hora Solicitada:*
• Fecha: ${fecha}
• Hora: ${hora}

⚠️ *Importante:*
Por favor, responda "CONFIRMAR" para aceptar la solicitud o "RECHAZAR" para declinarla.

¡Gracias por usar FixArg!`

    // Registrar el mensaje en la base de datos
    try {
      const { db } = await connectToDatabase();
      await db.collection('whatsapp_messages').insertOne({
        phoneNumber,
        message: mensajeFormateado,
        trabajadorId: new ObjectId(trabajadorId),
        solicitudId: new ObjectId(solicitudId),
        clienteNombre,
        clienteTelefono,
        timestamp: new Date()
      });
    } catch (dbError) {
      console.error('Error al registrar mensaje de WhatsApp:', dbError);
      // Continuamos con el envío aunque falle el registro
    }

    const result = await sendWhatsAppMessage(phoneNumber, mensajeFormateado);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Error al enviar el mensaje de WhatsApp'
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
        status: result.status
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en la ruta de WhatsApp:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }),
      { status: 500 }
    );
  }
}