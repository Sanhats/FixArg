"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Wrench, Drill, Truck, Brush, Hammer, PaintBucket, Leaf, Menu, X } from "lucide-react"
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet"
import BecomeTaskerForm from "@/components/become-tasker-form"
import UserRegistrationForm from "@/components/user-registration-form"
import LoginForm from "@/components/login-form"
import { useAuth } from "@/lib/AuthContext"
import { Logo } from "../components/ui/logo"

export default function HomePage() {
  const { isLoggedIn, user, logout } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleServiciosClick = (e) => {
    e.preventDefault()
    if (isLoggedIn) {
      router.push("/servicios")
    } else {
      alert("Por favor, inicia sesión para ver los servicios.")
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery)
    }
  }

  const services = [
    { icon: Wrench, label: "Ensamblaje", color: "bg-amber-100" },
    { icon: Drill, label: "Montaje", color: "bg-blue-100" },
    { icon: Truck, label: "Mudanza", color: "bg-green-100" },
    { icon: Brush, label: "Limpieza", color: "bg-purple-100" },
    { icon: Leaf, label: "Ayuda en exteriores", color: "bg-orange-100" },
    { icon: Hammer, label: "Reparaciones", color: "bg-red-100" },
    { icon: PaintBucket, label: "Pintura", color: "bg-teal-100" },
  ]

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="bg-[#71816D] z-50 shadow-md">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <Logo className="py-2" />

            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 transition-colors font-medium"
                onClick={handleServiciosClick}
              >
                Servicios
              </Button>

              {isLoggedIn ? (
                <div className="flex items-center gap-3 bg-white/10 rounded-full pl-4 pr-1 py-1">
                  <span className="text-white font-medium">Hola, {user?.firstName}</span>
                  <Button
                    onClick={logout}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 rounded-full h-8"
                  >
                    Cerrar sesión
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LoginForm />
                  <UserRegistrationForm />
                  <BecomeTaskerForm />
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent className="bg-[#71816D] border-l border-white/20 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <Logo className="h-8 w-auto" />
              <SheetClose className="rounded-full p-1 hover:bg-white/10">
                <X className="h-5 w-5 text-white" />
              </SheetClose>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="flex flex-col gap-3 mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 font-medium"
                  onClick={handleServiciosClick}
                >
                  Servicios
                </Button>

                {isLoggedIn ? (
                  <div className="bg-white/10 rounded-lg p-4 mt-2">
                    <p className="text-white mb-2">Bienvenido, {user?.firstName}</p>
                    <Button
                      onClick={logout}
                      variant="outline"
                      className="w-full bg-white text-[#71816D] hover:bg-white/90 border-white"
                    >
                      Cerrar sesión
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 mt-2">
                    <LoginForm />
                    <UserRegistrationForm />
                    <BecomeTaskerForm />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content - centered layout with organized services */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-1/3 h-full bg-[#71816D]/5 rounded-br-[100px]"></div>
          <div className="absolute bottom-0 right-0 w-1/3 h-2/3 bg-[#71816D]/5 rounded-tl-[100px]"></div>
        </div>

        {/* Main content structure */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Top services row */}
          <div className="pt-6 px-6">
            <div className="max-w-4xl mx-auto grid grid-cols-7 gap-2">
              {services.map((service, index) => (
                <Link
                  key={index}
                  href="#"
                  onClick={handleServiciosClick}
                  className="group flex flex-col items-center gap-1 p-2 rounded-lg hover:shadow-sm transition-all duration-200"
                >
                  <div
                    className={`p-3 rounded-full ${service.color} group-hover:scale-110 transition-transform duration-200`}
                  >
                    <service.icon className="w-5 h-5 text-[#71816D]" />
                  </div>
                  <span className="text-xs text-center text-[#091E05] font-medium">{service.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Centered content */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="max-w-xl w-full text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-[#091E05] mb-4 leading-tight">
                Confía en profesionales,
                <span className="text-[#71816D] block">confía en resultados.</span>
              </h1>

              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Encuentra expertos calificados para cualquier tarea que necesites realizar.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="relative mb-6 max-w-md mx-auto">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿En qué podemos ayudarte?"
                  className="w-full h-14 pl-5 pr-14 text-base rounded-full border-2 border-[#71816D] focus-visible:ring-[#71816D]/30 transition-all shadow-sm"
                />
                <Button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#71816D] h-11 w-11 rounded-full p-0 hover:bg-[#71816D]/90 transition-colors"
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5 text-white" />
                </Button>
              </form>

              {/* CTA buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button className="bg-[#71816D] hover:bg-[#71816D]/90 text-white px-6" onClick={handleServiciosClick}>
                  Explorar servicios
                </Button>
                <BecomeTaskerForm buttonClassName="bg-white border-2 border-[#71816D] text-[#71816D] hover:bg-[#71816D]/10 px-6" />
              </div>
            </div>
          </div>

          {/* Bottom section with testimonial */}
          <div className="pb-6 px-6">
            <div className="max-w-4xl mx-auto flex justify-end">
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 max-w-xs">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm">
                  "El servicio fue excelente. El profesional llegó puntual y trabajó eficientemente."
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full bg-[#71816D]/20 flex items-center justify-center text-[#71816D] font-bold text-xs">
                    A
                  </div>
                  <p className="text-xs font-medium text-[#091E05]">Cliente Satisfecho</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

