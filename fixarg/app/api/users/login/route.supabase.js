import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
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

    // Buscar usuario por email en Supabase
    console.log(`[${requestId}] Buscando usuario con email en la base de datos...`);
    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error(`[${requestId}] Error al buscar usuario:`, {
        error: error.message,
        code: error.code
      });
      
      if (error.code === 'PGRST116') { // No se encontraron registros
        return NextResponse.json(
          { error: 'Usuario no encontrado', requestId },
          { status: 401 }
        );
      }
      
      throw new Error('Error al buscar usuario en la base de datos');
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado', requestId },
        { status: 401 }
      );
    }

    // Verificar contraseña
    console.log(`[${requestId}] Verificando contraseña...`);
    const isValidPassword = await bcrypt.compare(password, user.hashed_password);
    console.log(`[${requestId}] Verificación de contraseña completada`);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta', requestId },
        { status: 401 }
      );
    }

    // Crear token JWT
    const userForToken = {
      userId: user.id,
      email: user.email,
      role: 'user'
    };

    const token = sign(userForToken, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Preparar datos de usuario para respuesta (sin incluir la contraseña)
    const userData = {
      _id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone
    };

    // Devolver respuesta exitosa
    return NextResponse.json({
      token,
      user: userData
    });

  } catch (error) {
    console.error(`[${requestId}] Error en el proceso de login:`, {
      error: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Manejar diferentes tipos de errores
    let statusCode = 500;
    let errorMessage = 'Error del servidor';
    let errorDetails = 'Ha ocurrido un error inesperado';

    if (error.name === 'UnauthorizedError' ||
        error.message.includes('unauthorized') ||
        error.message.includes('invalid token')) {
      statusCode = 401;
      errorMessage = 'Error de autenticación';
      errorDetails = 'Credenciales inválidas';
    } else if (error.message.includes('JWT_SECRET')) {
      statusCode = 500;
      errorMessage = 'Error de configuración';
      errorDetails = 'Error en la configuración del servidor';
    }

    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        requestId 
      },
      { status: statusCode }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}