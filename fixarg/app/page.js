"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Wrench,
  Drill,
  Truck,
  Brush,
  Hammer,
  PaintBucket,
  Leaf,
  Phone,
  Mail,
  MapPin,
  Quote,
  Check,
  Shield,
  Clock,
  Users,
  Calendar,
  FileCheck,
} from "lucide-react"
import BecomeTaskerForm from "@/components/become-tasker-form"
import LoginForm from "@/components/login-form"
import UserRegistrationForm from "@/components/user-registration-form"
import { useAuth } from "@/lib/AuthContext"
import { Logo } from "../components/ui/logo"

const CATEGORIAS = [
  { icon: Wrench, label: "Plomería", desc: "Arreglos e instalación.", categoria: "plomeria" },
  { icon: Drill, label: "Electricidad", desc: "Instalación y reparación.", categoria: "electricidad" },
  { icon: Truck, label: "Mudanza", desc: "Fletes.", categoria: "mudanza" },
  { icon: Brush, label: "Limpieza", desc: "Limpieza a fondo.", categoria: "limpieza" },
  { icon: Leaf, label: "Jardinería", desc: "Poda y mantenimiento.", categoria: "jardineria" },
  { icon: Hammer, label: "Carpintería", desc: "Muebles y madera.", categoria: "carpinteria" },
  { icon: PaintBucket, label: "Pintura", desc: "Interior y exterior.", categoria: "pintura" },
]

const BENEFICIOS_HERO = [
  { Icon: Users, text: "Fixers verificados" },
  { Icon: Shield, text: "Todo claro de entrada" },
  { Icon: MapPin, text: "Profesionales de acá" },
  { Icon: Calendar, text: "Vos elegís día y hora" },
]

const GARANTIAS = [
  { Icon: Users, text: "Solo Fixers chequeados" },
  { Icon: FileCheck, text: "Precio y tiempo visibles" },
  { Icon: Clock, text: "Respuesta en 24 h" },
  { Icon: Shield, text: "Laburo con nombre y apellido" },
]

const PASOS = [
  { num: 1, titulo: "Publicás tu pedido", desc: "Describís el laburo y los Fixers lo ven." },
  { num: 2, titulo: "Elegís a tu Fixer", desc: "Ves perfil, precio y coordinás." },
  { num: 3, titulo: "Se hace el trabajo", desc: "Viene, lo resuelve y listo." },
]

const TESTIMONIOS = [
  { texto: "Llegó en hora, hizo bien el laburo. Lo recomiendo.", nombre: "María", lugar: "CABA" },
  { texto: "En FixArg encontré al que necesitaba al toque.", nombre: "Juan", lugar: "Buenos Aires" },
]

const NAV_LINKS = [
  { label: "Servicios", href: "#servicios" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Contacto", href: "#cta" },
]

// Imágenes que cargan en Unsplash (IDs estables)
const HERO_IMG = "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80"
const COMO_FUNCIONA_IMG = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80"

export default function HomePage() {
  const { isLoggedIn, isCliente, isTrabajador, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) return
    if (isTrabajador) router.replace("/trabajador/dashboard")
    else if (isCliente) router.replace("/servicios")
  }, [isLoading, isLoggedIn, isTrabajador, isCliente, router])

  const handleServiciosClick = (e, categoria) => {
    e.preventDefault()
    const path = categoria ? `/servicios?categoria=${encodeURIComponent(categoria)}` : "/servicios"
    if (isLoggedIn) {
      router.push(path)
    } else {
      router.push(`/login?next=${encodeURIComponent(path)}`)
    }
  }

  const handleVerServiciosClick = (e) => {
    e.preventDefault()
    if (isLoggedIn) {
      router.push("/servicios")
    } else {
      router.push("/login?next=/servicios")
    }
  }

  const scrollTo = (href) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-[#71816D] font-medium">Cargando...</div>
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-[#71816D] font-medium">Redirigiendo...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white" id="inicio">
      {/* ——— Navbar única (estilo HomePro) ——— */}
      <header className="bg-[#091E05] sticky top-0 z-50 border-b border-white/5">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <Logo className="py-2 [&_img]:invert opacity-95 hover:opacity-100 transition-opacity" />
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(({ label, href }) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => scrollTo(href)}
                  className="text-white/90 hover:text-white text-sm font-medium transition-colors"
                >
                  {label}
                </button>
              ))}
              <LoginForm
                triggerClassName="text-white/90 hover:text-white text-sm font-medium flex items-center gap-2"
                triggerVariant="ghost"
              />
            </div>
            <div className="flex items-center gap-3">
              <LoginForm
                triggerClassName="md:hidden text-white/90 hover:text-white text-sm"
                triggerVariant="ghost"
              />
              <Button
                size="sm"
                onClick={handleVerServiciosClick}
                className="bg-[#71816D] hover:bg-[#71816D]/90 text-white font-semibold rounded-sm px-5 h-9"
              >
                Ver servicios
              </Button>
              <Button asChild size="sm" variant="ghost" className="text-white/90 hover:text-white hidden md:inline-flex">
                <Link href="/trabajador/login">Soy profesional</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* ——— Hero: dos columnas (imagen | título + checks + CTA + 4 beneficios) ——— */}
      <section className="bg-[#091E05] min-h-[90vh] flex flex-col lg:flex-row">
        <div className="relative flex-1 min-h-[40vh] lg:min-h-0 lg:w-[45%] order-2 lg:order-1">
          <Image
            src={HERO_IMG}
            alt="Persona trabajando en un arreglo del hogar"
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </div>
        <div className="flex-1 flex flex-col justify-center px-4 py-12 lg:py-16 lg:pl-16 lg:pr-8 order-1 lg:order-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4">
            El lugar para encontrar al que arregla
          </h1>
          <p className="text-lg text-white/90 mb-8">
            En FixArg publicás lo que necesitás y elegís entre profesionales verificados. Laburo claro, gente de acá.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <LoginForm
              triggerClassName="bg-[#71816D] hover:bg-[#71816D]/90 text-white font-semibold rounded-sm px-8 h-12 text-base border-0"
              triggerVariant="outline"
            />
            <UserRegistrationForm
              triggerClassName="bg-white/10 text-white border-2 border-white hover:bg-white/20 font-semibold rounded-sm px-8 h-12 text-base"
              triggerVariant="outline"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-white/90 text-sm">
            {BENEFICIOS_HERO.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-[#71816D] shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Servicios (grid + CTA) ——— */}
      <section id="servicios" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#091E05] mb-2">Servicios</h2>
          <p className="text-gray-600 mb-10 max-w-xl">Elegí la categoría y encontrá Fixers cerca tuyo.</p>
          <div className="grid lg:grid-cols-[1fr_280px] gap-8 lg:gap-10">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIAS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => handleServiciosClick(e, item.categoria)}
                  className="group text-left p-5 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#71816D]/30 transition-all"
                >
                  <div className="p-3 rounded-lg bg-[#091E05]/5 w-fit mb-3 group-hover:bg-[#71816D]/10 transition-colors">
                    <item.icon className="h-6 w-6 text-[#71816D]" />
                  </div>
                  <h3 className="font-semibold text-[#091E05] mb-1">{item.label}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </button>
              ))}
            </div>
            <div className="lg:flex flex-col">
              <div className="bg-[#71816D] text-white p-6 rounded-lg h-fit lg:sticky lg:top-24">
                <p className="text-sm font-medium mb-4">¿Tenés un laburo? Entrá y publicalo.</p>
                <div className="space-y-2">
                  <LoginForm
                    triggerClassName="w-full bg-white text-[#71816D] hover:bg-white/95 font-semibold rounded-sm h-11 border-0"
                    triggerVariant="outline"
                  />
                  <UserRegistrationForm
                    triggerClassName="w-full bg-white/10 text-white border border-white hover:bg-white/20 font-semibold rounded-sm h-11"
                    triggerVariant="outline"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— En buena onda (fondo oscuro) ——— */}
      <section className="py-16 md:py-20 bg-[#091E05]">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
            Así trabaja FixArg
          </h2>
          <p className="text-white/80 text-center mb-12 max-w-xl mx-auto">Verificamos a los profesionales. Vos ves precio y tiempo antes de elegir. Todo con nombre y apellido.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
            {GARANTIAS.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-4 text-white">
                <div className="p-3 rounded-lg bg-white/10 shrink-0">
                  <Icon className="h-6 w-6 text-[#71816D]" />
                </div>
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Cómo funciona FixArg (imagen | pasos numerados) ——— */}
      <section id="como-funciona" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-xl order-2 lg:order-1">
              <Image
                src={COMO_FUNCIONA_IMG}
                alt="Profesional trabajando"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute top-4 right-4 p-2 rounded-full bg-[#71816D] text-white">
                <Check className="h-6 w-6" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#091E05] mb-8">
                Cómo funciona FixArg
              </h2>
              <ul className="space-y-6">
                {PASOS.map(({ num, titulo, desc }) => (
                  <li key={num} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#71816D] text-white font-bold">
                      {num}
                    </span>
                    <div>
                      <h3 className="font-semibold text-[#091E05] mb-1">{titulo}</h3>
                      <p className="text-gray-600 text-sm">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Testimonios ——— */}
      <section id="testimonios" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#091E05] text-center mb-2">
            Lo que dicen
          </h2>
          <p className="text-gray-600 text-center mb-10">Quienes ya usaron FixArg.</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {TESTIMONIOS.map((t, i) => (
              <div key={i} className="bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-100">
                <Quote className="h-10 w-10 text-[#71816D] mb-4" strokeWidth={1.5} />
                <p className="text-gray-600 mb-4">&quot;{t.texto}&quot;</p>
                <p className="font-semibold text-[#091E05]">{t.nombre}</p>
                <p className="text-sm text-gray-500">{t.lugar}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA + Contacto ——— */}
      <section id="cta" className="py-16 md:py-20 bg-[#091E05]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Entrá a FixArg
            </h2>
            <p className="text-white/80 mb-6">Registrate como cliente o sumate como Fixer.</p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <LoginForm
                triggerClassName="bg-[#71816D] hover:bg-[#71816D]/90 text-white font-semibold rounded-sm px-8 h-12 border-0"
                triggerVariant="outline"
              />
              <UserRegistrationForm
                triggerClassName="border-2 border-white text-white hover:bg-white/10 font-semibold rounded-sm px-8 h-12"
                triggerVariant="outline"
              />
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
                <Link href="/trabajador/login">Soy profesional</Link>
              </Button>
            </div>
            <p className="text-white/70 text-sm mb-4">Cualquier duda:</p>
            <div className="flex flex-wrap justify-center gap-6 text-white/90 text-sm">
              <a href="tel:+5491112345678" className="flex items-center gap-2 hover:text-white">
                <Phone className="h-5 w-5" /> +54 9 11 1234-5678
              </a>
              <a href="mailto:info@fixarg.com" className="flex items-center gap-2 hover:text-white">
                <Mail className="h-5 w-5" /> info@fixarg.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Footer ——— */}
      <footer className="bg-[#0a2610] text-white pt-12 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
            <div>
              <Logo className="mb-4 [&_img]:invert opacity-95" />
              <p className="text-white/70 text-sm">
                FixArg: quien necesita un arreglo encuentra al que lo hace. Acá en Argentina.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Empresa</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li><button type="button" onClick={() => scrollTo("#servicios")} className="hover:text-white text-left">Servicios</button></li>
                <li><button type="button" onClick={() => scrollTo("#como-funciona")} className="hover:text-white text-left">Cómo funciona</button></li>
                <li><Link href="/trabajador/login" className="hover:text-white">Soy profesional</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Contacto</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="tel:+5491112345678" className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" /> +54 9 11 1234-5678</a></li>
                <li><a href="mailto:info@fixarg.com" className="flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" /> info@fixarg.com</a></li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Argentina</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white/80">Términos y condiciones</Link>
              <Link href="#" className="hover:text-white/80">Política de privacidad</Link>
            </div>
            <p>© {new Date().getFullYear()} FixArg. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
