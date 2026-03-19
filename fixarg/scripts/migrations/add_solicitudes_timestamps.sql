-- Add started_at and completed_at to solicitudes for work lifecycle tracking

ALTER TABLE solicitudes
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
