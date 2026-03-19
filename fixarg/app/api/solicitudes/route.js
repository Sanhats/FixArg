import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

const TOP_WORKERS_BY_POINTS = 20

function normalizeCategory(str) {
  if (!str || typeof str !== 'string') return ''
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

async function getWorkersInRubro(servicioRubro) {
  const rubroNorm = normalizeCategory(servicioRubro)
  if (!rubroNorm) return []
  const { data: allTrabajadores, error } = await supabaseAdmin
    .from('trabajadores')
    .select('id, occupation, skills_json, puntos, status')
  if (error || !allTrabajadores) return []
  const approved = (allTrabajadores || []).filter(
    t => String(t?.status || '').toLowerCase().trim() === 'approved'
  )
  const inRubro = approved.filter(t => {
    const occNorm = normalizeCategory(t.occupation)
    if (occNorm === rubroNorm) return true
    const skills = Array.isArray(t.skills_json) ? t.skills_json : []
    return skills.some(s => normalizeCategory(s?.skill) === rubroNorm)
  })
  inRubro.sort((a, b) => (Number(b.puntos) || 0) - (Number(a.puntos) || 0))
  return inRubro.slice(0, TOP_WORKERS_BY_POINTS).map(t => t.id)
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización no proporcionado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = verifyToken(token)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()

    if (decodedToken.role !== 'user') {
      return NextResponse.json(
        { error: 'Solo los clientes pueden enviar solicitudes. Inicia sesión con una cuenta de cliente (no de trabajador).' },
        { status: 403 }
      )
    }

    const usuarioId = decodedToken.userId
    const useServicioRubro = body.servicioRubro != null && String(body.servicioRubro).trim() !== ''
    const useTrabajadorId = body.trabajadorId != null && String(body.trabajadorId).trim() !== ''

    if (!useServicioRubro && !useTrabajadorId) {
      return NextResponse.json(
        { error: 'Indica el servicio/rubro (servicioRubro) o el profesional (trabajadorId).' },
        { status: 400 }
      )
    }

    const missingFields = []
    if (!body.descripcion?.trim()) missingFields.push('descripción')
    if (!body.fecha?.trim()) missingFields.push('fecha')
    if (!body.hora?.trim()) missingFields.push('hora')
    if (useTrabajadorId && !body.trabajadorId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json({ error: 'trabajadorId inválido' }, { status: 400 })
    }
    if (missingFields.length > 0) {
      return NextResponse.json({ error: 'Faltan datos requeridos', missingFields }, { status: 400 })
    }

    const { data: usuario, error: errUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('id', usuarioId)
      .single()

    if (errUsuario || !usuario) {
      return NextResponse.json(
        { error: 'Tu cuenta de cliente no está registrada. Regístrate o inicia sesión con una cuenta de cliente.' },
        { status: 400 }
      )
    }

    let insertPayload
    if (useServicioRubro) {
      insertPayload = {
        descripcion: body.descripcion.trim(),
        fecha: body.fecha.trim(),
        hora: body.hora.trim(),
        servicio_rubro: String(body.servicioRubro).trim(),
        trabajador_id: null,
        usuario_id: usuarioId,
        estado: 'pendiente_presupuestos',
        fecha_creacion: new Date().toISOString(),
      }
    } else {
      insertPayload = {
        descripcion: body.descripcion.trim(),
        fecha: body.fecha.trim(),
        hora: body.hora.trim(),
        trabajador_id: body.trabajadorId,
        usuario_id: usuarioId,
        estado: 'pendiente',
        fecha_creacion: new Date().toISOString(),
      }
    }
    if (body.direccion != null && String(body.direccion).trim() !== '') {
      insertPayload.direccion = String(body.direccion).trim()
    }
    if (typeof body.ubicacionLat === 'number' && !Number.isNaN(body.ubicacionLat)) {
      insertPayload.ubicacion_lat = body.ubicacionLat
    }
    if (typeof body.ubicacionLng === 'number' && !Number.isNaN(body.ubicacionLng)) {
      insertPayload.ubicacion_lng = body.ubicacionLng
    }
    if (body.duracionEstimada != null && String(body.duracionEstimada).trim() !== '') {
      insertPayload.duracion_estimada = String(body.duracionEstimada).trim()
    }
    if (Array.isArray(body.fotos) && body.fotos.length > 0) {
      insertPayload.fotos_json = body.fotos.filter(u => typeof u === 'string' && u.trim())
    }

    const { data, error } = await supabaseAdmin
      .from('solicitudes')
      .insert([insertPayload])
      .select()

    if (error) {
      console.error('Error al crear solicitud en Supabase:', error)
      return NextResponse.json({ error: 'Error al procesar la solicitud', details: error.message }, { status: 500 })
    }

    const solicitud = {
      ...data[0],
      _id: data[0].id,
      trabajadorId: data[0].trabajador_id,
      usuarioId: data[0].usuario_id,
      fechaCreacion: data[0].fecha_creacion,
      servicioRubro: data[0].servicio_rubro ?? null,
    }

    const { createNotification } = await import('@/lib/notifications')
    const { sendRequestCreated } = await import('@/lib/email')

    if (useServicioRubro) {
      const workerIds = await getWorkersInRubro(body.servicioRubro)
      for (const workerId of workerIds) {
        await createNotification({
          user_type: 'trabajador',
          user_id: workerId,
          type: 'new_request',
          title: 'Nueva solicitud en tu rubro',
          message: `Hay una solicitud del ${body.fecha} a las ${body.hora}. Entra al detalle para enviar tu presupuesto.`,
          related_id: solicitud.id,
        })
      }
    } else {
      await createNotification({
        user_type: 'trabajador',
        user_id: body.trabajadorId,
        type: 'new_request',
        title: 'Nuevo trabajo disponible',
        message: `Revisa la solicitud del ${body.fecha} a las ${body.hora}. Entra al detalle para aceptar o rechazar.`,
        related_id: solicitud.id,
      })
      const { data: worker } = await supabaseAdmin.from('trabajadores').select('email').eq('id', body.trabajadorId).single()
      if (worker?.email) {
        await sendRequestCreated(worker.email, { descripcion: body.descripcion, fecha: body.fecha, hora: body.hora })
      }
    }

    return NextResponse.json({ success: true, id: solicitud.id, solicitud })
  } catch (error) {
    console.error('Error al crear solicitud:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud', details: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización no proporcionado' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decodedToken = verifyToken(token)
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Filtrar por el usuario autenticado: cliente ve las suyas, trabajador las suyas
    const isCliente = decodedToken.role === 'user'
    const isTrabajador = decodedToken.role === 'trabajador'
    if (!isCliente && !isTrabajador) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const filterId = decodedToken.userId
    const filterColumn = isCliente ? 'usuario_id' : 'trabajador_id'

    const { data, error } = await supabaseAdmin
      .from('solicitudes')
      .select(`
        id,
        descripcion,
        fecha,
        hora,
        direccion,
        ubicacion_lat,
        ubicacion_lng,
        duracion_estimada,
        fotos_json,
        trabajador_id,
        usuario_id,
        estado,
        fecha_creacion,
        servicio_rubro,
        trabajadores!trabajador_id (id, first_name, last_name, display_name)
      `)
      .eq(filterColumn, filterId)
      .order('fecha_creacion', { ascending: false })

    if (error) {
      console.error('Error al obtener solicitudes:', error)
      return NextResponse.json({ 
        error: 'Error al obtener las solicitudes',
        details: error.message 
      }, { status: 500 })
    }

    const solicitudes = (data || []).map(solicitud => {
      const t = solicitud.trabajadores
      return {
        _id: solicitud.id,
        id: solicitud.id,
        descripcion: solicitud.descripcion,
        fecha: solicitud.fecha,
        hora: solicitud.hora,
        direccion: solicitud.direccion ?? null,
        ubicacionLat: solicitud.ubicacion_lat != null ? Number(solicitud.ubicacion_lat) : null,
        ubicacionLng: solicitud.ubicacion_lng != null ? Number(solicitud.ubicacion_lng) : null,
        duracionEstimada: solicitud.duracion_estimada ?? null,
        fotos: Array.isArray(solicitud.fotos_json) ? solicitud.fotos_json : (solicitud.fotos_json ? [] : []),
        trabajadorId: solicitud.trabajador_id,
        usuarioId: solicitud.usuario_id,
        estado: solicitud.estado,
        fechaCreacion: solicitud.fecha_creacion,
        servicioRubro: solicitud.servicio_rubro ?? null,
        trabajador: t ? {
          id: t.id,
          firstName: t.first_name,
          lastName: t.last_name,
          displayName: t.display_name,
        } : null,
      }
    })

    const res = NextResponse.json(solicitudes)
    res.headers.set('Cache-Control', 'private, no-store, max-age=0')
    return res
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json({ 
      error: 'Error al obtener las solicitudes',
      details: error.message 
    }, { status: 500 })
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