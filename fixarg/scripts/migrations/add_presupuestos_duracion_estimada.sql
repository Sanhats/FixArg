-- Duración estimada del trabajo la indica el trabajador en el presupuesto, no el cliente
ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS duracion_estimada TEXT;

COMMENT ON COLUMN presupuestos.duracion_estimada IS 'Estimación del trabajador (ej: "2 horas", "medio día") al enviar el presupuesto';
