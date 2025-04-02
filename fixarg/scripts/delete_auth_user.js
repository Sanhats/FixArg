/**
 * Script para eliminar un usuario específico de auth.users en Supabase
 * 
 * Uso: node delete_auth_user.js <email>
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Verificar argumentos
if (process.argv.length < 3) {
  console.error('Error: Debes proporcionar un email como argumento.');
  console.log('Uso: node delete_auth_user.js <email>');
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

async function deleteAuthUser(email) {
  try {
    console.log(`Buscando usuario con email: ${email}...`);
    
    // Primero obtenemos el usuario por email
    const { data: user, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (getUserError) {
      if (getUserError.status === 404 || getUserError.message?.includes('not found')) {
        console.log(`Usuario con email ${email} no encontrado en auth.users.`);
        return;
      }
      throw getUserError;
    }
    
    if (!user) {
      console.log(`Usuario con email ${email} no encontrado en auth.users.`);
      return;
    }
    
    console.log(`Usuario encontrado: ${user.id}`);
    
    // Eliminar el usuario de auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      throw deleteError;
    }
    
    console.log(`Usuario con email ${email} eliminado exitosamente de auth.users.`);
    
    // Verificar si también queremos eliminar el usuario de la tabla usuarios
    console.log('NOTA: Este script solo elimina el usuario de auth.users.');
    console.log('Si también deseas eliminar el usuario de la tabla usuarios, debes ejecutar:');
    console.log(`DELETE FROM usuarios WHERE email = '${email}';`);
    console.log('en el SQL Editor de Supabase.');
    
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    process.exit(1);
  }
}

// Ejecutar la función
deleteAuthUser(userEmail).then(() => {
  console.log('Operación completada.');
  process.exit(0);
});