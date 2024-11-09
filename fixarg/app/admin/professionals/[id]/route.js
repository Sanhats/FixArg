// app/api/admin/professionals/route.js
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Obtener todos los profesionales
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    const decodedToken = verifyToken(token)

    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { db } = await connectToDatabase()
    const professionals = await db.collection('trabajadores')
      .find({})
      .toArray()

    return NextResponse.json(professionals)
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { error: 'Error al cargar los profesionales' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado del profesional
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
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  })
}