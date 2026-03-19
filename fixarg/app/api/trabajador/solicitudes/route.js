import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeCategory(str) {
  if (!str || typeof str !== 'string') return ''
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

function serializeSolicitud(solicitud) {
  const usuarioEmbed = solicitud.usuarios
  return {
    ...solicitud,
    _id: solicitud.id,
    trabajadorId: solicitud.trabajador_id,
    usuarioId: solicitud.usuario_id,
    fechaCreacion: solicitud.fecha_creacion,
    servicioRubro: solicitud.servicio_rubro ?? null,
    usuario: usuarioEmbed ? {
      _id: usuarioEmbed.id,
      firstName: usuarioEmbed.first_name,
      lastName: usuarioEmbed.last_name,
      email: usuarioEmbed.email,
      puntos: usuarioEmbed.puntos != null ? Number(usuarioEmbed.puntos) : 0,
    } : null,
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'trabajador') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    const trabajadorId = decoded.userId

    const { data: solicitudesAsignadas, error } = await supabaseAdmin
      .from('solicitudes')
      .select(`
        *,
        usuarios!usuario_id (id, first_name, last_name, email)
      `)
      .eq('trabajador_id', trabajadorId)
      .order('fecha_creacion', { ascending: false })

    if (error) {
      console.error('Error al obtener solicitudes:', error)
      return NextResponse.json({ success: false, error: 'Error al cargar las solicitudes', details: error.message }, { status: 500 })
    }

    const serializedAsignadas = (solicitudesAsignadas || []).map(serializeSolicitud)

    const { data: worker } = await supabaseAdmin
      .from('trabajadores')
      .select('occupation, skills_json')
      .eq('id', trabajadorId)
      .single()

    let solicitudesDisponibles = []
    if (worker) {
      const { data: disponiblesRaw, error: errDisp } = await supabaseAdmin
        .from('solicitudes')
        .select(`
          *,
          usuarios!usuario_id (id, first_name, last_name, email, puntos)
        `)
        .is('trabajador_id', null)
        .eq('estado', 'pendiente_presupuestos')
        .not('servicio_rubro', 'is', null)
        .order('fecha_creacion', { ascending: false })

      if (!errDisp && disponiblesRaw && disponiblesRaw.length > 0) {
        const rubroNormOcc = normalizeCategory(worker.occupation)
        const rubroSkills = (Array.isArray(worker.skills_json) ? worker.skills_json : []).map(s => normalizeCategory(s?.skill))
        const filtradas = disponiblesRaw.filter(s => {
          const rubroSol = normalizeCategory(s.servicio_rubro)
          if (!rubroSol) return false
          if (rubroNormOcc === rubroSol) return true
          return rubroSkills.some(r => r === rubroSol)
        })
        filtradas.sort((a, b) => (Number(b.usuarios?.puntos) || 0) - (Number(a.usuarios?.puntos) || 0))
        const idsDisponibles = filtradas.map(s => s.id)
        const { data: misPresupuestos } = await supabaseAdmin
          .from('presupuestos')
          .select('solicitud_id')
          .eq('trabajador_id', trabajadorId)
          .in('solicitud_id', idsDisponibles)
        const idsYaEnviados = new Set((misPresupuestos || []).map(p => p.solicitud_id))
        solicitudesDisponibles = filtradas.map(s => ({
          ...serializeSolicitud(s),
          yaEnvioPresupuesto: idsYaEnviados.has(s.id),
        }))
      }
    }

    const res = NextResponse.json({
      success: true,
      solicitudes: serializedAsignadas,
      solicitudesDisponibles,
    })
    res.headers.set('Cache-Control', 'private, no-store, max-age=0')
    return res
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json({ success: false, error: 'Error al cargar las solicitudes', details: error?.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'trabajador') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    const trabajadorId = decoded.userId

    const { solicitudId, estado } = await request.json()

    // Actualizar solicitud en Supabase
    const { data, error } = await supabaseAdmin
      .from('solicitudes')
      .update({
        estado,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', solicitudId)
      .eq('trabajador_id', trabajadorId)
      .select()

    if (error) {
      console.error('Error al actualizar solicitud:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al actualizar la solicitud',
          details: error.message 
        },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Estado actualizado correctamente' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error al actualizar la solicitud',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}