'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Inbox, CheckCircle, Clock, History, Send } from 'lucide-react'

export default function TrabajadorDashboard() {
  const [solicitudes, setSolicitudes] = useState([])
  const [solicitudesDisponibles, setSolicitudesDisponibles] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [presupuestoDialog, setPresupuestoDialog] = useState(null)
  const [presupuestoForm, setPresupuestoForm] = useState({ monto: '', mensaje: '', duracionEstimada: '' })
  const [enviandoPresupuesto, setEnviandoPresupuesto] = useState(false)
  const { user, getToken, isLoggedIn, isLoading, logout } = useAuth()
  const router = useRouter()

  const updateSolicitudState = (solicitudId, updates) => {
    setSolicitudes(prev =>
      prev.map(sol => (sol._id === solicitudId ? { ...sol, ...updates } : sol))
    )
  }

  const callAction = async (solicitudId, action) => {
    try {
      const token = getToken()
      const response = await fetch(`/api/trabajador/solicitudes/${solicitudId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al actualizar')
      if (action === 'accept') updateSolicitudState(solicitudId, { estado: 'confirmada' })
      if (action === 'reject') updateSolicitudState(solicitudId, { estado: 'rechazada' })
      if (action === 'start') updateSolicitudState(solicitudId, { estado: 'en_progreso' })
      if (action === 'complete') updateSolicitudState(solicitudId, { estado: 'completada' })
      if (action === 'cancel') updateSolicitudState(solicitudId, { estado: 'cancelada_por_trabajador' })
    } catch (err) {
      console.error(err)
      setError(err.message)
    }
  }

  const fetchSolicitudes = async () => {
    if (!getToken()) return
    try {
      const token = getToken()
      const response = await fetch(`/api/trabajador/solicitudes?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Error al cargar las solicitudes')
      const data = await response.json()
      setSolicitudes(data.solicitudes || [])
      setSolicitudesDisponibles(data.solicitudesDisponibles || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/trabajador/login')
      return
    }
    if (isLoggedIn) fetchSolicitudes()
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

  const clienteNombre =
    (s) =>
    (s?.usuario?.firstName && s?.usuario?.lastName
      ? `${s.usuario.firstName} ${s.usuario.lastName}`
      : 'Cliente')

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-[#f8f9f7] to-[#eef0ec]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#71816D]/30 border-t-[#71816D]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9f7] to-[#eef0ec] flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl border-[#e5e7e3] shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => { setError(null); fetchSolicitudes() }} className="rounded-xl bg-[#71816D] hover:bg-[#71816D]/90">Intentar nuevamente</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const sendPresupuesto = async () => {
    if (!presupuestoDialog || !presupuestoForm.monto || Number(presupuestoForm.monto) < 0) return
    setEnviandoPresupuesto(true)
    setError(null)
    try {
      const token = getToken()
      const response = await fetch('/api/presupuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          solicitudId: presupuestoDialog._id,
          monto: Number(presupuestoForm.monto),
          mensaje: presupuestoForm.mensaje?.trim() || undefined,
          duracionEstimada: presupuestoForm.duracionEstimada?.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al enviar presupuesto')
      setSolicitudesDisponibles((prev) => prev.filter((s) => s._id !== presupuestoDialog._id))
      setPresupuestoDialog(null)
      setPresupuestoForm({ monto: '', mensaje: '', duracionEstimada: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviandoPresupuesto(false)
    }
  }

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente')
  const confirmadas = solicitudes.filter((s) => s.estado === 'confirmada')
  const enProgreso = solicitudes.filter((s) => s.estado === 'en_progreso')
  const historial = solicitudes.filter((s) =>
    s.estado === 'completada' || s.estado === 'rechazada' ||
    s.estado === 'cancelada_por_trabajador' || s.estado === 'cancelada_por_cliente'
  )

  const ESTADO_LABELS = {
    pendiente: 'Pendiente',
    pendiente_presupuestos: 'Esperando presupuestos',
    confirmada: 'Confirmada',
    en_progreso: 'En progreso',
    completada: 'Completada',
    rechazada: 'Rechazada',
    cancelada_por_trabajador: 'Cancelada por ti',
    cancelada_por_cliente: 'Cancelada por cliente',
  }
  const ESTADO_VARIANT = {
    pendiente: 'secondary',
    pendiente_presupuestos: 'outline',
    confirmada: 'default',
    en_progreso: 'default',
    completada: 'secondary',
    rechazada: 'destructive',
    cancelada_por_trabajador: 'outline',
    cancelada_por_cliente: 'outline',
  }

  const SolicitudCard = ({ solicitud, actions }) => (
    <Card key={solicitud._id} className="flex flex-col rounded-2xl border-[#e5e7e3] bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-[#71816D] uppercase tracking-wide">Estado actual</span>
          <Badge variant={ESTADO_VARIANT[solicitud.estado] || 'secondary'}>
            {ESTADO_LABELS[solicitud.estado] || solicitud.estado}
          </Badge>
        </div>
        <CardTitle className="text-base text-[#091E05]">Solicitud</CardTitle>
        <CardDescription className="text-[#71816D]">
          Cliente: {clienteNombre(solicitud)} · Fecha: {solicitud.fecha} {solicitud.hora}
        </CardDescription>
        <div className="mt-2">
          <p className="text-xs font-medium text-[#71816D] mb-1">Descripción completa</p>
          <p className="text-sm whitespace-pre-wrap text-[#091E05]">{solicitud.descripcion || '—'}</p>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p className="text-xs text-muted-foreground">Creada: {formatDate(solicitud.fechaCreacion)}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t border-[#e5e7e3] pt-4">
        <Button variant="outline" size="sm" className="rounded-xl border-[#e5e7e3]" asChild>
          <Link href={`/solicitudes/${solicitud._id}`}>Ver detalle</Link>
        </Button>
        {actions}
      </CardFooter>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9f7] to-[#eef0ec]">
      <header className="sticky top-0 z-50 border-b border-[#71816D]/20 bg-[#71816D]/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-14">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/15 gap-1.5">
              <Link href="/">Inicio</Link>
            </Button>
            <span className="text-white font-medium">Panel del profesional</span>
            <Button variant="secondary" size="sm" className="bg-white/20 text-white border-0 hover:bg-white/30" onClick={logout}>
              Salir
            </Button>
          </nav>
        </div>
      </header>
      <div className="container mx-auto p-4 py-6 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#091E05] mb-1">Hola, {user?.firstName} {user?.lastName}</h1>
          <p className="text-[#71816D] text-sm">
            Gestioná tus solicitudes. La lista se actualiza automáticamente.
          </p>
        </div>

        {pendientes.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <h2 className="font-semibold text-amber-800 mb-1">Nuevo trabajo disponible</h2>
            <p className="text-sm text-amber-700">
              Revisá la descripción y aceptá o rechazá desde el detalle. Respondé a tiempo para no perder la oportunidad.
            </p>
          </div>
        )}

        {solicitudesDisponibles.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Inbox className="h-5 w-5 text-[#71816D]" />
              <h2 className="text-lg font-semibold text-[#091E05]">Solicitudes en tu rubro</h2>
            </div>
            <p className="text-[#71816D] text-sm mb-4">
              Los clientes publicaron estas solicitudes. Enviá tu presupuesto para que puedan elegirte. Si ya enviaste uno, aparece indicado.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {solicitudesDisponibles.map((s) => (
                <Card key={s._id} className="flex flex-col rounded-2xl border-[#e5e7e3] bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-[#71816D] uppercase tracking-wide">Estado</span>
                      <Badge variant={s.yaEnvioPresupuesto ? 'secondary' : 'outline'}>
                        {s.yaEnvioPresupuesto ? 'Ya enviaste presupuesto' : 'Disponible para presupuestar'}
                      </Badge>
                    </div>
                    <CardTitle className="text-base text-[#091E05]">{s.servicioRubro || 'Solicitud'}</CardTitle>
                    <CardDescription className="text-[#71816D]">
                      Fecha: {s.fecha} {s.hora} · Cliente en la solicitud
                    </CardDescription>
                    <div className="mt-2">
                      <p className="text-xs font-medium text-[#71816D] mb-1">Descripción completa</p>
                      <p className="text-sm whitespace-pre-wrap text-[#091E05]">{s.descripcion || '—'}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <p className="text-xs text-muted-foreground">Creada: {formatDate(s.fechaCreacion)}</p>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 border-t border-[#e5e7e3] pt-4">
                    <Button variant="outline" size="sm" className="rounded-xl border-[#e5e7e3]" asChild>
                      <Link href={`/solicitudes/${s._id}`}>Ver detalle</Link>
                    </Button>
                    {s.yaEnvioPresupuesto ? (
                      <span className="text-xs text-[#71816D] font-medium flex items-center gap-1.5 py-2">
                        Presupuesto enviado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-xl bg-[#71816D] hover:bg-[#71816D]/90 text-white flex items-center gap-1.5"
                        onClick={() => {
                          setPresupuestoDialog(s)
                          setPresupuestoForm({ monto: '', mensaje: '', duracionEstimada: '' })
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enviar presupuesto
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

      <Dialog open={!!presupuestoDialog} onOpenChange={(open) => { if (!open) setPresupuestoDialog(null) }}>
        <DialogContent className="sm:max-w-md rounded-2xl border-[#e5e7e3] bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[#091E05]">Enviar presupuesto</DialogTitle>
            <DialogDescription className="text-[#71816D]">
              {presupuestoDialog && `Solicitud del ${presupuestoDialog.fecha} a las ${presupuestoDialog.hora}. Indicá tu monto y opcionalmente duración y mensaje.`}
            </DialogDescription>
          </DialogHeader>
          {presupuestoDialog && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#71816D] mb-1.5">Monto ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={presupuestoForm.monto}
                  onChange={(e) => setPresupuestoForm((p) => ({ ...p, monto: e.target.value }))}
                  placeholder="Ej: 5000"
                  required
                  className="rounded-xl border-[#e5e7e3] h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#71816D] mb-1.5">Duración estimada (opcional)</label>
                <Input
                  type="text"
                  value={presupuestoForm.duracionEstimada}
                  onChange={(e) => setPresupuestoForm((p) => ({ ...p, duracionEstimada: e.target.value }))}
                  placeholder="Ej: 2 horas, medio día"
                  className="rounded-xl border-[#e5e7e3] h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#71816D] mb-1.5">Mensaje (opcional)</label>
                <Textarea
                  value={presupuestoForm.mensaje}
                  onChange={(e) => setPresupuestoForm((p) => ({ ...p, mensaje: e.target.value }))}
                  placeholder="Breve descripción de tu propuesta..."
                  rows={3}
                  className="rounded-xl border-[#e5e7e3] resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setPresupuestoDialog(null)} className="rounded-xl border-[#e5e7e3]">Cancelar</Button>
                <Button onClick={sendPresupuesto} disabled={enviandoPresupuesto || !presupuestoForm.monto} className="rounded-xl bg-[#71816D] hover:bg-[#71816D]/90 text-white">
                  {enviandoPresupuesto ? 'Enviando...' : 'Enviar presupuesto'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

        {solicitudes.length === 0 && solicitudesDisponibles.length === 0 ? (
          <Card className="rounded-2xl border-[#e5e7e3] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#091E05]">No hay solicitudes</CardTitle>
              <CardDescription className="text-[#71816D]">
                Cuando un cliente publique una solicitud en tu rubro, aparecerá aquí. Revisá la descripción y enviá tu presupuesto desde el detalle.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
        <div className="space-y-8">
          {pendientes.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-[#71816D]" />
                <h2 className="text-lg font-semibold text-[#091E05]">Solicitudes nuevas</h2>
              </div>
              <p className="text-[#71816D] text-sm mb-4">Entrá al detalle de cada solicitud para aceptar o rechazar.</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendientes.map((s) => (
                  <SolicitudCard
                    key={s._id}
                    solicitud={s}
                    actions={null}
                  />
                ))}
              </div>
            </section>
          )}

          {confirmadas.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-[#71816D]" />
                <h2 className="text-lg font-semibold text-[#091E05]">Trabajos confirmados</h2>
              </div>
              <p className="text-[#71816D] text-sm mb-4">Podés cancelar o ir al detalle para iniciar el trabajo.</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {confirmadas.map((s) => (
                  <SolicitudCard
                    key={s._id}
                    solicitud={s}
                    actions={
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="rounded-xl border-[#e5e7e3]">Cancelar solicitud</Button>
                        </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
                              <AlertDialogDescription>
                                El cliente será notificado. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No</AlertDialogCancel>
                              <AlertDialogAction onClick={() => callAction(s._id, 'cancel')}>
                                Sí, cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {enProgreso.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-[#71816D]" />
                <h2 className="text-lg font-semibold text-[#091E05]">En progreso</h2>
              </div>
              <p className="text-[#71816D] text-sm mb-4">Cuando termines, marcá como finalizado desde el detalle.</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {enProgreso.map((s) => (
                  <SolicitudCard
                    key={s._id}
                    solicitud={s}
                    actions={
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="rounded-xl bg-[#71816D] hover:bg-[#71816D]/90 text-white">Finalizar trabajo</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Marcar como finalizado?</AlertDialogTitle>
                            <AlertDialogDescription>
                              El cliente podrá calificarte.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => callAction(s._id, 'complete')}>
                              Finalizar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {historial.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <History className="h-5 w-5 text-[#71816D]" />
                <h2 className="text-lg font-semibold text-[#091E05]">Historial</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {historial.map((s) => (
                  <SolicitudCard
                    key={s._id}
                    solicitud={s}
                    actions={
                      <span
                        className={
                          s.estado === 'completada'
                            ? 'text-green-600 font-medium'
                            : s.estado === 'cancelada_por_trabajador' || s.estado === 'cancelada_por_cliente'
                              ? 'text-amber-600 font-medium'
                              : 'text-red-600 font-medium'
                        }
                      >
                        {s.estado === 'completada'
                          ? 'Completada'
                          : s.estado === 'rechazada'
                            ? 'Rechazada'
                            : s.estado === 'cancelada_por_trabajador'
                              ? 'Cancelada por ti'
                              : s.estado === 'cancelada_por_cliente'
                                ? 'Cancelada por el cliente'
                                : s.estado}
                      </span>
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
