'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import Reviews from '@/components/reviews'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

export default function TrabajadorDashboard() {
  const [solicitudes, setSolicitudes] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)
  const { user, getToken, isLoggedIn, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/trabajador/login')
      return
    }

    const fetchSolicitudes = async () => {
      try {
        const token = getToken()
        const response = await fetch('/api/trabajador/solicitudes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Error al cargar las solicitudes')
        }

        const data = await response.json()
        setSolicitudes(data.solicitudes)
      } catch (error) {
        console.error('Error:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (isLoggedIn) {
      fetchSolicitudes()
    }
  }, [isLoggedIn, isLoading, router, getToken])

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Fecha no disponible'
    }
  }

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(amount)
    } catch (error) {
      return `$${amount}`
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Cargando...</h2>
          <p className="text-muted-foreground">Por favor espere</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>
              Intentar nuevamente
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Panel de Trabajador</h1>
        <p className="text-muted-foreground">
          Bienvenido, {user?.firstName} {user?.lastName}
        </p>
      </div>
      
      {solicitudes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay solicitudes pendientes</CardTitle>
            <CardDescription>
              Las nuevas solicitudes aparecerán aquí.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {solicitudes.map((solicitud) => (
            <Card key={solicitud._id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{solicitud.tipoServicio}</CardTitle>
                <CardDescription>
                  Solicitado por: {solicitud.usuario?.nombre || 'Usuario'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Fecha de solicitud:
                    </p>
                    <p>{formatDate(solicitud.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Descripción:
                    </p>
                    <p className="text-sm">{solicitud.descripcion}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Presupuesto:
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(solicitud.presupuesto)}
                    </p>
                  </div>
                  {solicitud.direccion && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Dirección:
                      </p>
                      <p className="text-sm">{solicitud.direccion}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                {solicitud.estado === 'pendiente' && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="default">Aceptar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Aceptar esta solicitud?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Al aceptar esta solicitud, te comprometes a realizar el trabajo
                            según los términos acordados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleAcceptRequest(solicitud._id)}
                          >
                            Aceptar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Rechazar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Rechazar esta solicitud?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRejectRequest(solicitud._id)}
                          >
                            Rechazar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                {solicitud.estado === 'aceptada' && (
                  <span className="text-green-500 font-medium">Aceptada</span>
                )}
                {solicitud.estado === 'rechazada' && (
                  <span className="text-red-500 font-medium">Rechazada</span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}