-- Añadir estados de cancelación: por trabajador y por cliente
-- Ejecutar en Supabase SQL Editor.
-- Si falla DROP CONSTRAINT, en SQL Editor ejecutar:
--   SELECT conname FROM pg_constraint WHERE conrelid = 'public.solicitudes'::regclass;
-- y reemplazar solicitudes_estado_check por el nombre que salga.
ALTER TABLE solicitudes
  DROP CONSTRAINT IF EXISTS solicitudes_estado_check;

ALTER TABLE solicitudes
  ADD CONSTRAINT solicitudes_estado_check CHECK (
    estado IN (
      'pendiente',
      'confirmada',
      'rechazada',
      'en_progreso',
      'completada',
      'cancelada_por_trabajador',
      'cancelada_por_cliente'
    )
  );
