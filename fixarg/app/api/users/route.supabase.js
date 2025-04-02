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
      console.log(`[${requestId}] Usuario ya existe:`, { id: existingUser.id });
      return NextResponse.json({ 
        success: false, 
        message: 'El usuario ya existe',
        requestId 
      }, { status: 400 });
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