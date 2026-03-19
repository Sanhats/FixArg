-- Coordenadas de la ubicación del servicio (para mapa / navegación del trabajador)
ALTER TABLE solicitudes
ADD COLUMN IF NOT EXISTS ubicacion_lat NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS ubicacion_lng NUMERIC(10, 7);

COMMENT ON COLUMN solicitudes.ubicacion_lat IS 'Latitud de la ubicación del servicio (geolocalización del cliente)';
COMMENT ON COLUMN solicitudes.ubicacion_lng IS 'Longitud de la ubicación del servicio (geolocalización del cliente)';
