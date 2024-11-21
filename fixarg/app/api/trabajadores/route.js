import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
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

    const { db } = await connectToDatabase()
    
    const trabajadores = await db.collection('trabajadores')
      .find({ status: 'approved' })
      .project({
        firstName: 1,
        lastName: 1,
        email: 1,
        service: 1,
        hourlyRate: 1,
        description: 1,
        phone: 1
      })
      .toArray()

    console.log('Trabajadores encontrados:', JSON.stringify(trabajadores, null, 2))

    return NextResponse.json(trabajadores)
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