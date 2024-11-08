"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminPanel() {
  const [professionals, setProfessionals] = useState([])
  const [filteredProfessionals, setFilteredProfessionals] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }

    try {
      const response = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Token inválido')
      }

      fetchProfessionals()
    } catch (error) {
      console.error('Auth error:', error)
      localStorage.removeItem('adminToken')
      router.push('/admin/login')
    }
  }

  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/professionals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar los profesionales')
      }

      const data = await response.json()
      setProfessionals(data)
      setFilteredProfessionals(data)
    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (filter === 'all') {
      setFilteredProfessionals(professionals)
    } else {
      setFilteredProfessionals(professionals.filter(p => p.service === filter))
    }
  }, [filter, professionals])

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/admin/professionals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el estado')
      }

      setProfessionals(professionals.map(p => 
        p._id === id ? { ...p, status: newStatus } : p
      ))
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el estado del profesional')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <Button onClick={handleLogout} variant="outline">
          Cerrar sesión
        </Button>
      </div>
      
      <div className="mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por servicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los servicios</SelectItem>
            <SelectItem value="ensamblaje">Ensamblaje</SelectItem>
            <SelectItem value="montaje">Montaje</SelectItem>
            <SelectItem value="mudanza">Mudanza</SelectItem>
            <SelectItem value="limpieza">Limpieza</SelectItem>
            <SelectItem value="exteriores">Ayuda en exteriores</SelectItem>
            <SelectItem value="reparaciones">Reparaciones del Hogar</SelectItem>
            <SelectItem value="pintura">Pintura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {professionals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay profesionales registrados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfessionals.map((professional) => (
                <TableRow key={professional._id}>
                  <TableCell>{professional.name}</TableCell>
                  <TableCell>{professional.email}</TableCell>
                  <TableCell>{professional.service}</TableCell>
                  <TableCell>{professional.status}</TableCell>
                  <TableCell>
                    <Select 
                      value={professional.status}
                      onValueChange={(value) => handleStatusChange(professional._id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="approved">Aprobado</SelectItem>
                        <SelectItem value="rejected">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}