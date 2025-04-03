import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/twilio';

// Función para enviar recordatorios de llegada a trabajadores con servicios programados para hoy
async function enviarRecordatoriosLlegada() {
  try {
    // Obtener la fecha actual en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0];
    
    // Buscar solicitudes confirmadas para hoy
    const { data: solicitudes, error } = await supabaseAdmin
      .from('solicitudes')
      .select(`
        id,
        descripcion,
        fecha,
        hora,
        trabajador_id,
        usuario_id,
        estado
      `)
      .eq('fecha', hoy)
      .eq('estado', 'confirmada');
    
    if (error) {
      console.error('Error al buscar solicitudes para hoy:', error);
      return { success: false, error: 'Error al buscar solicitudes' };
    }
    
    if (!solicitudes || solicitudes.length === 0) {
      console.log('No hay solicitudes confirmadas para hoy');
      return { success: true, message: 'No hay solicitudes para hoy' };
    }
    
    console.log(`Se encontraron ${solicitudes.length} solicitudes para hoy`);
    
    // Enviar recordatorios a cada trabajador
    const resultados = [];
    
    for (const solicitud of solicitudes) {
      // Verificar si ya se envió un recordatorio para esta solicitud hoy
      const { data: mensajesExistentes, error: mensajesError } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('id')
        .eq('solicitud_id', solicitud.id)
        .eq('tipo', 'recordatorio_llegada')
        .gte('created_at', new Date().toISOString().split('T')[0]);
      
      if (mensajesError) {
        console.error('Error al verificar mensajes existentes:', mensajesError);
        continue;
      }
      
      // Si ya se envió un recordatorio hoy, omitir
      if (mensajesExistentes && mensajesExistentes.length > 0) {
        console.log(`Ya se envió un recordatorio para la solicitud ${solicitud.id} hoy`);
        continue;
      }
      
      // Obtener datos del trabajador
      const { data: trabajador, error: trabajadorError } = await supabaseAdmin
        .from('trabajadores')
        .select('phone, first_name, last_name')
        .eq('id', solicitud.trabajador_id)
        .single();
      
      if (trabajadorError || !trabajador || !trabajador.phone) {
        console.error('Error al obtener datos del trabajador:', trabajadorError);
        continue;
      }
      
      // Enviar recordatorio al trabajador
      const mensaje = `🔔 *RECORDATORIO DE SERVICIO*\n\nTiene un servicio programado para hoy a las ${solicitud.hora}.\n\nCuando llegue al lugar, por favor responda "LLEGUE" para notificar al cliente.\n\n¡Gracias por usar FixArg!`;
      
      const resultado = await sendWhatsAppMessage(trabajador.phone, mensaje);
      
      if (resultado.success) {
        // Registrar el mensaje en la base de datos
        await supabaseAdmin
          .from('whatsapp_messages')
          .insert([
            {
              phone_number: trabajador.phone,
              message: mensaje,
              trabajador_id: solicitud.trabajador_id,
              solicitud_id: solicitud.id,
              status: 'sent',
              tipo: 'recordatorio_llegada',
              created_at: new Date().toISOString()
            }
          ]);
        
        resultados.push({
          solicitudId: solicitud.id,
          trabajadorId: solicitud.trabajador_id,
          success: true
        });
      } else {
        resultados.push({
          solicitudId: solicitud.id,
          trabajadorId: solicitud.trabajador_id,
          success: false,
          error: resultado.error
        });
      }
    }
    
    return { success: true, resultados };
  } catch (error) {
    console.error('Error al enviar recordatorios de llegada:', error);
    return { success: false, error: 'Error interno al enviar recordatorios' };
  }
}

// Función para enviar recordatorios de finalización a trabajadores con servicios en progreso
async function enviarRecordatoriosFinalizacion() {
  try {
    // Buscar solicitudes en progreso
    const { data: solicitudes, error } = await supabaseAdmin
      .from('solicitudes')
      .select(`
        id,
        descripcion,
        fecha,
        hora,
        trabajador_id,
        usuario_id,
        estado
      `)
      .eq('estado', 'en_progreso');
    
    if (error) {
      console.error('Error al buscar solicitudes en progreso:', error);
      return { success: false, error: 'Error al buscar solicitudes' };
    }
    
    if (!solicitudes || solicitudes.length === 0) {
      console.log('No hay solicitudes en progreso');
      return { success: true, message: 'No hay solicitudes en progreso' };
    }
    
    console.log(`Se encontraron ${solicitudes.length} solicitudes en progreso`);
    
    // Enviar recordatorios a cada trabajador
    const resultados = [];
    
    for (const solicitud of solicitudes) {
      // Verificar si ya se envió un recordatorio para esta solicitud hoy
      const { data: mensajesExistentes, error: mensajesError } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('id')
        .eq('solicitud_id', solicitud.id)
        .eq('tipo', 'recordatorio_finalizacion')
        .gte('created_at', new Date().toISOString().split('T')[0]);
      
      if (mensajesError) {
        console.error('Error al verificar mensajes existentes:', mensajesError);
        continue;
      }
      
      // Si ya se envió un recordatorio hoy, omitir
      if (mensajesExistentes && mensajesExistentes.length > 0) {
        console.log(`Ya se envió un recordatorio para la solicitud ${solicitud.id} hoy`);
        continue;
      }
      
      // Obtener datos del trabajador
      const { data: trabajador, error: trabajadorError } = await supabaseAdmin
        .from('trabajadores')
        .select('phone, first_name, last_name')
        .eq('id', solicitud.trabajador_id)
        .single();
      
      if (trabajadorError || !trabajador || !trabajador.phone) {
        console.error('Error al obtener datos del trabajador:', trabajadorError);
        continue;
      }
      
      // Enviar recordatorio al trabajador
      const mensaje = `🔔 *SERVICIO EN PROGRESO*\n\nCuando finalice el trabajo, por favor responda "FINALIZADO" para notificar al cliente y permitirle calificar su servicio.\n\n¡Gracias por usar FixArg!`;
      
      const resultado = await sendWhatsAppMessage(trabajador.phone, mensaje);
      
      if (resultado.success) {
        // Registrar el mensaje en la base de datos
        await supabaseAdmin
          .from('whatsapp_messages')
          .insert([
            {
              phone_number: trabajador.phone,
              message: mensaje,
              trabajador_id: solicitud.trabajador_id,
              solicitud_id: solicitud.id,
              status: 'sent',
              tipo: 'recordatorio_finalizacion',
              created_at: new Date().toISOString()
            }
          ]);
        
        resultados.push({
          solicitudId: solicitud.id,
          trabajadorId: solicitud.trabajador_id,
          success: true
        });
      } else {
        resultados.push({
          solicitudId: solicitud.id,
          trabajadorId: solicitud.trabajador_id,
          success: false,
          error: resultado.error
        });
      }
    }
    
    return { success: true, resultados };
  } catch (error) {
    console.error('Error al enviar recordatorios de finalización:', error);
    return { success: false, error: 'Error interno al enviar recordatorios' };
  }
}

// Endpoint para ejecutar manualmente los recordatorios (también se puede configurar con un cron job)
export async function GET(request) {
  try {
    // Verificar autenticación (opcional, dependiendo de cómo quieras proteger este endpoint)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener el tipo de recordatorio a enviar (llegada o finalización)
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    
    let resultado;
    
    if (tipo === 'llegada') {
      resultado = await enviarRecordatoriosLlegada();
    } else if (tipo === 'finalizacion') {
      resultado = await enviarRecordatoriosFinalizacion();
    } else {
      // Si no se especifica tipo, enviar ambos tipos de recordatorios
      const resultadoLlegada = await enviarRecordatoriosLlegada();
      const resultadoFinalizacion = await enviarRecordatoriosFinalizacion();
      
      resultado = {
        success: resultadoLlegada.success && resultadoFinalizacion.success,
        llegada: resultadoLlegada,
        finalizacion: resultadoFinalizacion
      };
    }
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error en el endpoint de recordatorios:', error);
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