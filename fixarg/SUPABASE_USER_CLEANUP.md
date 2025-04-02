# Solución para problemas de registro en Supabase

## Problema

Cuando intentas registrar un usuario y recibes el error "El usuario ya existe" a pesar de haber limpiado la base de datos, es posible que el usuario siga existiendo en la tabla `auth.users` de Supabase, aunque ya no esté en la tabla `usuarios` de tu aplicación.

Esto ocurre porque el script de limpieza de la base de datos debe eliminar los registros tanto de la tabla `usuarios` como de la tabla `auth.users` de Supabase.

## Solución

Hemos creado varios scripts para ayudarte a solucionar este problema:

### 1. Script para eliminar un usuario específico de auth.users

Este script te permite eliminar un usuario específico de la tabla `auth.users` de Supabase sin afectar otras tablas.

```bash
node scripts/delete_auth_user.js <email>
```

Donde `<email>` es el correo electrónico del usuario que deseas eliminar.

### 2. Script SQL para eliminar un usuario específico de auth.users

Si prefieres ejecutar un script SQL directamente en el SQL Editor de Supabase, puedes usar el archivo `scripts/delete_auth_user.sql`. Recuerda reemplazar `'email@ejemplo.com'` con el correo electrónico del usuario que deseas eliminar.

### 3. Script para limpiar completamente un usuario

Este script elimina un usuario específico de todas las tablas relevantes en Supabase, incluyendo `usuarios`, `auth.users`, y todas las tablas relacionadas (mensajes, reviews, solicitudes, etc.).

```bash
node scripts/clean_user.js <email>
```

Donde `<email>` es el correo electrónico del usuario que deseas eliminar.

## Verificación

Para verificar si un usuario existe en la tabla `auth.users` de Supabase, puedes ejecutar la siguiente consulta SQL en el SQL Editor de Supabase:

```sql
SELECT * FROM auth.users WHERE email = 'email@ejemplo.com';
```

Reemplaza `'email@ejemplo.com'` con el correo electrónico del usuario que deseas verificar.

## Prevención

Hemos mejorado el manejo de errores en la API de registro de usuarios para proporcionar mensajes más claros y específicos sobre dónde existe el conflicto. Ahora, cuando intentes registrar un usuario que ya existe, recibirás un mensaje que indica si el usuario existe en la tabla `usuarios`, en la tabla `auth.users`, o en ambas.

Si sigues teniendo problemas, ejecuta el script de limpieza completa de la base de datos:

```sql
-- Ejecutar en el SQL Editor de Supabase
DELETE FROM auth.users;
```

O utiliza el script `scripts/clean_database.sql` que ya incluye la limpieza de la tabla `auth.users`.