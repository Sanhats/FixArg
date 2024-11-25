'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function TrabajadorDashboard() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, isLoggedIn, getToken } = useAuth()

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'trabajador') {
      router.push('/trabajador/login')
      return
    }

    fetchSolicitudes()
  }, [isLoggedIn, user, router])

  const fetchSolicitudes = async () => {
    try {
      const token = getToken()
      const response = await fetch(`/api/trabajador/solicitudes?trabajadorId=${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar las solicitudes')
      }

      const data = await response.json()
      setSolicitudes(data)
    } catch (error) {
      setError('Error al cargar las solicitudes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Cargando...</div>
  if (error) return <div>{error}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Trabajador</h1>
      <h2 className="text-xl mb-4">Bienvenido, {user.firstName} {user.lastName}</h2>
      <h3 className="text-lg mb-4">Solicitudes de Trabajo</h3>
      {solicitudes.length === 0 ? (
        <p>No tienes solicitudes de trabajo pendientes.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {solicitudes.map((solicitud) => (
            <Card key={solicitud._id}>
              <CardHeader>
                <CardTitle>{solicitud.descripcion}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Fecha: {new Date(solicitud.fecha).toLocaleDateString()}</p>
                <p>Hora: {solicitud.hora}</p>
                <p>Estado: {solicitud.estado}</p>
                <Button className="mt-2" onClick={() => router.push(`/trabajador/solicitud/${solicitud._id}`)}>
                  Ver detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}