"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = Cookies.get('authToken')
        const userData = Cookies.get('userData')
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          
          // Validate user data structure
          if (parsedUser && parsedUser._id && parsedUser.email) {
            setIsLoggedIn(true)
            setUser(parsedUser)
          } else {
            console.warn('Invalid user data structure:', parsedUser)
            logout()
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error)
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = (token, userData) => {
    try {
      // Validate required user data
      if (!userData || !userData._id || !userData.email) {
        console.error('Invalid user data provided:', userData)
        throw new Error('Datos de usuario inválidos')
      }

      // Store the data
      Cookies.set('authToken', token, { expires: 7 })
      Cookies.set('userData', JSON.stringify(userData), { expires: 7 })
      
      // Update state
      setIsLoggedIn(true)
      setUser(userData)
      
      console.log('Login successful:', { isLoggedIn: true, user: userData })
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
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

  const value = {
    isLoggedIn,
    user,
    login,
    logout,
    getToken,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}