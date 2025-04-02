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

    // Verificar si el usuario ya ha realizado una reseña para este trabajador
    const { data: existingReview, error: checkError } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('trabajador_id', workerId)
      .eq('usuario_id', decodedToken.userId)
      .maybeSingle()

    if (checkError) {
      console.error('Error al verificar reseña existente:', checkError)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    if (existingReview) {
      return NextResponse.json(
        { error: 'Ya has realizado una reseña para este trabajador' },
        { status: 400 }
      )
    }

    // Insertar la nueva reseña
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert([
        {
          trabajador_id: workerId,
          usuario_id: decodedToken.userId,
          rating,
          comment,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error al crear reseña:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    // Actualizar el promedio de calificaciones del trabajador
    await supabaseAdmin.rpc('update_worker_rating', { worker_id: workerId })

    return NextResponse.json({
      success: true,
      review: {
        _id: data[0].id,
        workerId: data[0].trabajador_id,
        userId: data[0].usuario_id,
        rating: data[0].rating,
        comment: data[0].comment,
        createdAt: data[0].created_at
      }
    })
  } catch (error) {
    console.error('Error al crear reseña:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}