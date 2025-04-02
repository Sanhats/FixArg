import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Error de configuración: Variables de entorno de Supabase no definidas')
}

// Cliente de Supabase con la clave de servicio para operaciones del lado del servidor
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Cliente de Supabase para el lado del cliente
export const createSupabaseClient = (supabaseAccessToken) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAccessToken}`
        }
      }
    }
  )
}

// Funciones para usuarios
export async function insertUser(userData) {
  try {
    console.log('Attempting to insert user:', userData)
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .insert([
        {
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          hashed_password: userData.password // Ya debe venir hasheado
        }
      ])
      .select()

    if (error) throw error
    console.log('User inserted successfully:', data[0].id)
    return { insertedId: data[0].id }
  } catch (error) {
    console.error('Failed to insert user:', error)
    throw error
  }
}

export async function findUserByEmail(email) {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 es el código para "no se encontraron registros"

    console.log('User found:', data)
    return data
  } catch (error) {
    console.error('Failed to find user:', error)
    throw error
  }
}

// Funciones para trabajadores/profesionales
export async function insertTasker(taskerData) {
  try {
    console.log('Attempting to insert tasker:', taskerData)
    const { data, error } = await supabaseAdmin
      .from('trabajadores')
      .insert([
        {
          email: taskerData.email,
          first_name: taskerData.firstName,
          last_name: taskerData.lastName,
          occupation: taskerData.occupation,
          hourly_rate: taskerData.hourlyRate,
          description: taskerData.description,
          phone: taskerData.phone,
          display_name: taskerData.displayName,
          status: taskerData.status || 'pending',
          hashed_password: taskerData.password // Ya debe venir hasheado
        }
      ])
      .select()

    if (error) throw error
    console.log('Tasker inserted successfully:', data[0].id)
    return { insertedId: data[0].id }
  } catch (error) {
    console.error('Failed to insert tasker:', error)
    throw error
  }
}

export async function findWorkerByEmail(email) {
  try {
    const { data, error } = await supabaseAdmin
      .from('trabajadores')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    console.log('Worker found:', data)
    return data
  } catch (error) {
    console.error('Failed to find worker:', error)
    throw error
  }
}

// Funciones para solicitudes de trabajo
export async function insertSolicitud(solicitudData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('solicitudes')
      .insert([
        {
          descripcion: solicitudData.descripcion,
          fecha: solicitudData.fecha,
          hora: solicitudData.hora,
          trabajador_id: solicitudData.trabajadorId,
          usuario_id: solicitudData.usuarioId,
          estado: solicitudData.estado || 'pendiente',
          fecha_creacion: new Date().toISOString()
        }
      ])
      .select()

    if (error) throw error
    return { insertedId: data[0].id }
  } catch (error) {
    console.error('Failed to insert solicitud:', error)
    throw error
  }
}

// Funciones para reviews/valoraciones
export async function insertReview(reviewData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert([
        {
          trabajador_id: reviewData.workerId,
          usuario_id: reviewData.userId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) throw error

    // Actualizar el promedio de calificaciones del trabajador
    await updateWorkerRating(reviewData.workerId)

    return { insertedId: data[0].id }
  } catch (error) {
    console.error('Failed to insert review:', error)
    throw error
  }
}

async function updateWorkerRating(workerId) {
  try {
    // Obtener todas las reviews del trabajador
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('trabajador_id', workerId)

    if (reviewsError) throw reviewsError

    // Calcular el promedio
    const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length

    // Actualizar el trabajador
    const { error: updateError } = await supabaseAdmin
      .from('trabajadores')
      .update({ average_rating: averageRating })
      .eq('id', workerId)

    if (updateError) throw updateError
  } catch (error) {
    console.error('Failed to update worker rating:', error)
    throw error
  }
}

// Funciones para mensajes
export async function insertMensaje(mensajeData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('mensajes')
      .insert([
        {
          contenido: mensajeData.contenido,
          emisor_id: mensajeData.emisorId,
          receptor_id: mensajeData.receptorId,
          solicitud_id: mensajeData.solicitudId,
          fecha_creacion: new Date().toISOString()
        }
      ])
      .select()

    if (error) throw error
    return { insertedId: data[0].id, mensaje: data[0] }
  } catch (error) {
    console.error('Failed to insert mensaje:', error)
    throw error
  }
}

export default supabaseAdmin