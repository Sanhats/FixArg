# Configurar Gmail para envío de correos (verificación, notificaciones)

El error **"Username and Password not accepted" (535)** de Gmail significa que no puedes usar tu contraseña normal de la cuenta. Hay dos formas de solucionarlo.

---

## Opción 1: Probar sin email (desarrollo)

Si solo quieres probar el flujo en local **sin configurar Gmail**:

1. En `.env.local`, **comenta o borra** las líneas:
   - `GMAIL_USER=...`
   - `GMAIL_PASS=...`
2. Reinicia el servidor (`npm run dev`).
3. Al pedir "Enviar código de verificación", el código se guarda en la base de datos y **aparecerá en un cuadro de alerta** en el navegador. Copia ese código y pégalo en el campo de verificación para seguir con el registro.

Así puedes completar registro de cliente y de trabajador sin tener que configurar correo.

---

## Opción 2: Usar Gmail con Contraseña de aplicación

Para que los correos se envíen de verdad (producción o pruebas con email real):

1. Entra en tu **Cuenta de Google** → [Seguridad](https://myaccount.google.com/security).
2. Activa **Verificación en 2 pasos** si no la tienes.
3. Busca **Contraseñas de aplicaciones** (o "App passwords").
4. Crea una contraseña de aplicación para "Correo" / "Mail" (elige "Otro" y pon "FixArg").
5. Google te dará una **contraseña de 16 caracteres**. Esa es la que debes usar en `.env.local`:
   ```env
   GMAIL_USER=tu-email@gmail.com
   GMAIL_PASS=xxxx xxxx xxxx xxxx
   ```
   (puedes escribirla con o sin espacios)

6. Reinicia el servidor.

**Importante:** No uses tu contraseña normal de Gmail en `GMAIL_PASS`; con la verificación en 2 pasos activa, Gmail solo acepta Contraseñas de aplicaciones para SMTP.
