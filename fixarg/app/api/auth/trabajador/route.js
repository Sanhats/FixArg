import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcrypt'
import { sign } from 'jsonwebtoken'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    const { db } = await connectToDatabase()
    
    // Buscar el trabajador
    const trabajador = await db.collection('trabajadores').findOne({
      email,
      status: 'approved'
    })

    if (!trabajador || !trabajador.password) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, trabajador.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Crear token JWT
    const token = sign(
      {
        userId: trabajador._id.toString(),
        email: trabajador.email,
        role: 'trabajador'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      token,
      user: {
        id: trabajador._id,
        email: trabajador.email,
        displayName: trabajador.displayName,
        occupation: trabajador.occupation
      }
    })
  } catch (error) {
    console.error('Error en la autenticación:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

