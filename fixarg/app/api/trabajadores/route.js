import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// Evitar que Next.js cachee esta ruta (era la causa de que siempre devolviera [] viejo)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const decodedToken = verifyToken(token)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener todos los trabajadores y filtrar por aprobados en JS (evita problemas de mayúsculas/espacios en status)
    const { data: allTrabajadores, error } = await supabaseAdmin
      .from('trabajadores')
      .select('*')

    if (error) {
      console.error('Error al obtener trabajadores:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    const rawList = allTrabajadores || []
    const data = rawList.filter(
      t => String(t?.status || '').toLowerCase().trim() === 'approved'
    )

    const ids = data.map(t => t.id)

    // Reseñas por trabajador
    const { data: counts } = await supabaseAdmin
      .from('reviews')
      .select('trabajador_id')
      .in('trabajador_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    const reviewCountByWorker = (counts || []).reduce((acc, row) => {
      acc[row.trabajador_id] = (acc[row.trabajador_id] || 0) + 1
      return acc
    }, {})

    // Estadísticas por trabajador para matching y reputación (tasa aceptación, completados, cancelaciones)
    const { data: solicitudesRows } = await supabaseAdmin
      .from('solicitudes')
      .select('trabajador_id, estado')
      .in('trabajador_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])

    const statsByWorker = {}
    for (const wid of ids) {
      statsByWorker[wid] = {
        total: 0,
        accepted: 0,
        rejected: 0,
        cancelledByWorker: 0,
        completed: 0,
      }
    }
    for (const row of solicitudesRows || []) {
      const w = statsByWorker[row.trabajador_id]
      if (!w) continue
      w.total++
      if (row.estado === 'confirmada' || row.estado === 'en_progreso' || row.estado === 'completada') w.accepted++
      else if (row.estado === 'rechazada') w.rejected++
      else if (row.estado === 'cancelada_por_trabajador') w.cancelledByWorker++
      if (row.estado === 'completada') w.completed++
    }

    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sort') || 'ranking'

    // Score de reputación para matching: rating, aceptación, trabajos completados, pocas cancelaciones
    function rankingScore(t, stats, reviewCount) {
      const rating = t.average_rating != null ? Number(t.average_rating) : 0
      const s = stats[t.id] || {}
      const responded = s.accepted + s.rejected
      const acceptanceRate = responded > 0 ? s.accepted / responded : 1
      const cancelRate = s.total > 0 ? s.cancelledByWorker / s.total : 0
      const completed = s.completed || 0
      const ratingNorm = (rating / 5) * 40
      const acceptanceNorm = acceptanceRate * 30
      const completedNorm = Math.min(completed / 10, 1) * 20
      const lowCancelNorm = (1 - Math.min(cancelRate * 2, 1)) * 10
      return ratingNorm + acceptanceNorm + completedNorm + lowCancelNorm
    }

    const trabajadoresMapped = data.map(t => {
      const s = statsByWorker[t.id] || {}
      const responded = s.accepted + s.rejected
      const acceptanceRate = responded > 0 ? s.accepted / responded : 1
      const score = rankingScore(t, statsByWorker, reviewCountByWorker[t.id])
      return {
        _id: t.id,
        firstName: t.first_name,
        lastName: t.last_name,
        email: t.email,
        occupation: t.occupation,
        hourlyRate: t.hourly_rate,
        description: t.description,
        phone: t.phone,
        displayName: t.display_name,
        service: t.occupation,
        averageRating: t.average_rating != null ? Number(t.average_rating) : null,
        reviewCount: reviewCountByWorker[t.id] || 0,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        completedJobs: s.completed || 0,
        cancellationCount: s.cancelledByWorker || 0,
        rankingScore: Math.round(score * 100) / 100,
        profilePhotoUrl: t.profile_photo_url ?? null,
        skillsJson: Array.isArray(t.skills_json) ? t.skills_json : (t.skills_json ? [] : []),
        puntos: t.puntos != null ? Number(t.puntos) : 0,
      }
    })

    if (sortBy === 'ranking') {
      trabajadoresMapped.sort((a, b) => (b.rankingScore ?? 0) - (a.rankingScore ?? 0))
    } else if (sortBy === 'price_asc') {
      trabajadoresMapped.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0))
    } else if (sortBy === 'price_desc') {
      trabajadoresMapped.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0))
    } else if (sortBy === 'rating') {
      trabajadoresMapped.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
    }

    const res = NextResponse.json(trabajadoresMapped)
    // Evitar que el navegador cachee esta respuesta
    res.headers.set('Cache-Control', 'private, no-store, max-age=0')
    return res
  } catch (error) {
    console.error('Error fetching trabajadores:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}