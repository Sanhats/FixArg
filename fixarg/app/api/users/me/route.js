import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function toUserPayload(row) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    street: row.street,
    streetNumber: row.street_number,
    province: row.province,
    locality: row.locality,
    role: 'user',
    puntos: row.puntos != null ? Number(row.puntos) : 0,
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'user') {
      return NextResponse.json({ error: 'Solo disponible para clientes' }, { status: 403 })
    }

    const { data: row, error } = await supabaseAdmin
      .from('usuarios')
      .select(
        'id, email, first_name, last_name, phone, street, street_number, province, locality, puntos'
      )
      .eq('id', decoded.userId)
      .single()

    if (error || !row) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user: toUserPayload(row) })
  } catch (e) {
    console.error('GET /api/users/me', e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'user') {
      return NextResponse.json({ error: 'Solo disponible para clientes' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const patch = {}

    if (body.firstName != null) patch.first_name = String(body.firstName).trim()
    if (body.lastName != null) patch.last_name = String(body.lastName).trim()
    if (body.phone != null) patch.phone = String(body.phone).trim()
    if (body.street != null) patch.street = String(body.street).trim()
    if (body.streetNumber != null) patch.street_number = String(body.streetNumber).trim()
    if (body.province != null) patch.province = String(body.province).trim()
    if (body.locality != null) patch.locality = String(body.locality).trim()
    if (body.expoPushToken != null) {
      const t = String(body.expoPushToken).trim()
      patch.expo_push_token = t || null
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const { data: row, error } = await supabaseAdmin
      .from('usuarios')
      .update(patch)
      .eq('id', decoded.userId)
      .select(
        'id, email, first_name, last_name, phone, street, street_number, province, locality, puntos'
      )
      .single()

    if (error) {
      console.error('PATCH /api/users/me', error)
      if (String(error.message || '').includes('expo_push_token') || error.code === '42703') {
        return NextResponse.json(
          {
            error:
              'Falta la columna expo_push_token. Ejecutá scripts/migrations/add_expo_push_token_usuarios.sql en Supabase.',
          },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: 'No se pudo actualizar el perfil' }, { status: 500 })
    }

    return NextResponse.json({ user: toUserPayload(row) })
  } catch (e) {
    console.error('PATCH /api/users/me', e)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
