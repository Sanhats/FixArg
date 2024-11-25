import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const decodedToken = verifyToken(token)
    if (!decodedToken || decodedToken.role !== 'trabajador') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const trabajadorId = searchParams.get('trabajadorId')

    if (!trabajadorId) {
      return NextResponse.json({ error: 'ID de trabajador requerido' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const solicitudes = await db.collection('solicitudes')
      .find({ trabajadorId: new ObjectId(trabajadorId) })
      .sort({ fechaCreacion: -1 })
      .toArray()

    return NextResponse.json(solicitudes)
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}