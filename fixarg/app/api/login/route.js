import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    const { db } = await connectToDatabase()
    const user = await db.collection('usuarios').findOne({ email })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Aquí podrías generar un JWT token
    const token = 'token-temporal' // Reemplazar con JWT real

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.firstName
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Error del servidor' },
      { status: 500 }
    )
  }
}