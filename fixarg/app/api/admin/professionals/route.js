import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    // Verificar el token de autenticación
    const token = request.headers.get('Authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const decodedToken = verifyToken(token)
    
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()
    
    // Obtener todos los profesionales
    const professionals = await db.collection('trabajadores').find({}).toArray()

    return NextResponse.json(professionals)
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { error: 'Error al cargar los profesionales' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}