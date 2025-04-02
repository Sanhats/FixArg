import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// GET: Obtener reseñas de un trabajador específico
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')

    if (!workerId) {
      return NextResponse.json({ error: 'Se requiere ID del trabajador' }, { status: 400 })
    }

    // Obtener reseñas de Supabase con información del usuario
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        usuarios!inner(first_name, last_name)
      `)
      .eq('trabajador_id', workerId)

    if (error) {
      console.error('Error al obtener reseñas:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const reviews = data.map(review => ({
      _id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      user: {
        firstName: review.usuarios.first_name,
        lastName: review.usuarios.last_name
      }
    }))

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