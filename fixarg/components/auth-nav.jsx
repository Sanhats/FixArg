"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import Cookies from 'js-cookie'

export default function AuthNav() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const userData = Cookies.get('userData')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    Cookies.remove('authToken')
    Cookies.remove('userData')
    setUser(null)
    router.push('/')
  }

  if (!user) return null

  return (
    <div className="flex items-center space-x-4">
      <span>Bienvenido, {user.firstName}</span>
      <Button onClick={handleLogout} variant="outline">Cerrar sesión</Button>
    </div>
  )
}