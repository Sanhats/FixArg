'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function Chat({ solicitudId, trabajadorId }) {
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const { user, getToken } = useAuth()

  useEffect(() => {
    cargarMensajes()
    const interval = setInterval(cargarMensajes, 5000) // Actualizar cada 5 segundos
    return () => clearInterval(interval)
  }, [solicitudId])

  const cargarMensajes = async () => {
    try {
      const token = getToken()
      const response = await fetch(`/api/mensajes?solicitudId=${solicitudId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Error al cargar mensajes')
      const data = await response.json()
      setMensajes(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const enviarMensaje = async (e) => {
    e.preventDefault()
    if (!nuevoMensaje.trim()) return

    try {
      const token = getToken()
      const response = await fetch('/api/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contenido: nuevoMensaje,
          emisorId: user._id,
          receptorId: trabajadorId,
          solicitudId: solicitudId
        })
      })

      if (!response.ok) throw new Error('Error al enviar mensaje')
      
      setNuevoMensaje('')
      cargarMensajes()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="flex flex-col h-[400px] border rounded-lg">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {mensajes.map((mensaje, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg max-w-[80%] ${
                mensaje.emisorId === user._id 
                  ? 'ml-auto bg-blue-100' 
                  : 'bg-gray-100'
              }`}
            >
              <p className="text-sm">{mensaje.contenido}</p>
              <span className="text-xs text-gray-500">
                {new Date(mensaje.fechaCreacion).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={enviarMensaje} className="flex p-2 border-t">
        <Input
          type="text"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-grow mr-2"
        />
        <Button type="submit">Enviar</Button>
      </form>
    </div>
  )
}