-- Solicitudes por servicio/rubro: trabajador_id opcional hasta aprobar presupuesto; servicio_rubro; nuevo estado
-- Ejecutar en Supabase SQL Editor después de add_solicitudes_cancel_estados.sql

-- Permitir trabajador_id NULL (se asigna al aprobar un presupuesto)
ALTER TABLE solicitudes
  ALTER COLUMN trabajador_id DROP NOT NULL;

-- Columna servicio/rubro (slug o texto del servicio elegido por el cliente)
ALTER TABLE solicitudes
  ADD COLUMN IF NOT EXISTS servicio_rubro TEXT;

COMMENT ON COLUMN solicitudes.servicio_rubro IS 'Servicio o rubro elegido por el cliente (mapeo occupation/skill); NULL en solicitudes antiguas';

-- Ampliar estados: pendiente_presupuestos = esperando presupuestos de trabajadores del rubro
ALTER TABLE solicitudes
  DROP CONSTRAINT IF EXISTS solicitudes_estado_check;

ALTER TABLE solicitudes
  ADD CONSTRAINT solicitudes_estado_check CHECK (
    estado IN (
      'pendiente',
      'pendiente_presupuestos',
      'confirmada',
      'rechazada',
      'en_progreso',
      'completada',
      'cancelada_por_trabajador',
      'cancelada_por_cliente'
    )
  );

CREATE INDEX IF NOT EXISTS idx_solicitudes_servicio_rubro ON solicitudes (servicio_rubro) WHERE servicio_rubro IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solicitudes_trabajador_null ON solicitudes (servicio_rubro, fecha_creacion) WHERE trabajador_id IS NULL;
