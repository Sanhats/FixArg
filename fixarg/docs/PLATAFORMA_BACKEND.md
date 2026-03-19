# Flujo de la plataforma (backend)

Este documento describe los sistemas clave del backend: **Matching Engine**, **Sistema de reputación** y **Sistema antifraude**.

---

## 1. Matching Engine

Objetivo: encontrar al profesional adecuado para cada solicitud.

### Variables que intervienen

| Variable | Descripción | Dónde se usa |
|----------|-------------|--------------|
| **Rating** | Promedio de reseñas (1–5) | `trabajadores.average_rating`, actualizado por reviews |
| **Precio** | Tarifa por hora | `trabajadores.hourly_rate` (o por habilidad en `skills_json`) |
| **Tasa de aceptación** | Aceptadas / (Aceptadas + Rechazadas) | Calculada desde `solicitudes` por `trabajador_id` |
| **Disponibilidad** | Zonas y horarios | `trabajadores.zones`, `trabajadores.availability` (texto) |
| **Distancia** | (Futuro) Cliente–profesional | Requiere geolocalización de cliente y zonas del trabajador |

El **ranking** por defecto al listar profesionales (`GET /api/trabajadores`) combina estas variables en un **ranking score** (ver Sistema de reputación). El cliente puede ordenar por:

- `sort=ranking` (por defecto): mejor score de reputación primero.
- `sort=price_asc` / `sort=price_desc`: por precio.
- `sort=rating`: por valoración.

---

## 2. Sistema de reputación

Cada trabajador tiene un **score de reputación** que determina visibilidad y posición en el listado.

### Factores del score

- **Rating promedio** (peso alto): reseñas de clientes.
- **Tasa de aceptación**: solicitudes aceptadas frente a rechazadas.
- **Trabajos completados**: número de solicitudes en estado `completada`.
- **Cancelaciones**: solicitudes canceladas por el trabajador penalizan el score.
- **Velocidad de respuesta** (dato ya guardado): `solicitudes.responded_at` al aceptar/rechazar; se puede usar para ordenar o mostrar “Responde rápido”.

### Implementación

- Las estadísticas se calculan en **GET /api/trabajadores** a partir de `solicitudes` y `reviews`.
- Cada trabajador devuelve: `acceptanceRate`, `completedJobs`, `cancellationCount`, `rankingScore`.
- La fórmula del score está en `lib/platform.js` → `reputationScore()`.

---

## 3. Sistema antifraude

Objetivo: detectar cuentas falsas, trabajos fraudulentos y pagos sospechosos.

### Ámbitos

| Ámbito | Descripción | Estado |
|--------|-------------|--------|
| **Cuentas falsas** | Múltiples cuentas, IP compartida, emails temporales, patrones de registro anómalos | Stubs en `lib/platform.js` → `checkFakeAccount()` |
| **Trabajos fraudulentos** | Patrones anómalos en solicitudes (mismo par cliente–trabajador, montos raros, etc.) | Stubs en `lib/platform.js` → `checkFraudulentJob()` |
| **Pagos sospechosos** | Montos o frecuencia anómala cuando exista flujo de pago | Stubs en `lib/platform.js` → `checkSuspiciousPayment()` |

Las funciones devuelven `{ risk: 'low'|'medium'|'high', reasons: string[] }`. Por ahora no se bloquean operaciones; están preparadas para integrarse en registro, creación de solicitudes y (futuro) pagos.

---

## Resumen técnico

- **Matching y ranking**: `GET /api/trabajadores?sort=ranking|price_asc|price_desc|rating`, con estadísticas y `rankingScore` calculados en backend.
- **Reputación**: misma API; campos `acceptanceRate`, `completedJobs`, `cancellationCount`, `rankingScore`; lógica en `lib/platform.js`.
- **Velocidad de respuesta**: se guarda `responded_at` en `solicitudes` al aceptar/rechazar (migración `add_solicitudes_responded_at.sql`).
- **Antifraude**: `lib/platform.js` exporta `checkFakeAccount`, `checkFraudulentJob`, `checkSuspiciousPayment` para usar donde se considere necesario.
