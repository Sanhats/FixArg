import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Almacenamiento en memoria para los códigos de verificación (reemplazar con una base de datos en producción)
const verificationCodes = new Map();

export async function POST(request) {
  const body = await request.json();
  const { email, action } = body;

  if (action === 'send') {
    const verificationCode = uuidv4().slice(0, 6).toUpperCase();
    verificationCodes.set(email, verificationCode);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Verificación de correo electrónico',
      text: `Tu código de verificación es: ${verificationCode}`,
      html: `<strong>Tu código de verificación es: ${verificationCode}</strong>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, message: 'Código de verificación enviado' });
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      return NextResponse.json({ success: false, message: 'Error al enviar el código de verificación' }, { status: 500 });
    }
  } else if (action === 'verify') {
    const { code } = body;
    const storedCode = verificationCodes.get(email);

    if (code === storedCode) {
      verificationCodes.delete(email);
      return NextResponse.json({ success: true, message: 'Correo electrónico verificado correctamente' });
    } else {
      return NextResponse.json({ success: false, message: 'Código de verificación inválido' }, { status: 400 });
    }
  } else {
    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
  }
}