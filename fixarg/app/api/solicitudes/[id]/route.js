import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeCategory(str) {
  if (!str || typeof str !== 'string') return ''
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/**
 * GET /api/solicitudes/[id]
 * Returns a single solicitud with usuario, trabajador (if assigned), and presupuestos.
 * Allowed if JWT is cliente (usuario_id), assigned worker (trabajador_id), or worker in rubro when pendiente_presupuestos.
 */
export async function GET(request, { params }) {
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
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { data: solicitud, error } = await supabaseAdmin
      .from('solicitudes')
      .select(`
        *,
        usuarios:usuario_id (id, email, first_name, last_name),
        trabajadores:trabajador_id (id, email, first_name, last_name, display_name, occupation, hourly_rate)
      `)
      .eq('id', id)
      .single()

    if (error || !solicitud) {
      console.error('Error al obtener solicitud:', error)
      return NextResponse.json({ error: 'Error al obtener la solicitud' }, { status: error?.code === 'PGRST116' ? 404 : 500 })
    }

    const isCliente = decoded.role === 'user' && solicitud.usuario_id === decoded.userId
    const isTrabajadorAsignado = decoded.role === 'trabajador' && solicitud.trabajador_id === decoded.userId
    let isTrabajadorEnRubro = false
    if (decoded.role === 'trabajador' && !solicitud.trabajador_id && solicitud.estado === 'pendiente_presupuestos' && solicitud.servicio_rubro) {
      const { data: worker } = await supabaseAdmin.from('trabajadores').select('occupation, skills_json').eq('id', decoded.userId).single()
      if (worker) {
        const rubroNorm = normalizeCategory(solicitud.servicio_rubro)
        const occNorm = normalizeCategory(worker.occupation)
        if (occNorm === rubroNorm) isTrabajadorEnRubro = true
        else {
          const skills = Array.isArray(worker.skills_json) ? worker.skills_json : []
          if (skills.some(s => normalizeCategory(s?.skill) === rubroNorm)) isTrabajadorEnRubro = true
        }
      }
    }
    const isTrabajador = isTrabajadorAsignado || isTrabajadorEnRubro
    if (!isCliente && !isTrabajador) {
      return NextResponse.json({ error: 'No autorizado para ver esta solicitud' }, { status: 403 })
    }

    const usuario = solicitud.usuarios
      ? { id: solicitud.usuarios.id, email: solicitud.usuarios.email, firstName: solicitud.usuarios.first_name, lastName: solicitud.usuarios.last_name }
      : null
    const trabajador = solicitud.trabajadores
      ? {
          id: solicitud.trabajadores.id,
          email: solicitud.trabajadores.email,
          firstName: solicitud.trabajadores.first_name,
          lastName: solicitud.trabajadores.last_name,
          displayName: solicitud.trabajadores.display_name,
          occupation: solicitud.trabajadores.occupation,
          hourlyRate: solicitud.trabajadores.hourly_rate,
        }
      : null

    let presupuestos = []
    const { data: presupuestosRows } = await supabaseAdmin
      .from('presupuestos')
      .select(`
        id,
        solicitud_id,
        trabajador_id,
        monto,
        mensaje,
        duracion_estimada,
        estado,
        fecha_creacion,
        trabajadores:trabajador_id (id, first_name, last_name, display_name, occupation, average_rating)
      `)
      .eq('solicitud_id', id)
      .order('fecha_creacion', { ascending: true })
    if (presupuestosRows && presupuestosRows.length > 0) {
      presupuestos = presupuestosRows.map(p => ({
        id: p.id,
        solicitudId: p.solicitud_id,
        trabajadorId: p.trabajador_id,
        monto: p.monto != null ? Number(p.monto) : null,
        mensaje: p.mensaje ?? null,
        duracionEstimada: p.duracion_estimada ?? null,
        estado: p.estado,
        fechaCreacion: p.fecha_creacion,
        trabajador: p.trabajadores ? {
          id: p.trabajadores.id,
          firstName: p.trabajadores.first_name,
          lastName: p.trabajadores.last_name,
          displayName: p.trabajadores.display_name,
          occupation: p.trabajadores.occupation,
          averageRating: p.trabajadores.average_rating != null ? Number(p.trabajadores.average_rating) : null,
        } : null,
      }))
    }

    const formatted = {
      id: solicitud.id,
      _id: solicitud.id,
      descripcion: solicitud.descripcion,
      fecha: solicitud.fecha,
      hora: solicitud.hora,
      direccion: solicitud.direccion ?? null,
      ubicacionLat: solicitud.ubicacion_lat != null ? Number(solicitud.ubicacion_lat) : null,
      ubicacionLng: solicitud.ubicacion_lng != null ? Number(solicitud.ubicacion_lng) : null,
      duracionEstimada: solicitud.duracion_estimada ?? null,
      fotos: Array.isArray(solicitud.fotos_json) ? solicitud.fotos_json : [],
      estado: solicitud.estado,
      trabajadorId: solicitud.trabajador_id,
      usuarioId: solicitud.usuario_id,
      fechaCreacion: solicitud.fecha_creacion,
      servicioRubro: solicitud.servicio_rubro ?? null,
      respondedByDeadline: solicitud.fecha_creacion
        ? new Date(new Date(solicitud.fecha_creacion).getTime() + 24 * 60 * 60 * 1000).toISOString()
        : null,
      fechaActualizacion: solicitud.fecha_actualizacion,
      startedAt: solicitud.started_at,
      completedAt: solicitud.completed_at,
      usuario,
      trabajador,
      presupuestos,
    }

    const res = NextResponse.json(formatted)
    res.headers.set('Cache-Control', 'private, no-store, max-age=0')
    return res
  } catch (error) {
    console.error('Error en GET /api/solicitudes/[id]:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

/**
 * PATCH /api/solicitudes/[id]
 * Cliente: cancel (cancelada_por_cliente) o approve_presupuesto (asigna trabajador, estado confirmada).
 */
export async function PATCH(request, { params }) {
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
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'user') {
      return NextResponse.json({ error: 'Solo el cliente puede usar esta ruta' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action

    const { data: current, error: fetchError } = await supabaseAdmin
      .from('solicitudes')
      .select('id, estado, usuario_id, trabajador_id, fecha, hora')
      .eq('id', id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (current.usuario_id !== decoded.userId) {
      return NextResponse.json({ error: 'No autorizado para esta solicitud' }, { status: 403 })
    }

    if (action === 'approve_presupuesto') {
      const presupuestoId = body.presupuestoId
      if (!presupuestoId) {
        return NextResponse.json({ error: 'Falta presupuestoId' }, { status: 400 })
      }
      if (current.estado !== 'pendiente_presupuestos') {
        return NextResponse.json({ error: 'Solo se puede aprobar un presupuesto en una solicitud pendiente de presupuestos' }, { status: 400 })
      }
      const { data: presupuesto, error: presErr } = await supabaseAdmin
        .from('presupuestos')
        .select('id, trabajador_id, estado, duracion_estimada')
        .eq('id', presupuestoId)
        .eq('solicitud_id', id)
        .single()
      if (presErr || !presupuesto || presupuesto.estado !== 'enviado') {
        return NextResponse.json({ error: 'Presupuesto no encontrado o no válido' }, { status: 404 })
      }
      const nowIso = new Date().toISOString()
      await supabaseAdmin
        .from('presupuestos')
        .update({ estado: 'aprobado', fecha_actualizacion: nowIso })
        .eq('id', presupuestoId)
      await supabaseAdmin
        .from('presupuestos')
        .update({ estado: 'rechazado', fecha_actualizacion: nowIso })
        .eq('solicitud_id', id)
        .neq('id', presupuestoId)
      const updateSolicitudPayload = {
        trabajador_id: presupuesto.trabajador_id,
        estado: 'confirmada',
        fecha_actualizacion: nowIso,
      }
      if (presupuesto.duracion_estimada != null && String(presupuesto.duracion_estimada).trim() !== '') {
        updateSolicitudPayload.duracion_estimada = String(presupuesto.duracion_estimada).trim()
      }
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('solicitudes')
        .update(updateSolicitudPayload)
        .eq('id', id)
        .select()
        .single()
      if (updateError) {
        console.error('Error al aprobar presupuesto:', updateError)
        return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 })
      }
      const { createNotification } = await import('@/lib/notifications')
      await createNotification({
        user_type: 'trabajador',
        user_id: presupuesto.trabajador_id,
        type: 'request_accepted',
        title: 'Tu presupuesto fue aceptado',
        message: `El cliente aprobó tu presupuesto. La solicitud del ${current.fecha} a las ${current.hora} está confirmada.`,
        related_id: id,
      })
      const { data: otrosPresupuestos } = await supabaseAdmin.from('presupuestos').select('trabajador_id').eq('solicitud_id', id).eq('estado', 'rechazado')
      for (const row of otrosPresupuestos || []) {
        if (row.trabajador_id && row.trabajador_id !== presupuesto.trabajador_id) {
          await createNotification({
            user_type: 'trabajador',
            user_id: row.trabajador_id,
            type: 'request_cancelled',
            title: 'Otro profesional fue elegido',
            message: `El cliente eligió otro presupuesto para la solicitud del ${current.fecha} a las ${current.hora}.`,
            related_id: id,
          })
        }
      }
      const formatted = {
        ...updated,
        _id: updated.id,
        trabajadorId: updated.trabajador_id,
        usuarioId: updated.usuario_id,
        fechaCreacion: updated.fecha_creacion,
      }
      return NextResponse.json({ message: 'Presupuesto aprobado', solicitud: formatted })
    }

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Acción no válida. Use: { "action": "cancel" } o { "action": "approve_presupuesto", "presupuestoId": "..." }' }, { status: 400 })
    }

    if (current.estado !== 'pendiente' && current.estado !== 'pendiente_presupuestos' && current.estado !== 'confirmada') {
      return NextResponse.json(
        { error: 'Solo se puede cancelar una solicitud pendiente o confirmada' },
        { status: 400 }
      )
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('solicitudes')
      .update({
        estado: 'cancelada_por_cliente',
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error al cancelar solicitud:', updateError)
      return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 })
    }

    const { createNotification } = await import('@/lib/notifications')
    if (current.trabajador_id) {
      await createNotification({
        user_type: 'trabajador',
        user_id: current.trabajador_id,
        type: 'request_cancelled',
        title: 'Solicitud cancelada por el cliente',
        message: `El cliente canceló la solicitud del ${current.fecha} a las ${current.hora}.`,
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
    return NextResponse.json({ message: 'Solicitud cancelada', solicitud: formatted })
  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
