import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function PATCH(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    const decodedToken = verifyToken(token)

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params
    const { status } = await request.json()

    const { db } = await connectToDatabase()
    const result = await db.collection('trabajadores').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Estado actualizado con éxito' })
  } catch (error) {
    console.error('Error updating professional status:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  })
}