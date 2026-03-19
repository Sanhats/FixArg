import bcrypt from 'bcryptjs'
import supabaseAdmin, { insertTasker } from '@/lib/supabase'
import { checkFakeAccount } from '@/lib/platform'

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Validar precio: puede venir en hourlyRate (único) o en skillsJson (por habilidad)
    let hourlyRate = 0
    if (body.hourlyRate !== undefined) {
      hourlyRate = parseFloat(body.hourlyRate)
      if (isNaN(hourlyRate) || hourlyRate < 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid hourly rate. Must be a non-negative number.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    let skillsJson = []
    if (Array.isArray(body.skillsJson) && body.skillsJson.length > 0) {
      skillsJson = body.skillsJson.map(s => ({
        skill: String(s.skill || s.name || '').trim(),
        hourlyRate: typeof s.hourlyRate === 'number' ? s.hourlyRate : parseFloat(s.hourlyRate) || 0,
      })).filter(s => s.skill)
      if (skillsJson.length > 0 && hourlyRate === 0) {
        hourlyRate = skillsJson[0].hourlyRate
      }
    }
    if (hourlyRate === 0 && (!skillsJson || skillsJson.length === 0)) {
      hourlyRate = parseFloat(body.hourlyRate) || 0
    }

    const antifraud = checkFakeAccount({ email: body.email })
    if (antifraud.risk === 'high') {
      console.warn('[Antifraude] Registro tasker rechazado:', body.email, antifraud.reasons)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo completar el registro. Si crees que es un error, contacta a soporte.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (antifraud.risk === 'medium' && antifraud.reasons?.length) {
      console.warn('[Antifraude] Registro tasker revisar:', body.email, antifraud.reasons)
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    const taskerData = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      occupation: body.occupation ?? (skillsJson[0]?.skill || null),
      hourlyRate,
      description: body.description,
      displayName: body.displayName || `${body.firstName} ${body.lastName}`,
      password: hashedPassword,
      status: 'pending',
    }
    if (body.documentAntecedentesUrl != null) taskerData.documentAntecedentesUrl = body.documentAntecedentesUrl
    if (body.dniFrenteUrl != null) taskerData.dniFrenteUrl = body.dniFrenteUrl
    if (body.dniReversoUrl != null) taskerData.dniReversoUrl = body.dniReversoUrl
    if (body.profilePhotoUrl != null) taskerData.profilePhotoUrl = body.profilePhotoUrl
    if (body.experience != null) taskerData.experience = body.experience
    if (body.tools != null) taskerData.tools = body.tools
    if (body.zones != null) taskerData.zones = body.zones
    if (body.availability != null) taskerData.availability = body.availability
    if (skillsJson.length > 0) taskerData.skillsJson = skillsJson
    
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

    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      // Error de duplicación en Supabase (violación de restricción única)
      statusCode = 409
      errorMessage = 'Ya existe un registro con estos datos.'
    } else if (error.code === 'PGRST301' || error.message?.includes('connection')) {
      // Error de conexión en Supabase
      errorMessage = 'La conexión con la base de datos se interrumpió. Por favor, intente nuevamente.'
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