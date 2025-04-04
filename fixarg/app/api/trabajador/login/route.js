import { NextResponse } from 'next/server';
import supabaseAdmin, { findWorkerByEmail } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Buscar el trabajador en Supabase
    const trabajador = await findWorkerByEmail(email);

    if (!trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 401 }
      );
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, trabajador.hashed_password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Crear token JWT
    const token = jwt.sign(
      { userId: trabajador.id, email: trabajador.email, role: 'trabajador' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Preparar datos del usuario para enviar al cliente
    const userToSend = {
      _id: trabajador.id, // Mantener _id para compatibilidad con el frontend
      email: trabajador.email,
      firstName: trabajador.first_name,
      lastName: trabajador.last_name,
      role: 'trabajador'
    };

    return NextResponse.json(
      { token, user: userToSend },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}