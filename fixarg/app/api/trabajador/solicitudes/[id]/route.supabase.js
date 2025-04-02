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

    // Obtener la solicitud de Supabase
    const { data: solicitud, error } = await supabaseAdmin
      .from('solicitudes')
      .select('*')
      .eq('id', id)
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

export async function PUT(request, { params }) {
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

    const body = await request.json()
    const { estado } = body

    if (!estado) {
      return NextResponse.json({ error: 'Estado no proporcionado' }, { status: 400 })
    }

    // Actualizar el estado de la solicitud en Supabase
    const { data, error } = await supabaseAdmin
      .from('solicitudes')
      .update({ estado })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error al actualizar solicitud:', error)
      return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const formattedSolicitud = {
      ...data[0],
      _id: data[0].id,
      trabajadorId: data[0].trabajador_id,
      usuarioId: data[0].usuario_id,
      fechaCreacion: data[0].fecha_creacion
    }

    return NextResponse.json({
      success: true,
      solicitud: formattedSolicitud
    })
  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}