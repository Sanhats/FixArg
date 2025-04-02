import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { headers } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET() {
  try {
    const headersList = headers()
    const token = headersList.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const trabajadorId = decoded.userId

    // Obtener solicitudes de Supabase con join a usuarios
    const { data: solicitudes, error } = await supabaseAdmin
      .from('solicitudes')
      .select(`
        *,
        usuarios:usuario_id (*)
      `)
      .eq('trabajador_id', trabajadorId)
      .order('fecha_creacion', { ascending: false })

    if (error) {
      console.error('Error al obtener solicitudes:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al cargar las solicitudes',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const serializedSolicitudes = solicitudes.map(solicitud => ({
      ...solicitud,
      _id: solicitud.id,
      trabajadorId: solicitud.trabajador_id,
      usuarioId: solicitud.usuario_id,
      fechaCreacion: solicitud.fecha_creacion,
      usuario: solicitud.usuarios ? {
        ...solicitud.usuarios,
        _id: solicitud.usuarios.id,
        firstName: solicitud.usuarios.first_name,
        lastName: solicitud.usuarios.last_name
      } : null
    }))

    return NextResponse.json({ 
      success: true, 
      solicitudes: serializedSolicitudes 
    })
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al cargar las solicitudes',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const headersList = headers()
    const token = headersList.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
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