import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// Verificar que las variables de entorno estén cargadas
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET)

export async function GET(request) {
  try {
    // Verificar el token de autenticación
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    console.log('Token recibido:', token ? 'Token presente' : 'Token ausente')
    
    if (!token) {
      console.error('Token no proporcionado o formato inválido')
      return NextResponse.json(
        { error: 'Token no proporcionado o formato inválido' },
        { status: 401 }
      )
    }

    const decodedToken = verifyToken(token)
    
    if (!decodedToken) {
      console.error('Token inválido o expirado')
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    if (decodedToken.role !== 'admin') {
      console.error('Usuario no tiene permisos de administrador')
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      )
    }

    // Obtener todos los profesionales de Supabase
    // Modificado para asegurar que se obtengan todos los profesionales independientemente del estado
    const { data: professionals, error } = await supabaseAdmin
      .from('trabajadores')
      .select('*')
      .order('created_at', { ascending: false }) // Ordenar por fecha de creación, más recientes primero
    
    if (error) {
      console.error('Error fetching professionals:', error)
      return NextResponse.json(
        { error: 'Error al cargar los profesionales' },
        { status: 500 }
      )
    }
    
    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    // Asegurarse de que el campo status esté definido
    const formattedProfessionals = professionals.map(prof => ({
      ...prof,
      _id: prof.id,
      firstName: prof.first_name,
      lastName: prof.last_name,
      hourlyRate: prof.hourly_rate,
      displayName: prof.display_name,
      status: prof.status || 'pending' // Asegurarse de que el estado esté definido
    }))

    // Agregar logs para depuración
    console.log('Total de profesionales:', formattedProfessionals.length)
    console.log('Profesionales pendientes:', formattedProfessionals.filter(p => p.status === 'pending').length)
    console.log('Profesionales aprobados:', formattedProfessionals.filter(p => p.status === 'approved').length)

    return NextResponse.json(formattedProfessionals)
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { error: 'Error al cargar los profesionales' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}