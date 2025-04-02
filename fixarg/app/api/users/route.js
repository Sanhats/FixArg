import { NextResponse } from 'next/server';
import { insertUser, findUserByEmail } from '@/lib/supabase';
import bcrypt from 'bcryptjs'
export async function POST(request) {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000;
  let userData;

  try {
    userData = await request.json();
    console.log('Received user data:', userData);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al procesar los datos del usuario.' 
    }, { status: 400 });
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log('Received user data:', userData);
    
    // Validar que todos los campos requeridos estén presentes
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'phone', 'street', 'streetNumber', 'province', 'locality'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        console.log(`Missing required field: ${field}`);
        return NextResponse.json({ success: false, message: `Falta el campo requerido: ${field}` }, { status: 400 });
      }
    }
    
    // Asegurarse de que streetNumber sea un string
    if (typeof userData.streetNumber !== 'string') {
      userData.streetNumber = String(userData.streetNumber);
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Replace the plain text password with the hashed password
    userData.password = hashedPassword;
    
    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return NextResponse.json({ success: false, message: 'El usuario ya existe' }, { status: 400 });
    }

    // Insert the new user into the 'usuarios' collection
    const result = await insertUser(userData);
    console.log('User inserted, result:', result);

    return NextResponse.json({ success: true, userId: result.insertedId });
  } catch (error) {
    console.error(`Registration error on attempt ${attempt}:`, error);
    
    // Mejorar el manejo de errores específicos
    const isNetworkError = 
      error.name === 'MongoNetworkError' || 
      error.code === 'ECONNRESET' || 
      error.message.includes('ECONNRESET') ||
      error.message.includes('Body is unusable');

    if (!isNetworkError && attempt === MAX_RETRIES) {
      console.error('Error no recuperable después de máximos reintentos:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Error al registrar el usuario. Por favor, intenta nuevamente.' 
      }, { status: 500 });
    }

    if (!isNetworkError) {
      console.error('Error no relacionado con la red:', error);
      throw error;
    }

    console.log(`Reintentando operación después de error de red (intento ${attempt}/${MAX_RETRIES})`)

    const delay = BASE_DELAY * Math.pow(2, attempt - 1);
    console.log(`Waiting ${delay}ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    continue;
  }
}
}