import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    // Verificar el token de autorización
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización no proporcionado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = verifyToken(token)
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Datos recibidos en API:', body) // Para debugging

    // Validar los campos requeridos y su formato
    const requiredFields = {
      descripcion: 'descripción',
      fecha: 'fecha',
      hora: 'hora',
      trabajadorId: 'trabajadorId',
      usuarioId: 'usuarioId'
    }

    const missingFields = []
    const invalidFields = []

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!body[field]) {
        missingFields.push(label)
        continue
      }

      // Validación específica para IDs
      if ((field === 'trabajadorId' || field === 'usuarioId') && !ObjectId.isValid(body[field])) {
        invalidFields.push(`${label} inválido`)
      }
    }

    if (missingFields.length > 0) {
      console.log('Campos faltantes:', missingFields)
      return NextResponse.json({ 
        error: 'Faltan datos requeridos', 
        missingFields 
      }, { status: 400 })
    }

    if (invalidFields.length > 0) {
      console.log('Campos inválidos:', invalidFields)
      return NextResponse.json({ 
        error: 'Formato inválido en algunos campos', 
        invalidFields 
      }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Crear el objeto de solicitud con los campos validados
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
    return NextResponse.json({ 
      error: 'Error al procesar la solicitud',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización no proporcionado' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
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
    return NextResponse.json({ 
      error: 'Error al obtener las solicitudes',
      details: error.message 
    }, { status: 500 })
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