import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiRequest, bearerHeaders } from '@fixarg/api-client';
import { labelEstado } from '../constants/estados';

export default function MisSolicitudesScreen({ navigation }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await apiRequest(`/api/solicitudes?_=${Date.now()}`, {
        method: 'GET',
        headers: bearerHeaders(token),
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Error al cargar');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {error ? <Text style={styles.banner}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id || item._id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No tenés solicitudes todavía.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('SolicitudDetail', { id: item.id || item._id })}
          >
            <Text style={styles.rubro} numberOfLines={1}>{item.servicioRubro || 'Servicio'}</Text>
            <Text style={styles.estado}>{labelEstado(item.estado)}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.descripcion || '—'}</Text>
            <Text style={styles.meta}>{item.fecha || ''} {item.hora || ''}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { backgroundColor: '#fef2f2', color: '#b91c1c', padding: 12, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 48, paddingHorizontal: 24 },
  row: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  rubro: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  estado: { fontSize: 13, color: '#64748b', marginTop: 4 },
  desc: { fontSize: 14, color: '#334155', marginTop: 8 },
  meta: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
});
