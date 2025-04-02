import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function POST(request) {
  try {
    // Verificar el token de autorización
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
    console.log('Datos recibidos en API:', body) // Para debugging

    // Validar los campos requeridos y su formato
    const requiredFields = {
      descripcion: 'descripción',
      fecha: 'fecha',
      hora: 'hora',
      trabajadorId: 'trabajadorId',
      usuarioId: 'usuarioId'
    }

    const missingFields = []
    const invalidFields = []

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!body[field]) {
        missingFields.push(label)
        continue
      }

      // Validación específica para IDs
      if ((field === 'trabajadorId' || field === 'usuarioId') && !body[field].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        invalidFields.push(`${label} inválido`)
      }
    }

    if (missingFields.length > 0) {
      console.log('Campos faltantes:', missingFields)
      return NextResponse.json({ 
        error: 'Faltan datos requeridos', 
        missingFields 
      }, { status: 400 })
    }

    if (invalidFields.length > 0) {
      console.log('Campos inválidos:', invalidFields)
      return NextResponse.json({ 
        error: 'Formato inválido en algunos campos', 
        invalidFields 
      }, { status: 400 })
    }

    // Crear la solicitud en Supabase
    const { data, error } = await supabaseAdmin
      .from('solicitudes')
      .insert([
        {
          descripcion: body.descripcion,
          fecha: body.fecha,
          hora: body.hora,
          trabajador_id: body.trabajadorId,
          usuario_id: body.usuarioId,
          estado: 'pendiente',
          fecha_creacion: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error al crear solicitud en Supabase:', error)
      return NextResponse.json({ 
        error: 'Error al procesar la solicitud',
        details: error.message 
      }, { status: 500 })
    }

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const solicitud = {
      ...data[0],
      _id: data[0].id,
      trabajadorId: data[0].trabajador_id,
      usuarioId: data[0].usuario_id,
      fechaCreacion: data[0].fecha_creacion
    }

    return NextResponse.json({
      success: true,
      id: solicitud.id,
      solicitud
    })

  } catch (error) {
    console.error('Error al crear solicitud:', error)
    return NextResponse.json({ 
      error: 'Error al procesar la solicitud',
      details: error.message 
    }, { status: 500 })
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

    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId')
    const trabajadorId = searchParams.get('trabajadorId')

    let query = supabaseAdmin.from('solicitudes').select(`
      id,
      descripcion,
      fecha,
      hora,
      trabajador_id,
      usuario_id,
      estado,
      fecha_creacion
    `)

    if (usuarioId) {
      query = query.eq('usuario_id', usuarioId)
    } else if (trabajadorId) {
      query = query.eq('trabajador_id', trabajadorId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener solicitudes:', error)
      return NextResponse.json({ 
        error: 'Error al obtener las solicitudes',
        details: error.message 
      }, { status: 500 })
    }

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const solicitudes = data.map(solicitud => ({
      ...solicitud,
      _id: solicitud.id,
      trabajadorId: solicitud.trabajador_id,
      usuarioId: solicitud.usuario_id,
      fechaCreacion: solicitud.fecha_creacion
    }))

    return NextResponse.json(solicitudes)
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