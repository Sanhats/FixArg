import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    const { contenido, emisorId, receptorId, solicitudId } = body

    if (!contenido?.trim() || !emisorId || !receptorId || !solicitudId) {
      return NextResponse.json({ error: 'Faltan datos del mensaje' }, { status: 400 })
    }
    if (decodedToken.userId !== emisorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar que el emisor es parte de la solicitud
    const { data: solicitud, error: solError } = await supabaseAdmin
      .from('solicitudes')
      .select('usuario_id, trabajador_id')
      .eq('id', solicitudId)
      .single()
    if (solError || !solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }
    const isParticipant = solicitud.usuario_id === emisorId || solicitud.trabajador_id === emisorId
    if (!isParticipant) {
      return NextResponse.json({ error: 'No autorizado para enviar mensajes en esta solicitud' }, { status: 403 })
    }

    // Crear el mensaje en Supabase
    const { data, error } = await supabaseAdmin
      .from('mensajes')
      .insert([
        {
          contenido: contenido.trim(),
          emisor_id: emisorId,
          receptor_id: receptorId,
          solicitud_id: solicitudId,
          fecha_creacion: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error al crear mensaje:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    // Notificación al receptor
    const { createNotification } = await import('@/lib/notifications')
    const receptorUserType = solicitud.usuario_id === receptorId ? 'usuario' : 'trabajador'
    await createNotification({
      user_type: receptorUserType,
      user_id: receptorId,
      type: 'new_message',
      title: 'Nuevo mensaje',
      message: `Tienes un nuevo mensaje en una solicitud.`,
      related_id: solicitudId,
    })

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const mensaje = {
      ...data[0],
      _id: data[0].id,
      emisorId: data[0].emisor_id,
      receptorId: data[0].receptor_id,
      solicitudId: data[0].solicitud_id,
      fechaCreacion: data[0].fecha_creacion
    }

    return NextResponse.json({ 
      success: true, 
      id: mensaje._id,
      mensaje
    })
  } catch (error) {
    console.error('Error al crear mensaje:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const decodedToken = verifyToken(token)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const solicitudId = searchParams.get('solicitudId')

    if (!solicitudId) {
      return NextResponse.json({ error: 'ID de solicitud requerido' }, { status: 400 })
    }

    // Solo permitir ver mensajes si el usuario es parte de la solicitud (cliente o trabajador)
    const { data: solicitud, error: solError } = await supabaseAdmin
      .from('solicitudes')
      .select('usuario_id, trabajador_id')
      .eq('id', solicitudId)
      .single()

    if (solError || !solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }
    const isParticipant = solicitud.usuario_id === decodedToken.userId || solicitud.trabajador_id === decodedToken.userId
    if (!isParticipant) {
      return NextResponse.json({ error: 'No autorizado para ver los mensajes de esta solicitud' }, { status: 403 })
    }

    // Obtener mensajes de Supabase
    const { data, error } = await supabaseAdmin
      .from('mensajes')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .order('fecha_creacion', { ascending: true })

    if (error) {
      console.error('Error al obtener mensajes:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    const mensajes = (data || []).map(mensaje => ({
      ...mensaje,
      _id: mensaje.id,
      emisorId: mensaje.emisor_id,
      receptorId: mensaje.receptor_id,
      solicitudId: mensaje.solicitud_id,
      fechaCreacion: mensaje.fecha_creacion
    }))

    const res = NextResponse.json(mensajes)
    res.headers.set('Cache-Control', 'private, no-store, max-age=0')
    return res
  } catch (error) {
    console.error('Error al obtener mensajes:', error)
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