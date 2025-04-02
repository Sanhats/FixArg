import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function DELETE(request, { params }) {
  try {
    // Verificar el token de autenticación
    const token = request.headers.get('Authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const decodedToken = verifyToken(token)
    
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = params

    // Eliminar el profesional en Supabase
    const { error, count } = await supabaseAdmin
      .from('trabajadores')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting professional:', error)
      return NextResponse.json(
        { error: 'Error al eliminar el profesional' },
        { status: 500 }
      )
    }

    if (count === 0) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Profesional eliminado con éxito' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting professional:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    // Verificar el token de autenticación
    const token = request.headers.get('Authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const decodedToken = verifyToken(token)
    
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = params

    // Obtener el nuevo estado del cuerpo de la solicitud
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Estado no proporcionado' },
        { status: 400 }
      )
    }

    const { data, error, count } = await supabaseAdmin
      .from('trabajadores')
      .update({ status })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating professional status:', error)
      return NextResponse.json(
        { error: 'Error al actualizar el estado del profesional' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Estado del profesional actualizado con éxito' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating professional status:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// Configurar los headers CORS para permitir DELETE y PATCH
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}
