const bcrypt = require('bcryptjs');

// Configuración de admin
const adminConfig = {
  username: 'admin',
  password: 'admin123', // Cambia esto por la contraseña que desees usar
};

async function generateCredentials() {
  try {
    // Generar el hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminConfig.password, salt);

    console.log('\n=== Credenciales de Administrador ===');
    console.log('\nCopia estas variables en tu archivo .env.local:');
    console.log('\nADMIN_USERNAME=' + adminConfig.username);
    console.log('ADMIN_PASSWORD_HASH=' + hash);
    
    // Verificar que el hash funciona
    const isValid = await bcrypt.compare(adminConfig.password, hash);
    console.log('\nVerificación del hash:', isValid ? 'Exitosa' : 'Fallida');
    
    console.log('\nCredenciales para iniciar sesión:');
    console.log('Usuario:', adminConfig.username);
    console.log('Contraseña:', adminConfig.password);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateCredentials();