import { NextResponse } from 'next/server';
import supabaseAdmin, { insertUser, findUserByEmail } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const requestId = Date.now().toString(36);
  console.log(`[${requestId}] Iniciando solicitud de registro de usuario`);
  
  let userData;

  try {
    userData = await request.json();
    console.log(`[${requestId}] Datos de solicitud recibidos:`, { email: userData?.email ? '***@***' : undefined });
  } catch (error) {
    console.error(`[${requestId}] Error al parsear JSON:`, error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al procesar los datos del usuario.',
      requestId 
    }, { status: 400 });
  }

  try {
    // Validar que todos los campos requeridos estén presentes
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'phone', 'street', 'streetNumber', 'province', 'locality'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        console.log(`[${requestId}] Missing required field: ${field}`);
        return NextResponse.json({ 
          success: false, 
          message: `Falta el campo requerido: ${field}`,
          requestId 
        }, { status: 400 });
      }
    }
    
    // Generar hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    userData.password = hashedPassword;
    
    // Verificar si el usuario ya existe en Supabase
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      console.log(`[${requestId}] Usuario ya existe en tabla usuarios:`, { id: existingUser.id });
      return NextResponse.json({ 
        success: false, 
        message: 'El usuario ya existe en la base de datos. Si acabas de limpiar la base de datos, es posible que necesites limpiar también la tabla auth.users de Supabase.',
        requestId 
      }, { status: 400 });
    }
    
    // Verificar si el usuario existe en auth.users de Supabase
    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserByEmail(userData.email);
      if (authUser) {
        console.log(`[${requestId}] Usuario ya existe en auth.users:`, { id: authUser.id });
        return NextResponse.json({ 
          success: false, 
          message: 'El email ya está registrado en el sistema de autenticación. Debes limpiar la tabla auth.users de Supabase.',
          requestId 
        }, { status: 400 });
      }
    } catch (authCheckError) {
      // Si hay un error al verificar auth.users, verificamos el tipo de error
      console.log(`[${requestId}] Error al verificar auth.users:`, authCheckError);
      
      // Si el error es de tipo 404 (usuario no encontrado), continuamos con el registro
      if (authCheckError.status === 404 || authCheckError.message?.includes('not found')) {
        console.log(`[${requestId}] Usuario no encontrado en auth.users, continuando con el registro`);
      } else {
        // Para otros tipos de errores, devolvemos un mensaje de error
        console.error(`[${requestId}] Error crítico al verificar auth.users:`, authCheckError);
        return NextResponse.json({ 
          success: false, 
          message: 'Error al verificar el sistema de autenticación. Por favor, intenta nuevamente más tarde.',
          requestId 
        }, { status: 500 });
      }
    }

    // Crear dirección en Supabase
    const { data: addressData, error: addressError } = await supabaseAdmin
      .from('direcciones')
      .insert([
        {
          calle: userData.street,
          numero: userData.streetNumber,
          provincia: userData.province,
          localidad: userData.locality
        }
      ])
      .select();

    if (addressError) {
      console.error(`[${requestId}] Error al crear dirección:`, addressError);
      throw new Error('Error al crear dirección: ' + addressError.message);
    }

    // Preparar datos de usuario para Supabase
    const supabaseUserData = {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      password: userData.password, // Ya está hasheado
      direccion_id: addressData[0].id
    };

    // Insertar usuario en Supabase
    const result = await insertUser(supabaseUserData);
    console.log(`[${requestId}] Usuario registrado correctamente:`, { userId: result.insertedId });

    return NextResponse.json({ 
      success: true, 
      userId: result.insertedId,
      requestId 
    });

  } catch (error) {
    console.error(`[${requestId}] Error en el registro:`, {
      error: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Determinar el tipo de error para dar una respuesta más específica
    let statusCode = 500;
    let errorMessage = 'Error al registrar el usuario';
    
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      statusCode = 400;
      errorMessage = 'El usuario ya existe';
    } else if (error.message.includes('validation')) {
      statusCode = 400;
      errorMessage = 'Error de validación: ' + error.message;
    }

    return NextResponse.json({ 
      success: false, 
      message: errorMessage,
      requestId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
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
  );
}