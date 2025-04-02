/**
 * Script para limpiar un usuario específico de todas las tablas relevantes en Supabase
 * 
 * Uso: node clean_user.js <email>
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Verificar argumentos
if (process.argv.length < 3) {
  console.error('Error: Debes proporcionar un email como argumento.');
  console.log('Uso: node clean_user.js <email>');
  process.exit(1);
}

const userEmail = process.argv[2];

// Configuración de Supabase
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Variables de entorno de Supabase no definidas');
  console.log('Asegúrate de tener un archivo .env.local con las variables NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function cleanUser(email) {
  try {
    console.log(`Iniciando limpieza para el usuario con email: ${email}...`);
    
    // 1. Verificar si el usuario existe en la tabla usuarios
    console.log('Verificando si el usuario existe en la tabla usuarios...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error al buscar usuario en tabla usuarios:', userError);
    }
    
    // 2. Verificar si el usuario existe en auth.users
    console.log('Verificando si el usuario existe en auth.users...');
    let authUser = null;
    try {
      const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      if (authError) {
        if (authError.status === 404 || authError.message?.includes('not found')) {
          console.log(`Usuario con email ${email} no encontrado en auth.users.`);
        } else {
          console.error('Error al buscar usuario en auth.users:', authError);
        }
      } else {
        authUser = authUserData;
        console.log(`Usuario encontrado en auth.users: ${authUser.id}`);
      }
    } catch (authCheckError) {
      console.error('Error al verificar auth.users:', authCheckError);
    }
    
    // 3. Eliminar registros relacionados si el usuario existe en la tabla usuarios
    if (userData) {
      console.log(`Usuario encontrado en tabla usuarios: ${userData.id}`);
      const userId = userData.id;
      
      // 3.1 Eliminar mensajes
      console.log('Eliminando mensajes relacionados...');
      const { error: mensajesError } = await supabaseAdmin
        .from('mensajes')
        .delete()
        .or(`emisor_id.eq.${userId},receptor_id.eq.${userId}`);
      
      if (mensajesError) {
        console.error('Error al eliminar mensajes:', mensajesError);
      } else {
        console.log('Mensajes eliminados correctamente.');
      }
      
      // 3.2 Eliminar reviews
      console.log('Eliminando reviews relacionadas...');
      const { error: reviewsError } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('usuario_id', userId);
      
      if (reviewsError) {
        console.error('Error al eliminar reviews:', reviewsError);
      } else {
        console.log('Reviews eliminadas correctamente.');
      }
      
      // 3.3 Eliminar solicitudes
      console.log('Eliminando solicitudes relacionadas...');
      const { error: solicitudesError } = await supabaseAdmin
        .from('solicitudes')
        .delete()
        .eq('usuario_id', userId);
      
      if (solicitudesError) {
        console.error('Error al eliminar solicitudes:', solicitudesError);
      } else {
        console.log('Solicitudes eliminadas correctamente.');
      }
      
      // 3.4 Obtener dirección del usuario
      const { data: direccionData, error: direccionError } = await supabaseAdmin
        .from('usuarios')
        .select('direccion_id')
        .eq('id', userId)
        .single();
      
      // 3.5 Eliminar usuario
      console.log('Eliminando usuario...');
      const { error: deleteUserError } = await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('id', userId);
      
      if (deleteUserError) {
        console.error('Error al eliminar usuario:', deleteUserError);
      } else {
        console.log('Usuario eliminado correctamente de la tabla usuarios.');
      }
      
      // 3.6 Eliminar dirección si existe
      if (direccionData && direccionData.direccion_id) {
        console.log('Eliminando dirección asociada...');
        const { error: deleteDireccionError } = await supabaseAdmin
          .from('direcciones')
          .delete()
          .eq('id', direccionData.direccion_id);
        
        if (deleteDireccionError) {
          console.error('Error al eliminar dirección:', deleteDireccionError);
        } else {
          console.log('Dirección eliminada correctamente.');
        }
      }
    } else {
      console.log(`No se encontró usuario con email ${email} en la tabla usuarios.`);
    }
    
    // 4. Eliminar usuario de auth.users si existe
    if (authUser) {
      console.log('Eliminando usuario de auth.users...');
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      
      if (deleteAuthError) {
        console.error('Error al eliminar usuario de auth.users:', deleteAuthError);
      } else {
        console.log('Usuario eliminado correctamente de auth.users.');
      }
    }
    
    // 5. Eliminar códigos de verificación
    console.log('Eliminando códigos de verificación...');
    const { error: verificationError } = await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('email', email);
    
    if (verificationError) {
      console.error('Error al eliminar códigos de verificación:', verificationError);
    } else {
      console.log('Códigos de verificación eliminados correctamente.');
    }
    
    console.log('\nResumen de la limpieza:');
    console.log(`- Usuario en tabla usuarios: ${userData ? 'Encontrado y eliminado' : 'No encontrado'}`);
    console.log(`- Usuario en auth.users: ${authUser ? 'Encontrado y eliminado' : 'No encontrado'}`);
    
  } catch (error) {
    console.error('Error durante el proceso de limpieza:', error);
    process.exit(1);
  }
}

// Ejecutar la función
cleanUser(userEmail).then(() => {
  console.log('\nOperación de limpieza completada.');
  process.exit(0);
});