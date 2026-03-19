/**
 * Lógica de plataforma: Matching Engine, Reputación y Antifraude.
 * Usado por el backend para ranking de profesionales y detección de fraude.
 */

/**
 * Calcula el score de reputación de un trabajador (0–100).
 * Variables: rating promedio, tasa de aceptación, trabajos completados, cancelaciones.
 * @param {object} params
 * @param {number} params.averageRating - 0–5
 * @param {number} params.acceptanceRate - 0–1 (aceptadas / (aceptadas + rechazadas))
 * @param {number} params.completedJobs
 * @param {number} params.cancellationRate - 0–1 (canceladas por él / total)
 * @returns {number}
 */
export function reputationScore({ averageRating = 0, acceptanceRate = 1, completedJobs = 0, cancellationRate = 0 }) {
  const ratingNorm = (averageRating / 5) * 40
  const acceptanceNorm = acceptanceRate * 30
  const completedNorm = Math.min(completedJobs / 10, 1) * 20
  const lowCancelNorm = (1 - Math.min(cancellationRate * 2, 1)) * 10
  return Math.round((ratingNorm + acceptanceNorm + completedNorm + lowCancelNorm) * 100) / 100
}

/**
 * Ordena trabajadores por score de matching (ranking).
 * Variables del matching: rating, precio, tasa de aceptación, disponibilidad (aquí no usamos distancia).
 * @param {Array} workers - Lista con averageRating, hourlyRate, acceptanceRate, completedJobs, cancellationCount, total (solicitudes)
 * @returns {Array} Misma lista ordenada por ranking descendente
 */
export function sortByMatchingRank(workers) {
  return [...workers].map((w) => ({
    ...w,
    rankingScore:
      w.rankingScore ??
      reputationScore({
        averageRating: w.averageRating ?? 0,
        acceptanceRate: w.acceptanceRate ?? 1,
        completedJobs: w.completedJobs ?? 0,
        cancellationRate: (w.total && w.cancellationCount != null) ? w.cancellationCount / w.total : 0,
      }),
  })).sort((a, b) => (b.rankingScore ?? 0) - (a.rankingScore ?? 0))
}

// --- Antifraude (stubs para futura implementación) ---

/**
 * Detecta posibles cuentas falsas (mismo patrón de registro, IP, etc.).
 * Por ahora solo stub.
 * @param {object} payload - { email, ip?, userAgent? }
 * @returns {{ risk: 'low'|'medium'|'high', reasons: string[] }}
 */
export function checkFakeAccount(payload) {
  const reasons = []
  // TODO: revisar IP repetida, emails temporales, patrones de registro
  return { risk: 'low', reasons }
}

/**
 * Detecta posibles trabajos fraudulentos (patrones anómalos en solicitudes).
 * Por ahora solo stub.
 * @param {object} payload - { solicitudId, usuarioId, trabajadorId, monto? }
 * @returns {{ risk: 'low'|'medium'|'high', reasons: string[] }}
 */
export function checkFraudulentJob(payload) {
  const reasons = []
  // TODO: muchas solicitudes mismo cliente/trabajador, montos atípicos, etc.
  return { risk: 'low', reasons }
}

/**
 * Detecta pagos sospechosos (cuando se implemente flujo de pago).
 * Por ahora solo stub.
 * @param {object} payload - { amount, userId, workerId, method? }
 * @returns {{ risk: 'low'|'medium'|'high', reasons: string[] }}
 */
export function checkSuspiciousPayment(payload) {
  const reasons = []
  // TODO: montos anómalos, frecuencia, método de pago
  return { risk: 'low', reasons }
}
