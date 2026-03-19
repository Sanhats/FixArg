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

// POST: Crear una nueva reseña (por solicitud completada o por trabajador)
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

    // Solo el cliente (usuario) puede dejar reseñas
    if (decodedToken.role !== 'user') {
      return NextResponse.json({ error: 'Solo el cliente puede calificar' }, { status: 403 })
    }

    const body = await request.json()
    const { workerId, rating, comment, solicitudId } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Datos inválidos (rating 1-5)' }, { status: 400 })
    }

    let resolvedWorkerId = workerId

    if (solicitudId) {
      // Flujo por solicitud: una review por solicitud completada
      const { data: solicitud, error: solError } = await supabaseAdmin
        .from('solicitudes')
        .select('id, estado, usuario_id, trabajador_id')
        .eq('id', solicitudId)
        .single()

      if (solError || !solicitud) {
        return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
      }
      if (solicitud.estado !== 'completada') {
        return NextResponse.json(
          { error: 'Solo puedes calificar cuando el trabajo esté finalizado' },
          { status: 400 }
        )
      }
      if (solicitud.usuario_id !== decodedToken.userId) {
        return NextResponse.json({ error: 'No autorizado para calificar esta solicitud' }, { status: 403 })
      }

      const { data: existingBySolicitud } = await supabaseAdmin
        .from('reviews')
        .select('id')
        .eq('solicitud_id', solicitudId)
        .single()

      if (existingBySolicitud) {
        return NextResponse.json(
          { error: 'Ya has realizado una reseña para esta solicitud' },
          { status: 400 }
        )
      }

      resolvedWorkerId = solicitud.trabajador_id
    } else {
      // Flujo legacy: por trabajador (una por usuario por trabajador)
      if (!workerId) {
        return NextResponse.json({ error: 'Se requiere workerId o solicitudId' }, { status: 400 })
      }
      const { data: existingReview, error: checkError } = await supabaseAdmin
        .from('reviews')
        .select('id')
        .eq('trabajador_id', workerId)
        .eq('usuario_id', decodedToken.userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error al verificar reseña existente:', checkError)
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
      }
      if (existingReview) {
        return NextResponse.json(
          { error: 'Ya has realizado una reseña para este trabajador' },
          { status: 400 }
        )
      }
    }

    const review = {
      trabajador_id: resolvedWorkerId,
      usuario_id: decodedToken.userId,
      rating,
      comment: comment || null,
      created_at: new Date().toISOString(),
      ...(solicitudId && { solicitud_id: solicitudId }),
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert([review])
      .select()

    if (error) {
      console.error('Error al crear reseña:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    try {
      await supabaseAdmin.rpc('update_worker_rating', { worker_id: resolvedWorkerId })
    } catch (rpcErr) {
      console.warn('update_worker_rating RPC:', rpcErr)
    }

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