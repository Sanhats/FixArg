'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'

export default function NotificationsBell() {
  const { isLoggedIn, getToken } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn || !open) return
    const token = getToken()
    if (!token) return
    setLoading(true)
    fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [isLoggedIn, open, getToken])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (id) => {
    const token = getToken()
    if (!token) return
    const notif = notifications.find((n) => n.id === id)
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    if (notif?.relatedId) {
      router.push(`/solicitudes/${notif.relatedId}`)
    }
    setOpen(false)
  }

  if (!isLoggedIn) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full border bg-background hover:bg-muted"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'absolute right-0 top-full z-50 mt-2 w-80 max-h-[70vh] overflow-auto',
              'rounded-md border bg-white py-1 shadow-lg text-gray-900'
            )}
          >
            <div className="px-3 py-2 border-b">
              <p className="font-medium text-sm text-gray-900">Notificaciones</p>
            </div>
            {loading ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Cargando...</p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">No hay notificaciones</p>
            ) : (
              <ul className="py-1">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-gray-100',
                        !n.read && 'bg-blue-50'
                      )}
                      onClick={() => markAsRead(n.id)}
                    >
                      <p className="font-medium text-gray-900">{n.title}</p>
                      {n.message && (
                        <p className="text-muted-foreground truncate">{n.message}</p>
                      )}
                      {n.relatedId && (
                        <p className="text-xs text-blue-600 mt-0.5">Ver solicitud →</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
