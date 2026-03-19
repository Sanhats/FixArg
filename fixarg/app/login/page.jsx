"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/AuthContext"

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoggedIn, isTrabajador, isLoading } = useAuth()
  const next = searchParams.get("next") || ""

  const [formData, setFormData] = useState({ email: "", password: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const safeNext = next.startsWith("/") ? next : "/"

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) return
    if (isTrabajador) {
      router.replace("/trabajador/dashboard")
      return
    }
    router.replace(safeNext || "/servicios")
  }, [isLoading, isLoggedIn, isTrabajador, router, safeNext])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) throw new Error("Usuario o contraseña incorrectos")
        throw new Error(data.error || data.message || "Error al iniciar sesión")
      }
      login(data.token, data.user)
      router.push(safeNext || "/servicios")
    } catch (err) {
      setSubmitError(err.message || "Error al iniciar sesión.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isLoggedIn) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-[#71816D] font-medium">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[425px] mx-auto">
      <h1 className="text-xl font-bold text-[#091E05] mb-2">Iniciar sesión</h1>
      <p className="text-gray-600 text-sm mb-6">
        Ingresá con tu cuenta de cliente para ver servicios y contratar Fixers.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Correo electrónico</Label>
          <Input
            id="login-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Contraseña</Label>
          <Input
            id="login-password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            autoComplete="current-password"
          />
        </div>
        {submitError && (
          <div role="alert" className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {submitError}
          </div>
        )}
        <Button
          type="submit"
          className="w-full bg-[#71816D] hover:bg-[#71816D]/90 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        ¿No tenés cuenta?{" "}
        <Link href="/" className="text-[#71816D] font-medium hover:underline">
          Volver al inicio
        </Link>{" "}
        para registrarte.
      </p>
      <p className="mt-2 text-sm text-gray-500">
        <Link href="/trabajador/login" className="text-[#71816D] hover:underline">
          Soy profesional
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-[#091E05] border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-white font-semibold hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={<div className="text-[#71816D]">Cargando...</div>}>
          <LoginFormContent />
        </Suspense>
      </main>
    </div>
  )
}
