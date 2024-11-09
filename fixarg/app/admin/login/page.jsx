"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('Enviando credenciales:', {
        username: credentials.username,
        password: credentials.password.length + ' caracteres'
      })

      const response = await fetch('/api/admin/login', {
        method: 'POST',
  headers: { 
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: credentials.username.trim(),
    password: credentials.password.trim()
  })
})

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('adminToken', data.token)
        router.push('/admin')
      } else {
        setError(data.error || 'Credenciales inválidas')
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error)
      setError('Error al conectar con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Iniciar Sesión - Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ 
                  ...credentials, 
                  username: e.target.value 
                })}
                required
                disabled={isLoading}
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ 
                  ...credentials, 
                  password: e.target.value 
                })}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}