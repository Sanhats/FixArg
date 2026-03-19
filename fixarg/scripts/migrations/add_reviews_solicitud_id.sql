-- Allow one review per completed solicitud

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS solicitud_id UUID REFERENCES solicitudes(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_solicitud_unique ON reviews (solicitud_id) WHERE solicitud_id IS NOT NULL;
