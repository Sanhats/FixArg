import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

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

    // Obtener trabajadores de Supabase
    const { data, error } = await supabaseAdmin
      .from('trabajadores')
      .select('*')
      .eq('status', 'approved')

    if (error) {
      console.error('Error al obtener trabajadores:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const trabajadoresMapped = data.map(t => ({
      _id: t.id,
      firstName: t.first_name,
      lastName: t.last_name,
      email: t.email,
      occupation: t.occupation,
      hourlyRate: t.hourly_rate,
      description: t.description,
      phone: t.phone,
      displayName: t.display_name,
      service: t.occupation // Añadir service basado en occupation
    }))

    console.log('Trabajadores encontrados:', JSON.stringify(trabajadoresMapped, null, 2))

    return NextResponse.json(trabajadoresMapped)
  } catch (error) {
    console.error('Error fetching trabajadores:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}