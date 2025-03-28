import jwt from 'jsonwebtoken'

export function verifyToken(token) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET no está definido en las variables de entorno')
      return null
    }
    
    console.log('Verificando token con JWT_SECRET')
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error('Error al verificar token:', error.message)
    return null
  }
}