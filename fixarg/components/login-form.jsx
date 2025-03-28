"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from '@/lib/AuthContext'

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Error al iniciar sesión';
        if (response.status === 401) {
          throw new Error('Usuario o contraseña incorrectos');
        }
        throw new Error(errorMessage);
      }

      login(data.token, data.user)
      setIsOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Login error:', error)
      setSubmitError(error.message || 'Error al iniciar sesión. Por favor, intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">Iniciar sesión</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="login-form-description">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Iniciar sesión</DialogTitle>
          <DialogDescription id="login-form-description" className="text-sm sm:text-base">
            Ingresa tus credenciales para acceder a tu cuenta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" aria-label="Formulario de inicio de sesión">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-sm sm:text-base">
              Correo electrónico
            </Label>
            <Input
              id="login-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="text-sm sm:text-base"
              autoComplete="email"
              aria-required="true"
              aria-invalid={submitError ? "true" : "false"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-sm sm:text-base">
              Contraseña
            </Label>
            <Input
              id="login-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              className="text-sm sm:text-base"
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={submitError ? "true" : "false"}
            />
          </div>
          {submitError && (
            <div role="alert" className="text-red-500 text-sm sm:text-base bg-red-50 p-3 rounded-md">
              {submitError}
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-[#324376] text-white hover:bg-[#324376]/90 text-sm sm:text-base"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}