import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/twilio';

// Función para procesar las respuestas de los trabajadores
async function procesarRespuestaTrabajador(mensaje, numeroTelefono) {
  try {
    // Normalizar el mensaje para comparación (convertir a mayúsculas y eliminar espacios)
    const mensajeNormalizado = mensaje.trim().toUpperCase();
    
    // Buscar el último mensaje enviado a este número de teléfono
    console.log('Buscando mensajes para el número:', numeroTelefono);
    const { data: mensajes, error: mensajesError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .eq('phone_number', numeroTelefono)
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log('Resultado de búsqueda de mensajes:', { encontrados: mensajes?.length || 0 });
    
    if (mensajesError) {
      console.error('Error al buscar mensajes:', mensajesError);
      return { success: false, error: 'Error al buscar mensajes' };
    }
    
    if (!mensajes || mensajes.length === 0) {
      console.warn('No se encontraron mensajes previos para este número:', numeroTelefono);
      return { success: false, error: 'No se encontraron mensajes previos' };
    }
    
    const ultimoMensaje = mensajes[0];
    console.log('Último mensaje encontrado:', JSON.stringify(ultimoMensaje));
    
    const solicitudId = ultimoMensaje.solicitud_id;
    console.log('ID de solicitud extraído:', solicitudId);
    
    if (!solicitudId) {
      console.warn('El último mensaje no está asociado a una solicitud');
      return { success: false, error: 'Mensaje no asociado a solicitud' };
    }
    
    // Verificar que la solicitud existe antes de intentar actualizarla
    const { data: solicitudPrevia, error: errorVerificacionPrevia } = await supabaseAdmin
      .from('solicitudes')
      .select('id, estado')
      .eq('id', solicitudId)
      .single();
      
    if (errorVerificacionPrevia) {
      console.error('Error al verificar existencia previa de solicitud:', errorVerificacionPrevia);
    } else {
      console.log('Estado actual de la solicitud antes de actualizar:', solicitudPrevia?.estado);
    }
    
    // Actualizar el estado de la solicitud según la respuesta
    if (mensajeNormalizado === 'CONFIRMAR') {
      // Actualizar el estado de la solicitud a 'confirmada'
      console.log(`Actualizando estado de solicitud ${solicitudId} a 'confirmada'`);
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('solicitudes')
        .update({ estado: 'confirmada' })
        .eq('id', solicitudId)
        .select();
      
      if (updateError) {
        console.error('Error al actualizar solicitud:', updateError);
        return { success: false, error: 'Error al actualizar solicitud' };
      }
      
      if (!updateData || updateData.length === 0) {
        console.warn(`No se encontró la solicitud con ID ${solicitudId} para actualizar`);
        // Intentar verificar si la solicitud existe
        const { data: solicitudExiste, error: errorVerificacion } = await supabaseAdmin
          .from('solicitudes')
          .select('id, estado')
          .eq('id', solicitudId)
          .single();
          
        if (errorVerificacion) {
          console.error('Error al verificar existencia de solicitud:', errorVerificacion);
          return { success: false, error: 'No se pudo verificar la existencia de la solicitud' };
        }
        
        if (!solicitudExiste) {
          return { success: false, error: 'La solicitud no existe en la base de datos' };
        }
        
        console.log('Estado actual de la solicitud:', solicitudExiste.estado);
        if (solicitudExiste.estado === 'confirmada') {
          console.log('La solicitud ya estaba confirmada');
        } else {
          // Intentar actualizar nuevamente
          const { error: retryError } = await supabaseAdmin
            .from('solicitudes')
            .update({ estado: 'confirmada' })
            .eq('id', solicitudId);
            
          if (retryError) {
            console.error('Error en segundo intento de actualización:', retryError);
            return { success: false, error: 'Error persistente al actualizar solicitud' };
          }
        }
      } else {
        console.log('Solicitud actualizada correctamente:', updateData);
      }
      
      // Registrar la respuesta en la tabla de mensajes
      await supabaseAdmin
        .from('whatsapp_messages')
        .insert([
          {
            phone_number: numeroTelefono,
            message: 'CONFIRMAR',
            trabajador_id: ultimoMensaje.trabajador_id,
            solicitud_id: solicitudId,
            status: 'received',
            created_at: new Date().toISOString()
          }
        ]);
      
      // Obtener datos del cliente para enviar confirmación
      const { data: solicitud, error: solicitudError } = await supabaseAdmin
        .from('solicitudes')
        .select(`
          id,
          descripcion,
          fecha,
          hora,
          usuario_id
        `)
        .eq('id', solicitudId)
        .single();
      
      if (solicitudError) {
        console.error('Error al obtener datos de la solicitud:', solicitudError);
        return { success: true, message: 'Solicitud confirmada pero no se pudo notificar al cliente' };
      }
      
      // Obtener datos del cliente
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('usuarios')
        .select('phone, first_name, last_name')
        .eq('id', solicitud.usuario_id)
        .single();
      
      if (clienteError || !cliente || !cliente.phone) {
        console.error('Error al obtener datos del cliente:', clienteError);
        return { success: true, message: 'Solicitud confirmada pero no se pudo notificar al cliente' };
      }
      
      // Enviar mensaje de confirmación al cliente
      const mensajeCliente = `✅ *SOLICITUD CONFIRMADA*\n\nSu solicitud para el día ${solicitud.fecha} a las ${solicitud.hora} ha sido confirmada por el profesional.\n\nDetalles del trabajo:\n${solicitud.descripcion}\n\nGracias por usar FixArg!`;
      
      await sendWhatsAppMessage(cliente.phone, mensajeCliente);
      
      return { success: true, message: 'Solicitud confirmada y cliente notificado' };
    } else if (mensajeNormalizado === 'RECHAZAR') {
      // Actualizar el estado de la solicitud a 'rechazada'
      console.log(`Actualizando estado de solicitud ${solicitudId} a 'rechazada'`);
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('solicitudes')
        .update({ estado: 'rechazada' })
        .eq('id', solicitudId)
        .select();
      
      if (updateError) {
        console.error('Error al actualizar solicitud:', updateError);
        return { success: false, error: 'Error al actualizar solicitud' };
      }
      
      if (!updateData || updateData.length === 0) {
        console.warn(`No se encontró la solicitud con ID ${solicitudId} para actualizar`);
        // Intentar verificar si la solicitud existe
        const { data: solicitudExiste, error: errorVerificacion } = await supabaseAdmin
          .from('solicitudes')
          .select('id, estado')
          .eq('id', solicitudId)
          .single();
          
        if (errorVerificacion) {
          console.error('Error al verificar existencia de solicitud:', errorVerificacion);
          return { success: false, error: 'No se pudo verificar la existencia de la solicitud' };
        }
        
        if (!solicitudExiste) {
          return { success: false, error: 'La solicitud no existe en la base de datos' };
        }
        
        console.log('Estado actual de la solicitud:', solicitudExiste.estado);
        if (solicitudExiste.estado === 'rechazada') {
          console.log('La solicitud ya estaba rechazada');
        } else {
          // Intentar actualizar nuevamente
          const { error: retryError } = await supabaseAdmin
            .from('solicitudes')
            .update({ estado: 'rechazada' })
            .eq('id', solicitudId);
            
          if (retryError) {
            console.error('Error en segundo intento de actualización:', retryError);
            return { success: false, error: 'Error persistente al actualizar solicitud' };
          }
        }
      } else {
        console.log('Solicitud actualizada correctamente:', updateData);
      }
      
      // Registrar la respuesta en la tabla de mensajes
      await supabaseAdmin
        .from('whatsapp_messages')
        .insert([
          {
            phone_number: numeroTelefono,
            message: 'RECHAZAR',
            trabajador_id: ultimoMensaje.trabajador_id,
            solicitud_id: solicitudId,
            status: 'received',
            created_at: new Date().toISOString()
          }
        ]);
      
      // Obtener datos del cliente para enviar notificación
      const { data: solicitud, error: solicitudError } = await supabaseAdmin
        .from('solicitudes')
        .select(`
          id,
          descripcion,
          fecha,
          hora,
          usuario_id
        `)
        .eq('id', solicitudId)
        .single();
      
      if (solicitudError) {
        console.error('Error al obtener datos de la solicitud:', solicitudError);
        return { success: true, message: 'Solicitud rechazada pero no se pudo notificar al cliente' };
      }
      
      // Obtener datos del cliente
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('usuarios')
        .select('phone, first_name, last_name')
        .eq('id', solicitud.usuario_id)
        .single();
      
      if (clienteError || !cliente || !cliente.phone) {
        console.error('Error al obtener datos del cliente:', clienteError);
        return { success: true, message: 'Solicitud rechazada pero no se pudo notificar al cliente' };
      }
      
      // Enviar mensaje de rechazo al cliente
      const mensajeCliente = `❌ *SOLICITUD RECHAZADA*\n\nLamentablemente, su solicitud para el día ${solicitud.fecha} a las ${solicitud.hora} ha sido rechazada por el profesional.\n\nLe recomendamos buscar otro profesional disponible en nuestra plataforma.\n\nGracias por usar FixArg!`;
      
      await sendWhatsAppMessage(cliente.phone, mensajeCliente);
      
      return { success: true, message: 'Solicitud rechazada y cliente notificado' };
    } else if (mensajeNormalizado === 'LLEGUE') {
      // Actualizar el estado de la solicitud a 'en_progreso'
      console.log(`Actualizando estado de solicitud ${solicitudId} a 'en_progreso'`);
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('solicitudes')
        .update({ estado: 'en_progreso' })
        .eq('id', solicitudId)
        .select();
      
      if (updateError) {
        console.error('Error al actualizar solicitud:', updateError);
        return { success: false, error: 'Error al actualizar solicitud' };
      }
      
      if (!updateData || updateData.length === 0) {
        console.warn(`No se encontró la solicitud con ID ${solicitudId} para actualizar`);
        // Intentar verificar si la solicitud existe
        const { data: solicitudExiste, error: errorVerificacion } = await supabaseAdmin
          .from('solicitudes')
          .select('id, estado')
          .eq('id', solicitudId)
          .single();
          
        if (errorVerificacion) {
          console.error('Error al verificar existencia de solicitud:', errorVerificacion);
          return { success: false, error: 'No se pudo verificar la existencia de la solicitud' };
        }
        
        if (!solicitudExiste) {
          return { success: false, error: 'La solicitud no existe en la base de datos' };
        }
        
        console.log('Estado actual de la solicitud:', solicitudExiste.estado);
        if (solicitudExiste.estado === 'en_progreso') {
          console.log('La solicitud ya estaba en progreso');
        } else {
          // Intentar actualizar nuevamente
          const { error: retryError } = await supabaseAdmin
            .from('solicitudes')
            .update({ estado: 'en_progreso' })
            .eq('id', solicitudId);
            
          if (retryError) {
            console.error('Error en segundo intento de actualización:', retryError);
            return { success: false, error: 'Error persistente al actualizar solicitud' };
          }
        }
      } else {
        console.log('Solicitud actualizada correctamente:', updateData);
      }
      
      // Registrar la respuesta en la tabla de mensajes
      await supabaseAdmin
        .from('whatsapp_messages')
        .insert([
          {
            phone_number: numeroTelefono,
            message: 'LLEGUE',
            trabajador_id: ultimoMensaje.trabajador_id,
            solicitud_id: solicitudId,
            status: 'received',
            created_at: new Date().toISOString()
          }
        ]);
      
      // Obtener datos del cliente para enviar notificación
      const { data: solicitud, error: solicitudError } = await supabaseAdmin
        .from('solicitudes')
        .select(`
          id,
          descripcion,
          fecha,
          hora,
          usuario_id
        `)
        .eq('id', solicitudId)
        .single();
      
      if (solicitudError) {
        console.error('Error al obtener datos de la solicitud:', solicitudError);
        return { success: true, message: 'Estado actualizado pero no se pudo notificar al cliente' };
      }
      
      // Obtener datos del cliente
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('usuarios')
        .select('phone, first_name, last_name')
        .eq('id', solicitud.usuario_id)
        .single();
      
      if (clienteError || !cliente || !cliente.phone) {
        console.error('Error al obtener datos del cliente:', clienteError);
        return { success: true, message: 'Estado actualizado pero no se pudo notificar al cliente' };
      }
      
      // Enviar mensaje de llegada al cliente
      const mensajeCliente = `🔔 *PROFESIONAL EN SITIO*\n\nEl profesional ha llegado para realizar el trabajo solicitado para hoy a las ${solicitud.hora}.\n\nDetalles del trabajo:\n${solicitud.descripcion}\n\nGracias por usar FixArg!`;
      
      await sendWhatsAppMessage(cliente.phone, mensajeCliente);
      
      return { success: true, message: 'Estado actualizado y cliente notificado' };
    } else if (mensajeNormalizado === 'FINALIZADO') {
      // Actualizar el estado de la solicitud a 'completada'
      console.log(`Actualizando estado de solicitud ${solicitudId} a 'completada'`);
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('solicitudes')
        .update({ estado: 'completada' })
        .eq('id', solicitudId)
        .select();
      
      if (updateError) {
        console.error('Error al actualizar solicitud:', updateError);
        return { success: false, error: 'Error al actualizar solicitud' };
      }
      
      if (!updateData || updateData.length === 0) {
        console.warn(`No se encontró la solicitud con ID ${solicitudId} para actualizar`);
        // Intentar verificar si la solicitud existe
        const { data: solicitudExiste, error: errorVerificacion } = await supabaseAdmin
          .from('solicitudes')
          .select('id, estado')
          .eq('id', solicitudId)
          .single();
          
        if (errorVerificacion) {
          console.error('Error al verificar existencia de solicitud:', errorVerificacion);
          return { success: false, error: 'No se pudo verificar la existencia de la solicitud' };
        }
        
        if (!solicitudExiste) {
          return { success: false, error: 'La solicitud no existe en la base de datos' };
        }
        
        console.log('Estado actual de la solicitud:', solicitudExiste.estado);
        if (solicitudExiste.estado === 'completada') {
          console.log('La solicitud ya estaba completada');
        } else {
          // Intentar actualizar nuevamente
          const { error: retryError } = await supabaseAdmin
            .from('solicitudes')
            .update({ estado: 'completada' })
            .eq('id', solicitudId);
            
          if (retryError) {
            console.error('Error en segundo intento de actualización:', retryError);
            return { success: false, error: 'Error persistente al actualizar solicitud' };
          }
        }
      } else {
        console.log('Solicitud actualizada correctamente:', updateData);
      }
      
      // Registrar la respuesta en la tabla de mensajes
      await supabaseAdmin
        .from('whatsapp_messages')
        .insert([
          {
            phone_number: numeroTelefono,
            message: 'FINALIZADO',
            trabajador_id: ultimoMensaje.trabajador_id,
            solicitud_id: solicitudId,
            status: 'received',
            created_at: new Date().toISOString()
          }
        ]);
      
      // Obtener datos del cliente para enviar notificación
      const { data: solicitud, error: solicitudError } = await supabaseAdmin
        .from('solicitudes')
        .select(`
          id,
          descripcion,
          fecha,
          hora,
          usuario_id,
          trabajador_id
        `)
        .eq('id', solicitudId)
        .single();
      
      if (solicitudError) {
        console.error('Error al obtener datos de la solicitud:', solicitudError);
        return { success: true, message: 'Trabajo finalizado pero no se pudo notificar al cliente' };
      }
      
      // Obtener datos del cliente
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('usuarios')
        .select('phone, first_name, last_name')
        .eq('id', solicitud.usuario_id)
        .single();
      
      if (clienteError || !cliente || !cliente.phone) {
        console.error('Error al obtener datos del cliente:', clienteError);
        return { success: true, message: 'Trabajo finalizado pero no se pudo notificar al cliente' };
      }
      
      // Obtener datos del trabajador
      const { data: trabajador, error: trabajadorError } = await supabaseAdmin
        .from('trabajadores')
        .select('first_name, last_name')
        .eq('id', solicitud.trabajador_id)
        .single();
      
      // Enviar mensaje de finalización al cliente con enlace para calificar
      const nombreTrabajador = trabajador ? `${trabajador.first_name} ${trabajador.last_name}` : 'el profesional';
      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
      const urlCalificacion = `${baseUrl}/calificar/${solicitud.id}`;
      
      const mensajeCliente = `✅ *TRABAJO FINALIZADO*\n\n${nombreTrabajador} ha marcado como finalizado el trabajo solicitado.\n\n📝 *¿Cómo fue tu experiencia?*\nPor favor, califica el servicio recibido en el siguiente enlace:\n${urlCalificacion}\n\nTu opinión es muy importante para nosotros.\n\nGracias por usar FixArg!`;
      
      await sendWhatsAppMessage(cliente.phone, mensajeCliente);
      
      return { success: true, message: 'Trabajo finalizado y cliente notificado' };
    } else {
      // Respuesta no reconocida
      console.log('Respuesta no reconocida:', mensajeNormalizado);
      
      // Registrar la respuesta en la tabla de mensajes
      await supabaseAdmin
        .from('whatsapp_messages')
        .insert([
          {
            phone_number: numeroTelefono,
            message: mensaje,
            trabajador_id: ultimoMensaje.trabajador_id,
            solicitud_id: solicitudId,
            status: 'received',
            created_at: new Date().toISOString()
          }
        ]);
      
      // Enviar mensaje de ayuda al trabajador
      const mensajeAyuda = `*Respuesta no reconocida*\n\nPor favor, responda con una de las siguientes opciones:\n\n- CONFIRMAR: Para aceptar una solicitud\n- RECHAZAR: Para rechazar una solicitud\n- LLEGUE: Para indicar que ha llegado al lugar del trabajo\n- FINALIZADO: Para marcar un trabajo como completado\n\nGracias por usar FixArg!`;
      
      await sendWhatsAppMessage(numeroTelefono, mensajeAyuda);
      
      return { success: true, message: 'Respuesta no reconocida, se envió mensaje de ayuda' };
    }
  } catch (error) {
    console.error('Error al procesar respuesta:', error);
    return { success: false, error: 'Error interno al procesar respuesta' };
  }
}

// Endpoint para recibir webhooks de Twilio
export async function POST(request) {
  try {
    console.log('=== INICIO PROCESAMIENTO WEBHOOK TWILIO ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Verificar que la solicitud sea válida
    if (!request.body) {
      console.error('Error: Solicitud sin cuerpo');
      return NextResponse.json({ success: false, error: 'Solicitud inválida' }, { status: 400 });
    }
    
    console.log('Webhook recibido - request completo:', request);
    
    // Obtener los datos del formulario (Twilio envía datos como form-urlencoded)
    const formData = await request.formData();
    
    // Log de todos los campos recibidos para depuración
    console.log('=== CAMPOS DEL WEBHOOK ===');
    const camposWebhook = {};
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
      camposWebhook[key] = value;
    }
    console.log('Resumen de campos:', JSON.stringify(camposWebhook));
    
    // Extraer los datos relevantes
    const mensaje = formData.get('Body');
    // Asegurar que el número de teléfono esté correctamente formateado
    let numeroTelefono = formData.get('From')?.replace('whatsapp:', '');
    // Verificar si el número tiene el formato correcto (con código de país)
    if (numeroTelefono && !numeroTelefono.startsWith('+')) {
      numeroTelefono = '+' + numeroTelefono;
    }
    const messageSid = formData.get('MessageSid') || 'No disponible';
    
    // Validar que tengamos los datos necesarios
    if (!mensaje || !numeroTelefono) {
      console.error('Datos incompletos en webhook:', { mensaje, numeroTelefono, messageSid });
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }
    
    console.log('=== DATOS PROCESADOS ===');
    console.log('Webhook recibido:', { mensaje, numeroTelefono, messageSid });
    
    // Procesar la respuesta del trabajador
    console.log('Iniciando procesamiento de respuesta del trabajador...');
    const resultado = await procesarRespuestaTrabajador(mensaje, numeroTelefono);
    
    // Registrar el resultado para depuración
    console.log('=== RESULTADO DEL PROCESAMIENTO ===');
    console.log('Resultado:', JSON.stringify(resultado));
    
    // Verificar si se actualizó correctamente el estado
    if (resultado.success) {
      console.log('✅ Procesamiento exitoso:', resultado.message);
    } else {
      console.error('❌ Error en procesamiento:', resultado.error);
    }
    
    // Responder a Twilio con un TwiML vacío (no es necesario enviar una respuesta inmediata)
    console.log('=== ENVIANDO RESPUESTA A TWILIO ===');
    const response = new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml'
        }
      }
    );
    
    console.log('=== FIN PROCESAMIENTO WEBHOOK TWILIO ===');
    return response;
  } catch (error) {
    console.error('=== ERROR EN WEBHOOK DE WHATSAPP ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    // Registrar información adicional para depuración
    try {
      console.error('Detalles de la solicitud:', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      });
    } catch (logError) {
      console.error('Error al registrar detalles de la solicitud:', logError);
    }
    
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