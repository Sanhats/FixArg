import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiRequest, bearerHeaders } from '@fixarg/api-client';

export default function ChatScreen({ route }) {
  const { solicitudId, receptorId } = route.params || {};
  const { token, user } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef(null);

  const cargarMensajes = useCallback(async () => {
    if (!solicitudId || !token) return;
    try {
      const data = await apiRequest(`/api/mensajes?solicitudId=${solicitudId}`, {
        headers: bearerHeaders(token),
      });
      setMensajes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('cargarMensajes', e);
    }
  }, [solicitudId, token]);

  useEffect(() => {
    setLoading(true);
    cargarMensajes().finally(() => setLoading(false));
    const interval = setInterval(cargarMensajes, 3000);
    return () => clearInterval(interval);
  }, [cargarMensajes]);

  const enviarMensaje = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await apiRequest('/api/mensajes', {
        method: 'POST',
        headers: bearerHeaders(token),
        body: JSON.stringify({
          contenido: text.trim(),
          emisorId: user?._id,
          receptorId,
          solicitudId,
        }),
      });
      setText('');
      cargarMensajes();
    } catch (e) {
      console.warn('enviarMensaje', e);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.emisorId === user?._id || item.emisor_id === user?._id;
    return (
      <View style={[styles.msgBubble, isMine ? styles.msgMine : styles.msgOther]}>
        <Text style={[styles.msgText, isMine ? styles.msgTextMine : styles.msgTextOther]}>
          {item.contenido}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatRef}
        data={mensajes}
        keyExtractor={(m) => m._id || m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatRef.current?.scrollToEnd()}
      />
      <View style={styles.footer}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Escribe un mensaje..."
          multiline
        />
        <Pressable style={styles.sendBtn} onPress={enviarMensaje} disabled={sending || !text.trim()}>
          <Text style={styles.sendBtnText}>{sending ? '...' : 'Enviar'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  msgBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  msgMine: { backgroundColor: '#0f172a', alignSelf: 'flex-end' },
  msgOther: { backgroundColor: '#e2e8f0', alignSelf: 'flex-start' },
  msgText: { fontSize: 15 },
  msgTextMine: { color: '#fff' },
  msgTextOther: { color: '#0f172a' },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontWeight: '600' },
});
