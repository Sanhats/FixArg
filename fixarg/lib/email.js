import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  })
}

/**
 * Send email to worker when a new request is created.
 * @param {string} to - Worker email
 * @param {object} solicitud - { descripcion, fecha, hora } and optional cliente name
 */
export async function sendRequestCreated(to, solicitud) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return
  const transporter = getTransporter()
  const subject = 'FixArg - Nueva solicitud de trabajo'
  const text = `Tienes una nueva solicitud de trabajo.\n\nDescripción: ${solicitud.descripcion}\nFecha: ${solicitud.fecha}\nHora: ${solicitud.hora}\n\nEntra a tu panel en FixArg para aceptarla o rechazarla.`
  const html = `<p>Tienes una nueva solicitud de trabajo.</p><p><strong>Descripción:</strong> ${solicitud.descripcion}</p><p><strong>Fecha:</strong> ${solicitud.fecha}</p><p><strong>Hora:</strong> ${solicitud.hora}</p><p>Entra a tu panel en FixArg para aceptarla o rechazarla.</p>`
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
    html,
  }).catch(err => console.error('Email sendRequestCreated error:', err))
}

/**
 * Send email to client when request is accepted.
 * @param {string} to - Client (usuario) email
 * @param {object} solicitud - { descripcion, fecha, hora }
 */
export async function sendRequestAccepted(to, solicitud) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return
  const transporter = getTransporter()
  const subject = 'FixArg - Tu solicitud fue aceptada'
  const text = `Tu solicitud de trabajo fue aceptada.\n\nDescripción: ${solicitud.descripcion}\nFecha: ${solicitud.fecha}\nHora: ${solicitud.hora}\n\nRevisa el estado en FixArg.`
  const html = `<p>Tu solicitud de trabajo fue aceptada.</p><p><strong>Descripción:</strong> ${solicitud.descripcion}</p><p><strong>Fecha:</strong> ${solicitud.fecha}</p><p><strong>Hora:</strong> ${solicitud.hora}</p><p>Revisa el estado en FixArg.</p>`
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
    html,
  }).catch(err => console.error('Email sendRequestAccepted error:', err))
}

/**
 * Send email to client when work is completed, with link to rate.
 * @param {string} to - Client email
 * @param {object} solicitud - { id, descripcion }
 * @param {string} linkToReview - Full URL to solicitud page or services
 */
export async function sendWorkCompleted(to, solicitud, linkToReview) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return
  const transporter = getTransporter()
  const subject = 'FixArg - Trabajo finalizado'
  const url = linkToReview || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/solicitudes/${solicitud.id}` : `/solicitudes/${solicitud.id}`)
  const text = `El trabajo ha sido marcado como finalizado.\n\nDescripción: ${solicitud.descripcion}\n\nCalifica al profesional aquí: ${url}`
  const html = `<p>El trabajo ha sido marcado como finalizado.</p><p><strong>Descripción:</strong> ${solicitud.descripcion}</p><p><a href="${url}">Califica al profesional aquí</a></p>`
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
    html,
  }).catch(err => console.error('Email sendWorkCompleted error:', err))
}
