import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID de solicitud no proporcionado' }, { status: 400 })
    }

    // Verificar autenticación
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = verifyToken(token)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Solo el trabajador dueño puede ver su solicitud
    const { data: solicitud, error } = await supabaseAdmin
      .from('solicitudes')
      .select('*')
      .eq('id', id)
      .eq('trabajador_id', decodedToken.userId)
      .single()

    if (error) {
      console.error('Error al obtener solicitud:', error)
      return NextResponse.json({ error: 'Error al obtener la solicitud' }, { status: 500 })
    }

    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const formattedSolicitud = {
      ...solicitud,
      _id: solicitud.id,
      trabajadorId: solicitud.trabajador_id,
      usuarioId: solicitud.usuario_id,
      fechaCreacion: solicitud.fecha_creacion
    }

    return NextResponse.json(formattedSolicitud)
  } catch (error) {
    console.error('Error al obtener solicitud:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

const VALID_ACTIONS = ['accept', 'reject', 'start', 'complete', 'cancel']

export async function PUT(request, { params }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID de solicitud no proporcionado' }, { status: 400 })
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = verifyToken(token)
    if (!decodedToken || decodedToken.role !== 'trabajador') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const action = body?.action
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: 'Acción no válida. Use: accept, reject, start, complete, cancel' },
        { status: 400 }
      )
    }

    // Get current solicitud
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('solicitudes')
      .select('*')
      .eq('id', id)
      .eq('trabajador_id', decodedToken.userId)
      .single()

    if (fetchError || !current) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no autorizada' },
        { status: 404 }
      )
    }

    const RESPONSE_DEADLINE_HOURS = 24
    const now = new Date()
    const nowIso = now.toISOString()
    let newEstado = null
    let updatePayload = { fecha_actualizacion: nowIso }

    const checkResponseDeadline = () => {
      if (current.estado !== 'pendiente') return null
      const created = new Date(current.fecha_creacion)
      const deadline = new Date(created.getTime() + RESPONSE_DEADLINE_HOURS * 60 * 60 * 1000)
      if (now.getTime() > deadline.getTime()) {
        return NextResponse.json(
          { error: `El plazo para responder ha expirado (${RESPONSE_DEADLINE_HOURS} horas desde la creación).` },
          { status: 400 }
        )
      }
      return null
    }

    switch (action) {
      case 'accept': {
        if (current.estado !== 'pendiente') {
          return NextResponse.json({ error: 'Solo se puede aceptar una solicitud pendiente' }, { status: 400 })
        }
        const deadlineErr = checkResponseDeadline()
        if (deadlineErr) return deadlineErr
        newEstado = 'confirmada'
        updatePayload.estado = newEstado
        updatePayload.responded_at = nowIso
        break
      }
      case 'reject': {
        if (current.estado !== 'pendiente') {
          return NextResponse.json({ error: 'Solo se puede rechazar una solicitud pendiente' }, { status: 400 })
        }
        const deadlineErr = checkResponseDeadline()
        if (deadlineErr) return deadlineErr
        newEstado = 'rechazada'
        updatePayload.estado = newEstado
        updatePayload.responded_at = nowIso
        break
      }
      case 'start': {
        if (current.estado !== 'confirmada') {
          return NextResponse.json({ error: 'Solo se puede iniciar una solicitud confirmada' }, { status: 400 })
        }
        // Ventana horaria desactivada: el trabajador puede iniciar en cualquier momento
        newEstado = 'en_progreso'
        updatePayload.estado = newEstado
        updatePayload.started_at = now
        break
      }
      case 'complete':
        if (current.estado !== 'en_progreso') {
          return NextResponse.json({ error: 'Solo se puede finalizar un trabajo en progreso' }, { status: 400 })
        }
        newEstado = 'completada'
        updatePayload.estado = newEstado
        updatePayload.completed_at = now
        break
      case 'cancel':
        if (current.estado !== 'pendiente' && current.estado !== 'confirmada') {
          return NextResponse.json({ error: 'Solo se puede cancelar una solicitud pendiente o confirmada' }, { status: 400 })
        }
        newEstado = 'cancelada_por_trabajador'
        updatePayload.estado = newEstado
        break
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('solicitudes')
      .update(updatePayload)
      .eq('id', id)
      .eq('trabajador_id', decodedToken.userId)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar solicitud:', error)
      return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 })
    }

    // Notify cliente (usuario) and send emails
    const { createNotification } = await import('@/lib/notifications')
    const { sendRequestAccepted, sendWorkCompleted } = await import('@/lib/email')
    const usuarioId = current.usuario_id
    const solicitudInfo = { id: current.id, descripcion: current.descripcion, fecha: current.fecha, hora: current.hora }

    if (action === 'accept') {
      await createNotification({
        user_type: 'usuario',
        user_id: usuarioId,
        type: 'request_accepted',
        title: 'Solicitud aceptada',
        message: `Tu solicitud del ${current.fecha} a las ${current.hora} fue aceptada.`,
        related_id: id,
      })
      const { data: usuario } = await supabaseAdmin.from('usuarios').select('email').eq('id', usuarioId).single()
      if (usuario?.email) await sendRequestAccepted(usuario.email, solicitudInfo)
    } else if (action === 'reject') {
      await createNotification({
        user_type: 'usuario',
        user_id: usuarioId,
        type: 'request_rejected',
        title: 'Solicitud rechazada',
        message: `Tu solicitud del ${current.fecha} a las ${current.hora} fue rechazada.`,
        related_id: id,
      })
    } else if (action === 'start') {
      await createNotification({
        user_type: 'usuario',
        user_id: usuarioId,
        type: 'work_started',
        title: 'Trabajo iniciado',
        message: `El profesional llegó y comenzó el trabajo.`,
        related_id: id,
      })
    } else if (action === 'complete') {
      const PUNTOS_POR_TRABAJO = 10
      const { data: usuarioRow } = await supabaseAdmin.from('usuarios').select('puntos').eq('id', usuarioId).single()
      const { data: trabajadorRow } = await supabaseAdmin.from('trabajadores').select('puntos').eq('id', decodedToken.userId).single()
      const nuevosPuntosUsuario = (Number(usuarioRow?.puntos) || 0) + PUNTOS_POR_TRABAJO
      const nuevosPuntosTrabajador = (Number(trabajadorRow?.puntos) || 0) + PUNTOS_POR_TRABAJO
      await supabaseAdmin.from('usuarios').update({ puntos: nuevosPuntosUsuario }).eq('id', usuarioId)
      await supabaseAdmin.from('trabajadores').update({ puntos: nuevosPuntosTrabajador }).eq('id', decodedToken.userId)

      await createNotification({
        user_type: 'usuario',
        user_id: usuarioId,
        type: 'work_completed',
        title: 'Trabajo finalizado',
        message: `El trabajo fue marcado como finalizado. Puedes calificar al profesional.`,
        related_id: id,
      })
      const { data: usuario } = await supabaseAdmin.from('usuarios').select('email').eq('id', usuarioId).single()
      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : ''
      const linkToReview = `${baseUrl}/solicitudes/${id}`
      if (usuario?.email) await sendWorkCompleted(usuario.email, { ...solicitudInfo, id }, linkToReview)
    } else if (action === 'cancel') {
      await createNotification({
        user_type: 'usuario',
        user_id: usuarioId,
        type: 'request_cancelled',
        title: 'Solicitud cancelada por el profesional',
        message: `El profesional canceló la solicitud del ${current.fecha} a las ${current.hora}.`,
        related_id: id,
      })
    }

    const formatted = {
      ...updated,
      _id: updated.id,
      trabajadorId: updated.trabajador_id,
      usuarioId: updated.usuario_id,
      fechaCreacion: updated.fecha_creacion,
    }
    return NextResponse.json({ message: 'Estado actualizado correctamente', solicitud: formatted })
  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}