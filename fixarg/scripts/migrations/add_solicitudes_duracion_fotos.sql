-- Duración estimada y fotos en la solicitud (flujo cliente)
ALTER TABLE solicitudes
ADD COLUMN IF NOT EXISTS duracion_estimada TEXT;

ALTER TABLE solicitudes
ADD COLUMN IF NOT EXISTS fotos_json JSONB DEFAULT '[]';

COMMENT ON COLUMN solicitudes.duracion_estimada IS 'Duración estimada del trabajo (ej: "2 horas", "medio día")';
COMMENT ON COLUMN solicitudes.fotos_json IS 'URLs de fotos adjuntas a la solicitud (array de strings)';
