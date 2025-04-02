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
      phone: user.phone,
      street: user.street,
      streetNumber: user.street_number,
      province: user.province,
      locality: user.locality
    };

    console.log(`[${requestId}] Login exitoso para usuario: ${userData.email}`);
    return NextResponse.json({
      token,
      user: userData,
      requestId
    });
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
    
    console.error('Login error:', errorLog);

    let statusCode = 500;
    let errorMessage = 'Error en el servidor';
    let errorDetails = error.message;

    // Manejo específico de errores
    if (error.message.includes('conexión') || 
        error.message.includes('ECONNREFUSED') || 
        error.message.includes('Timeout')) {
      statusCode = 503;
      errorMessage = 'Error de conexión';
      errorDetails = 'Servicio temporalmente no disponible. Por favor, intente nuevamente.';
    } else if (error.message.includes('validación') || 
               error.message.includes('invalid') ||
               error.message.includes('JWT_SECRET')) {
      statusCode = 400;
      errorMessage = 'Error de validación';
      errorDetails = 'Datos inválidos o error de configuración.';
    } else if (error.message.includes('unauthorized') ||
               error.message.includes('Credenciales')) {
      statusCode = 401;
      errorMessage = 'Autenticación fallida';
      errorDetails = 'Credenciales inválidas.';
    } else if (error.name === 'SyntaxError' || 
               error.message.includes('JSON')) {
      statusCode = 400;
      errorMessage = 'Error de formato';
      errorDetails = 'Formato de datos inválido.';
    }

    return NextResponse.json({ error: errorMessage, details: errorDetails, requestId }, { status: statusCode });
  }
}