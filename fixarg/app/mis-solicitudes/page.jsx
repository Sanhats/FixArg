'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MessageSquare } from 'lucide-react'

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  pendiente_presupuestos: 'Esperando presupuestos',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  en_progreso: 'En progreso',
  completada: 'Completada',
  cancelada_por_trabajador: 'Cancelada por el profesional',
  cancelada_por_cliente: 'Cancelada por ti',
}

const ESTADO_VARIANT = {
  pendiente: 'secondary',
  pendiente_presupuestos: 'secondary',
  confirmada: 'default',
  rechazada: 'destructive',
  en_progreso: 'default',
  completada: 'outline',
  cancelada_por_trabajador: 'secondary',
  cancelada_por_cliente: 'secondary',
}

export default function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, getToken, isLoggedIn, isLoading, logout, isCliente, isTrabajador } = useAuth()
  const router = useRouter()

  const fetchSolicitudes = async () => {
    if (!getToken()) return
    try {
      const token = getToken()
      const response = await fetch(`/api/solicitudes?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Error al cargar tus solicitudes')
      const data = await response.json()
      setSolicitudes(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/')
      return
    }
    if (!isLoggedIn) return
    fetchSolicitudes()
  }, [isLoggedIn, isLoading, router, getToken])

  useEffect(() => {
    if (!isLoggedIn || !getToken()) return
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') fetchSolicitudes()
    }
    const interval = setInterval(tick, 8000)
    return () => clearInterval(interval)
  }, [isLoggedIn, getToken])

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
    }
  }

  const nombreProfesional = (s) => {
    const t = s?.trabajador
    if (!t) return s?.servicioRubro ? `Servicio: ${s.servicioRubro}` : 'Profesional'
    const nombreCompleto = [t.firstName, t.lastName].filter(Boolean).join(' ')
    if (nombreCompleto) return nombreCompleto
    const display = t.displayName?.trim()
    if (display && !/^\d{6,}$/.test(display.replace(/\s/g, ''))) return display
    return 'Profesional'
  }

  const enCurso = solicitudes.filter(
    (s) => s.estado === 'pendiente' || s.estado === 'pendiente_presupuestos' || s.estado === 'confirmada' || s.estado === 'en_progreso'
  )
  const finalizadas = solicitudes.filter(
    (s) =>
      s.estado === 'completada' ||
      s.estado === 'rechazada' ||
      s.estado === 'cancelada_por_trabajador' ||
      s.estado === 'cancelada_por_cliente'
  )

  const SolicitudCard = ({ s }) => (
    <Card key={s._id} className="border border-[#F5F5F5] hover:border-[#71816D]/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado actual</span>
          <Badge variant={ESTADO_VARIANT[s.estado] || 'secondary'} className="text-sm">
            {ESTADO_LABELS[s.estado] || s.estado}
          </Badge>
        </div>
        <CardTitle className="text-lg">
          {nombreProfesional(s)} · {s.fecha} {s.hora}
        </CardTitle>
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Descripción completa</p>
          <p className="text-sm whitespace-pre-wrap">{s.descripcion || '—'}</p>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <p className="text-xs text-muted-foreground">Creada: {formatDate(s.fechaCreacion)}</p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild className="bg-[#71816D] hover:bg-[#71816D]/90 text-white">
          <Link href={`/solicitudes/${s._id}`} className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Ver detalle y conversación
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#E8E8E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#324376]" />
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#E8E8E8] space-y-4">
        <h2 className="text-2xl font-semibold text-[#091E05]">Acceso restringido</h2>
        <p className="text-[#71816D]">Debes iniciar sesión para ver tus solicitudes.</p>
        <Button onClick={() => router.push('/')} className="bg-[#324376] hover:bg-[#324376]/90 text-white">
          Ir al inicio
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-[#71816D] z-50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              className="text-white flex items-center gap-2"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex items-center gap-4">
              {isTrabajador && (
                <Button variant="ghost" className="text-white" onClick={() => router.push('/trabajador/dashboard')}>
                  Mi panel
                </Button>
              )}
              {isCliente && (
                <Button variant="ghost" className="text-white" onClick={() => router.push('/servicios')}>
                  Servicios
                </Button>
              )}
              <span className="text-white">Hola, {user?.firstName}{isTrabajador && <span className="opacity-90 text-sm"> (profesional)</span>}</span>
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white hover:bg-white/20" onClick={logout}>
                Cerrar sesión
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-[#091E05] mb-2">Mis solicitudes</h1>
            <p className="text-[#71816D]">
              Aquí ves el estado de cada solicitud y la descripción completa. La lista se actualiza automáticamente cada pocos segundos.
            </p>
          </header>

          {loading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : error ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-500">Error</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              </CardFooter>
            </Card>
          ) : solicitudes.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Sin solicitudes</CardTitle>
                <CardDescription>
                  Aún no has enviado ninguna solicitud. Entra en Servicios para contactar a un profesional.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild className="bg-[#71816D] hover:bg-[#71816D]/90 text-white">
                  <Link href="/servicios">Ver servicios</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-12">
              {enCurso.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-[#091E05] mb-1">En curso</h2>
                  <p className="text-sm text-[#71816D] mb-6">
                    Solicitudes pendientes, confirmadas o en progreso.
                  </p>
                  <div className="space-y-4">
                    {enCurso.map((s) => (
                      <SolicitudCard key={s._id} s={s} />
                    ))}
                  </div>
                </section>
              )}

              {finalizadas.length > 0 && (
                <section className="pt-4 border-t border-[#E8E8E8]">
                  <h2 className="text-xl font-semibold text-[#091E05] mb-1">Completadas e historial</h2>
                  <p className="text-sm text-[#71816D] mb-6">
                    Trabajos finalizados, rechazados o cancelados.
                  </p>
                  <div className="space-y-4">
                    {finalizadas.map((s) => (
                      <SolicitudCard key={s._id} s={s} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
