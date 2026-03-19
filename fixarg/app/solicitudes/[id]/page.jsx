'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Chat from '@/components/chat'
import { Badge } from '@/components/ui/badge'

export default function SolicitudDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id
  const { user, getToken, isLoggedIn, isLoading } = useAuth()
  const [solicitud, setSolicitud] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewSent, setReviewSent] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [presupuestoForm, setPresupuestoForm] = useState({ monto: '', mensaje: '', duracionEstimada: '' })
  const [presupuestoEnviando, setPresupuestoEnviando] = useState(false)

  const fetchSolicitud = async () => {
    if (!id || !getToken()) return
    try {
      const token = getToken()
      const response = await fetch(`/api/solicitudes/${id}?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Error al cargar la solicitud')
      }
      const data = await response.json()
      setSolicitud(data)
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
    if (!id || !isLoggedIn) return
    fetchSolicitud()
  }, [id, isLoggedIn, isLoading, router, getToken])

  useEffect(() => {
    if (!id || !isLoggedIn || !solicitud) return
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') fetchSolicitud()
    }
    const interval = setInterval(tick, 5000)
    return () => clearInterval(interval)
  }, [id, isLoggedIn, solicitud?._id])

  const callAction = async (action) => {
    try {
      const token = getToken()
      const response = await fetch(`/api/trabajador/solicitudes/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error')
      setSolicitud((prev) => ({ ...prev, estado: data.solicitud?.estado ?? getNextEstado(action) }))
    } catch (err) {
      setError(err.message)
    }
  }

  function getNextEstado(action) {
    if (action === 'accept') return 'confirmada'
    if (action === 'reject') return 'rechazada'
    if (action === 'start') return 'en_progreso'
    if (action === 'complete') return 'completada'
    if (action === 'cancel') return isWorker ? 'cancelada_por_trabajador' : 'cancelada_por_cliente'
    return solicitud?.estado
  }

  const callCancelAsCliente = async () => {
    try {
      const token = getToken()
      const response = await fetch(`/api/solicitudes/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error')
      setSolicitud((prev) => ({ ...prev, estado: 'cancelada_por_cliente' }))
    } catch (err) {
      setError(err.message)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!solicitud?.trabajador?.id) return
    try {
      const token = getToken()
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solicitudId: id,
          workerId: solicitud.trabajador.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al enviar la reseña')
      setReviewSent(true)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[40vh]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (error || !solicitud) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error || 'Solicitud no encontrada'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/servicios">Volver a servicios</Link>
            </Button>
            {user?.role === 'trabajador' && (
              <Button asChild variant="outline" className="ml-2">
                <Link href="/trabajador/dashboard">Ir al panel</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const isWorker = user?.role === 'trabajador' || solicitud.trabajadorId === user?._id
  const isCliente = !isWorker
  const currentUserId = user?._id
  const otherParticipantId = isWorker ? solicitud.usuarioId : solicitud.trabajadorId

  const estadoLabels = {
    pendiente: 'Pendiente',
    pendiente_presupuestos: 'Esperando presupuestos',
    confirmada: 'Confirmada',
    rechazada: 'Rechazada',
    en_progreso: 'En progreso',
    completada: 'Completada',
    cancelada_por_trabajador: 'Cancelada por el profesional',
    cancelada_por_cliente: 'Cancelada por el cliente',
  }

  const callApprovePresupuesto = async (presupuestoId) => {
    try {
      const token = getToken()
      const response = await fetch(`/api/solicitudes/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_presupuesto', presupuestoId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error')
      setSolicitud((prev) => {
        const approved = (prev.presupuestos || []).find(p => p.id === presupuestoId)
        return {
          ...prev,
          estado: 'confirmada',
          trabajadorId: approved?.trabajadorId ?? prev.trabajadorId,
          trabajador: approved?.trabajador ? {
            id: approved.trabajador.id,
            firstName: approved.trabajador.firstName,
            lastName: approved.trabajador.lastName,
            displayName: approved.trabajador.displayName,
            occupation: approved.trabajador.occupation,
            hourlyRate: approved.trabajador.averageRating,
          } : prev.trabajador,
          presupuestos: (prev.presupuestos || []).map(p => ({
            ...p,
            estado: p.id === presupuestoId ? 'aprobado' : 'rechazado',
          })),
        }
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const estadoVariant = {
    pendiente: 'secondary',
    pendiente_presupuestos: 'outline',
    confirmada: 'default',
    en_progreso: 'default',
    completada: 'secondary',
    rechazada: 'destructive',
    cancelada_por_trabajador: 'outline',
    cancelada_por_cliente: 'outline',
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={isWorker ? '/trabajador/dashboard' : '/servicios'}>← Volver</Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Estado actual</span>
          <Badge variant={estadoVariant[solicitud.estado] || 'secondary'} className="text-sm">
            {estadoLabels[solicitud.estado] || solicitud.estado}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">Se actualiza automáticamente</span>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detalle de la solicitud</CardTitle>
          <CardDescription>Descripción completa de lo que se solicita</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
            <p className="whitespace-pre-wrap">{solicitud.descripcion || '—'}</p>
          </div>
          <p><strong>Fecha:</strong> {solicitud.fecha} · <strong>Hora:</strong> {solicitud.hora}</p>
          {solicitud.direccion && (
            <p><strong>Dirección del servicio:</strong> {solicitud.direccion}</p>
          )}
          {solicitud.ubicacionLat != null && solicitud.ubicacionLng != null && (
            <p>
              <a
                href={`https://www.google.com/maps?q=${solicitud.ubicacionLat},${solicitud.ubicacionLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#71816D] underline hover:no-underline"
              >
                Ver ubicación en el mapa →
              </a>
            </p>
          )}
          {solicitud.duracionEstimada && (
            <p><strong>Duración estimada:</strong> {solicitud.duracionEstimada}</p>
          )}
          {solicitud.fotos?.length > 0 && (
            <div>
              <p className="font-medium mb-1">Fotos adjuntas:</p>
              <div className="flex flex-wrap gap-2">
                {solicitud.fotos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={url} alt={`Adjunto ${i + 1}`} className="h-20 w-20 object-cover rounded border" />
                  </a>
                ))}
              </div>
            </div>
          )}
          {solicitud.usuario && (
            <p><strong>Cliente:</strong> {solicitud.usuario.firstName} {solicitud.usuario.lastName}</p>
          )}
          {solicitud.trabajador && (
            <p><strong>Profesional:</strong> {solicitud.trabajador.displayName || `${solicitud.trabajador.firstName} ${solicitud.trabajador.lastName}`}</p>
          )}
          {solicitud.servicioRubro && (
            <p><strong>Servicio:</strong> {solicitud.servicioRubro}</p>
          )}
        </CardContent>
      </Card>

      {isCliente && solicitud.estado === 'pendiente_presupuestos' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Presupuestos recibidos</CardTitle>
            <CardDescription>
              {solicitud.presupuestos?.length
                ? 'Elige un presupuesto para confirmar al profesional. El resto será notificado de que no fueron elegidos.'
                : 'Los profesionales del rubro te enviarán presupuestos. Revisa esta página para verlos.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {solicitud.presupuestos?.length > 0 ? (
              solicitud.presupuestos.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {p.trabajador?.displayName || [p.trabajador?.firstName, p.trabajador?.lastName].filter(Boolean).join(' ') || 'Profesional'}
                    </p>
                    <p className="text-2xl font-bold text-[#71816D]">${Number(p.monto)}</p>
                    {p.duracionEstimada && <p className="text-sm text-muted-foreground">Duración estimada: {p.duracionEstimada}</p>}
                    {p.mensaje && <p className="text-sm text-muted-foreground mt-1">{p.mensaje}</p>}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={p.estado !== 'enviado'}>
                        {p.estado === 'aprobado' ? 'Aprobado' : p.estado === 'rechazado' ? 'No elegido' : 'Aprobar este presupuesto'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Aprobar este presupuesto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Confirmarás a este profesional para el trabajo. Los demás serán notificados de que no fueron elegidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => callApprovePresupuesto(p.id)}>Aprobar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay presupuestos. Volvé a revisar en unos minutos.</p>
            )}
          </CardContent>
        </Card>
      )}

      {isWorker && !solicitud.trabajadorId && solicitud.estado === 'pendiente_presupuestos' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enviar presupuesto</CardTitle>
            <CardDescription>
              Esta solicitud está en tu rubro. Enviá tu monto, duración estimada y opcionalmente un mensaje para que el cliente pueda elegirte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const miPresupuesto = (solicitud.presupuestos || []).find(p => p.trabajadorId === user?._id)
              if (miPresupuesto) {
                return (
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Tu presupuesto: ${Number(miPresupuesto.monto)}</p>
                    {miPresupuesto.duracionEstimada && <p className="text-sm text-muted-foreground">Duración estimada: {miPresupuesto.duracionEstimada}</p>}
                    {miPresupuesto.mensaje && <p className="text-sm text-muted-foreground mt-1">{miPresupuesto.mensaje}</p>}
                    <p className="text-sm mt-2">
                      Estado: <span className={miPresupuesto.estado === 'aprobado' ? 'text-green-600' : miPresupuesto.estado === 'rechazado' ? 'text-amber-600' : ''}>
                        {miPresupuesto.estado === 'enviado' ? 'Enviado (esperando respuesta del cliente)' : miPresupuesto.estado === 'aprobado' ? 'Aprobado' : 'No elegido'}
                      </span>
                    </p>
                  </div>
                )
              }
              return (
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!presupuestoForm.monto || Number(presupuestoForm.monto) < 0) return
                    setPresupuestoEnviando(true)
                    setError(null)
                    try {
                      const token = getToken()
                      const res = await fetch('/api/presupuestos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                        solicitudId: id,
                        monto: Number(presupuestoForm.monto),
                        mensaje: presupuestoForm.mensaje?.trim() || undefined,
                        duracionEstimada: presupuestoForm.duracionEstimada?.trim() || undefined,
                      }),
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error || 'Error al enviar presupuesto')
                      const solRes = await fetch(`/api/solicitudes/${id}?_=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
                      const solData = await solRes.json()
                      setSolicitud(solData)
                      setPresupuestoForm({ monto: '', mensaje: '', duracionEstimada: '' })
                    } catch (err) {
                      setError(err.message)
                    } finally {
                      setPresupuestoEnviando(false)
                    }
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">Monto ($)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={presupuestoForm.monto}
                      onChange={(e) => setPresupuestoForm((p) => ({ ...p, monto: e.target.value }))}
                      placeholder="Ej: 5000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duración estimada (opcional)</label>
                    <Input
                      type="text"
                      value={presupuestoForm.duracionEstimada}
                      onChange={(e) => setPresupuestoForm((p) => ({ ...p, duracionEstimada: e.target.value }))}
                      placeholder="Ej: 2 horas, medio día"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mensaje (opcional)</label>
                    <Textarea
                      value={presupuestoForm.mensaje}
                      onChange={(e) => setPresupuestoForm((p) => ({ ...p, mensaje: e.target.value }))}
                      placeholder="Breve descripción de tu propuesta..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={presupuestoEnviando}>
                    {presupuestoEnviando ? 'Enviando...' : 'Enviar presupuesto'}
                  </Button>
                </form>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {isWorker && solicitud.trabajadorId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            {solicitud.estado === 'pendiente' && solicitud.respondedByDeadline && (
              <CardDescription>
                Responde antes de:{' '}
                {new Date(solicitud.respondedByDeadline).toLocaleString('es-AR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
                {new Date(solicitud.respondedByDeadline) < new Date() && (
                  <span className="block text-amber-600 font-medium mt-1">Plazo vencido (24 h)</span>
                )}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {solicitud.estado === 'pendiente' && (
              <>
                {(() => {
                  const plazoVencido = solicitud.respondedByDeadline && new Date(solicitud.respondedByDeadline) < new Date()
                  return (
                    <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={plazoVencido}>Aceptar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Aceptar esta solicitud?</AlertDialogTitle>
                      <AlertDialogDescription>Confirmarás el trabajo.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => callAction('accept')}>Aceptar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={plazoVencido}>Cancelar solicitud</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
                      <AlertDialogDescription>El cliente será notificado. Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No</AlertDialogCancel>
                      <AlertDialogAction onClick={() => callAction('cancel')}>Sí, cancelar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                    </>
                  )
                })()}
              </>
            )}
            {solicitud.estado === 'confirmada' && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>Iniciar trabajo</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Marcar como iniciado?</AlertDialogTitle>
                      <AlertDialogDescription>Indicarás que llegaste y comenzaste.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => callAction('start')}>Iniciar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Cancelar solicitud</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
                      <AlertDialogDescription>El cliente será notificado. Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No</AlertDialogCancel>
                      <AlertDialogAction onClick={() => callAction('cancel')}>Sí, cancelar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {solicitud.estado === 'en_progreso' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>Finalizar trabajo</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Marcar como finalizado?</AlertDialogTitle>
                    <AlertDialogDescription>El cliente podrá calificarte.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => callAction('complete')}>Finalizar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {solicitud.estado === 'completada' && (
              <Button variant="outline" onClick={() => alert('Próximamente: aquí se mostrará el comprobante.')}>
                Mostrar comprobante
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {solicitud.estado === 'completada' && isCliente && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => alert('Próximamente: aquí se mostrará el comprobante.')}>
              Mostrar comprobante
            </Button>
          </CardContent>
        </Card>
      )}

      {isCliente && (solicitud.estado === 'pendiente' || solicitud.estado === 'pendiente_presupuestos' || solicitud.estado === 'confirmada') && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Cancelar solicitud</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
                  <AlertDialogDescription>El profesional será notificado. Esta acción no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No</AlertDialogCancel>
                  <AlertDialogAction onClick={callCancelAsCliente}>Sí, cancelar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chat</CardTitle>
          <CardDescription>
            {!solicitud.trabajadorId
              ? 'Aprobá un presupuesto para habilitar el chat con el profesional.'
              : solicitud.estado === 'completada'
                ? 'Mensajes de esta solicitud (conversación cerrada)'
                : 'Mensajes sobre esta solicitud'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {solicitud.trabajadorId ? (
            <Chat
              solicitudId={id}
              trabajadorId={solicitud.trabajadorId}
              currentUserId={currentUserId}
              receptorId={otherParticipantId}
              readOnly={solicitud.estado === 'completada'}
            />
          ) : (
            <p className="text-sm text-muted-foreground">El chat estará disponible cuando elijas un profesional.</p>
          )}
        </CardContent>
      </Card>

      {isCliente && solicitud.estado === 'completada' && solicitud.trabajador?.id && (
        <Card>
          <CardHeader>
            <CardTitle>Calificar al profesional</CardTitle>
            <CardDescription>Una vez por solicitud</CardDescription>
          </CardHeader>
          <CardContent>
            {reviewSent ? (
              <p className="text-green-600 font-medium">Gracias, tu reseña fue enviada.</p>
            ) : (
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Puntuación (1-5)</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                    className="border rounded px-3 py-2 w-full max-w-[120px]"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Comentario (opcional)</label>
                  <Textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Comentario..."
                    rows={3}
                    className="w-full"
                  />
                </div>
                <Button type="submit">Enviar reseña</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
