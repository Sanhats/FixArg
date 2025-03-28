import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET: Obtener reseñas de un trabajador específico
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')

    if (!workerId) {
      return NextResponse.json({ error: 'Se requiere ID del trabajador' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    
    const reviews = await db.collection('reviews')
      .aggregate([
        { $match: { workerId: new ObjectId(workerId) } },
        { $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }},
        { $unwind: '$user' },
        { $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,
          'user.firstName': 1,
          'user.lastName': 1
        }}
      ])
      .toArray()

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error al obtener reseñas:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// POST: Crear una nueva reseña
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

    const body = await request.json()
    const { workerId, rating, comment } = body

    if (!workerId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verificar si el usuario ya ha realizado una reseña para este trabajador
    const existingReview = await db.collection('reviews').findOne({
      workerId: new ObjectId(workerId),
      userId: new ObjectId(decodedToken.userId)
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Ya has realizado una reseña para este trabajador' },
        { status: 400 }
      )
    }

    const review = {
      workerId: new ObjectId(workerId),
      userId: new ObjectId(decodedToken.userId),
      rating,
      comment,
      createdAt: new Date()
    }

    await db.collection('reviews').insertOne(review)

    // Actualizar el promedio de calificaciones del trabajador
    const reviews = await db.collection('reviews')
      .find({ workerId: new ObjectId(workerId) })
      .toArray()

    const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length

    await db.collection('trabajadores').updateOne(
      { _id: new ObjectId(workerId) },
      { $set: { averageRating } }
    )

    return NextResponse.json({ message: 'Reseña creada exitosamente' })
  } catch (error) {
    console.error('Error al crear reseña:', error)
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