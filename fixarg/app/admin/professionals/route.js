import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

// Definimos los métodos permitidos
export async function GET(request) {
  try {
    // Verificar el token de autenticación
    const token = request.headers.get('Authorization')?.split(' ')[1]
    const decodedToken = verifyToken(token)

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { db } = await connectToDatabase()
    const professionals = await db.collection('trabajadores').find({}).toArray()

    return NextResponse.json(professionals)
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// Agregamos el método OPTIONS para manejar las solicitudes preflight CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  })
}