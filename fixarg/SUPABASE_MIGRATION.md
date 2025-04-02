# Migración de MongoDB a Supabase en FixArg

Este documento proporciona instrucciones detalladas para migrar la base de datos de MongoDB a Supabase en el proyecto FixArg.

## Requisitos previos

1. Una cuenta de Supabase activa
2. Acceso al proyecto de Vercel
3. Acceso a la base de datos MongoDB actual

## Configuración de Supabase

### Crear un nuevo proyecto en Supabase

1. Inicia sesión en [Supabase](https://app.supabase.com/)
2. Crea un nuevo proyecto
3. Anota la URL del proyecto y las claves de API (anon key y service role key)

### Configurar las tablas en Supabase

Debes crear las siguientes tablas en Supabase:

#### Tabla `usuarios`

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabla `trabajadores`

```sql
CREATE TABLE trabajadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  occupation TEXT NOT NULL,
  hourly_rate NUMERIC(10, 2),
  description TEXT,
  phone TEXT,
  display_name TEXT,
  status TEXT DEFAULT 'pending',
  hashed_password TEXT,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabla `solicitudes`

```sql
CREATE TABLE solicitudes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descripcion TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  trabajador_id UUID REFERENCES trabajadores(id),
  usuario_id UUID REFERENCES usuarios(id),
  estado TEXT DEFAULT 'pendiente',
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabla `reviews`

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trabajador_id UUID REFERENCES trabajadores(id),
  usuario_id UUID REFERENCES usuarios(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trabajador_id, usuario_id)
);
```

#### Tabla `mensajes`

```sql
CREATE TABLE mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contenido TEXT NOT NULL,
  emisor_id UUID NOT NULL,
  receptor_id UUID NOT NULL,
  solicitud_id UUID REFERENCES solicitudes(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabla `whatsapp_messages`

```sql
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuración de variables de entorno en Vercel

Para que la integración con Supabase funcione correctamente en Vercel, debes configurar las siguientes variables de entorno en tu proyecto de Vercel:

1. **NEXT_PUBLIC_SUPABASE_URL**: La URL de tu proyecto de Supabase
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: La clave anónima de tu proyecto de Supabase
3. **SUPABASE_SERVICE_ROLE_KEY**: La clave de servicio de tu proyecto de Supabase (¡mantén esta clave segura!)

### Pasos para configurar las variables de entorno en Vercel

1. Inicia sesión en tu cuenta de Vercel
2. Selecciona tu proyecto
3. Ve a la pestaña "Settings"
4. Haz clic en "Environment Variables"
5. Agrega cada una de las variables mencionadas anteriormente con sus respectivos valores
6. Haz clic en "Save" para guardar los cambios

## Migración de datos

Para migrar los datos de MongoDB a Supabase, puedes utilizar un script de migración. Aquí hay un ejemplo básico de cómo podría ser:

```javascript
// migrate-data.js
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

// Configuración de MongoDB
const mongoUri = process.env.MONGODB_URI;
const mongoClient = new MongoClient(mongoUri);

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  try {
    // Conectar a MongoDB
    await mongoClient.connect();
    const db = mongoClient.db('FixArg');
    
    // Migrar usuarios
    const usuarios = await db.collection('usuarios').find({}).toArray();
    for (const usuario of usuarios) {
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          email: usuario.email,
          first_name: usuario.firstName,
          last_name: usuario.lastName,
          phone: usuario.phone,
          hashed_password: usuario.password
        });
      
      if (error) console.error('Error al migrar usuario:', error);
    }
    
    // Migrar trabajadores
    const trabajadores = await db.collection('trabajadores').find({}).toArray();
    for (const trabajador of trabajadores) {
      const { data, error } = await supabase
        .from('trabajadores')
        .insert({
          email: trabajador.email,
          first_name: trabajador.firstName,
          last_name: trabajador.lastName,
          occupation: trabajador.occupation,
          hourly_rate: trabajador.hourlyRate,
          description: trabajador.description,
          phone: trabajador.phone,
          display_name: trabajador.displayName,
          status: trabajador.status || 'pending',
          hashed_password: trabajador.password,
          average_rating: trabajador.averageRating || 0
        });
      
      if (error) console.error('Error al migrar trabajador:', error);
    }
    
    // Continuar con otras colecciones...
    
    console.log('Migración completada con éxito');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await mongoClient.close();
  }
}

migrateData();
```

## Actualización de la autenticación

Supabase proporciona un sistema de autenticación integrado que puedes utilizar en lugar de la autenticación personalizada con JWT. Sin embargo, si prefieres mantener la autenticación JWT actual, puedes seguir utilizándola con Supabase.

### Uso de la autenticación de Supabase

Para utilizar la autenticación de Supabase, debes modificar el componente `AuthContext.js` para utilizar las funciones de autenticación de Supabase en lugar de las funciones personalizadas actuales.

## Verificación de la migración

Para verificar que la migración se ha realizado correctamente:

1. Ejecuta la aplicación en modo de desarrollo
2. Prueba todas las funcionalidades principales (registro, inicio de sesión, creación de solicitudes, etc.)
3. Verifica que los datos se estén guardando correctamente en Supabase

## Solución de problemas comunes

### Error de conexión a Supabase

Si recibes un error de conexión a Supabase, verifica que las variables de entorno estén correctamente configuradas en Vercel y que las claves de API sean válidas.

### Error de autenticación

Si recibes un error de autenticación, verifica que estés utilizando las claves de API correctas y que los tokens de autenticación se estén generando correctamente.

### Error de inserción de datos

Si recibes un error al insertar datos en Supabase, verifica que los datos cumplan con las restricciones de las tablas (por ejemplo, campos únicos, referencias a otras tablas, etc.).

## Recursos adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Guía de migración de datos a Supabase](https://supabase.com/docs/guides/migrations/migrating-to-supabase)