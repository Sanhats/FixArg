"use client"

import { useState, useRef } from "react"
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
  DialogClose,
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
import { Check, Upload, ChevronRight, Home } from "lucide-react"

export default function BecomeTaskerForm() {
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(25)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    profilePicture: null,
    description: "",
    occupation: "",
    skills: [],
    email: "",
    phone: "",
    hourlyRate: "",
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const handleNext = () => {
    setStep(step + 1)
    setProgress(progress + 25)
  }

  const handleBack = () => {
    setStep(step - 1)
    setProgress(progress - 25)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!emailVerified) {
      setSubmitError("Por favor, verifica tu correo electrónico antes de enviar la solicitud.")
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: formData.displayName,
        description: formData.description,
        occupation: formData.occupation,
        skills: formData.skills,
        email: formData.email,
        phone: formData.phone,
        hourlyRate: parseFloat(formData.hourlyRate),
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
        throw new Error(data.message || 'Error al enviar los datos')
      }

      setProgress(100) // Completar la barra de progreso
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
      alert("Código de verificación enviado. Por favor, revisa tu correo electrónico.");
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
              <DialogTitle className="text-center text-xl sm:text-2xl">¡Solicitud Enviada!</DialogTitle>
              <CardDescription className="text-center text-sm sm:text-base">
                Gracias por tu interés en unirte a nuestra comunidad. Revisaremos tu solicitud y nos pondremos en contacto contigo pronto.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="w-full sm:w-auto bg-[#14A800] text-white hover:bg-[#14A800]/90"
                onClick={() => window.location.href = '/'}
              >
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
        
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step >= 1 ? 'bg-[#091E05] text-white' : 'bg-gray-200'}`}>1</div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step >= 2 ? 'bg-[#091E05] text-white' : 'bg-gray-200'}`}>2</div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${step >= 3 ? 'bg-[#091E05] text-white' : 'bg-gray-200'}`}>3</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium">Informacion personal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre de profesional</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Foto de perfil</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer relative"
                  onClick={triggerFileInput}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Profile preview" className="mx-auto h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-full" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                      >
                        Eliminar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-[#71816D]" />
                      <div className="mt-2 text-sm sm:text-base">Haga clic para cargar o arrastrar y soltar</div>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium">Informacion personal</h3>
              <div className="space-y-2">
                <Label htmlFor="occupation">Ocupacion</Label>
                <Select onValueChange={(value) => setFormData({...formData, occupation: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu ocupacion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ensamblaje">Ensamblaje</SelectItem>
                    <SelectItem value="montaje">Montaje</SelectItem>
                    <SelectItem value="mudanza">Mudanza</SelectItem>
                    <SelectItem value="limpieza">Limpieza</SelectItem>
                    <SelectItem value="ayuda en exteriores">Ayuda en exteriores</SelectItem>
                    <SelectItem value="reparaciones del hogar">Reparaciones del Hogar</SelectItem>
                    <SelectItem value="pintar">Pintura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripcion del servicio</Label>
                <Textarea
                  id="description"
                  placeholder="Háblanos un poco de tu experiencia laboral, de los proyectos interesantes que has realizado y de tu especialidad."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Precio por hora (ARS)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="Ej: 1000"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium">Seguridad de la cuenta</h3>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electronico</Label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Input
                    
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => 
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={emailVerified}
                    className="flex-grow"
                  />
                  <Button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={emailVerified || isVerifying}
                    className="w-full sm:w-auto"
                  >
                    {isVerifying ? "Enviando..." : "Verificar"}
                  </Button>
                </div>
              </div>
              {!emailVerified && (
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">
                    Código de verificación
                  </Label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isVerifying}
                      className="w-full sm:w-auto"
                    >
                      {isVerifying ? 
                      "Verificando..." : "Confirmar"}
                    </Button>
                  </div>
                </div>
              )}
              {emailVerified && (
                <div className="text-[#091E05] flex items-center text-sm sm:text-base">
                  <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Correo electrónico verificado
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="phone">Numero de telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Volver
              </Button>
            )}
            {step < 3 ? (
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

/*SDADSAD