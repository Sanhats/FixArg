-- Script para eliminar un usuario específico de auth.users en Supabase
-- Ejecutar este script en el SQL Editor de Supabase
-- Reemplazar 'email@ejemplo.com' con el email del usuario que deseas eliminar

-- Primero verificamos si el usuario existe
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Buscar el ID del usuario por email
  SELECT id INTO user_id FROM auth.users WHERE email = 'email@ejemplo.com';
  
  -- Si el usuario existe, lo eliminamos
  IF user_id IS NOT NULL THEN
    -- Eliminar el usuario de auth.users
    DELETE FROM auth.users WHERE id = user_id;
    RAISE NOTICE 'Usuario con email % eliminado exitosamente', 'email@ejemplo.com';
  ELSE
    RAISE NOTICE 'Usuario con email % no encontrado', 'email@ejemplo.com';
  END IF;
END;
$$;

-- Verificar que el usuario ya no existe
SELECT COUNT(*) as usuarios_restantes FROM auth.users WHERE email = 'email@ejemplo.com';