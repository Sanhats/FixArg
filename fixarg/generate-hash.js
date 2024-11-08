const bcrypt = require('bcryptjs');

const password = 'admin123123'; // Reemplaza esto con tu contraseña real
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error al generar el hash:', err);
  } else {
    console.log('Tu hash de contraseña es:', hash);
    console.log('Guarda este hash en tu variable de entorno ADMIN_PASSWORD_HASH');
  }
});