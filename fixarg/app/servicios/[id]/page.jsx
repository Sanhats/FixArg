'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import WorkerProfile from '@/components/worker-profile'

export default function PerfilTrabajadorPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoggedIn, getToken, user, isLoading } = useAuth()
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ descripcion: '', fecha: '', hora: '', direccion: '', fotos: [] })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/')
      return
    }
    if (!isLoggedIn || !params?.id) return
    const token = getToken()
    if (!token) return
    fetch(`/api/trabajadores/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Profesional no encontrado')
        return res.json()
      })
      .then(setWorker)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [isLoggedIn, isLoading, params?.id, router, getToken])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    try {
      if (!user?._id || user?.role !== 'user') {
        throw new Error('Debes iniciar sesión como cliente para contratar.')
      }
      if (!worker?._id) throw new Error('No se ha seleccionado un trabajador.')
      const token = getToken()
      if (!token) throw new Error('No se encontró el token.')
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          descripcion: formData.descripcion,
          fecha: formData.fecha,
          hora: formData.hora,
          direccion: formData.direccion?.trim() || undefined,
          fotos: (formData.fotos && formData.fotos.length) ? formData.fotos : undefined,
          trabajadorId: worker._id,
          usuarioId: user._id,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al enviar la solicitud')
      setIsDialogOpen(false)
      setFormData({ descripcion: '', fecha: '', hora: '', direccion: '', fotos: [] })
      router.push('/mis-solicitudes')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || loading) {
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
        <p className="text-[#71816D]">Debes iniciar sesión para ver este perfil.</p>
        <Button onClick={() => router.push('/login')} className="bg-[#324376] hover:bg-[#324376]/90 text-white">
          Iniciar sesión
        </Button>
      </div>
    )
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="text-[#71816D] mb-4">{error || 'Profesional no encontrado.'}</p>
        <Button asChild variant="outline" className="border-[#71816D] text-[#71816D]">
          <Link href="/servicios">Volver a servicios</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E8E8E8]">
      <header className="sticky top-0 bg-[#71816D] z-50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <Button asChild variant="ghost" className="text-white flex items-center gap-2">
              <Link href="/servicios" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a servicios
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {user?.role === 'trabajador' && (
                <Button asChild variant="ghost" className="text-white">
                  <Link href="/trabajador/dashboard">Mi panel</Link>
                </Button>
              )}
              <Button asChild variant="ghost" className="text-white">
                <Link href="/mis-solicitudes">Mis solicitudes</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <WorkerProfile worker={worker} />

        {user?.role === 'user' && (
          <div className="mt-8">
            <Button
              className="w-full bg-[#71816D] hover:bg-[#71816D]/90 text-white text-lg py-6"
              onClick={() => setIsDialogOpen(true)}
            >
              Contratar a este profesional
            </Button>
          </div>
        )}
        {user?.role === 'trabajador' && (
          <p className="mt-6 text-center text-[#71816D] text-sm">
            Para contratar un servicio debes usar una cuenta de cliente.
          </p>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#091E05]">Solicitar servicio</DialogTitle>
            <DialogDescription className="text-[#71816D]">
              Completa el formulario para solicitar el servicio de{' '}
              {worker?.displayName || `${worker?.firstName} ${worker?.lastName}` || 'este profesional'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-[#091E05] mb-1">
                Descripción del trabajo
              </label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                required
                placeholder="Describe el trabajo que necesitas..."
                className="min-h-[100px] border-[#71816D] focus:border-[#71816D] focus:ring-[#71816D]"
              />
            </div>
            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-[#091E05] mb-1">
                Dirección del servicio
              </label>
              <Input
                id="direccion"
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle, número, localidad..."
                className="border-[#71816D] focus:border-[#71816D] focus:ring-[#71816D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#091E05] mb-1">
                Fotos (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#71816D] file:text-white"
                onChange={async (e) => {
                  const files = [...(e.target.files || [])]
                  if (!files.length) return
                  try {
                    const token = getToken()
                    const urls = []
                    for (const file of files.slice(0, 5)) {
                      const fd = new FormData()
                      fd.append('file', file)
                      const res = await fetch('/api/upload?folder=solicitudes', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} })
                      if (!res.ok) throw new Error('Error al subir')
                      const d = await res.json()
                      if (d.url) urls.push(d.url)
                    }
                    setFormData((f) => ({ ...f, fotos: [...(f.fotos || []), ...urls] }))
                  } catch (err) {
                    setFormError(err.message)
                  }
                  e.target.value = ''
                }}
              />
              {formData.fotos?.length > 0 && <p className="text-xs text-muted-foreground mt-1">{formData.fotos.length} foto(s)</p>}
            </div>
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-[#091E05] mb-1">
                Fecha preferida
              </label>
              <Input
                type="date"
                id="fecha"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="border-[#71816D] focus:border-[#71816D] focus:ring-[#71816D]"
              />
            </div>
            <div>
              <label htmlFor="hora" className="block text-sm font-medium text-[#091E05] mb-1">
                Hora preferida
              </label>
              <Input
                type="time"
                id="hora"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                required
                className="border-[#71816D] focus:border-[#71816D] focus:ring-[#71816D]"
              />
            </div>
            {formError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{formError}</div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[#71816D] text-[#71816D]">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#71816D] hover:bg-[#71816D]/90 text-white">
                {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
