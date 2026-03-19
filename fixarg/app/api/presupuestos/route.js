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
 * POST /api/presupuestos
 * El trabajador envía un presupuesto para una solicitud en su rubro.
 * Body: solicitudId, monto, mensaje (opcional), duracionEstimada (opcional; la indica el trabajador).
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'trabajador') {
      return NextResponse.json({ error: 'Solo un profesional puede enviar presupuestos' }, { status: 403 })
    }

    const body = await request.json()
    const { solicitudId, monto, mensaje, duracionEstimada } = body

    if (!solicitudId) {
      return NextResponse.json({ error: 'Falta solicitudId' }, { status: 400 })
    }
    const montoNum = monto != null ? Number(monto) : NaN
    if (!Number.isFinite(montoNum) || montoNum < 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    const { data: solicitud, error: solError } = await supabaseAdmin
      .from('solicitudes')
      .select('id, estado, servicio_rubro, usuario_id')
      .eq('id', solicitudId)
      .single()

    if (solError || !solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (solicitud.estado !== 'pendiente_presupuestos') {
      return NextResponse.json({ error: 'Esta solicitud no acepta presupuestos' }, { status: 400 })
    }

    const { data: worker, error: workerError } = await supabaseAdmin
      .from('trabajadores')
      .select('id, occupation, skills_json, status')
      .eq('id', decoded.userId)
      .single()

    if (workerError || !worker) {
      return NextResponse.json({ error: 'Profesional no encontrado' }, { status: 403 })
    }
    if (String(worker.status || '').toLowerCase().trim() !== 'approved') {
      return NextResponse.json({ error: 'Tu cuenta no está aprobada para enviar presupuestos' }, { status: 403 })
    }

    const rubroNorm = normalizeCategory(solicitud.servicio_rubro)
    if (!rubroNorm) {
      return NextResponse.json({ error: 'La solicitud no tiene rubro definido' }, { status: 400 })
    }
    const occNorm = normalizeCategory(worker.occupation)
    const skills = Array.isArray(worker.skills_json) ? worker.skills_json : []
    const inRubro = occNorm === rubroNorm || skills.some(s => normalizeCategory(s?.skill) === rubroNorm)
    if (!inRubro) {
      return NextResponse.json({ error: 'No perteneces al rubro de esta solicitud' }, { status: 403 })
    }

    const { data: existing } = await supabaseAdmin
      .from('presupuestos')
      .select('id')
      .eq('solicitud_id', solicitudId)
      .eq('trabajador_id', decoded.userId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Ya enviaste un presupuesto para esta solicitud' }, { status: 400 })
    }

    const insertPayload = {
      solicitud_id: solicitudId,
      trabajador_id: decoded.userId,
      monto: montoNum,
      estado: 'enviado',
      fecha_creacion: new Date().toISOString(),
    }
    if (mensaje != null && String(mensaje).trim() !== '') {
      insertPayload.mensaje = String(mensaje).trim()
    }
    if (duracionEstimada != null && String(duracionEstimada).trim() !== '') {
      insertPayload.duracion_estimada = String(duracionEstimada).trim()
    }

    const { data: created, error: insertError } = await supabaseAdmin
      .from('presupuestos')
      .insert([insertPayload])
      .select()
      .single()

    if (insertError) {
      console.error('Error al crear presupuesto:', insertError)
      return NextResponse.json({ error: 'Error al guardar el presupuesto', details: insertError.message }, { status: 500 })
    }

    const { createNotification } = await import('@/lib/notifications')
    await createNotification({
      user_type: 'usuario',
      user_id: solicitud.usuario_id,
      type: 'new_message',
      title: 'Nuevo presupuesto',
      message: 'Tienes un nuevo presupuesto en una de tus solicitudes. Revisa el detalle para aprobarlo.',
      related_id: solicitudId,
    })

    const formatted = {
      id: created.id,
      _id: created.id,
      solicitudId: created.solicitud_id,
      trabajadorId: created.trabajador_id,
      monto: Number(created.monto),
      mensaje: created.mensaje ?? null,
      duracionEstimada: created.duracion_estimada ?? null,
      estado: created.estado,
      fechaCreacion: created.fecha_creacion,
    }

    return NextResponse.json({ success: true, presupuesto: formatted })
  } catch (error) {
    console.error('Error en POST /api/presupuestos:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    { status: 200, headers: { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Origin': '*' } }
  )
}
