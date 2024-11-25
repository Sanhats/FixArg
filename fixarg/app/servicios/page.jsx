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
  const { isLoggedIn, getToken, user, isLoading } = useAuth()

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
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!isLoggedIn || !user) {
    return <div className="flex items-center justify-center min-h-screen">
      Debe iniciar sesión para acceder a esta página
    </div>
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando trabajadores...</div>
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Servicios Disponibles</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select value={filtroServicio} onValueChange={setFiltroServicio}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Todos los servicios" />
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
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Ordenar por precio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ninguno">Sin ordenar</SelectItem>
            <SelectItem value="ascendente">Precio: Menor a Mayor</SelectItem>
            <SelectItem value="descendente">Precio: Mayor a Menor</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="text"
          placeholder="Buscar trabajadores..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-auto"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrabajadores.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No se encontraron trabajadores que coincidan con los criterios de búsqueda
          </div>
        ) : (
          filteredTrabajadores.map((trabajador) => (
            <Card key={trabajador._id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">
                  {trabajador.displayName || `${trabajador.firstName} ${trabajador.lastName}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Servicio:</span>
                    <Badge variant="secondary">
                      {trabajador.service || trabajador.occupation || 'No especificado'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Precio por hora:</span>
                    <span>${trabajador.hourlyRate || 'No especificado'}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Descripción:</span>
                    <p className="mt-1 text-sm text-gray-600">
                      {trabajador.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full bg-[#324376] hover:bg-[#324376]/90"
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Solicitar servicio</DialogTitle>
            <DialogDescription>
              Completa el formulario para solicitar el servicio de{' '}
              {selectedTrabajador?.displayName || 
                (selectedTrabajador && `${selectedTrabajador.firstName} ${selectedTrabajador.lastName}`) || 
                'trabajador seleccionado'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del trabajo
              </label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                required
                placeholder="Describe el trabajo que necesitas..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha preferida
              </label>
              <Input
                type="date"
                id="fecha"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-1">
                Hora preferida
              </label>
              <Input
                type="time"
                id="hora"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                required
              />
            </div>
            {formError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                {formError}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#324376] hover:bg-[#324376]/90"
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