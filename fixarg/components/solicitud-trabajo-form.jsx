'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from '@/lib/AuthContext'

export default function SolicitudTrabajoForm({ trabajador, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    descripcion: '',
    fecha: '',
    hora: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          trabajadorId: trabajador._id,
          usuarioId: user._id,
          estado: 'pendiente'
        }),
      })

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud')
      }

      const data = await response.json()
      onSubmit(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Hubo un error al enviar la solicitud. Por favor, intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
          Descripción del trabajo
        </label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          required
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
          Fecha preferida
        </label>
        <Input
          type="date"
          id="fecha"
          value={formData.fecha}
          onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
          required
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="hora" className="block text-sm font-medium text-gray-700">
          Hora preferida
        </label>
        <Input
          type="time"
          id="hora"
          value={formData.hora}
          onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
          required
          className="mt-1"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
        </Button>
      </div>
    </form>
  )
}