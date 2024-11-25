import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request) {
  const { email, password } = await request.json()

  try {
    // Verificar si el trabajador existe y está aprobado
    const trabajador = await prisma.trabajador.findUnique({
      where: { email, estado: 'APROBADO' }
    })

    if (!trabajador) {
      return NextResponse.json({ error: 'Trabajador no encontrado o no aprobado' }, { status: 404 })
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Actualizar el trabajador con la nueva contraseña
    await prisma.trabajador.update({
      where: { id: trabajador.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ message: 'Contraseña creada exitosamente' })
  } catch (error) {
    console.error('Error al crear la contraseña:', error)
    return NextResponse.json({ error: 'Error al crear la contraseña' }, { status: 500 })
  }
}

