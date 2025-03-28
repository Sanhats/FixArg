import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export async function POST(request) {
  const requestId = Date.now().toString(36);
  console.log(`[${requestId}] Iniciando solicitud de login`);
  
  try {
    let body;
    try {
      body = await request.json();
      console.log(`[${requestId}] Datos de solicitud recibidos:`, { email: body?.email ? '***@***' : undefined });
    } catch (e) {
      console.error(`[${requestId}] Error al parsear JSON:`, e);
      return NextResponse.json(
        { error: 'Formato JSON inválido', details: 'Los datos enviados no tienen un formato JSON válido', requestId },
        { status: 400 }
      );
    }

    if (!body) {
      return NextResponse.json(
        { error: 'Datos de solicitud inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = body

    // Validar campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado');
    }

    // Intentar conectar a la base de datos con timeout y reintentos
    let dbConnection;
    try {
      console.log(`[${requestId}] Intentando conectar a la base de datos...`);
      dbConnection = await connectToDatabase();
      console.log(`[${requestId}] Conexión a la base de datos establecida`);
    } catch (error) {
      console.error(`[${requestId}] Error de conexión a la base de datos:`, {
        error: error.message,
        name: error.name,
        code: error.code
      });
      return NextResponse.json(
        { 
          error: 'Error de conexión a la base de datos',
          details: 'No se pudo establecer conexión con la base de datos. Por favor, intente nuevamente.',
          requestId 
        },
        { status: 503 }
      );
    }

    const db = dbConnection.db;
    if (!db) {
      console.error(`[${requestId}] Objeto de base de datos no disponible`);
      throw new Error('Error al obtener la instancia de la base de datos'
    }

    let user;
    try {
      console.log(`[${requestId}] Buscando usuario con email en la base de datos...`);
      user = await db.collection('usuarios').findOne({ email });
      console.log(`[${requestId}] Búsqueda completada: Usuario ${user ? 'encontrado' : 'no encontrado'}`);

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado', requestId },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error(`[${requestId}] Error al buscar usuario:`, {
        error: error.message,
        name: error.name,
        code: error.code
      });
      throw new Error('Error al buscar usuario en la base de datos');
    }

    let isValidPassword;
    try {
      console.log(`[${requestId}] Verificando contraseña...`);
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log(`[${requestId}] Verificación de contraseña completada`);

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Contraseña incorrecta', requestId },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error(`[${requestId}] Error al verificar contraseña:`, {
        error: error.message,
        name: error.name
      });
      throw new Error('Error al verificar las credenciales');
    }

    // Create a user object without sensitive information
    const userForToken = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      street: user.street,
      streetNumber: user.streetNumber,
      province: user.province,
      locality: user.locality
    }

    let token;
    try {
      console.log(`[${requestId}] Generando token JWT...`);
      token = sign(userForToken, process.env.JWT_SECRET, { expiresIn: '7d' });
      console.log(`[${requestId}] Token JWT generado exitosamente`);
    } catch (error) {
      console.error(`[${requestId}] Error al generar token JWT:`, {
        error: error.message,
        name: error.name
      });
      throw new Error('Error al generar el token de autenticación');
    }

    console.log(`[${requestId}] Login exitoso para usuario: ${userForToken.email}`);
    return NextResponse.json({
      token,
      user: userForToken,
      requestId
    })
  } catch (error) {
    // Log detallado del error
    const errorLog = {
      message: error.message,
      type: error.name,
      timestamp: new Date().toISOString(),
      path: '/api/users/login'
    };
    
    // Solo incluir stack trace en desarrollo
    if (process.env.NODE_ENV === 'development') {
      errorLog.stack = error.stack;
    }
    
    console.error('Login error:', errorLog)

    let statusCode = 500;
    let errorMessage = 'Error en el servidor';
    let errorDetails = error.message;

    // Manejo específico de errores
    if (error.name === 'MongoNetworkError' || 
        error.message.includes('ECONNREFUSED') || 
        error.message.includes('Timeout') ||
        error.message.includes('Error de conexión a la base de datos')) {
      statusCode = 503;
      errorMessage = 'Error de conexión a la base de datos';
      errorDetails = 'No se pudo conectar a la base de datos. Por favor, intente nuevamente.';
    } else if (error.name === 'ValidationError' || 
               error.message.includes('invalid') ||
               error.message.includes('JWT_SECRET')) {
      statusCode = 400;
      errorMessage = 'Error de validación';
      errorDetails = 'Los datos proporcionados son inválidos o falta configuración del servidor.';
    } else if (error.name === 'UnauthorizedError' || 
               error.message.includes('unauthorized') ||
               error.message.includes('Credenciales')) {
      statusCode = 401;
      errorMessage = 'Autenticación fallida';
      errorDetails = 'Credenciales inválidas o sesión expirada.';
    } else if (error.name === 'SyntaxError' || 
               error.message.includes('JSON')) {
      statusCode = 400;
      errorMessage = 'Error en el formato de la solicitud';
      errorDetails = 'Los datos enviados no tienen el formato correcto.';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        requestId: Date.now().toString(36)
      },
      { status: statusCode }
    )
  }
}