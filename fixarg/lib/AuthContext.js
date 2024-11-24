"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = Cookies.get('authToken')
    const userData = Cookies.get('userData')
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const login = (token, userData) => {
    Cookies.set('authToken', token, { expires: 7 })
    Cookies.set('userData', JSON.stringify(userData), { expires: 7 })
    setIsLoggedIn(true)
    setUser(userData)
  }

  const logout = () => {
    Cookies.remove('authToken')
    Cookies.remove('userData')
    setIsLoggedIn(false)
    setUser(null)
  }

  const getToken = () => {
    return Cookies.get('authToken')
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)