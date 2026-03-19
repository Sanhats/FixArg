'use client'

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Check, Upload, ChevronRight, Home } from 'lucide-react'

const provinces = [
  "Tucumán"
  // Add other provinces here
]

const SKILLS_OPTIONS = [
  'Plomería', 'Gasista Matriculado', 'Electricidad', 'Albañil', 'Pintor', 'Carpintería',
  'Herrero', 'Techista', 'Instalador de Aire', 'Jardinería', 'Cerrajería', 'Fletero', 'Mudanza', 'Limpieza',
]

export default function BecomeTaskerForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const TOTAL_STEPS = 5
  const [progress, setProgress] = useState(20)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    profilePicture: null,
    profilePhotoUrl: "",
    description: "",
    occupation: "",
    skills: [],
    skillsJson: [],
    email: "",
    phone: "",
    hourlyRate: "",
    province: "",
    password: "",
    documentAntecedentesUrl: "",
    dniFrenteUrl: "",
    dniReversoUrl: "",
    experience: "",
    tools: "",
    zones: "",
    availability: "",
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [uploading, setUploading] = useState(null)

  const handleNext = () => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
    setProgress((p) => Math.min(p + 20, 100))
  }

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1))
    setProgress((p) => Math.max(p - 20, 20))
  }

  const uploadFile = async (file, folder) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/upload?folder=${folder}`, { method: 'POST', body: fd })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al subir')
    }
    const data = await res.json()
    return data.url
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!emailVerified) {
      setSubmitError("Por favor, verifica tu correo electrónico antes de enviar la solicitud.")
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    let profilePhotoUrl = formData.profilePhotoUrl
    if (formData.profilePicture && !profilePhotoUrl) {
      try {
        profilePhotoUrl = await uploadFile(formData.profilePicture, 'profile')
      } catch (err) {
        setSubmitError(err.message || 'Error al subir la foto de perfil')
        setIsSubmitting(false)
        return
      }
    }
    try {
      const skillsJson = (formData.skillsJson || []).filter(s => s.skill && (s.hourlyRate > 0 || s.hourlyRate === '0'))
      const firstSkill = skillsJson[0]
      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: formData.displayName,
        description: formData.description,
        occupation: formData.occupation || firstSkill?.skill,
        email: formData.email,
        phone: formData.phone,
        hourlyRate: firstSkill ? Number(firstSkill.hourlyRate) : parseFloat(formData.hourlyRate) || 0,
        province: formData.province,
        password: formData.password,
        documentAntecedentesUrl: formData.documentAntecedentesUrl || undefined,
        dniFrenteUrl: formData.dniFrenteUrl || undefined,
        dniReversoUrl: formData.dniReversoUrl || undefined,
        profilePhotoUrl: profilePhotoUrl || undefined,
        experience: formData.experience || undefined,
        tools: formData.tools || undefined,
        zones: formData.zones || undefined,
        availability: formData.availability || undefined,
        skillsJson: skillsJson.length ? skillsJson : undefined,
      }

      const response = await fetch('/api/taskers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejo específico para el error 409 (Conflict)
        if (response.status === 409) {
          throw new Error('Ya existe un trabajador registrado con este correo electrónico. Por favor, utiliza otro correo o inicia sesión si ya tienes una cuenta.')
        }
        throw new Error(data.error || data.message || 'Error al enviar los datos')
      }

      setProgress(100)
      setSubmitSuccess(true)
      console.log('Datos enviados correctamente', data)
    } catch (error) {
      setSubmitError(error.message)
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, profilePicture: file });
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, profilePicture: null });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendVerificationCode = async () => {
    if (!validateEmail(formData.email)) {
      setSubmitError("Por favor, ingresa un correo electrónico válido.");
      return;
    }
    setIsVerifying(true);
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, action: 'send' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el código de verificación');
      }

      setIsVerifying(false);
      setSubmitError(null);
      if (data.devCode) {
        alert(`${data.message || 'En desarrollo'} ${data.devCode}\n\nCopia el código y pégalo en el campo de verificación.`);
      } else {
        alert("Código de verificación enviado. Por favor, revisa tu correo electrónico.");
      }
    } catch (error) {
      setIsVerifying(false);
      setSubmitError(error.message);
    }
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, action: 'verify', code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al verificar el código');
      }

      setIsVerifying(false);
      setEmailVerified(true);
      setSubmitError(null);
    } catch (error) {
      setIsVerifying(false);
      setSubmitError(error.message);
    }
  };

  if (submitSuccess) {
    return (
      <Dialog open>
        <DialogContent className="sm:max-w-[500px]">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#091E05] flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-center text-xl sm:text-2xl">¡Solicitud enviada!</DialogTitle>
              <CardDescription className="text-center text-sm sm:text-base space-y-2">
                <p>Gracias por unirte. La plataforma realizará la verificación de antecedentes e identidad con los documentos que subiste.</p>
                <p>Te avisaremos cuando tu cuenta esté aprobada y podrás empezar a recibir trabajos.</p>
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="w-full sm:w-auto bg-[#14A800] text-white hover:bg-[#14A800]/90" onClick={() => router.push('/')}>
                <Home className="mr-2 h-4 w-4" />
                Ir al inicio
              </Button>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-[#71816D] text-white hover:bg-[#71856D]/90">
          Ofrece tu servicio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Ofrece tu servicio</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
          Ingresa a nuestra comunidad de profesionales
          </DialogDescription>
        </DialogHeader>
        
        <Progress value={progress} className="mb-4 color-[#324376]" />
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm shrink-0 ${step >= s ? 'bg-[#091E05] text-white' : 'bg-gray-200'}`}>{s}</div>
              {s < 5 && <div className="h-px flex-1 bg-gray-200 min-w-0" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium">1. Crear cuenta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={emailVerified} className="flex-grow" />
                  <Button type="button" onClick={handleSendVerificationCode} disabled={emailVerified || isVerifying}>{isVerifying ? "Enviando..." : "Verificar"}</Button>
                </div>
              </div>
              {!emailVerified && (
                <div className="space-y-2">
                  <Label>Código de verificación</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Código del correo" className="flex-grow" />
                    <Button type="button" onClick={handleVerifyCode} disabled={isVerifying}>{isVerifying ? "Verificando..." : "Confirmar"}</Button>
                  </div>
                </div>
              )}
              {emailVerified && <p className="text-[#091E05] flex items-center text-sm"><Check className="mr-2 h-4 w-4" /> Correo verificado</p>}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium">2. Documento antecedentes penales</h3>
              <p className="text-sm text-muted-foreground">Sube tu certificado de antecedentes penales (imagen o PDF). La plataforma verificará este documento.</p>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="antecedentes"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading('antecedentes')
                    setSubmitError(null)
                    try {
                      const url = await uploadFile(file, 'antecedentes')
                      setFormData((f) => ({ ...f, documentAntecedentesUrl: url }))
                    } catch (err) {
                      setSubmitError(err.message)
                    } finally {
                      setUploading(null)
                    }
                  }}
                />
                <Label htmlFor="antecedentes" className="cursor-pointer flex flex-col items-center gap-2 py-4">
                  <Upload className="h-10 w-10 text-[#71816D]" />
                  <span className="text-sm">{uploading === 'antecedentes' ? 'Subiendo...' : formData.documentAntecedentesUrl ? '✓ Documento subido' : 'Haz clic para subir'}</span>
                </Label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium">3. Verificación identidad - DNI</h3>
              <p className="text-sm text-muted-foreground">Sube foto del DNI (frente y reverso). Sirve para verificar tu identidad.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border-2 border-dashed rounded-lg p-4">
                  <Label className="text-sm font-medium">DNI frente</Label>
                  <input type="file" accept="image/*" className="hidden" id="dni-frente"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading('dni-frente')
                      setSubmitError(null)
                      try {
                        const url = await uploadFile(file, 'dni')
                        setFormData((f) => ({ ...f, dniFrenteUrl: url }))
                      } catch (err) { setSubmitError(err.message) }
                      finally { setUploading(null) }
                    }} />
                  <Label htmlFor="dni-frente" className="cursor-pointer flex flex-col items-center gap-2 py-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-xs">{formData.dniFrenteUrl ? '✓ Subido' : 'Subir frente'}</span>
                  </Label>
                </div>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <Label className="text-sm font-medium">DNI reverso</Label>
                  <input type="file" accept="image/*" className="hidden" id="dni-reverso"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading('dni-reverso')
                      setSubmitError(null)
                      try {
                        const url = await uploadFile(file, 'dni')
                        setFormData((f) => ({ ...f, dniReversoUrl: url }))
                      } catch (err) { setSubmitError(err.message) }
                      finally { setUploading(null) }
                    }} />
                  <Label htmlFor="dni-reverso" className="cursor-pointer flex flex-col items-center gap-2 py-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-xs">{formData.dniReversoUrl ? '✓ Subido' : 'Subir reverso'}</span>
                  </Label>
                </div>
              </div>
              {uploading && <p className="text-sm text-muted-foreground">{uploading === 'dni-frente' ? 'Subiendo frente...' : 'Subiendo reverso...'}</p>}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium">4. Habilidades y precio por hora</h3>
              <p className="text-sm text-muted-foreground">Elige las habilidades que ofreces y define tu tarifa por hora para cada una (ARS).</p>
              <div className="space-y-3">
                {(formData.skillsJson && formData.skillsJson.length > 0 ? formData.skillsJson : [{ skill: '', hourlyRate: '' }]).map((item, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-center">
                    <Select
                      value={item.skill}
                      onValueChange={(val) => {
                        const list = [...(formData.skillsJson || [])]
                        if (!list[idx]) list[idx] = { skill: '', hourlyRate: item.hourlyRate }
                        list[idx].skill = val
                        setFormData((f) => ({ ...f, skillsJson: list }))
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Habilidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILLS_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="$/h"
                      className="w-24"
                      min="0"
                      step="0.01"
                      value={item.hourlyRate}
                      onChange={(e) => {
                        const list = [...(formData.skillsJson || [])]
                        if (!list[idx]) list[idx] = { skill: item.skill, hourlyRate: '' }
                        list[idx].hourlyRate = e.target.value
                        setFormData((f) => ({ ...f, skillsJson: list }))
                      }}
                    />
                    {idx > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFormData((f) => ({ ...f, skillsJson: (f.skillsJson || []).filter((_, i) => i !== idx) }))}>Quitar</Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData((f) => ({ ...f, skillsJson: [...(f.skillsJson || []), { skill: '', hourlyRate: '' }] }))}>+ Añadir otra habilidad</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium">5. Configuración del perfil</h3>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre de profesional</Label>
                <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} required placeholder="Como quieres que te vean los clientes" />
              </div>
              <div className="space-y-2">
                <Label>Foto de perfil</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer relative" onClick={triggerFileInput}>
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="mx-auto h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-full" />
                      <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}>Eliminar</Button>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto h-10 w-10 text-[#71816D]" />
                      <div className="mt-2 text-sm">Clic para cargar foto</div>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del servicio</Label>
                <Textarea id="description" placeholder="Tu experiencia, proyectos y especialidad." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experiencia</Label>
                <Textarea id="experience" placeholder="Años de experiencia, trabajos destacados..." value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} className="min-h-[60px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tools">Herramientas disponibles</Label>
                <Input id="tools" placeholder="Ej: taladro, destornilladores, escalera..." value={formData.tools} onChange={(e) => setFormData({...formData, tools: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zones">Zonas donde trabajas</Label>
                <Input id="zones" placeholder="Ej: Tucumán capital, Yerba Buena..." value={formData.zones} onChange={(e) => setFormData({...formData, zones: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">Horarios disponibles</Label>
                <Input id="availability" placeholder="Ej: Lun–Vie 8–18, Sábados mañana" value={formData.availability} onChange={(e) => setFormData({...formData, availability: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Select value={formData.province} onValueChange={(v) => setFormData({...formData, province: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecciona provincia" /></SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRateFallback">Precio por hora por defecto (ARS)</Label>
                <Input id="hourlyRateFallback" type="number" placeholder="Ej: 5000" min="0" step="0.01" value={formData.hourlyRate} onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})} />
                <p className="text-xs text-muted-foreground">Usado si no definiste tarifas por habilidad en el paso anterior.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Volver
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button type="button" className="ml-auto" onClick={handleNext}>
                Avanzar <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="w-full space-y-4">
                {submitError && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                    {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div className="p-3 text-sm text-green-500 bg-green-50 rounded-md">
                    Solicitud enviada correctamente. Revisaremos su solicitud y
                    nos pondremos en contacto con usted en breve.
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-[#091E05] text-white hover:bg-[#092E05]/90"
                  disabled={isSubmitting || !emailVerified}
                >
                  {isSubmitting ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}