'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export default function WhatsAppMessageFormEnhanced({ trabajador, defaultMessage = '' }) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Establecer el mensaje predeterminado con el nombre del trabajador
    if (trabajador && trabajador.firstName) {
      const initialMessage = defaultMessage || 
        `Hola ${trabajador.firstName}, me interesa contratar tus servicios como ${trabajador.occupation?.toLowerCase() || 'profesional'}...`;
      setMessage(initialMessage);
    }
  }, [trabajador, defaultMessage]);

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    
    // Eliminar espacios y caracteres especiales
    const cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Verificar que tenga al menos 10 dígitos (sin contar el código de país)
    return cleaned.length >= 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que tengamos un trabajador y un número de teléfono válido
    if (!trabajador || !trabajador.phone) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo obtener el número de teléfono del trabajador.',
      });
      return;
    }

    // Validar el formato del número de teléfono
    if (!validatePhoneNumber(trabajador.phone)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El número de teléfono del trabajador no es válido para WhatsApp.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: trabajador.phone,
          message,
          trabajadorId: trabajador._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Mensaje enviado',
          description: 'Tu mensaje ha sido enviado exitosamente a WhatsApp.',
        });
        // No limpiamos el mensaje para permitir envíos repetidos
      } else {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Hubo un error al enviar el mensaje a WhatsApp.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="message" className="block text-sm font-medium">
          Mensaje para {trabajador?.firstName || 'el trabajador'}
        </label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          required
          disabled={isLoading}
          className="min-h-[100px]"
        />
      </div>
      <Button 
        type="submit" 
        disabled={isLoading || !trabajador?.phone} 
        className="w-full bg-[#324376] hover:bg-[#324376]/90"
      >
        {isLoading ? 'Enviando...' : 'Enviar mensaje por WhatsApp'}
      </Button>
      {!trabajador?.phone && (
        <p className="text-sm text-red-500 mt-2">
          Este trabajador no tiene un número de teléfono registrado.
        </p>
      )}
    </form>
  );
}