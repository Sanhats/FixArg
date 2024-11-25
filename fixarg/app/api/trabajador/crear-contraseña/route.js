import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcrypt'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    const { db } = await connectToDatabase()
    
    // Verificar si el trabajador existe y está aprobado
    const trabajador = await db.collection('trabajadores').findOne({
      email,
      status: 'approved'
    })

    if (!trabajador) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado o no aprobado' },
        { status: 404 }
      )
    }

    // Verificar si ya tiene contraseña
    if (trabajador.password) {
      return NextResponse.json(
        { error: 'Ya tienes una contraseña establecida' },
        { status: 400 }
      )
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Actualizar el trabajador con la nueva contraseña
    await db.collection('trabajadores').updateOne(
      { _id: trabajador._id },
      { 
        $set: { 
          password: hashedPassword,
          passwordCreatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ 
      message: 'Contraseña creada exitosamente',
      success: true
    })
  } catch (error) {
    console.error('Error al crear la contraseña:', error)
    return NextResponse.json(
      { error: 'Error al crear la contraseña' },
      { status: 500 }
    )
  }
}

