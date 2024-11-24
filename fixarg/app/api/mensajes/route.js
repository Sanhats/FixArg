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

    const mensaje = {
      contenido: body.contenido,
      emisorId: new ObjectId(body.emisorId),
      receptorId: new ObjectId(body.receptorId),
      solicitudId: new ObjectId(body.solicitudId),
      fechaCreacion: new Date()
    }

    const result = await db.collection('mensajes').insertOne(mensaje)
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      mensaje: {
        ...mensaje,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error('Error al crear mensaje:', error)
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
    const solicitudId = searchParams.get('solicitudId')

    if (!solicitudId) {
      return NextResponse.json({ error: 'ID de solicitud requerido' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const mensajes = await db.collection('mensajes')
      .find({ solicitudId: new ObjectId(solicitudId) })
      .sort({ fechaCreacion: 1 })
      .toArray()

    return NextResponse.json(mensajes)
  } catch (error) {
    console.error('Error al obtener mensajes:', error)
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