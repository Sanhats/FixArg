-- Ejecutar en Supabase SQL Editor
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
