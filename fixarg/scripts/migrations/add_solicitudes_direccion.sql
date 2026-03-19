-- Añadir dirección del servicio a la solicitud (flujo cliente: dirección exacta del trabajo)
ALTER TABLE solicitudes
ADD COLUMN IF NOT EXISTS direccion TEXT;

COMMENT ON COLUMN solicitudes.direccion IS 'Dirección donde se realizará el trabajo (calle, número, localidad, etc.)';
