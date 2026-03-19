'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from '@/lib/AuthContext'

export default function TrabajadorLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/trabajador/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        login(data.token, { ...data.user, role: 'trabajador' })
        router.push('/trabajador/dashboard')
      } else {
        setError(data.error || 'Error al iniciar sesión')
      }
    } catch (error) {
      setError('Error al conectar con el servidor')
    }
  }

  return (
    <div className="min-h-screen bg-[#E8E8E8] flex flex-col">
      <header className="bg-[#71816D] py-3 px-4">
        <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
          <Link href="/">← Volver al inicio</Link>
        </Button>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-[#091E05]">Iniciar sesión (profesional)</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1 font-medium">
              Correo Electrónico
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 font-medium">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-[#71816D] hover:bg-[#71816D]/90">
            Iniciar sesión
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Aún no eres profesional?{' '}
          <Link href="/" className="text-[#71816D] font-medium hover:underline">Regístrate desde el inicio</Link>
        </p>
      </div>
      </div>
    </div>
  )
}