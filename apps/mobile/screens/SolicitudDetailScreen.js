import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiRequest, bearerHeaders } from '@fixarg/api-client';
import { labelEstado, labelEstadoPresupuesto } from '../constants/estados';

function nombreTrabajador(t) {
  if (!t) return 'Profesional';
  return (
    t.displayName ||
    [t.firstName, t.lastName].filter(Boolean).join(' ') ||
    t.email ||
    'Profesional'
  );
}

function formatMonto(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `$${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

export default function SolicitudDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [canceling, setCanceling] = useState(false);

  const load = useCallback(
    async ({ silent } = {}) => {
      if (!id || !token) {
        if (!silent) setLoading(false);
        setError('Falta id o sesión');
        return;
      }
      if (!silent) setLoading(true);
      setError(null);
      try {
        const json = await apiRequest(`/api/solicitudes/${id}`, {
          method: 'GET',
          headers: bearerHeaders(token),
        });
        setData(json);
      } catch (e) {
        setError(e.message || 'Error');
      } finally {
        if (!silent) setLoading(false);
        setRefreshing(false);
      }
    },
    [id, token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load({ silent: true });
  }, [load]);

  const approvePresupuesto = useCallback(
    (presupuestoId) => {
      Alert.alert(
        '¿Aprobar este presupuesto?',
        'El resto quedará descartado y la solicitud quedará confirmada con el profesional elegido.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Aprobar',
            style: 'default',
            onPress: async () => {
              setApprovingId(presupuestoId);
              try {
                await apiRequest(`/api/solicitudes/${id}`, {
                  method: 'PATCH',
                  headers: bearerHeaders(token),
                  body: JSON.stringify({
                    action: 'approve_presupuesto',
                    presupuestoId,
                  }),
                });
                await load({ silent: true });
                Alert.alert('Listo', 'Presupuesto aceptado. La solicitud quedó confirmada.');
              } catch (e) {
                Alert.alert('Error', e.message || 'No se pudo aprobar el presupuesto');
              } finally {
                setApprovingId(null);
              }
            },
          },
        ]
      );
    },
    [id, token, load]
  );

  const cancelarSolicitud = useCallback(() => {
    Alert.alert('¿Cancelar solicitud?', 'Esta acción no se puede deshacer.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          setCanceling(true);
          try {
            await apiRequest(`/api/solicitudes/${id}`, {
              method: 'PATCH',
              headers: bearerHeaders(token),
              body: JSON.stringify({ action: 'cancel' }),
            });
            await load({ silent: true });
            Alert.alert('Cancelada', 'La solicitud fue cancelada.');
          } catch (e) {
            Alert.alert('Error', e.message || 'No se pudo cancelar');
          } finally {
            setCanceling(false);
          }
        },
      },
    ]);
  }, [id, token, load]);

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.padded}>
        <Text style={styles.err}>{error || 'No encontrada'}</Text>
      </View>
    );
  }

  const t = data.trabajador;
  const trabajadorNombre = t ? nombreTrabajador(t) : null;
  const presupuestos = Array.isArray(data.presupuestos) ? data.presupuestos : [];
  const puedeElegir = data.estado === 'pendiente_presupuestos';
  const puedeCancelar =
    data.estado === 'pendiente' ||
    data.estado === 'pendiente_presupuestos' ||
    data.estado === 'confirmada';
  const puedeChat = data.trabajador_id && (data.estado === 'confirmada' || data.estado === 'en_progreso');

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.padded}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.estado}>{labelEstado(data.estado)}</Text>
      <Text style={styles.rubro}>{data.servicioRubro || 'Servicio'}</Text>
      <Text style={styles.label}>Cuándo</Text>
      <Text style={styles.val}>
        {data.fecha || '—'} {data.hora || ''}
      </Text>
      {data.direccion ? (
        <>
          <Text style={styles.label}>Dirección</Text>
          <Text style={styles.val}>{data.direccion}</Text>
        </>
      ) : null}
      <Text style={styles.label}>Descripción</Text>
      <Text style={styles.val}>{data.descripcion || '—'}</Text>
      {trabajadorNombre ? (
        <>
          <Text style={styles.label}>Profesional</Text>
          <Text style={styles.val}>{trabajadorNombre}</Text>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Presupuestos</Text>
      {puedeElegir && presupuestos.length === 0 ? (
        <Text style={styles.hint}>
          Los profesionales del rubro te enviarán presupuestos. Tirá hacia abajo para actualizar.
        </Text>
      ) : null}
      {presupuestos.length === 0 && !puedeElegir ? (
        <Text style={styles.muted}>No hay presupuestos para esta solicitud.</Text>
      ) : null}

      {presupuestos.map((p) => {
        const tw = p.trabajador;
        const nombre = nombreTrabajador(tw);
        const puedeAceptar =
          puedeElegir && p.estado === 'enviado' && approvingId !== p.id;
        const aprobandoEste = approvingId === p.id;

        return (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardNombre}>{nombre}</Text>
              <View
                style={[
                  styles.badge,
                  p.estado === 'aprobado' && styles.badgeOk,
                  p.estado === 'rechazado' && styles.badgeMuted,
                ]}
              >
                <Text style={styles.badgeText}>{labelEstadoPresupuesto(p.estado)}</Text>
              </View>
            </View>
            <Text style={styles.monto}>{formatMonto(p.monto)}</Text>
            {p.duracionEstimada ? (
              <Text style={styles.cardMeta}>Duración estimada: {p.duracionEstimada}</Text>
            ) : null}
            {p.mensaje ? (
              <>
                <Text style={styles.cardLabel}>Mensaje</Text>
                <Text style={styles.cardMensaje}>{p.mensaje}</Text>
              </>
            ) : null}
            {tw?.averageRating != null ? (
              <Text style={styles.cardMeta}>
                Valoración: {Number(tw.averageRating).toFixed(1)} ★
              </Text>
            ) : null}
            {puedeAceptar ? (
              <Pressable
                style={styles.btnAceptar}
                onPress={() => approvePresupuesto(p.id)}
                disabled={!!approvingId}
              >
                {aprobandoEste ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnAceptarText}>Aceptar este presupuesto</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        );
      })}

      {puedeChat ? (
        <Pressable
          style={styles.btnChat}
          onPress={() =>
            navigation.navigate('Chat', {
              solicitudId: data.id || data._id,
              receptorId: data.trabajador_id,
            })
          }
        >
          <Text style={styles.btnChatText}>Enviar mensaje al profesional</Text>
        </Pressable>
      ) : null}

      {puedeCancelar ? (
        <Pressable style={styles.btnCancel} onPress={cancelarSolicitud} disabled={canceling}>
          {canceling ? (
            <ActivityIndicator color="#b91c1c" />
          ) : (
            <Text style={styles.btnCancelText}>Cancelar solicitud</Text>
          )}
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  padded: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  estado: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  rubro: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  label: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', marginTop: 16 },
  val: { fontSize: 16, color: '#334155', marginTop: 4 },
  err: { color: '#b91c1c', fontSize: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 28,
    marginBottom: 12,
  },
  hint: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  muted: { fontSize: 14, color: '#94a3b8' },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardNombre: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  badge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeOk: { backgroundColor: '#dcfce7' },
  badgeMuted: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  monto: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginTop: 8 },
  cardMeta: { fontSize: 13, color: '#64748b', marginTop: 6 },
  cardLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginTop: 12 },
  cardMensaje: { fontSize: 15, color: '#334155', marginTop: 4, lineHeight: 22 },
  btnAceptar: {
    marginTop: 14,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnAceptarText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnChat: {
    marginTop: 24,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnChatText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnCancel: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f87171',
    alignItems: 'center',
  },
  btnCancelText: { color: '#b91c1c', fontWeight: '600', fontSize: 16 },
});
