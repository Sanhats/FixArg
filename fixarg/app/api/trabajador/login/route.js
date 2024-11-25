import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const { db } = await connectToDatabase()

    const trabajador = await db.collection('trabajadores').findOne({ email })

    if (!trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, trabajador.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }

    const trabajadorForToken = {
      _id: trabajador._id.toString(),
      firstName: trabajador.firstName,
      lastName: trabajador.lastName,
      email: trabajador.email,
      occupation: trabajador.occupation,
      hourlyRate: trabajador.hourlyRate,
      role: 'trabajador'
    }

    const token = sign(trabajadorForToken, process.env.JWT_SECRET, { expiresIn: '7d' })

    return NextResponse.json({
      token,
      user: trabajadorForToken
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}