/**
 * Script para verificar el estado de una solicitud en Supabase
 * 
 * Este script consulta el estado actual de una solicitud en la base de datos
 * para verificar si las actualizaciones del webhook se están aplicando correctamente.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Verificar argumentos de línea de comandos
const solicitudId = process.argv[2];

if (!solicitudId) {
  console.error('Error: No se proporcionó un ID de solicitud.');
  console.error('Uso: node verify-solicitud-status.js [id_solicitud]');
  process.exit(1);
}

// Verificar variables de entorno
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Faltan variables de entorno de Supabase.');
  console.error('Asegúrate de configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu archivo .env');
  process.exit(1);
}

// Crear cliente de Supabase con la clave de servicio para acceso administrativo
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Función para verificar el estado de una solicitud
async function verificarEstadoSolicitud(id) {
  try {
    console.log(`🔍 Verificando estado de solicitud con ID: ${id}`);
    
    // Consultar la solicitud en la base de datos
    const { data: solicitud, error } = await supabaseAdmin
      .from('solicitudes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ Error al consultar la solicitud:', error.message);
      return;
    }
    
    if (!solicitud) {
      console.error(`❌ No se encontró ninguna solicitud con ID: ${id}`);
      return;
    }
    
    // Mostrar información de la solicitud
    console.log('✅ Solicitud encontrada:');
    console.log('-----------------------------------');
    console.log(`ID: ${solicitud.id}`);
    console.log(`Estado: ${solicitud.estado}`);
    console.log(`Fecha de creación: ${solicitud.fecha_creacion}`);
    console.log(`Fecha de actualización: ${solicitud.fecha_actualizacion || 'No disponible'}`);
    console.log(`Usuario ID: ${solicitud.usuario_id}`);
    console.log(`Trabajador ID: ${solicitud.trabajador_id}`);
    console.log(`Descripción: ${solicitud.descripcion}`);
    console.log(`Fecha: ${solicitud.fecha}`);
    console.log(`Hora: ${solicitud.hora}`);
    console.log('-----------------------------------');
    
    // Verificar mensajes de WhatsApp asociados a esta solicitud
    const { data: mensajes, error: mensajesError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .eq('solicitud_id', id)
      .order('created_at', { ascending: false });
    
    if (mensajesError) {
      console.error('❌ Error al consultar mensajes de WhatsApp:', mensajesError.message);
    } else if (mensajes && mensajes.length > 0) {
      console.log(`\n📱 Mensajes de WhatsApp asociados (${mensajes.length}):`);
      console.log('-----------------------------------');
      mensajes.forEach((mensaje, index) => {
        console.log(`Mensaje ${index + 1}:`);
        console.log(`  Teléfono: ${mensaje.phone_number}`);
        console.log(`  Mensaje: ${mensaje.message}`);
        console.log(`  Estado: ${mensaje.status}`);
        console.log(`  Fecha: ${mensaje.created_at}`);
        console.log('-----------------------------------');
      });
    } else {
      console.log('\n📱 No hay mensajes de WhatsApp asociados a esta solicitud.');
    }
    
    // Sugerir próximos pasos
    console.log('\n📋 Próximos pasos:');
    console.log('1. Si el estado no es el esperado, verifica los logs del webhook en Vercel.');
    console.log('2. Puedes usar el script simulate-webhook-local.js para simular una respuesta y actualizar el estado.');
    console.log(`   Ejemplo: node scripts/simulate-webhook-local.js +549XXXXXXXXXX "CONFIRMAR"`);
    console.log('3. Después de simular la respuesta, ejecuta este script nuevamente para verificar si el estado se actualizó.');
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar la verificación
verificarEstadoSolicitud(solicitudId).catch(error => {
  console.error('Error no controlado:', error);
  process.exit(1);
});