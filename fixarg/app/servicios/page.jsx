'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Package, Sparkles, TreePine, Wrench, Zap, Hammer, Paintbrush, Plus, Home, MapPin } from 'lucide-react'

const CATEGORIAS_SERVICIO = [
  { value: 'mudanza', label: 'Mudanza', icon: Package },
  { value: 'limpieza', label: 'Limpieza', icon: Sparkles },
  { value: 'jardineria', label: 'Jardinería', icon: TreePine },
  { value: 'plomeria', label: 'Plomería', icon: Wrench },
  { value: 'electricidad', label: 'Electricidad', icon: Zap },
  { value: 'carpinteria', label: 'Carpintería', icon: Hammer },
  { value: 'pintura', label: 'Pintura', icon: Paintbrush },
]

function buildDireccionCasa(user) {
  if (!user) return ''
  const parts = [user.street, user.streetNumber, user.locality, user.province].filter(Boolean)
  return parts.join(', ').trim()
}

export default function ServiciosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    descripcion: '',
    fecha: '',
    hora: '',
    direccion: '',
    fotos: [],
    ubicacionLat: null,
    ubicacionLng: null,
  })
  const [servicioRubro, setServicioRubro] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  const router = useRouter()
  const { isLoggedIn, getToken, user, isLoading, logout, isCliente, isTrabajador } = useAuth()
  const direccionCasa = buildDireccionCasa(user)

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/')
      return
    }
  }, [isLoggedIn, isLoading, router])

  const abrirSolicitudPorServicio = (rubroValue) => {
    setServicioRubro(rubroValue || '')
    const casa = buildDireccionCasa(user)
    setFormData({
      descripcion: '',
      fecha: '',
      hora: '',
      direccion: casa,
      fotos: [],
      ubicacionLat: null,
      ubicacionLng: null,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const usarDireccionCasa = () => {
    setFormData((prev) => ({
      ...prev,
      direccion: direccionCasa,
      ubicacionLat: null,
      ubicacionLng: null,
    }))
  }

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setFormError('Tu navegador no soporta geolocalización.')
      return
    }
    setGettingLocation(true)
    setFormError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'es' } }
          )
          const data = await res.json()
          const addressText = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          setFormData((prev) => ({
            ...prev,
            direccion: addressText,
            ubicacionLat: lat,
            ubicacionLng: lng,
          }))
        } catch {
          setFormData((prev) => ({
            ...prev,
            direccion: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            ubicacionLat: lat,
            ubicacionLng: lng,
          }))
        } finally {
          setGettingLocation(false)
        }
      },
      () => {
        setFormError('No se pudo obtener tu ubicación. Revisá que el permiso esté permitido.')
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      if (!user?._id) throw new Error('Usuario no autenticado')
      const token = getToken()
      if (!token) throw new Error('No se encontró el token de autenticación')
      if (!servicioRubro) throw new Error('Elegí un tipo de servicio')

      const body = {
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        hora: formData.hora,
        direccion: formData.direccion?.trim() || undefined,
        fotos: (formData.fotos && formData.fotos.length) ? formData.fotos : undefined,
        servicioRubro,
      }
      if (formData.ubicacionLat != null && formData.ubicacionLng != null) {
        body.ubicacionLat = formData.ubicacionLat
        body.ubicacionLng = formData.ubicacionLng
      }

      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al enviar la solicitud')

      setIsDialogOpen(false)
      setFormData({ descripcion: '', fecha: '', hora: '', direccion: '', fotos: [], ubicacionLat: null, ubicacionLng: null })
      setServicioRubro('')
      alert('Solicitud enviada. Los profesionales de ese rubro recibirán tu pedido y podrán enviarte presupuestos.')
      if (data.id) router.push(`/solicitudes/${data.id}`)
      else router.push('/mis-solicitudes')
    } catch (error) {
      console.error('Error al enviar solicitud:', error)
      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#f8f9f7] to-[#eef0ec]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#71816D]/30 border-t-[#71816D]" />
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#f8f9f7] to-[#eef0ec] px-4">
        <div className="rounded-2xl bg-white border border-[#e5e7e3] shadow-sm p-8 text-center max-w-sm">
          <h2 className="text-xl font-semibold text-[#091E05] mb-2">Acceso restringido</h2>
          <p className="text-[#71816D] text-sm mb-6">Iniciá sesión para pedir servicios y recibir presupuestos.</p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full rounded-xl bg-[#71816D] hover:bg-[#71816D]/90 text-white h-11"
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9f7] to-[#eef0ec]">
      <header className="sticky top-0 z-50 border-b border-[#71816D]/20 bg-[#71816D]/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/15 gap-1.5"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Button>
            <div className="flex items-center gap-2">
              {isTrabajador && (
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/15" onClick={() => router.push('/trabajador/dashboard')}>
                  Mi panel
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/15" onClick={() => router.push('/mis-solicitudes')}>
                Mis solicitudes
              </Button>
              <span className="text-white/90 text-sm hidden sm:inline">{user?.firstName}</span>
              <Button size="sm" onClick={logout} variant="secondary" className="bg-white/20 text-white border-0 hover:bg-white/30">
                Salir
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        {isCliente ? (
          <>
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#091E05] tracking-tight mb-1.5">
                ¿Qué necesitás?
              </h1>
              <p className="text-[#71816D] text-sm sm:text-base">
                Tocá un servicio, completá en un momento y recibí presupuestos.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {CATEGORIAS_SERVICIO.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => abrirSolicitudPorServicio(cat.value)}
                    className="flex flex-col items-center justify-center gap-2.5 p-5 sm:p-6 rounded-2xl bg-white border border-[#e5e7e3] shadow-sm hover:shadow-md hover:border-[#71816D]/30 hover:bg-[#71816D]/5 active:scale-[0.98] transition-all duration-200 text-[#091E05]"
                  >
                    <span className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#71816D]/12 text-[#71816D]">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </span>
                    <span className="font-medium text-sm sm:text-base">{cat.label}</span>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => abrirSolicitudPorServicio('')}
                className="flex flex-col items-center justify-center gap-2.5 p-5 sm:p-6 rounded-2xl bg-white/80 border border-dashed border-[#71816D]/40 text-[#71816D] hover:bg-white hover:border-[#71816D]/50 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
              >
                <span className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#71816D]/10">
                  <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <span className="font-medium text-sm sm:text-base">Otro</span>
              </button>
            </div>

            <p className="text-center text-xs text-[#71816D]/80 mt-6">
              Los profesionales del rubro te envían presupuestos. Vos elegís.
            </p>
          </>
        ) : (
          <section className="rounded-2xl border border-[#e5e7e3] bg-white shadow-sm p-8 text-center max-w-sm mx-auto">
            <p className="text-[#71816D] mb-5">Sos profesional. Gestioná solicitudes y presupuestos desde tu panel.</p>
            <Button
              className="w-full rounded-xl bg-[#71816D] hover:bg-[#71816D]/90 text-white h-11"
              onClick={() => router.push('/trabajador/dashboard')}
            >
              Ir a mi panel
            </Button>
          </section>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setServicioRubro(''); setFormData((prev) => ({ ...prev, ubicacionLat: null, ubicacionLng: null })); } }}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl border-[#e5e7e3] bg-white shadow-xl p-0 gap-0 overflow-hidden">
          <div className="px-6 pt-6 pb-1">
            <DialogHeader>
              <DialogTitle className="text-[#091E05] text-lg">Pedir servicio</DialogTitle>
              <DialogDescription className="text-[#71816D] text-sm">
                {servicioRubro
                  ? `${CATEGORIAS_SERVICIO.find(c => c.value === servicioRubro)?.label || servicioRubro} — recibís presupuestos en tu solicitud.`
                  : 'Elegí el servicio y completá. Recibís presupuestos.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
            <div>
              <label htmlFor="servicio-rubro" className="block text-xs font-medium text-[#71816D] mb-1.5">
                Tipo de servicio
              </label>
              <Select value={servicioRubro} onValueChange={setServicioRubro} required>
                <SelectTrigger id="servicio-rubro" className="rounded-xl border-[#e5e7e3] focus:ring-[#71816D] h-10">
                  <SelectValue placeholder="Elegí uno" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_SERVICIO.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="descripcion" className="block text-xs font-medium text-[#71816D] mb-1.5">
                ¿Qué necesitás?
              </label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                required
                placeholder="Breve descripción del trabajo..."
                className="min-h-[88px] rounded-xl border-[#e5e7e3] focus:ring-[#71816D] resize-none"
              />
            </div>
            <div>
              <label htmlFor="direccion" className="block text-xs font-medium text-[#71816D] mb-1.5">
                Dirección del servicio
              </label>
              <div className="flex gap-2 mb-2">
                {direccionCasa && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs border-[#e5e7e3] text-[#71816D] hover:bg-[#71816D]/10 flex items-center gap-1.5"
                    onClick={usarDireccionCasa}
                  >
                    <Home className="h-3.5 w-3.5" />
                    Usar mi casa
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs border-[#e5e7e3] text-[#71816D] hover:bg-[#71816D]/10 flex items-center gap-1.5 disabled:opacity-50"
                  onClick={usarUbicacionActual}
                  disabled={gettingLocation}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {gettingLocation ? 'Obteniendo...' : 'Ubicación actual'}
                </Button>
              </div>
              <Input
                id="direccion"
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle, número, localidad o tocá un botón arriba"
                className="rounded-xl border-[#e5e7e3] focus:ring-[#71816D] h-10"
              />
              {formData.ubicacionLat != null && formData.ubicacionLng != null && (
                <p className="text-xs text-[#71816D] mt-1">Se enviará la ubicación en el mapa al profesional.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fecha" className="block text-xs font-medium text-[#71816D] mb-1.5">
                  Fecha
                </label>
                <Input
                  type="date"
                  id="fecha"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="rounded-xl border-[#e5e7e3] focus:ring-[#71816D] h-10"
                />
              </div>
              <div>
                <label htmlFor="hora" className="block text-xs font-medium text-[#71816D] mb-1.5">
                  Hora
                </label>
                <Input
                  type="time"
                  id="hora"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  required
                  className="rounded-xl border-[#e5e7e3] focus:ring-[#71816D] h-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#71816D] mb-1.5">
                Fotos (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#71816D] file:text-white file:text-xs"
                onChange={async (e) => {
                  const files = [...(e.target.files || [])]
                  if (!files.length) return
                  setUploadingPhoto(true)
                  setFormError(null)
                  try {
                    const token = getToken()
                    const urls = []
                    for (const file of files.slice(0, 5)) {
                      const fd = new FormData()
                      fd.append('file', file)
                      const res = await fetch('/api/upload?folder=solicitudes', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} })
                      if (!res.ok) throw new Error('Error al subir una foto')
                      const d = await res.json()
                      if (d.url) urls.push(d.url)
                    }
                    setFormData((f) => ({ ...f, fotos: [...(f.fotos || []), ...urls] }))
                  } catch (err) {
                    setFormError(err.message || 'Error al subir fotos')
                  } finally {
                    setUploadingPhoto(false)
                    e.target.value = ''
                  }
                }}
              />
              {(uploadingPhoto || formData.fotos?.length > 0) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadingPhoto ? 'Subiendo...' : `${formData.fotos?.length || 0} foto(s)`}
                </p>
              )}
            </div>
            {formError && (
              <div className="text-red-600 text-xs bg-red-50 rounded-xl px-3 py-2">
                {formError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 rounded-xl border-[#e5e7e3] text-[#71816D] hover:bg-[#f8f9f7]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-[#71816D] hover:bg-[#71816D]/90 text-white h-10 disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Pedir presupuestos'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

