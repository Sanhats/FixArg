import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function DELETE(request, { params }) {
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

    const { id } = params
    const { db } = await connectToDatabase()

    // Verificar que el ID sea válido
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const result = await db.collection('trabajadores').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Profesional eliminado con éxito' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting professional:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// Configurar los headers CORS para permitir DELETE
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}