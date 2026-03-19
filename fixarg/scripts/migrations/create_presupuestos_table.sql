-- Tabla de presupuestos: un trabajador envía un presupuesto por solicitud; el cliente aprueba uno
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  monto NUMERIC(12,2) NOT NULL,
  mensaje TEXT,
  estado TEXT NOT NULL DEFAULT 'enviado' CHECK (estado IN ('enviado', 'aprobado', 'rechazado')),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_presupuestos_solicitud_trabajador ON presupuestos (solicitud_id, trabajador_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_solicitud ON presupuestos (solicitud_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_trabajador ON presupuestos (trabajador_id);

COMMENT ON TABLE presupuestos IS 'Presupuestos enviados por trabajadores a una solicitud; el cliente aprueba uno y se asigna el trabajador a la solicitud';
