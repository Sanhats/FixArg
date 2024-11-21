"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
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

export default function HomePage() {
  const { isLoggedIn, user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-[#324376]">
              FixArg
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4 text-[#71816D]">
              <Link href="/servicios">
                <Button variant="ghost" className="mr-2">Servicios</Button>
              </Link>
              {isLoggedIn ? (
                <>
                  <span>Bienvenido, {user?.firstName}</span>
                  <Button onClick={logout} variant="outline">Cerrar sesión</Button>
                </>
              ) : (
                <>
                  <UserRegistrationForm />
                  <LoginForm />
                  <BecomeTaskerForm />
                </>
              )}
            </div>
            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-2">
              {isLoggedIn ? (
                <Button onClick={logout} variant="outline">Cerrar sesión</Button>
              ) : (
                <BecomeTaskerForm />
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Menú</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-4">
                    <Button variant="ghost" className="w-full justify-start">
                      Servicios
                    </Button>
                    {isLoggedIn ? (
                      <>
                        <span>Bienvenido, {user?.firstName}</span>
                        <Button onClick={logout} variant="outline">Cerrar sesión</Button>
                      </>
                    ) : (
                      <>
                        <UserRegistrationForm />
                        <LoginForm />
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="relative">
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-[#324376]/2 rounded-full -z-10 blur-3xl" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#324376] rounded-full -z-10 blur-3xl" />

          <div className="max-w-3xl mx-auto text-center pt-8 md:pt-20 pb-8 md:pb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-[#324376] mb-8 md:mb-12">
              Confía en profesionales,
              <br />
              confía en resultados.
            </h1>

            <div className="relative max-w-xl mx-auto">
              <Input
                type="text"
                placeholder="¿En qué podemos ayudarte?"
                className="w-full h-12 md:h-14 pl-6 pr-16 text-base md:text-lg rounded-full border-2 border-gray-200 focus:border-[#14A800]"
              />
              <Button 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#324376] h-8 w-8 md:h-10 md:w-10 rounded-full p-0 hover:bg-[#14A800]/90"
                aria-label="Search"
              >
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-8 max-w-4xl mx-auto">
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
                className="flex flex-col items-center gap-2 group p-2"
              >
                <div className="p-3 md:p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <service.icon className="w-5 h-5 md:w-6 md:h-6 text-[#324376]" />
                </div>
                <span className="text-xs md:text-sm text-center text-[#324376]">{service.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}