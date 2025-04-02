import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
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
    const trabajadores = data.map(trabajador => ({
      _id: trabajador.id,
      firstName: trabajador.first_name,
      lastName: trabajador.last_name,
      email: trabajador.email,
      occupation: trabajador.occupation,
      hourlyRate: trabajador.hourly_rate,
      description: trabajador.description,
      phone: trabajador.phone,
      displayName: trabajador.display_name,
      averageRating: trabajador.average_rating,
      status: trabajador.status
    }))

    return NextResponse.json(trabajadores)
  } catch (error) {
    console.error('Error al obtener trabajadores:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}