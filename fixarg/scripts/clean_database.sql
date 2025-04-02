-- Script para limpiar todas las tablas de la base de datos
-- Ejecutar este script en el SQL Editor de Supabase

-- Desactivar temporalmente las restricciones de clave foránea
BEGIN;

-- Primero eliminamos los datos de las tablas que tienen referencias a otras tablas
-- Tabla mensajes
DELETE FROM mensajes;

-- Tabla reviews
DELETE FROM reviews;

-- Tabla whatsapp_messages
DELETE FROM whatsapp_messages;

-- Tabla verification_codes
DELETE FROM verification_codes;

-- Tabla solicitudes
DELETE FROM solicitudes;

-- Luego eliminamos los datos de las tablas principales
-- Tabla trabajadores
DELETE FROM trabajadores;

-- Tabla usuarios
DELETE FROM usuarios;

-- Restablecer las secuencias de ID si es necesario
-- Nota: Supabase utiliza UUID por defecto, por lo que no es necesario restablecer secuencias
-- Si se utilizan secuencias personalizadas, descomentar las siguientes líneas
-- ALTER SEQUENCE IF EXISTS usuarios_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS trabajadores_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS solicitudes_id_seq RESTART WITH 1;

COMMIT;

-- Verificar que las tablas estén vacías
SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'trabajadores' as tabla, COUNT(*) as registros FROM trabajadores
UNION ALL
SELECT 'solicitudes' as tabla, COUNT(*) as registros FROM solicitudes
UNION ALL
SELECT 'reviews' as tabla, COUNT(*) as registros FROM reviews
UNION ALL
SELECT 'mensajes' as tabla, COUNT(*) as registros FROM mensajes
UNION ALL
SELECT 'whatsapp_messages' as tabla, COUNT(*) as registros FROM whatsapp_messages
UNION ALL
SELECT 'verification_codes' as tabla, COUNT(*) as registros FROM verification_codes;