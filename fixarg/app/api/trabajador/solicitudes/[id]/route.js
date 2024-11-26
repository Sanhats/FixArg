import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function PATCH(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const decodedToken = verifyToken(token)
    if (!decodedToken || decodedToken.role !== 'trabajador') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { estado } = await request.json()
    const { id } = params

    const { db } = await connectToDatabase()

    const result = await db.collection('solicitudes').updateOne(
      { 
        _id: new ObjectId(id),
        trabajadorId: new ObjectId(decodedToken._id)
      },
      { 
        $set: { 
          estado,
          fechaActualizacion: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no autorizada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Estado actualizado correctamente' })
  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}