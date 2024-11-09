require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');

const storedHash = process.env.ADMIN_PASSWORD_HASH;
const testPassword = 'admin123'; // Cambia esto por la contraseña que estás usando

async function verifyPassword() {
  console.log('Stored hash:', storedHash);
  
  if (!storedHash) {
    console.error('Error: ADMIN_PASSWORD_HASH no está definido en el archivo .env.local');
    return;
  }

  try {
    const isValid = await bcrypt.compare(testPassword, storedHash);
    console.log('Password validation result:', isValid);
    
    if (isValid) {
      console.log('La contraseña es válida.');
    } else {
      console.log('La contraseña no es válida.');
      console.log('Generando un nuevo hash para la contraseña de prueba:');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('Nuevo hash:', newHash);
      console.log('Actualiza ADMIN_PASSWORD_HASH en .env.local con este nuevo hash.');
    }
  } catch (error) {
    console.error('Error al verificar la contraseña:', error);
  }
}

verifyPassword();