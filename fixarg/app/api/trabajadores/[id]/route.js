import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request, { params }) {
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

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID de trabajador requerido' }, { status: 400 })
    }

    const { data: t, error } = await supabaseAdmin
      .from('trabajadores')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !t) {
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
    }

    if (String(t?.status || '').toLowerCase().trim() !== 'approved') {
      return NextResponse.json({ error: 'Trabajador no disponible' }, { status: 404 })
    }

    const { count } = await supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('trabajador_id', id)

    const worker = {
      _id: t.id,
      firstName: t.first_name,
      lastName: t.last_name,
      email: t.email,
      occupation: t.occupation,
      hourlyRate: t.hourly_rate,
      description: t.description,
      displayName: t.display_name,
      service: t.occupation,
      averageRating: t.average_rating != null ? Number(t.average_rating) : null,
      reviewCount: count ?? 0,
      profilePhotoUrl: t.profile_photo_url ?? null,
      skillsJson: Array.isArray(t.skills_json) ? t.skills_json : (t.skills_json ? [] : []),
      puntos: t.puntos != null ? Number(t.puntos) : 0,
    }

    const res = NextResponse.json(worker)
    res.headers.set('Cache-Control', 'private, no-store, max-age=0')
    return res
  } catch (error) {
    console.error('Error fetching trabajador:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
