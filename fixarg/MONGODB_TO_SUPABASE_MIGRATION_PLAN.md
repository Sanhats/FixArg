# Plan de Migración de MongoDB a Supabase

Este documento detalla el plan para migrar completamente de MongoDB a Supabase en el proyecto FixArg.

## Archivos que requieren cambios

Basado en el análisis del código, los siguientes archivos necesitan ser modificados para usar Supabase en lugar de MongoDB:

### API Routes

1. `app/api/users/route.js` - Registro de usuarios
2. `app/api/users/login/route.js` - Login de usuarios
3. `app/api/auth/trabajador/route.js` - Autenticación de trabajadores
4. `app/api/trabajador/login/route.js` - Login de trabajadores
5. `app/api/trabajador/solicitudes/route.js` - Solicitudes de trabajadores
6. `app/api/trabajador/solicitudes/[id]/route.js` - Solicitud específica de trabajador
7. `app/api/solicitudes/route.js` - Gestión de solicitudes
8. `app/api/mensajes/route.js` - Gestión de mensajes
9. `app/api/whatsapp/route.js` - Integración con WhatsApp
10. `app/api/admin/professionals/route.js` - Gestión de profesionales (admin)
11. `app/api/admin/professionals/[id]/route.js` - Profesional específico (admin)
12. `app/api/taskers/route.js` - Gestión de trabajadores
13. `app/api/reviews/route.js` - Gestión de reviews

## Estrategia de Migración

### 1. Preparación

- Asegurarse de que todas las tablas necesarias estén creadas en Supabase según el esquema definido en `SUPABASE_MIGRATION.md`
- Verificar que las variables de entorno de Supabase estén configuradas correctamente
- Ejecutar el script de migración de datos si aún no se ha hecho

### 2. Implementación

Para cada archivo que requiere cambios, seguiremos estos pasos:

1. Eliminar las importaciones relacionadas con MongoDB:
   ```javascript
   import { MongoClient, ObjectId } from 'mongodb'
   import { connectToDatabase } from '@/lib/mongodb'
   ```

2. Agregar las importaciones de Supabase:
   ```javascript
   import supabaseAdmin, { findUserByEmail, insertUser, /* otras funciones */ } from '@/lib/supabase'
   ```

3. Reemplazar las operaciones de MongoDB con sus equivalentes en Supabase:

   - **Consultas**:
     - MongoDB: `db.collection('coleccion').findOne({ campo: valor })`
     - Supabase: `supabaseAdmin.from('tabla').select('*').eq('campo', valor).single()`

   - **Inserciones**:
     - MongoDB: `db.collection('coleccion').insertOne(datos)`
     - Supabase: `supabaseAdmin.from('tabla').insert([datos]).select()`

   - **Actualizaciones**:
     - MongoDB: `db.collection('coleccion').updateOne({ _id: id }, { $set: datos })`
     - Supabase: `supabaseAdmin.from('tabla').update(datos).eq('id', id)`

   - **Eliminaciones**:
     - MongoDB: `db.collection('coleccion').deleteOne({ _id: id })`
     - Supabase: `supabaseAdmin.from('tabla').delete().eq('id', id)`

4. Reemplazar `ObjectId` con UUID:
   - MongoDB: `new ObjectId(id)`
   - Supabase: Usar directamente el string del UUID

5. Actualizar el manejo de errores para adaptarse a las respuestas de Supabase

### 3. Pruebas

Después de cada modificación, probar exhaustivamente la funcionalidad para asegurar que:

- Las operaciones CRUD funcionan correctamente
- La autenticación y autorización funcionan como se espera
- Los errores se manejan adecuadamente

### 4. Limpieza

Una vez que todas las funcionalidades estén migradas y probadas:

1. Eliminar el archivo `lib/mongodb.js`
2. Eliminar las dependencias de MongoDB del `package.json`
3. Actualizar la documentación para reflejar el uso exclusivo de Supabase

## Consideraciones Importantes

### Cambios en la estructura de datos

- MongoDB usa `_id` como identificador principal, mientras que Supabase usa `id`
- Los nombres de campos en MongoDB usan camelCase, mientras que en Supabase se recomienda snake_case
- MongoDB almacena ObjectId, mientras que Supabase usa UUID

### Autenticación

- Considerar migrar a la autenticación integrada de Supabase en lugar de JWT personalizado
- Actualizar el contexto de autenticación para usar Supabase Auth

### Transacciones

- MongoDB y Supabase manejan las transacciones de manera diferente
- Asegurarse de que las operaciones que requieren consistencia transaccional se implementen correctamente