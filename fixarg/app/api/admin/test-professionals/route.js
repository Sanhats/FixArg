import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

export async function GET(request) {
  try {
    // Obtener todos los profesionales de Supabase sin filtrar por estado
    const { data: professionals, error } = await supabaseAdmin
      .from('trabajadores')
      .select('*')
    
    if (error) {
      console.error('Error fetching professionals:', error)
      return NextResponse.json(
        { error: 'Error al cargar los profesionales' },
        { status: 500 }
      )
    }
    
    // Transformar la respuesta para mantener compatibilidad con el formato anterior
    const formattedProfessionals = professionals.map(prof => ({
      ...prof,
      _id: prof.id,
      firstName: prof.first_name,
      lastName: prof.last_name,
      hourlyRate: prof.hourly_rate,
      displayName: prof.display_name,
      status: prof.status || 'pending' // Asegurarse de que el estado esté definido
    }))

    return NextResponse.json({
      professionals: formattedProfessionals,
      count: formattedProfessionals.length,
      pendingCount: formattedProfessionals.filter(p => p.status === 'pending').length,
      approvedCount: formattedProfessionals.filter(p => p.status === 'approved').length
    })
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { error: 'Error al cargar los profesionales' },
      { status: 500 }
    )
  }
}