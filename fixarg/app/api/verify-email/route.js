import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Inicializar cliente de Supabase para almacenar códigos de verificación
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tabla temporal para almacenar códigos de verificación
const VERIFICATION_TABLE = 'verification_codes';

export async function POST(request) {
  const body = await request.json();
  const { email, action } = body;

  if (action === 'send') {
    const verificationCode = uuidv4().slice(0, 6).toUpperCase();
    
    // Almacenar el código en Supabase con un tiempo de expiración (30 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    
    try {
      // Primero eliminar cualquier código existente para este email
      await supabase
        .from(VERIFICATION_TABLE)
        .delete()
        .eq('email', email);
      
      // Insertar el nuevo código
      const { error: insertError } = await supabase
        .from(VERIFICATION_TABLE)
        .insert([
          { 
            email, 
            code: verificationCode,
            created_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString()
          }
        ]);
      
      if (insertError) {
        console.error('Error al guardar el código de verificación:', insertError);
        return NextResponse.json({ success: false, message: 'Error al generar el código de verificación' }, { status: 500 });
      }

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Verificación de correo electrónico',
        text: `Tu código de verificación es: ${verificationCode}`,
        html: `<strong>Tu código de verificación es: ${verificationCode}</strong>`,
      };

      await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, message: 'Código de verificación enviado' });
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      return NextResponse.json({ success: false, message: 'Error al enviar el código de verificación' }, { status: 500 });
    }
  } else if (action === 'verify') {
    const { code } = body;
    
    try {
      // Buscar el código en Supabase
      const { data, error } = await supabase
        .from(VERIFICATION_TABLE)
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .single();
      
      if (error || !data) {
        console.error('Error al verificar el código:', error);
        return NextResponse.json({ success: false, message: 'Código de verificación inválido' }, { status: 400 });
      }
      
      // Verificar si el código ha expirado
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (now > expiresAt) {
        // Eliminar el código expirado
        await supabase
          .from(VERIFICATION_TABLE)
          .delete()
          .eq('email', email);
          
        return NextResponse.json({ success: false, message: 'El código de verificación ha expirado' }, { status: 400 });
      }
      
      // Código válido, eliminar de la base de datos
      await supabase
        .from(VERIFICATION_TABLE)
        .delete()
        .eq('email', email);
      
      return NextResponse.json({ success: true, message: 'Correo electrónico verificado correctamente' });
    } catch (error) {
      console.error('Error en la verificación:', error);
      return NextResponse.json({ success: false, message: 'Error al verificar el código' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
  }
}