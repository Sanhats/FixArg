const bcrypt = require('bcryptjs');

// Reemplaza 'tu_contraseña' por la contraseña que estás usando en el login
bcrypt.compare('admin123', '$2a$10$MI57y.ssXPB7eBGqEB2qVerUEsZqLKOQQY7j3M0okUxUdO/PkZAWG', (err, result) => {
  console.log(result ? "Password matches!" : "Password does not match");
});