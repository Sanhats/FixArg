const crypto = require('crypto');

const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('Tu JWT_SECRET es:', jwtSecret);
console.log('Guarda este valor en tu archivo .env.local como JWT_SECRET');