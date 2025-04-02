import bcrypt from 'bcryptjs'
import supabaseAdmin, { insertTasker } from '@/lib/supabase'

export async function POST(request) {
  try {
    // Parse the JSON body
    const body = await request.json()
    
    // Validate hourly rate
    if (body.hourlyRate !== undefined) {
      const hourlyRate = parseFloat(body.hourlyRate)
      if (isNaN(hourlyRate) || hourlyRate < 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid hourly rate. Must be a non-negative number.',
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
      body.hourlyRate = hourlyRate // Ensure it's stored as a number
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10)
    
    // Preparar los datos para Supabase
    const taskerData = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      occupation: body.occupation,
      hourlyRate: body.hourlyRate,
      description: body.description,
      displayName: body.displayName || `${body.firstName} ${body.lastName}`,
      password: hashedPassword,
      status: 'pending'
    }
    
    // Insertar el nuevo trabajador en Supabase
    const result = await insertTasker(taskerData)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application submitted successfully',
        id: result.insertedId
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Database Error:', error)
    let statusCode = 500
    let errorMessage = 'Error interno del servidor'

    if (error.code === 'ECONNRESET') {
      errorMessage = 'La conexión con la base de datos se interrumpió. Por favor, intente nuevamente.'
      // Intentar reconectar para futuros requests
      clientPromise = connectWithRetry()
    } else if (error.name === 'MongoServerSelectionError') {
      errorMessage = 'No se pudo conectar con la base de datos. Por favor, intente más tarde.'
    } else if (error.code === 11000) {
      statusCode = 409
      errorMessage = 'Ya existe un registro con estos datos.'
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'No se pudo procesar la solicitud',
        error: errorMessage
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}