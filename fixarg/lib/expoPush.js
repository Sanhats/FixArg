import supabaseAdmin from '@/lib/supabase'

/**
 * Envía notificación push vía Expo Push API (cliente con token en usuarios.expo_push_token).
 * No falla la app si falla el envío.
 */
export async function sendExpoPushToUsuario(userId, { title, body, data } = {}) {
  if (!userId || !title) return
  try {
    const { data: row } = await supabaseAdmin
      .from('usuarios')
      .select('expo_push_token')
      .eq('id', userId)
      .maybeSingle()
    const token = row?.expo_push_token
    if (!token || typeof token !== 'string') return

    const payload = {
      to: token,
      title: String(title).slice(0, 200),
      body: body ? String(body).slice(0, 500) : '',
      sound: 'default',
      priority: 'high',
    }
    if (data && typeof data === 'object') payload.data = data

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const t = await res.text()
      console.warn('Expo push send failed', res.status, t)
    }
  } catch (e) {
    console.warn('sendExpoPushToUsuario', e)
  }
}
