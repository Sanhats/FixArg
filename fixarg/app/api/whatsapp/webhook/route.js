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
    
    // Intentar buscar con el número exacto primero
    console.log('Buscando mensajes para el número exacto:', numeroTelefono);
    let { data: mensajes, error: mensajesError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .eq('phone_number', numeroTelefono)
      .order('created_at', { ascending: false })
      .limit(5); // Aumentar el límite para tener más posibilidades de encontrar una coincidencia válida
    
    // Si no se encuentra, intentar buscar con variantes del número
    if (!mensajes || mensajes.length === 0) {
      console.log('No se encontraron mensajes con el número exacto, intentando búsqueda alternativa');
      
      // Crear variantes del número para búsqueda
      const variantesNumero = [];
      
      // Variante 1: Si comienza con +549, probar con +54
      if (numeroTelefono.startsWith('+549')) {
        const numeroSin9 = '+54' + numeroTelefono.substring(4);
        variantesNumero.push(numeroSin9);
        console.log('Añadiendo variante sin 9:', numeroSin9);
      }
      
      // Variante 2: Si comienza con +54 (sin 9), probar con +549
      if (numeroTelefono.startsWith('+54') && !numeroTelefono.startsWith('+549')) {
        const numeroCon9 = '+549' + numeroTelefono.substring(3);
        variantesNumero.push(numeroCon9);
        console.log('Añadiendo variante con 9:', numeroCon9);
      }
      
      // Variante 3: Si no tiene prefijo internacional, probar con +54 y +549
      if (!numeroTelefono.startsWith('+')) {
        variantesNumero.push('+54' + numeroTelefono);
        variantesNumero.push('+549' + numeroTelefono);
        console.log('Añadiendo variantes con prefijo internacional');
      }
      
      // Buscar con cada variante hasta encontrar mensajes
      for (const variante of variantesNumero) {
        console.log('Intentando con número alternativo:', variante);
        
        ({ data: mensajes, error: mensajesError } = await supabaseAdmin
          .from('whatsapp_messages')
          .select('*')
          .eq('phone_number', variante)
          .order('created_at', { ascending: false })
          .limit(1));
        
        if (mensajes && mensajes.length > 0) {
          console.log('Mensajes encontrados con la variante:', variante);
          break;
        }
      }
    }
    
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
      console.log('Datos de la solicitud antes de actualizar:', { solicitudId, numeroTelefono });
      
      // Verificar que la solicitud existe antes de intentar actualizarla
      console.log('Verificando existencia de solicitud con ID:', solicitudId);
      const { data: solicitudExistente, error: errorVerificacion } = await supabaseAdmin
        .from('solicitudes')
        .select('id, estado, trabajador_id, usuario_id, fecha_creacion')
        .eq('id', solicitudId)
        .single();
        
      // Registrar información detallada para depuración
      console.log('Consulta SQL ejecutada:', `SELECT id, estado, trabajador_id, usuario_id, fecha_creacion FROM solicitudes WHERE id = '${solicitudId}'`);
      
      console.log('Resultado de verificación de solicitud:', { 
        encontrada: !!solicitudExistente, 
        error: errorVerificacion ? JSON.stringify(errorVerificacion) : 'ninguno',
        datos: solicitudExistente ? JSON.stringify(solicitudExistente) : 'ninguno'
      });
        
      if (errorVerificacion) {
        console.error('Error al verificar existencia de solicitud:', errorVerificacion);
        return { success: false, error: 'No se pudo verificar la existencia de la solicitud' };
      }
      
      if (!solicitudExistente) {
        console.error(`No se encontró la solicitud con ID ${solicitudId}`);
        return { success: false, error: 'La solicitud no existe en la base de datos' };
      }
      
      console.log('Estado actual de la solicitud antes de actualizar:', solicitudExistente.estado);
      
      // Si la solicitud ya está confirmada, no es necesario actualizarla
      if (solicitudExistente.estado === 'confirmada') {
        console.log('La solicitud ya estaba confirmada, no es necesario actualizarla');
        // Continuar con el flujo normal para enviar la confirmación al cliente
      } else {
        // Actualizar el estado de la solicitud a 'confirmada'
        console.log(`Ejecutando actualización de solicitud ${solicitudId} a estado 'confirmada'`);
        
        try {
          // Usar una actualización más robusta con mejor manejo de errores
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from('solicitudes')
            .update({ 
              estado: 'confirmada',
              fecha_actualizacion: new Date().toISOString() // Usar el campo correcto según el esquema
            })
            .eq('id', solicitudId)
            .select();
          
          // Registrar inmediatamente el resultado de la operación
          console.log('Resultado inmediato de actualización:', { 
            exitoso: !!updateData, 
            datos: updateData ? JSON.stringify(updateData) : 'ninguno',
            error: updateError ? JSON.stringify(updateError) : 'ninguno' 
          });
            
          // Verificar si hubo error en la actualización con registro detallado
          if (updateError) {
            console.error('Error detallado al actualizar solicitud:', JSON.stringify(updateError));
            console.error('Código de error:', updateError.code);
            console.error('Mensaje de error:', updateError.message);
            console.error('Detalles:', updateError.details || 'No hay detalles adicionales');
            
            // Intentar una actualización alternativa inmediatamente
            console.log('Intentando método alternativo de actualización...');
            const { error: retryError } = await supabaseAdmin
              .from('solicitudes')
              .update({ estado: 'confirmada' })
              .eq('id', solicitudId);
              
            if (retryError) {
              console.error('Error en intento alternativo:', JSON.stringify(retryError));
              throw new Error(`Error en actualización: ${updateError.message}`);
            } else {
              console.log('Actualización alternativa exitosa');
            }
          }
          
          // Verificar que la actualización fue exitosa consultando el estado actual
          const { data: verificacionData, error: verificacionError } = await supabaseAdmin
            .from('solicitudes')
            .select('*')
            .eq('id', solicitudId)
            .single();
        
        console.log('Resultado de actualización:', { 
          exitoso: !!verificacionData, 
          error: verificacionError ? JSON.stringify(verificacionError) : 'ninguno',
          datos: verificacionData ? JSON.stringify(verificacionData) : 'ninguno'
        });
      
          if (updateError) {
            console.error('Error al actualizar solicitud (primer intento):', updateError);
            throw new Error(`Error en primer intento: ${updateError.message}`);
          }
          
          if (!updateData) {
            console.warn(`No se encontró la solicitud con ID ${solicitudId} para actualizar en primer intento`);
            // Intentar verificar si la solicitud existe
            const { data: solicitudExiste, error: errorVerificacion } = await supabaseAdmin
              .from('solicitudes')
              .select('id, estado')
              .eq('id', solicitudId)
              .single();
              
            if (errorVerificacion) {
              console.error('Error al verificar existencia de solicitud:', errorVerificacion);
              throw new Error(`Error al verificar existencia: ${errorVerificacion.message}`);
            }
            
            if (!solicitudExiste) {
              throw new Error(`La solicitud con ID ${solicitudId} no existe en la base de datos`);
            }
            
            console.log('Estado actual de la solicitud:', solicitudExiste.estado);
            if (solicitudExiste.estado === 'confirmada') {
              console.log('La solicitud ya estaba confirmada');
            } else {
              // Intentar actualizar nuevamente con un método alternativo
              console.log('Intentando actualización alternativa sin select');
              const { error: retryError } = await supabaseAdmin
                .from('solicitudes')
                .update({ 
                  estado: 'confirmada',
                  fecha_actualizacion: new Date().toISOString()
                })
                .eq('id', solicitudId);
                
              if (retryError) {
                console.error('Error en segundo intento de actualización:', retryError);
                throw new Error(`Error en segundo intento: ${retryError.message}`);
              }
              
              // Verificar que la actualización fue exitosa
              const { data: verificacionFinal, error: errorFinal } = await supabaseAdmin
                .from('solicitudes')
                .select('estado')
                .eq('id', solicitudId)
                .single();
                
              if (errorFinal) {
                console.error('Error al verificar actualización final:', errorFinal);
              } else {
                console.log('Estado final verificado:', verificacionFinal.estado);
              }
            }
          } else {
            console.log('Solicitud actualizada correctamente en primer intento:', updateData);
          }
        } catch (error) {
          console.error('Error durante el proceso de actualización:', error);
          
          // Último intento con método directo
          console.log('Realizando intento final de actualización con método directo');
          try {
            const { error: finalError } = await supabaseAdmin
              .from('solicitudes')
              .update({ estado: 'rechazada' })
              .eq('id', solicitudId);
              
            if (finalError) {
              console.error('Error en intento final de actualización:', finalError);
              return { success: false, error: 'No se pudo actualizar la solicitud después de múltiples intentos' };
            }
            
            // Verificar estado final
            const { data: estadoFinal } = await supabaseAdmin
              .from('solicitudes')
              .select('estado')
              .eq('id', solicitudId)
              .single();
              
            console.log('Estado final después de todos los intentos:', estadoFinal?.estado);
          } catch (finalCatchError) {
            console.error('Error catastrófico en actualización:', finalCatchError);
            return { success: false, error: 'Error crítico al actualizar la solicitud' };
          }
        }
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
      
      try {
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('solicitudes')
          .update({ estado: 'rechazada' })
          .eq('id', solicitudId)
          .select();
        
        if (verificacionError) {
          console.error('Error al verificar actualización:', verificacionError);
          // No lanzamos error aquí, solo registramos el problema de verificación
          console.log('Continuando con el flujo normal a pesar del error de verificación');
        }
        
        if (!updateData) {
          console.warn(`No se encontró la solicitud con ID ${solicitudId} para actualizar en primer intento`);
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
          console.log('Solicitud actualizada correctamente en primer intento:', updateData);
        }
      } catch (error) {
          console.error('Error durante el proceso de actualización:', error);
          
          // Último intento con método directo
          console.log('Realizando intento final de actualización con método directo');
          try {
            const { error: finalError } = await supabaseAdmin
              .from('solicitudes')
              .update({ estado: 'rechazada' })
              .eq('id', solicitudId);
              
            if (finalError) {
              console.error('Error en intento final de actualización:', finalError);
              return { success: false, error: 'No se pudo actualizar la solicitud después de múltiples intentos' };
            }
            
            // Verificar estado final
            const { data: estadoFinal } = await supabaseAdmin
              .from('solicitudes')
              .select('estado')
              .eq('id', solicitudId)
              .single();
              
            console.log('Estado final después de todos los intentos:', estadoFinal?.estado);
          } catch (finalCatchError) {
            console.error('Error catastrófico en actualización:', finalCatchError);
            return { success: false, error: 'Error crítico al actualizar la solicitud' };
          }
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
      
      try {
        // Actualizar sin select para evitar problemas de retorno
        const { error: updateError } = await supabaseAdmin
          .from('solicitudes')
          .update({ 
            estado: 'en_progreso',
            fecha_actualizacion: new Date().toISOString()
          })
          .eq('id', solicitudId);
          
        if (updateError) {
          console.error('Error al actualizar solicitud:', updateError);
          throw new Error(`Error en actualización: ${updateError.message}`);
        }
        
        // Verificar que la actualización fue exitosa
        const { data: updateData, error: selectError } = await supabaseAdmin
          .from('solicitudes')
          .select('*')
          .eq('id', solicitudId)
          .single();
        
        if (verificacionError) {
          console.error('Error al verificar actualización:', verificacionError);
          // No lanzamos error aquí, solo registramos el problema de verificación
          console.log('Continuando con el flujo normal a pesar del error de verificación');
        }
        
        if (!updateData) {
          console.warn(`No se encontró la solicitud con ID ${solicitudId} para actualizar en primer intento`);
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
          console.log('Solicitud actualizada correctamente en primer intento:', updateData);
        }
      } catch (error) {
        console.error('Error durante el proceso de actualización:', error);
        
        // Último intento con método directo
        console.log('Realizando intento final de actualización con método directo');
        try {
          const { error: finalError } = await supabaseAdmin
            .from('solicitudes')
            .update({ estado: 'en_progreso' })
            .eq('id', solicitudId);
              
            if (finalError) {
              console.error('Error en intento final de actualización:', finalError);
              return { success: false, error: 'No se pudo actualizar la solicitud después de múltiples intentos' };
            }
            
            // Verificar estado final
            const { data: estadoFinal } = await supabaseAdmin
              .from('solicitudes')
              .select('estado')
              .eq('id', solicitudId)
              .single();
              
            console.log('Estado final después de todos los intentos:', estadoFinal?.estado);
          } catch (finalCatchError) {
            console.error('Error catastrófico en actualización:', finalCatchError);
            return { success: false, error: 'Error crítico al actualizar la solicitud' };
          }
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
      
      try {
        // Actualizar sin select para evitar problemas de retorno
        const { error: updateError } = await supabaseAdmin
          .from('solicitudes')
          .update({ 
            estado: 'completada',
            fecha_actualizacion: new Date().toISOString()
          })
          .eq('id', solicitudId);
          
        if (updateError) {
          console.error('Error al actualizar solicitud:', updateError);
          throw new Error(`Error en actualización: ${updateError.message}`);
        }
        
        // Verificar que la actualización fue exitosa
        const { data: updateData, error: selectError } = await supabaseAdmin
          .from('solicitudes')
          .select('*')
          .eq('id', solicitudId)
          .single();
        
        if (verificacionError) {
          console.error('Error al verificar actualización:', verificacionError);
          // No lanzamos error aquí, solo registramos el problema de verificación
          console.log('Continuando con el flujo normal a pesar del error de verificación');
        }
        
        if (!updateData) {
          console.warn(`No se encontró la solicitud con ID ${solicitudId} para actualizar en primer intento`);
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
          console.log('Solicitud actualizada correctamente en primer intento:', updateData);
        }
      } catch (error) {
        console.error('Error durante el proceso de actualización:', error);
        
        // Último intento con método directo
        console.log('Realizando intento final de actualización con método directo');
        try {
          const { error: finalError } = await supabaseAdmin
            .from('solicitudes')
            .update({ estado: 'completada' })
            .eq('id', solicitudId);
              
            if (finalError) {
              console.error('Error en intento final de actualización:', finalError);
              return { success: false, error: 'No se pudo actualizar la solicitud después de múltiples intentos' };
            }
            
            // Verificar estado final
            const { data: estadoFinal } = await supabaseAdmin
              .from('solicitudes')
              .select('estado')
              .eq('id', solicitudId)
              .single();
              
            console.log('Estado final después de todos los intentos:', estadoFinal?.estado);
          } catch (finalCatchError) {
            console.error('Error catastrófico en actualización:', finalCatchError);
            return { success: false, error: 'Error crítico al actualizar la solicitud' };
          }
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

// Endpoint para manejar solicitudes GET (verificación de Twilio)
export async function GET(request) {
  console.log('=== SOLICITUD GET RECIBIDA EN WEBHOOK ===');
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  console.log('URL:', request.url);
  
  // Responder con un mensaje simple para verificación
  // Twilio espera un código 200 para verificar que el webhook está configurado correctamente
  return new NextResponse('Webhook de WhatsApp configurado correctamente. Este endpoint solo acepta solicitudes POST.', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store',
      'X-Powered-By': 'FixArg Webhook'
    }
  });
}

// Endpoint para recibir webhooks de Twilio
export async function POST(request) {
  try {
    console.log('=== INICIO PROCESAMIENTO WEBHOOK TWILIO ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Verificar que la solicitud sea válida
    if (!request || !request.body) {
      console.error('Error: Solicitud sin cuerpo');
      return NextResponse.json({ success: false, error: 'Solicitud inválida' }, { status: 400 });
    }
    
    // Log de la solicitud completa para depuración
    console.log('Webhook recibido - headers:', Object.fromEntries(request.headers.entries()));
    console.log('Webhook recibido - método:', request.method);
    console.log('Webhook recibido - URL:', request.url);
    
    // Obtener los datos del formulario (Twilio envía datos como form-urlencoded)
    let formData;
    try {
      // Clonar la solicitud para evitar errores de stream ya consumido
      const requestClone = request.clone();
      formData = await requestClone.formData();
      console.log('FormData obtenido correctamente');
    } catch (formError) {
      console.error('Error al obtener formData:', formError);
      // Intentar obtener el cuerpo de la solicitud como texto
      try {
        const bodyText = await request.text();
        console.log('Cuerpo de la solicitud como texto:', bodyText);
        
        // Crear un FormData manualmente a partir del texto
        formData = new FormData();
        const params = new URLSearchParams(bodyText);
        for (const [key, value] of params.entries()) {
          formData.append(key, value);
        }
        console.log('FormData creado manualmente a partir del texto');
      } catch (textError) {
        console.error('Error al obtener el cuerpo como texto:', textError);
        return NextResponse.json({ success: false, error: 'No se pudo procesar el cuerpo de la solicitud' }, { status: 400 });
      }
    }
    
    // Log de todos los campos recibidos para depuración
    console.log('=== CAMPOS DEL WEBHOOK ===');
    const camposWebhook = {};
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
      camposWebhook[key] = value;
    }
    console.log('Resumen de campos:', JSON.stringify(camposWebhook));
    
    // Verificar que tengamos los campos mínimos necesarios
    if (Object.keys(camposWebhook).length === 0) {
      console.error('Error: No se recibieron campos en el formulario');
      return NextResponse.json({ success: false, error: 'No se recibieron datos en el formulario' }, { status: 400 });
    }
    
    // Extraer los datos relevantes con manejo de casos alternativos
    // Twilio puede enviar el mensaje en diferentes campos dependiendo de la configuración
    const mensaje = formData.get('Body') || formData.get('body') || 
                   formData.get('message') || formData.get('SmsBody') || 
                   formData.get('smsBody') || formData.get('text') || '';
    console.log('Mensaje extraído:', mensaje);
    
    // Asegurar que el número de teléfono esté correctamente formateado
    // Buscar el número en diferentes campos posibles que Twilio puede enviar
    let numeroTelefono = formData.get('From') || formData.get('from') || 
                         formData.get('sender') || formData.get('WaId') || 
                         formData.get('waId') || formData.get('phone') || 
                         formData.get('Phone') || '';
    console.log('Número de teléfono original (sin procesar):', numeroTelefono);
    
    // Limpiar el prefijo de WhatsApp si existe
    if (numeroTelefono) {
      numeroTelefono = numeroTelefono.replace(/^whatsapp:/, '');
      console.log('Número de teléfono después de quitar prefijo whatsapp:', numeroTelefono);
    }
    
    // Verificar si el número tiene el formato correcto (con código de país)
    if (numeroTelefono && !numeroTelefono.startsWith('+')) {
      numeroTelefono = '+' + numeroTelefono;
      console.log('Número de teléfono después de agregar +:', numeroTelefono);
    }
    
    // Asegurarse de que los números argentinos tengan el formato correcto para WhatsApp
    if (numeroTelefono && numeroTelefono.startsWith('+54') && !numeroTelefono.startsWith('+549')) {
      // Si ya tiene código de país +54 pero no tiene el 9 para móviles, agregarlo
      numeroTelefono = `+549${numeroTelefono.substring(3)}`;
      console.log('Número reformateado para Argentina:', numeroTelefono);
    }
    
    // Asegurarse de que el número esté completamente limpio para la búsqueda
    numeroTelefono = numeroTelefono.trim();
    console.log('Número de teléfono final para procesamiento:', numeroTelefono);
    
    const messageSid = formData.get('MessageSid') || formData.get('messageSid') || formData.get('SmsMessageSid') || formData.get('smsMessageSid') || 'No disponible';
    console.log('MessageSid extraído:', messageSid);
    
    // Validar que tengamos los datos necesarios
    if (!mensaje) {
      console.error('Mensaje no encontrado en la solicitud');
      return NextResponse.json({ success: false, error: 'Mensaje no encontrado en la solicitud' }, { status: 400 });
    }
    
    if (!numeroTelefono) {
      console.error('Número de teléfono no encontrado en la solicitud');
      return NextResponse.json({ success: false, error: 'Número de teléfono no encontrado en la solicitud' }, { status: 400 });
    }
    
    console.log('Datos extraídos correctamente:', { mensaje, numeroTelefono, messageSid });
    
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
    
    // Responder a Twilio con un TwiML válido
    console.log('=== ENVIANDO RESPUESTA A TWILIO ===');
    
    // Crear una respuesta TwiML válida
    // Twilio espera una respuesta XML con el formato correcto
    // Podemos incluir un mensaje vacío para no enviar respuesta automática al usuario
    const twimlResponse = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    console.log('Respuesta TwiML:', twimlResponse);
    
    // Registrar información de depuración adicional
    console.log('Estado final de procesamiento:', resultado.success ? 'Exitoso' : 'Fallido');
    console.log('Mensaje de resultado:', resultado.message || resultado.error || 'No hay mensaje adicional');
    
    const response = new NextResponse(twimlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'X-Powered-By': 'FixArg Webhook',  // Identificador personalizado
        'X-Processing-Result': resultado.success ? 'success' : 'error',
        'X-Processing-Message': resultado.message || resultado.error || 'No message'
      }
    });
    
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
      
      // Intentar registrar el cuerpo de la solicitud si es posible
      try {
        const bodyClone = request.clone();
        const bodyText = await bodyClone.text();
        console.error('Cuerpo de la solicitud:', bodyText);
      } catch (bodyError) {
        console.error('No se pudo obtener el cuerpo de la solicitud:', bodyError);
      }
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