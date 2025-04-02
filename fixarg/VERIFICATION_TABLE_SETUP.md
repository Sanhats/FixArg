# Configuración de la tabla de verificación de correo electrónico

Para que el sistema de verificación de correo electrónico funcione correctamente, es necesario crear la tabla `verification_codes` en Supabase.

## Pasos para crear la tabla en Supabase

1. Inicia sesión en tu cuenta de [Supabase](https://app.supabase.com/)
2. Selecciona tu proyecto de FixArg
3. Ve a la sección "SQL Editor" en el menú lateral
4. Crea un nuevo script SQL
5. Copia y pega el siguiente código SQL:

```sql
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(email)
);
```

6. Ejecuta el script haciendo clic en el botón "Run"
7. Verifica que la tabla se haya creado correctamente en la sección "Table Editor"

## Verificación de variables de entorno en Vercel

Asegúrate de que las siguientes variables de entorno estén correctamente configuradas en tu proyecto de Vercel:

1. **GMAIL_USER**: Tu dirección de correo electrónico de Gmail
2. **GMAIL_PASS**: Tu contraseña de aplicación de Gmail (no tu contraseña normal)
3. **NEXT_PUBLIC_SUPABASE_URL**: La URL de tu proyecto de Supabase
4. **SUPABASE_SERVICE_ROLE_KEY**: La clave de servicio de tu proyecto de Supabase

### Pasos para verificar las variables de entorno en Vercel

1. Inicia sesión en tu cuenta de [Vercel](https://vercel.com/)
2. Selecciona tu proyecto de FixArg
3. Ve a la pestaña "Settings"
4. Haz clic en "Environment Variables"
5. Verifica que todas las variables mencionadas anteriormente estén presentes y tengan los valores correctos

## Notas importantes sobre la contraseña de Gmail

Para que el envío de correos electrónicos funcione correctamente, debes usar una "contraseña de aplicación" de Google, no tu contraseña normal. Para crear una contraseña de aplicación:

1. Ve a la [configuración de seguridad de tu cuenta de Google](https://myaccount.google.com/security)
2. En la sección "Iniciar sesión en Google", selecciona "Contraseñas de aplicaciones"
3. Selecciona "Otra (nombre personalizado)" en el menú desplegable
4. Ingresa un nombre para la aplicación (por ejemplo, "FixArg")
5. Haz clic en "Generar"
6. Copia la contraseña generada y úsala como valor para la variable de entorno GMAIL_PASS

Recuerda que para usar contraseñas de aplicación, debes tener habilitada la verificación en dos pasos en tu cuenta de Google.