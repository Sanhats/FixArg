export const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  pendiente_presupuestos: 'Esperando presupuestos',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  en_progreso: 'En progreso',
  completada: 'Completada',
  cancelada_por_trabajador: 'Cancelada por el profesional',
  cancelada_por_cliente: 'Cancelada por ti',
};

export function labelEstado(e) {
  return ESTADO_LABELS[e] || e || '—';
}

export const PRESUPUESTO_LABELS = {
  enviado: 'Disponible',
  aprobado: 'Elegido',
  rechazado: 'No elegido',
};

export function labelEstadoPresupuesto(e) {
  return PRESUPUESTO_LABELS[e] || e || '—';
}
