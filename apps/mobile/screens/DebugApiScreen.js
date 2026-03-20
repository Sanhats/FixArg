import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { getApiBaseUrl, apiRequest } from '@fixarg/api-client';

export default function DebugApiScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const base = getApiBaseUrl();

  async function ping() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiRequest('/api/health', { method: 'GET' });
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.code}>Base: {base || '(sin EXPO_PUBLIC_API_URL)'}</Text>
      <Pressable style={styles.btn} onPress={ping} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>GET /api/health</Text>}
      </Pressable>
      {result ? <Text style={styles.ok}>{result}</Text> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  code: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  btn: { backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  ok: { marginTop: 16, fontSize: 12, color: '#15803d' },
  err: { marginTop: 16, fontSize: 12, color: '#b91c1c' },
});
