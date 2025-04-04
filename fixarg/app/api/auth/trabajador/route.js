import { NextResponse } from 'next/server';
import supabaseAdmin, { findWorkerByEmail } from '@/lib/supabase';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Buscar el trabajador en Supabase
    const trabajador = await findWorkerByEmail(email);
    
    if (!trabajador || !trabajador.hashed_password || trabajador.status !== 'approved') {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, trabajador.hashed_password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Crear token JWT
    const token = sign(
      {
        userId: trabajador.id,
        email: trabajador.email,
        role: 'trabajador'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      token,
      user: {
        id: trabajador.id,
        email: trabajador.email,
        displayName: trabajador.display_name,
        occupation: trabajador.occupation
      }
    });
  } catch (error) {
    console.error('Error en la autenticación:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

