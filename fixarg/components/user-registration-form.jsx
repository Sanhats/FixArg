"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// This is a simplified list of provinces in Argentina
const provinces = [
  "Tucumán"
]

// This is a simplified object with some localities for each province
const localities = {
  "Tucumán": [
    "Alderetes",
    "Banda del Río Salí",
    "Bella Vista",
    "Burruyacú",
    "Choromoro",
    "Colalao del Valle",
    "Concepción",
    "Delfín Gallo",
    "El Manantial",
    "El Mojón",
    "El Mollar",
    "El Naranjo y El Sunchal",
    "Escaba",
    "Famaillá",
    "Graneros",
    "La Cocha",
    "La Ramada y La Cruz",
    "Las Cejas",
    "Las Talitas",
    "Leales",
    "Los Nogales",
    "Lules",
    "Monteagudo",
    "Raco",
    "Ranchillos y San Miguel",
    "Río Chico",
    "San Andrés",
    "San Javier",
    "San Miguel de Tucumán",
    "San Pedro de Colalao",
    "Santa Ana",
    "Santa Lucía",
    "Simoca",
    "Taco Ralo",
    "Tafí del Valle",
    "Tafí Viejo",
    "Trancas",
    "Villa Belgrano",
    "Villa Benjamín Aráoz",
    "Yerba Buena"
  ]
}

export default function UserRegistrationForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    streetNumber: "",
    province: "",
    locality: "",
    email: "",
  })
  const [availableLocalities, setAvailableLocalities] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (formData.province) {
      setAvailableLocalities(localities[formData.province] || [])
      setFormData(prev => ({ ...prev, locality: "" }))
    }
  }, [formData.province])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!emailVerified) {
      setSubmitError("Por favor, verifica tu correo electrónico antes de enviar el formulario.")
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      console.log('Submitting form data:', formData)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log('Response from server:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar el usuario')
      }

      setSubmitSuccess(true)
      console.log('Usuario registrado correctamente', data)
    } catch (error) {
      setSubmitError(error.message)
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSendVerificationCode = async () => {
    if (!validateEmail(formData.email)) {
      setSubmitError("Por favor, ingresa un correo electrónico válido.")
      return
    }
    setIsVerifying(true)
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, action: 'send' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el código de verificación')
      }

      setIsVerifying(false)
      setSubmitError(null)
      alert("Código de verificación enviado. Por favor, revisa tu correo electrónico.")
    } catch (error) {
      setIsVerifying(false)
      setSubmitError(error.message)
    }
  }

  const handleVerifyCode = async () => {
    setIsVerifying(true)
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, action: 'verify', code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al verificar el código')
      }

      setIsVerifying(false)
      setEmailVerified(true)
      setSubmitError(null)
    } catch (error) {
      setIsVerifying(false)
      setSubmitError(error.message)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">Registrarse</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Registro de Usuario</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Completa tus datos para crear una cuenta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm sm:text-base">Nombre</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm sm:text-base">Apellido</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
                className="text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm sm:text-base">Número de teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
              className="text-sm sm:text-base"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm sm:text-base">Calle</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="streetNumber" className="text-sm sm:text-base">Altura</Label>
              <Input
                id="streetNumber"
                value={formData.streetNumber}
                onChange={(e) => setFormData({...formData, streetNumber: e.target.value})}
                required
                className="text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="province" className="text-sm sm:text-base">Provincia</Label>
            <Select
              value={formData.province}
              onValueChange={(value) => setFormData({...formData, province: value})}
            >
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Selecciona una provincia" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province} className="text-sm sm:text-base">
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="locality" className="text-sm sm:text-base">Localidad</Label>
            <Select
              value={formData.locality}
              onValueChange={(value) => setFormData({...formData, locality: value})}
              disabled={!formData.province}
            >
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Selecciona una localidad" />
              </SelectTrigger>
              <SelectContent>
                {availableLocalities.map((locality) => (
                  <SelectItem key={locality} value={locality} className="text-sm sm:text-base">
                    {locality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">Correo electrónico</Label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={emailVerified}
                className="text-sm sm:text-base flex-grow"
              />
              <Button
                type="button"
                onClick={handleSendVerificationCode}
                disabled={emailVerified || isVerifying}
                className="text-sm sm:text-base w-full sm:w-auto"
              >
                {isVerifying ? "Enviando..." : "Verificar"}
              </Button>
            </div>
          </div>
          {!emailVerified && (
            <div className="space-y-2">
              <Label htmlFor="verificationCode" className="text-sm sm:text-base">Código de verificación</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  className="text-sm sm:text-base flex-grow"
                />
                <Button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isVerifying}
                  className="text-sm sm:text-base w-full sm:w-auto"
                >
                  {isVerifying ? "Verificando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          )}
          {emailVerified && (
            <div className="text-[#091E05] flex items-center text-sm sm:text-base">
              <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Correo electrónico verificado
            </div>
          )}
          {submitError && (
            <div className="text-red-500 text-sm sm:text-base">{submitError}</div>
          )}
          {submitSuccess && (
            <div className="text-green-500 text-sm sm:text-base">Registro completado con éxito.</div>
          )}
          <Button
            type="submit"
            className="w-full bg-[#091E05] text-white hover:bg-[#092E05]/90 text-sm sm:text-base"
            disabled={isSubmitting || !emailVerified}
          >
            {isSubmitting ? "Enviando..." : "Registrarse"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}