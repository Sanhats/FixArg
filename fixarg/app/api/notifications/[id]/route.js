import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 })
    }

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

    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('id', id)
      .eq('user_type', userType)
      .eq('user_id', userId)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (updateError) {
      console.error('Error al marcar notificación:', updateError)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Notificación marcada como leída' })
  } catch (error) {
    console.error('Error en PATCH /api/notifications/[id]:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
