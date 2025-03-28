import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Formato JSON inválido', details: 'Los datos enviados no tienen un formato JSON válido' },
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
    let db;
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        const dbConnection = await Promise.race([
          connectToDatabase(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout al conectar a la base de datos')), 5000)
          )
        ]);
        db = dbConnection.db;
        break;
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!db) {
      throw new Error(`Error al conectar con la base de datos después de múltiples intentos: ${lastError?.message}`)
    } catch (error) {
      throw new Error('Error al conectar con la base de datos: ' + error.message)
    }

    const user = await db.collection('usuarios').findOne({ email })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      )
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

    const token = sign(userForToken, process.env.JWT_SECRET, { expiresIn: '7d' })

    return NextResponse.json({
      token,
      user: userForToken
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
        error.message.includes('Timeout')) {
      statusCode = 503;
      errorMessage = 'Error de conexión a la base de datos';
      errorDetails = 'No se pudo conectar a la base de datos. Por favor, intente nuevamente.';
    } else if (error.name === 'ValidationError' || error.message.includes('invalid')) {
      statusCode = 400;
      errorMessage = 'Error de validación';
      errorDetails = 'Los datos proporcionados son inválidos.';
    } else if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
      statusCode = 401;
      errorMessage = 'Autenticación fallida';
      errorDetails = 'Credenciales inválidas.';
    } else if (error.name === 'SyntaxError') {
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