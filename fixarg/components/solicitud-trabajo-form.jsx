'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from '@/lib/AuthContext'

export default function SolicitudTrabajoForm({ trabajador, usuario, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    descripcion: '',
    fecha: '',
    hora: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const { getToken } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar que tenemos toda la información necesaria
      if (!trabajador?._id || !usuario?._id) {
        throw new Error('Información de usuario o trabajador no disponible')
      }

      // Validar que todos los campos estén completos
      if (!formData.descripcion || !formData.fecha || !formData.hora) {
        throw new Error('Por favor, complete todos los campos')
      }

      const token = getToken()
      if (!token) {
        throw new Error('No se encontró el token de autenticación')
      }

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
          trabajadorId: trabajador._id,
          usuarioId: usuario._id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la solicitud')
      }

      onSubmit(data)
    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
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
  )
}