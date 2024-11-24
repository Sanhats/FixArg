import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const decodedToken = verifyToken(token)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const body = await request.json()

    const solicitud = {
      descripcion: body.descripcion,
      fecha: body.fecha,
      hora: body.hora,
      trabajadorId: new ObjectId(body.trabajadorId),
      usuarioId: new ObjectId(body.usuarioId),
      estado: 'pendiente',
      fechaCreacion: new Date()
    }

    const result = await db.collection('solicitudes').insertOne(solicitud)

    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      solicitud: {
        ...solicitud,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error('Error al crear solicitud:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const decodedToken = verifyToken(token)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')
    const trabajadorId = searchParams.get('trabajadorId')

    const { db } = await connectToDatabase()
    let query = {}

    if (usuarioId) {
      query.usuarioId = new ObjectId(usuarioId)
    }
    if (trabajadorId) {
      query.trabajadorId = new ObjectId(trabajadorId)
    }

    const solicitudes = await db.collection('solicitudes')
      .find(query)
      .sort({ fechaCreacion: -1 })
      .toArray()

    return NextResponse.json(solicitudes)
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}