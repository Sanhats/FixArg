"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Search, Wrench, Drill, Truck, Brush, Hammer, PaintBucket, Leaf, Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import BecomeTaskerForm from "@/components/become-tasker-form"
import UserRegistrationForm from "@/components/user-registration-form"
import LoginForm from "@/components/login-form"
import { useAuth } from '@/lib/AuthContext'
import { Logo } from '../components/ui/logo'

export default function HomePage() {
  const { isLoggedIn, user, logout } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleServiciosClick = (e) => {
    e.preventDefault()
    if (isLoggedIn) {
      router.push('/servicios')
    } else {
      alert('Por favor, inicia sesión para ver los servicios.')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-[#71816D] z-50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <Logo className="py-2" />
            <div className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                className="text-white  transition-colors" 
                onClick={handleServiciosClick}
              >
                Servicios
              </Button>
              {isLoggedIn ? (
                <>
                  <span className="text-white">Bienvenido, {user?.firstName}</span>
                  <Button 
                    onClick={logout} 
                    variant="outline" 
                    className="bg-white text-[#71816D] hover:bg-white/90 border-white transition-all"
                  >
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <>
                  <UserRegistrationForm />
                  <LoginForm />
                  <BecomeTaskerForm />
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </nav>
        </div>
      </header>
      
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent className="bg-[#71816D] border-l border-white/20">
          <SheetHeader>
            <SheetTitle className="text-white">Menú</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-8">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-white hover:text-white/90"
              onClick={handleServiciosClick}
            >
              Servicios
            </Button>
            {isLoggedIn ? (
              <>
                <span className="text-white">Bienvenido, {user?.firstName}</span>
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  className="bg-white text-[#71816D] hover:bg-white/90 border-white"
                >
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <UserRegistrationForm />
                <LoginForm />
                <BecomeTaskerForm />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#091E05] mb-12 leading-tight">
            Confía en profesionales,
            <br />
            confía en resultados.
          </h1>

          <div className="relative max-w-2xl mx-auto mb-16">
            <Input
              type="text"
              placeholder="¿En qué podemos ayudarte?"
              className="w-full h-14 pl-6 pr-16 text-lg rounded-full border-2 border-[#71816D] focus:ring-2 focus:ring-[#71816D]/20 transition-all"
            />
            <Button 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#71816D] h-10 w-10 rounded-full p-0 hover:bg-[#71816D]/90 transition-colors"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5 text-white" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Wrench, label: "Ensamblaje" },
              { icon: Drill, label: "Montaje" },
              { icon: Truck, label: "Mudanza" },
              { icon: Brush, label: "Limpieza" },
              { icon: Leaf, label: "Ayuda en exteriores" },
              { icon: Hammer, label: "Reparaciones del Hogar" },
              { icon: PaintBucket, label: "Pintura" },
            ].map((service, index) => (
              <Link
                key={index}
                href="#"
                className="group flex flex-col items-center gap-3 p-4"
              >
                <div className="p-4 rounded-full bg-[#F5F5F5] group-hover:bg-[#E8E8E8] transition-colors duration-200">
                  <service.icon className="w-6 h-6 text-[#71816D]" />
                </div>
                <span className="text-sm text-center text-[#091E05] font-medium">
                  {service.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

