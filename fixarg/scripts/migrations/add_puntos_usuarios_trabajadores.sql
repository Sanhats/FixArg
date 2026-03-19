-- Puntos para prioridad: se suman al completar un trabajo exitosamente
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS puntos INTEGER NOT NULL DEFAULT 0;

ALTER TABLE trabajadores
  ADD COLUMN IF NOT EXISTS puntos INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN usuarios.puntos IS 'Puntos acumulados por trabajos completados; mayor prioridad al ver solicitudes';
COMMENT ON COLUMN trabajadores.puntos IS 'Puntos acumulados por trabajos completados; mayor prioridad al recibir nuevas solicitudes en su rubro';
