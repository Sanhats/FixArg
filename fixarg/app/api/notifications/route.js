import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const userType = decoded.role === 'trabajador' ? 'trabajador' : 'usuario'
    const userId = decoded.userId

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_type', userType)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener notificaciones:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    const notifications = data.map(n => ({
      id: n.id,
      userType: n.user_type,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      relatedId: n.related_id,
      createdAt: n.created_at,
    }))

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error en GET /api/notifications:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
