import { MongoClient, ObjectId } from 'mongodb'
import { headers } from 'next/headers'
import jwt from 'jsonwebtoken'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function GET() {
  try {
    const headersList = headers()
    const token = headersList.get('authorization')?.split(' ')[1]

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token no proporcionado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const trabajadorId = decoded.userId

    const client = await clientPromise
    const db = client.db("FixArg")

    // Get all requests for this worker with populated user data
    const solicitudes = await db.collection('solicitudes')
      .aggregate([
        {
          $match: {
            trabajadorId: new ObjectId(trabajadorId)
          }
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: 'usuarioId',
            foreignField: '_id',
            as: 'usuario'
          }
        },
        {
          $unwind: {
            path: '$usuario',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ])
      .toArray()

    // Transform ObjectId to string for JSON serialization
    const serializedSolicitudes = solicitudes.map(solicitud => ({
      ...solicitud,
      _id: solicitud._id.toString(),
      trabajadorId: solicitud.trabajadorId.toString(),
      usuarioId: solicitud.usuarioId?.toString(),
      usuario: solicitud.usuario ? {
        ...solicitud.usuario,
        _id: solicitud.usuario._id.toString()
      } : null
    }))

    return new Response(
      JSON.stringify({ 
        success: true, 
        solicitudes: serializedSolicitudes 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error al cargar las solicitudes',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}

export async function PUT(request) {
  try {
    const headersList = headers()
    const token = headersList.get('authorization')?.split(' ')[1]

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token no proporcionado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const trabajadorId = decoded.userId

    const { solicitudId, estado } = await request.json()

    const client = await clientPromise
    const db = client.db("FixArg")

    const result = await db.collection('solicitudes').updateOne(
      {
        _id: new ObjectId(solicitudId),
        trabajadorId: new ObjectId(trabajadorId)
      },
      {
        $set: {
          estado,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Solicitud no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Estado actualizado correctamente' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error al actualizar la solicitud',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}