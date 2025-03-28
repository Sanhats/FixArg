import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  console.log('Env Variables Loaded:', {
    usernameEnv: process.env.ADMIN_USERNAME,
    passwordHashEnv: "$2a$10$MI57y.ssXPB7eBGqEB2qVerUEsZqLKOQQY7j3M0okUxUdO/PkZAWG",
    jwtSecretEnv: process.env.JWT_SECRET
  });
  
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      console.error('Invalid JSON body');
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { username, password } = body;

    console.log('Received credentials:', {
      username,
      passwordLength: password ? password.length : 0
    });

    if (!process.env.ADMIN_USERNAME || !"$2a$10$MI57y.ssXPB7eBGqEB2qVerUEsZqLKOQQY7j3M0okUxUdO/PkZAWG" || !process.env.JWT_SECRET) {
      console.error('Missing environment variables:', {
        hasUsername: !!process.env.ADMIN_USERNAME,
        hasPasswordHash: !!"$2a$10$MI57y.ssXPB7eBGqEB2qVerUEsZqLKOQQY7j3M0okUxUdO/PkZAWG",
        hasJwtSecret: !!process.env.JWT_SECRET,
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (username !== process.env.ADMIN_USERNAME) {
      console.log('Invalid username');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('Username validation successful, checking password');

    // Verificar contraseña
    console.log('Password from request:', password);
    console.log('Admin password hash:', "$2a$10$MI57y.ssXPB7eBGqEB2qVerUEsZqLKOQQY7j3M0okUxUdO/PkZAWG");

    const isPasswordValid = await bcrypt.compare(
      password,
    "$2a$10$MI57y.ssXPB7eBGqEB2qVerUEsZqLKOQQY7j3M0okUxUdO/PkZAWG"

    );

    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('Password validation successful, generating token');
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está definido en las variables de entorno');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Token generated successfully');

    return NextResponse.json(
      { token },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Detailed login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}
