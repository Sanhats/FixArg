-- Velocidad de respuesta del trabajador (sistema de reputación y matching)
ALTER TABLE solicitudes
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

COMMENT ON COLUMN solicitudes.responded_at IS 'Momento en que el trabajador aceptó o rechazó la solicitud (para métrica de velocidad de respuesta)';
