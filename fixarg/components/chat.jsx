'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function Chat({ solicitudId, trabajadorId, currentUserId, receptorId, readOnly = false }) {
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const { user, getToken } = useAuth()
  const myId = currentUserId ?? user?._id
  const otherId = receptorId ?? trabajadorId

  useEffect(() => {
    cargarMensajes()
    const interval = setInterval(cargarMensajes, 3000)
    return () => clearInterval(interval)
  }, [solicitudId])

  const cargarMensajes = async () => {
    if (!solicitudId) return
    try {
      const token = getToken()
      const response = await fetch(`/api/mensajes?solicitudId=${solicitudId}&_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Error al cargar mensajes')
      const data = await response.json()
      setMensajes(Array.isArray(data) ? data : [])
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
          emisorId: myId,
          receptorId: otherId,
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
              key={mensaje._id || index} 
              className={`p-3 rounded-lg max-w-[80%] ${
                String(mensaje.emisorId || '').toLowerCase() === String(myId || '').toLowerCase()
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
      {readOnly ? (
        <div className="p-3 border-t bg-muted/30 text-center text-sm text-muted-foreground">
          Conversación cerrada. Los mensajes se mantienen guardados.
        </div>
      ) : (
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
      )}
    </div>
  )
}