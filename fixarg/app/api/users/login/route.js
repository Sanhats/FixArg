import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const { db } = await connectToDatabase()

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
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      type: error.name
    })

    let statusCode = 500;
    let errorMessage = 'Error en el servidor';
    let errorDetails = error.message;

    if (error.name === 'MongoNetworkError' || error.message.includes('ECONNREFUSED')) {
      statusCode = 503;
      errorMessage = 'Error de conexión a la base de datos';
      errorDetails = 'No se pudo conectar a la base de datos';
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Error de validación';
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      errorMessage = 'Autenticación fallida';
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