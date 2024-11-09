const bcrypt = require('bcryptjs');

// La contraseña que quieres usar
const password = 'admin123'; // Cambia esto por la contraseña que desees
const saltRounds = 10;

// Generar el hash
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error al generar el hash:', err);
    return;
  }
  
  console.log('\nHash generado:', hash);
  console.log('\nGuarda este hash en tu variable de entorno ADMIN_PASSWORD_HASH\n');

  // Verificar el hash
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('Error al verificar el hash:', err);
      return;
    }
    
    console.log('Verificación de la contraseña:', result ? 'Exitosa' : 'Fallida');
    console.log('\nPuedes usar estas credenciales para iniciar sesión:');
    console.log('Usuario:', 'admin');
    console.log('Contraseña:', password);
  });
});