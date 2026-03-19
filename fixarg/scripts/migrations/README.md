# Migraciones de base de datos (Supabase)

## Base de datos nueva (sin tablas aún)

Usa el esquema completo en **`../supabase-schema-complete.sql`**: crea todas las tablas y la función `update_worker_rating` de una vez. Ver `../SUPABASE_SETUP.md`.

## Base de datos existente (solo cambios incrementales)

Ejecutar en el SQL Editor **en este orden**:

1. `add_solicitudes_timestamps.sql` – añade `started_at` y `completed_at` a `solicitudes`
2. `create_notifications_table.sql` – crea la tabla `notifications`
3. `add_reviews_solicitud_id.sql` – añade `solicitud_id` a `reviews` y el índice único
4. `drop_whatsapp_messages.sql` – elimina la tabla `whatsapp_messages` (si existía)
5. `add_solicitudes_cancel_estados.sql` – estados de cancelación en solicitudes
6. `add_solicitudes_direccion.sql` – columna `direccion` en solicitudes (flujo cliente: dirección del trabajo)
7. `add_trabajador_onboarding.sql` – documentos, DNI, perfil y habilidades (flujo trabajador/Fixer)
8. `add_solicitudes_responded_at.sql` – momento en que el trabajador acepta/rechaza (velocidad de respuesta para reputación)
9. `add_solicitudes_duracion_fotos.sql` – duración estimada y fotos (fotos_json) en solicitudes
10. `add_solicitudes_servicio_rubro_trabajador_null.sql` – servicio_rubro, trabajador_id nullable, estado pendiente_presupuestos
11. `create_presupuestos_table.sql` – tabla presupuestos (monto, trabajador, solicitud)
12. `add_puntos_usuarios_trabajadores.sql` – columnas puntos en usuarios y trabajadores
13. `add_presupuestos_duracion_estimada.sql` – duración estimada en presupuestos (la indica el trabajador)

Las variables de Twilio ya no son necesarias.
