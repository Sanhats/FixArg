-- ============================================================
-- FixArg - Esquema completo de base de datos para Supabase
-- Ejecutar en el SQL Editor del proyecto Supabase (una sola vez)
-- ============================================================

-- 1. Usuarios (clientes)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  hashed_password TEXT NOT NULL,
  street TEXT,
  street_number TEXT,
  province TEXT,
  locality TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trabajadores / profesionales
CREATE TABLE IF NOT EXISTS trabajadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  display_name TEXT,
  occupation TEXT,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  description TEXT,
  hashed_password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  average_rating NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Solicitudes de trabajo
CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'rechazada', 'en_progreso', 'completada', 'cancelada_por_trabajador', 'cancelada_por_cliente')),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_trabajador ON solicitudes (trabajador_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario ON solicitudes (usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes (estado);

-- 4. Reseñas (una por solicitud completada; también por trabajador+usuario legacy)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  solicitud_id UUID REFERENCES solicitudes(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_solicitud_unique ON reviews (solicitud_id) WHERE solicitud_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_trabajador ON reviews (trabajador_id);

-- 5. Mensajes (chat entre cliente y trabajador por solicitud)
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contenido TEXT NOT NULL,
  emisor_id UUID NOT NULL,
  receptor_id UUID NOT NULL,
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_solicitud ON mensajes (solicitud_id);

-- 6. Notificaciones internas (user_id = usuarios.id o trabajadores.id según user_type)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL CHECK (user_type IN ('usuario', 'trabajador')),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

-- 7. Códigos de verificación de email
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 8. Función RPC para actualizar el promedio de calificaciones del trabajador
CREATE OR REPLACE FUNCTION update_worker_rating(worker_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE trabajadores
  SET average_rating = (
    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)
    FROM reviews
    WHERE trabajador_id = update_worker_rating.worker_id
  )
  WHERE id = update_worker_rating.worker_id;
END;
$$;

-- Comentarios para documentación
COMMENT ON TABLE usuarios IS 'Clientes que solicitan servicios';
COMMENT ON TABLE trabajadores IS 'Profesionales que ofrecen servicios (estado pending/approved)';
COMMENT ON TABLE solicitudes IS 'Solicitudes de trabajo: pendiente → confirmada → en_progreso → completada';
COMMENT ON TABLE reviews IS 'Reseñas de clientes a trabajadores; puede ligarse a solicitud_id (una por solicitud)';
COMMENT ON TABLE mensajes IS 'Chat interno por solicitud entre cliente y trabajador';
COMMENT ON TABLE notifications IS 'Notificaciones in-app por user_type (usuario/trabajador) y user_id';
COMMENT ON TABLE verification_codes IS 'Códigos de verificación de email (registro, etc.)';
