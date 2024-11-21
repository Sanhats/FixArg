'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

export default function ServiciosPage() {
  const [trabajadores, setTrabajadores] = useState([])
  const [filteredTrabajadores, setFilteredTrabajadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroServicio, setFiltroServicio] = useState('todos')
  const [ordenPrecio, setOrdenPrecio] = useState('ninguno')
  const [busqueda, setBusqueda] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/')
      return
    }
    fetchTrabajadores(token)
  }, [router])

  const fetchTrabajadores = async (token) => {
    try {
      const response = await fetch('/api/trabajadores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Error al cargar los trabajadores')
      }
      const data = await response.json()
      console.log('Datos recibidos:', data)
      setTrabajadores(data)
      setFilteredTrabajadores(data)
    } catch (error) {
      console.error('Error:', error)
      setError('Error al cargar los trabajadores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let result = [...trabajadores]

    if (filtroServicio !== 'todos') {
      result = result.filter(t => t.service && t.service.toLowerCase() === filtroServicio.toLowerCase())
    }

    if (busqueda) {
      const searchTerm = busqueda.toLowerCase()
      result = result.filter(t => 
        t.firstName?.toLowerCase().includes(searchTerm) ||
        t.lastName?.toLowerCase().includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm) ||
        t.service?.toLowerCase().includes(searchTerm)
      )
    }

    if (ordenPrecio === 'ascendente') {
      result.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0))
    } else if (ordenPrecio === 'descendente') {
      result.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0))
    }

    setFilteredTrabajadores(result)
  }, [trabajadores, filtroServicio, ordenPrecio, busqueda])

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
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
            <SelectItem value="ensamblaje">Ensamblaje</SelectItem>
            <SelectItem value="montaje">Montaje</SelectItem>
            <SelectItem value="mudanza">Mudanza</SelectItem>
            <SelectItem value="limpieza">Limpieza</SelectItem>
            <SelectItem value="exteriores">Ayuda en exteriores</SelectItem>
            <SelectItem value="reparaciones">Reparaciones del Hogar</SelectItem>
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
                  {trabajador.firstName} {trabajador.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Servicio:</span>
                    <Badge variant="secondary">{trabajador.service || 'No especificado'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Precio por hora:</span>
                    <span>${trabajador.hourlyRate || 'No especificado'}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Descripción:</span>
                    <p className="mt-1 text-sm text-gray-600">{trabajador.description || 'Sin descripción'}</p>
                  </div>
                </div>
                <Button 
                  className="w-full bg-[#324376] hover:bg-[#324376]/90"
                  onClick={() => {
                    console.log('Contactar a:', trabajador.firstName)
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
  )
}