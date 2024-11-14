import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    console.log('Login attempt for email:', email)

    const { db } = await connectToDatabase()

    // Buscar el usuario por email
    const user = await db.collection('usuarios').findOne({ email })
    console.log('User found:', user ? 'Yes' : 'No')

    if (!user) {
      console.log('No user found with email:', email)
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Log para debugging
    console.log('Stored hashed password:', user.password)
    console.log('Attempting to compare with provided password')

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isPasswordValid)

    if (!isPasswordValid) {
      console.log('Invalid password for user:', email)
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined')
      return NextResponse.json(
        { message: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    console.log('Login successful for user:', email)
    
    return NextResponse.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })

  } catch (error) {
    console.error('Detailed login error:', error)
    return NextResponse.json(
      { 
        message: 'Error del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}