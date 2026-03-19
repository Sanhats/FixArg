-- Flujo trabajador (Fixer): documentos, verificación, perfil y habilidades con precio por hora
-- Además, crear en Supabase Dashboard → Storage un bucket "tasker-docs" (público si quieres URLs públicas para las subidas).

-- Documentos para verificación (URLs tras subir a storage)
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS document_antecedentes_url TEXT;
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS dni_frente_url TEXT;
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS dni_reverso_url TEXT;

-- Estado de verificación (opcional: la plataforma hace chequeo de antecedentes e identidad)
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
-- Valores: pending, verified, rejected

-- Configuración del perfil
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS tools TEXT;
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS zones TEXT;
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS availability TEXT;

-- Habilidades con precio por hora: JSON array [{ "skill": "Plomería", "hourlyRate": 30 }, ...]
ALTER TABLE trabajadores ADD COLUMN IF NOT EXISTS skills_json JSONB DEFAULT '[]';

COMMENT ON COLUMN trabajadores.document_antecedentes_url IS 'URL del documento de antecedentes penales (storage)';
COMMENT ON COLUMN trabajadores.dni_frente_url IS 'URL foto DNI frente';
COMMENT ON COLUMN trabajadores.dni_reverso_url IS 'URL foto DNI reverso';
COMMENT ON COLUMN trabajadores.skills_json IS 'Habilidades con tarifa: [{"skill":"Plomería","hourlyRate":30}]';
