'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/lib/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Search, Clock, MapPin, Star, Filter, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ServiciosPage() {
  const [trabajadores, setTrabajadores] = useState([])
  const [filteredTrabajadores, setFilteredTrabajadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroServicio, setFiltroServicio] = useState('todos')
  const [ordenPrecio, setOrdenPrecio] = useState('ninguno')
  const [busqueda, setBusqueda] = useState('')
  const [selectedTrabajador, setSelectedTrabajador] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    descripcion: '',
    fecha: '',
    hora: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  
  const router = useRouter()
  const { isLoggedIn, getToken, user, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/')
      return
    }
    
    if (isLoggedIn && user) {
      fetchTrabajadores()
    }
  }, [isLoggedIn, isLoading, user, router])

  const fetchTrabajadores = async () => {
    try {
      const token = getToken()
      if (!token) {
        throw new Error('No se encontró el token de autenticación')
      }
      const response = await fetch('/api/trabajadores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Error al cargar los trabajadores')
      }
      const data = await response.json()
      setTrabajadores(data)
      setFilteredTrabajadores(data)
    } catch (error) {
      console.error('Error:', error)
      setError(error.message || 'Error al cargar los trabajadores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let result = [...trabajadores]

    if (filtroServicio !== 'todos') {
      result = result.filter(t => 
        (t.service || t.occupation)?.toLowerCase() === filtroServicio.toLowerCase()
      )
    }

    if (busqueda) {
      const searchTerm = busqueda.toLowerCase()
      result = result.filter(t => 
        t.firstName?.toLowerCase().includes(searchTerm) ||
        t.lastName?.toLowerCase().includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm) ||
        (t.service || t.occupation)?.toLowerCase().includes(searchTerm)
      )
    }

    if (ordenPrecio === 'ascendente') {
      result.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0))
    } else if (ordenPrecio === 'descendente') {
      result.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0))
    }

    setFilteredTrabajadores(result)
  }, [trabajadores, filtroServicio, ordenPrecio, busqueda])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      if (!user?._id) {
        throw new Error('Usuario no autenticado')
      }

      if (!selectedTrabajador?._id) {
        throw new Error('No se ha seleccionado un trabajador')
      }

      const token = getToken()
      if (!token) {
        throw new Error('No se encontró el token de autenticación')
      }

      console.log('Enviando solicitud con:', {
        usuario: user,
        trabajador: selectedTrabajador,
        formData
      })

      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          descripcion: formData.descripcion,
          fecha: formData.fecha,
          hora: formData.hora,
          trabajadorId: selectedTrabajador._id,
          usuarioId: user._id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la solicitud')
      }

      setIsDialogOpen(false)
      setFormData({ descripcion: '', fecha: '', hora: '' })
      alert('Solicitud enviada con éxito')
    } catch (error) {
      console.error('Error al enviar solicitud:', error)
      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E8E8E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#324376]"></div>
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#E8E8E8] space-y-4">
        <h2 className="text-2xl font-semibold text-[#091E05]">Acceso Restringido</h2>
        <p className="text-[#71816D]">Debe iniciar sesión para acceder a esta página</p>
        <Button 
          onClick={() => router.push('/login')}
          className="bg-[#324376] hover:bg-[#324376]/90 text-white"
        >
          Iniciar Sesión
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
              className="text-white  flex items-center gap-2"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-white">
                Bienvenido, {user?.firstName}
              </span>
              <Button 
                onClick={logout} 
                variant="outline" 
                className="bg-white text-[#71816D] hover:bg-white/90 border-white"
              >
                Cerrar sesión
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-[#091E05] mb-2">Servicios Disponibles</h1>
            <p className="text-[#71816D]">Encuentra profesionales calificados para tus necesidades</p>
          </header>

          <div className="bg-[#F5F5F5] rounded-lg p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#71816D] h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10 bg-white border-[#71816D] focus:border-[#71816D] focus:ring-[#71816D]"
                />
              </div>

              <Select value={filtroServicio} onValueChange={setFiltroServicio}>
                <SelectTrigger className="bg-white border-[#71816D]">
                  <Filter className="h-4 w-4 mr-2 text-[#71816D]" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los servicios</SelectItem>
                  <SelectItem value="mudanza">Mudanza</SelectItem>
                  <SelectItem value="limpieza">Limpieza</SelectItem>
                  <SelectItem value="jardineria">Jardinería</SelectItem>
                  <SelectItem value="plomeria">Plomería</SelectItem>
                  <SelectItem value="electricidad">Electricidad</SelectItem>
                  <SelectItem value="carpinteria">Carpintería</SelectItem>
                  <SelectItem value="pintura">Pintura</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ordenPrecio} onValueChange={setOrdenPrecio}>
                <SelectTrigger className="bg-white border-[#71816D]">
                  <SlidersHorizontal className="h-4 w-4 mr-2 text-[#71816D]" />
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin ordenar</SelectItem>
                  <SelectItem value="ascendente">Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="descendente">Precio: Mayor a Menor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrabajadores.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="mx-auto max-w-sm">
                  <p className="text-[#71816D] mb-4">No se encontraron trabajadores que coincidan con los criterios de búsqueda</p>
                  <Button 
                    onClick={() => {
                      setFiltroServicio('todos')
                      setOrdenPrecio('ninguno')
                      setBusqueda('')
                    }}
                    variant="outline"
                    className="border-[#71816D] text-[#71816D] hover:bg-[#71816D] hover:text-white"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            ) : (
              filteredTrabajadores.map((trabajador) => (
                <Card 
                  key={trabajador._id} 
                  className="bg-white border border-[#F5F5F5] hover:border-[#71816D] transition-colors duration-200"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-[#091E05]">
                      {trabajador.displayName || `${trabajador.firstName} ${trabajador.lastName}`}
                    </CardTitle>
                    <Badge 
                      variant="secondary" 
                      className="bg-[#F5F5F5] text-[#71816D] font-medium"
                    >
                      {trabajador.service || trabajador.occupation || 'No especificado'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-[#71816D]">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="font-medium">${trabajador.hourlyRate || 'No especificado'}/hora</span>
                      </div>
                      <div className="flex items-center text-[#71816D]">
                        <Star className="h-4 w-4 mr-2" />
                        <span>4.8 (24 reseñas)</span>
                      </div>
                      <div className="flex items-center text-[#71816D]">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>Tucuman</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#71816D] line-clamp-2">
                      {trabajador.description || 'Sin descripción'}
                    </p>
                    <Button 
                      className="w-full bg-[#71816D] hover:bg-[#71816D]/90 text-white"
                      onClick={() => {
                        setSelectedTrabajador(trabajador)
                        setIsDialogOpen(true)
                      }}
                    >
                      Contactar
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#091E05]">Solicitar servicio</DialogTitle>
            <DialogDescription className="text-[#71816D]">
              Completa el formulario para solicitar el servicio de{' '}
              {selectedTrabajador?.displayName || 
                (selectedTrabajador && `${selectedTrabajador.firstName} ${selectedTrabajador.lastName}`) || 
                'trabajador seleccionado'}
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
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                {formError}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="border-[#71816D] text-[#71816D] hover:bg-[#71816D] hover:text-white"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={cn(
                  "bg-[#71816D] hover:bg-[#71816D]/90 text-white",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

