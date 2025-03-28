import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    // Verificar variables de entorno al inicio
    if (!process.env.ADMIN_USERNAME || !process.env.JWT_SECRET) {
      console.error('Missing critical environment variables');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing critical environment variables'
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    console.log('Environment check passed, processing request');
  
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Invalid request format',
          details: 'Unable to parse request body as JSON'
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    if (!body || !body.username || !body.password) {
      console.error('Missing required fields in request body');
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: 'Username and password are required'
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
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
    console.error('Detailed login error:', {
      message: error.message,
      stack: error.stack,
      type: error.name
    });

    let statusCode = 500;
    let errorMessage = 'Internal server error';
    let errorDetails = error.message;

    if (error.name === 'MongoNetworkError' || error.message.includes('ECONNREFUSED')) {
      statusCode = 503;
      errorMessage = 'Database connection error';
      errorDetails = 'Unable to connect to database';
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Validation error';
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      errorMessage = 'Authentication failed';
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        requestId: Date.now().toString(36)
      }),
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
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
