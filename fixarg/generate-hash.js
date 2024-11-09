const bcrypt = require('bcryptjs');

const password = 'admin123123'; // Reemplaza esto con la contraseña que deseas usar
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error al generar el hash:', err);
  } else {
    console.log('Tu hash de contraseña es:', hash);
    console.log('Copia este hash y agrégalo a tu archivo .env.local como ADMIN_PASSWORD_HASH');
  }
});