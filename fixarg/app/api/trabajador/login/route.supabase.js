import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // Buscar trabajador por email en Supabase
    const { data: trabajador, error } = await supabaseAdmin
      .from('trabajadores')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, trabajador.hashed_password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: trabajador.id, 
        email: trabajador.email, 
        role: 'trabajador' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const userToSend = {
      _id: trabajador.id,
      email: trabajador.email,
      firstName: trabajador.first_name,
      lastName: trabajador.last_name,
      role: 'trabajador'
    }

    return NextResponse.json({ token, user: userToSend })
  } catch (error) {
    console.error('Login Error:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}