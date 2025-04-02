import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

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

    // Crear el mensaje en Supabase
    const { data, error } = await supabaseAdmin
      .from('mensajes')
      .insert([
        {
          contenido: body.contenido,
          emisor_id: body.emisorId,
          receptor_id: body.receptorId,
          solicitud_id: body.solicitudId,
          fecha_creacion: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error al crear mensaje:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

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

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const mensajes = data.map(mensaje => ({
      ...mensaje,
      _id: mensaje.id,
      emisorId: mensaje.emisor_id,
      receptorId: mensaje.receptor_id,
      solicitudId: mensaje.solicitud_id,
      fechaCreacion: mensaje.fecha_creacion
    }))

    return NextResponse.json(mensajes)
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