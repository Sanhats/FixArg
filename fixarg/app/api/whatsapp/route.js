import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/twilio';

export async function POST(request) {
  try {
    // Verificar que la solicitud sea válida
    if (!request.body) {
      return NextResponse.json({ success: false, error: 'Solicitud inválida' }, { status: 400 });
    }
    
    const data = await request.json();
    const { phoneNumber, message } = data;
    
    // Validación básica para todos los tipos de mensajes
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ success: false, error: 'Número de teléfono inválido' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Mensaje requerido' }, { status: 400 });
    }
    
    // Determinar el tipo de mensaje a enviar
    let mensajeFormateado = message;
    let metadatos = {};
    
    // Si es una solicitud de trabajo (tiene todos los campos adicionales)
    if (data.trabajadorId && data.solicitudId && data.clienteNombre && data.clienteTelefono && data.fecha && data.hora) {
      // Validar campos específicos para solicitudes de trabajo
      if (typeof data.trabajadorId !== 'string') {
        return NextResponse.json({ success: false, error: 'ID del trabajador inválido' }, { status: 400 });
      }
      if (typeof data.solicitudId !== 'string') {
        return NextResponse.json({ success: false, error: 'ID de solicitud inválido' }, { status: 400 });
      }
      if (typeof data.clienteNombre !== 'string' || data.clienteNombre.trim().length === 0) {
        return NextResponse.json({ success: false, error: 'Nombre del cliente requerido' }, { status: 400 });
      }
      if (typeof data.clienteTelefono !== 'string') {
        return NextResponse.json({ success: false, error: 'Teléfono del cliente inválido' }, { status: 400 });
      }
      
      // Formatear el mensaje con un diseño más claro y profesional para solicitudes
      mensajeFormateado = `🔔 *NUEVA SOLICITUD DE SERVICIO*

👤 *Datos del Cliente:*
• Nombre: ${data.clienteNombre}
• Teléfono: ${data.clienteTelefono}

📝 *Detalles del Trabajo:*
${message}

📅 *Fecha y Hora Solicitada:*
• Fecha: ${data.fecha}
• Hora: ${data.hora}

⚠️ *Importante:*
Por favor, responda "CONFIRMAR" para aceptar la solicitud o "RECHAZAR" para declinarla.

¡Gracias por usar FixArg!`;
      
      // Guardar metadatos para la base de datos
      metadatos = {
        trabajador_id: data.trabajadorId,
        solicitud_id: data.solicitudId,
        cliente_nombre: data.clienteNombre,
        cliente_telefono: data.clienteTelefono
      };
    } else if (data.tipo === 'recordatorio_llegada' && data.solicitudId && data.trabajadorId) {
      // Mensaje de recordatorio de llegada
      mensajeFormateado = `🔔 *RECORDATORIO DE SERVICIO*

Tiene un servicio programado para hoy a las ${data.hora}.

Cuando llegue al lugar, por favor responda "LLEGUE" para notificar al cliente.

¡Gracias por usar FixArg!`;
      
      metadatos = {
        trabajador_id: data.trabajadorId,
        solicitud_id: data.solicitudId,
        tipo: 'recordatorio_llegada'
      };
    } else if (data.tipo === 'recordatorio_finalizacion' && data.solicitudId && data.trabajadorId) {
      // Mensaje de recordatorio de finalización
      mensajeFormateado = `🔔 *SERVICIO EN PROGRESO*

Cuando finalice el trabajo, por favor responda "FINALIZADO" para notificar al cliente y permitirle calificar su servicio.

¡Gracias por usar FixArg!`;
      
      metadatos = {
        trabajador_id: data.trabajadorId,
        solicitud_id: data.solicitudId,
        tipo: 'recordatorio_finalizacion'
      };
    }
    // Si no es ninguno de los tipos anteriores, se envía el mensaje tal cual

    // Registrar el mensaje en la base de datos de Supabase
    try {
      // Preparar los datos para insertar en la base de datos
      const mensajeData = {
        phone_number: phoneNumber,
        message: mensajeFormateado,
        status: 'sent',
        created_at: new Date().toISOString(),
        ...metadatos // Agregar los metadatos específicos del tipo de mensaje
      };
      
      const { data, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .insert([mensajeData])
        .select();

      if (error) {
        console.error('Error al registrar mensaje de WhatsApp en Supabase:', error);
        // Continuamos con el envío aunque falle el registro
      }
    } catch (dbError) {
      console.error('Error al registrar mensaje de WhatsApp:', dbError);
      // Continuamos con el envío aunque falle el registro
    }

    const result = await sendWhatsAppMessage(phoneNumber, mensajeFormateado);

    if (!result.success) {
      // Registrar el error específico para depuración en Vercel
      console.error('Error específico de Twilio:', result.error, result.details || '');
      
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Error al enviar el mensaje de WhatsApp',
          details: process.env.NODE_ENV === 'development' ? result.details : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        messageId: result.messageId,
        status: result.status
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en la ruta de WhatsApp:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}