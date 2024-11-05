"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, Wrench, Drill, Truck, Brush, Hammer, PaintBucket, Flame, Leaf } from "lucide-react"
import BecomeTaskerForm from "@/components/become-tasker-form"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-[#324376]">
              FixArg
            </Link>
            <div className="flex items-center gap-4 text-[#71816D]">
              <Button variant="ghost">Servicios</Button>
              <Button variant="ghost">Registrarse / Iniciar sesion</Button>
              <BecomeTaskerForm />

            </div>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="relative">
          

         
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-[#324376]/2 rounded-full -z-10 blur-3xl" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#324376] rounded-full -z-10 blur-3xl" />

          <div className="max-w-3xl mx-auto text-center pt-20 pb-12">
            <h1 className="text-5xl font-bold text-[#324376] mb-12">
            Confía en profesionales,              <br />
            confía en resultados.            </h1>

            <div className="relative">
              <Input
                type="text"
                placeholder="En que podemos ayudarte?"
                className="w-full h-14 pl-6 pr-16 text-lg rounded-full border-2 border-gray-200 focus:border-[#14A800]"
              />
              <Button 
                className="absolute right-2 top-2 bg-[#324376]/ h-10 w-10 rounded-full p-0 hover:bg-[#14A800]/90"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-8 max-w-4xl mx-auto">
            <Link href="#" className="flex flex-col items-center gap-2 group">
              <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Wrench className="w-6 h-6 text-[#324376]" />
              </div>
              <span className="text-sm text-[#324376]">Ensamblaje</span>
            </Link>
            
            <Link href="#" className="flex flex-col items-center gap-2 group">
              <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Drill className="w-6 h-6 text-[#324376]" />
              </div>
              <span className="text-sm text-[#324376]">Montaje</span>
            </Link>
            
            <Link href="#" className="flex flex-col items-center gap-2 group">
              <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Truck className="w-6 h-6 text-[#324376]" />
              </div>
              <span className="text-sm text-[#324376]">Mudanza</span>
            </Link>
            
            <Link href="#" className="flex flex-col items-center gap-2 group">
              <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Brush className="w-6 h-6 text-[#324376]" />
              </div>
              <span className="text-sm text-[#324376]">Limpieza</span>
            </Link>
            
            <Link href="#" className="flex flex-col items-center gap-2 group">
              <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Leaf className="w-6 h-6 text-[#324376]" />
              </div>
              <span className="text-sm text-[#324376]">Ayuda en exteriores</span>
            </Link>
            
            <Link href="#" className="flex flex-col items-center gap-2 group">
              <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Hammer className="w-6 h-6 text-[#324376]" />
              </div>
              <span className="text-sm text-[#324376]">Reparaciones del Hogar</span>
            </Link>
            
            <Link href="#" className="flex flex-col items-center gap-2 group">
              <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <PaintBucket className="w-6 h-6 text-[#324376]" />
              </div>
              <span className="text-sm text-[#324376]">Pintura</span>
            </Link>
            
            
          </div>
        </div>
      </main>
    </div>
  )
}