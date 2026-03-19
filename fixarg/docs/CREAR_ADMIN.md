# Crear / configurar usuario admin

El admin **no está en la base de datos**. Se configura solo con variables de entorno.

## 1. Usuario (obligatorio)

En `.env.local`:

```env
ADMIN_USERNAME=admin
```

(O el nombre que quieras para entrar al panel en **/admin/login**.)

## 2. Contraseña (elegir una opción)

**Opción A – Desarrollo (recomendado para local):** contraseña en texto:

```env
ADMIN_PASSWORD=tu_contraseña_secreta
```

**Opción B – Producción:** hash bcrypt (más seguro, la contraseña no va en el archivo):

1. Generar el hash (en la carpeta `fixarg`, donde está `node_modules`):
   ```bash
   node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('TuContraseña', 10).then(h=>console.log(h))"
   ```
2. Copiar el resultado y ponerlo en `.env.local` **entre comillas simples** (el hash contiene `$` y sin comillas puede corromperse):
   ```env
   ADMIN_PASSWORD_HASH='$2a$10$xxxxx...'
   ```

Si **no** configuras `ADMIN_PASSWORD` ni `ADMIN_PASSWORD_HASH`, la contraseña por defecto es **`admin123`** (solo para pruebas; en producción define siempre una contraseña en env).

## 3. Entrar al panel

1. Reinicia el servidor (`npm run dev`).
2. Abre **http://localhost:3000/admin/login**.
3. Usuario: el valor de `ADMIN_USERNAME`.
4. Contraseña: la que definiste en `ADMIN_PASSWORD` o la que usaste para generar `ADMIN_PASSWORD_HASH`.

Desde el panel podrás aprobar o rechazar profesionales (trabajadores) que se registren.
