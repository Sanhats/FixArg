import supabaseAdmin from '@/lib/supabase'

/**
 * Create a notification.
 * @param {object} params
 * @param {'usuario'|'trabajador'} params.user_type
 * @param {string} params.user_id - usuarios.id or trabajadores.id
 * @param {string} params.type - new_request, request_accepted, request_rejected, work_started, work_completed, new_message
 * @param {string} params.title
 * @param {string} [params.message]
 * @param {string} [params.related_id] - solicitud id or similar
 */
export async function createNotification({ user_type, user_id, type, title, message, related_id }) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .insert([
      {
        user_type,
        user_id,
        type,
        title,
        message: message || null,
        related_id: related_id || null,
        read: false,
        created_at: new Date().toISOString(),
      },
    ])
  if (error) console.error('createNotification error:', error)
}
