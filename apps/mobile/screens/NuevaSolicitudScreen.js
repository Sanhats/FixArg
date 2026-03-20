import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { apiRequest, bearerHeaders } from '@fixarg/api-client';

function buildDireccionCasa(user) {
  if (!user) return '';
  const parts = [user.street, user.streetNumber, user.locality, user.province].filter(Boolean);
  return parts.join(', ').trim();
}

function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeLocal(d) {
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export default function NuevaSolicitudScreen({ navigation, route }) {
  const { servicioRubro, servicioLabel } = route.params || {};
  const { token, user } = useAuth();
  const [descripcion, setDescripcion] = useState('');
  const now = useMemo(() => new Date(), []);
  const [fecha, setFecha] = useState(now);
  const [hora, setHora] = useState(() => {
    const t = new Date();
    t.setHours(9, 0, 0, 0);
    return t;
  });
  const [direccion, setDireccion] = useState('');
  const [ubicacionLat, setUbicacionLat] = useState(null);
  const [ubicacionLng, setUbicacionLng] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!servicioRubro) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>Falta el tipo de servicio.</Text>
        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const usarDireccionCasa = () => {
    setDireccion(buildDireccionCasa(user));
    setUbicacionLat(null);
    setUbicacionLng(null);
  };

  const usarUbicacionActual = async () => {
    setLocLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Necesitamos permiso de ubicacion.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      let text = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (places?.length) {
          const p = places[0];
          const parts = [p.street, p.streetNumber, p.city, p.region].filter(Boolean);
          if (parts.length) text = parts.join(', ');
        }
      } catch (_) {}
      setDireccion(text);
      setUbicacionLat(lat);
      setUbicacionLng(lng);
    } catch (e) {
      setError(e.message || 'No se pudo obtener la ubicacion');
    } finally {
      setLocLoading(false);
    }
  };
  const elegirFoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a tus fotos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        if (asset.base64) {
          const dataUri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
          setFotos((prev) => [...prev, dataUri]);
        }
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo cargar la foto');
    }
  };

  const removerFoto = (idx) => {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  };
  const onDateChange = (event, d) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (event.type === 'dismissed') return;
    if (d) setFecha(d);
  };

  const onTimeChange = (event, d) => {
    if (Platform.OS === 'android') setShowTime(false);
    if (event.type === 'dismissed') return;
    if (d) setHora(d);
  };

  const onSubmit = async () => {
    setError(null);
    const desc = descripcion.trim();
    if (!desc) {
      setError('Completa la descripcion del trabajo');
      return;
    }
    if (!token) {
      setError('Sesion no valida');
      return;
    }
    const fechaStr = formatDateLocal(fecha);
    const horaStr = formatTimeLocal(hora);
    const today = formatDateLocal(new Date());
    if (fechaStr < today) {
      setError('La fecha no puede ser anterior a hoy');
      return;
    }
    setLoading(true);
    try {
      const body = { descripcion: desc, fecha: fechaStr, hora: horaStr, servicioRubro };
      const dir = direccion.trim();
      if (dir) body.direccion = dir;
      if (ubicacionLat != null && ubicacionLng != null) {
        body.ubicacionLat = ubicacionLat;
        body.ubicacionLng = ubicacionLng;
      }
      if (fotos.length) {
        body.fotos = fotos;
      }
      const data = await apiRequest('/api/solicitudes', {
        method: 'POST',
        headers: bearerHeaders(token),
        body: JSON.stringify(body),
      });
      const id = data?.id || data?.solicitud?.id;
      Alert.alert(
        'Listo',
        'Tu solicitud fue enviada.',
        [
          { text: 'Mis solicitudes', onPress: () => navigation.navigate('MisSolicitudes') },
          ...(id
            ? [{ text: 'Ver detalle', onPress: () => navigation.navigate('SolicitudDetail', { id: String(id) }) }]
            : []),
        ]
      );
    } catch (e) {
      setError(e.message || 'No se pudo enviar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.pad}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{servicioLabel || servicioRubro}</Text>
      </View>
      <Text style={styles.fieldLabel}>Descripcion</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Describe el trabajo..."
        placeholderTextColor="#94a3b8"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        textAlignVertical="top"
      />
      <Text style={styles.fieldLabel}>Fecha</Text>
      <Pressable style={styles.inputLike} onPress={() => setShowDate(true)}>
        <Text style={styles.inputLikeText}>{formatDateLocal(fecha)}</Text>
      </Pressable>
      {showDate ? (
        <DateTimePicker
          value={fecha}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      ) : null}
      {Platform.OS === 'ios' && showDate ? (
        <Pressable style={styles.outlineBtn} onPress={() => setShowDate(false)}>
          <Text style={styles.outlineBtnText}>Cerrar fecha</Text>
        </Pressable>
      ) : null}
      <Text style={styles.fieldLabel}>Hora</Text>
      <Pressable style={styles.inputLike} onPress={() => setShowTime(true)}>
        <Text style={styles.inputLikeText}>{formatTimeLocal(hora)}</Text>
      </Pressable>
      {showTime ? (
        <DateTimePicker
          value={hora}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour
          onChange={onTimeChange}
        />
      ) : null}
      {Platform.OS === 'ios' && showTime ? (
        <Pressable style={styles.outlineBtn} onPress={() => setShowTime(false)}>
          <Text style={styles.outlineBtnText}>Cerrar hora</Text>
        </Pressable>
      ) : null}
      <Text style={styles.fieldLabel}>Direccion (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Donde se realiza el trabajo"
        placeholderTextColor="#94a3b8"
        value={direccion}
        onChangeText={setDireccion}
      />
      <View style={styles.rowBtns}>
        <Pressable style={styles.outlineBtn} onPress={usarDireccionCasa} disabled={!user}>
          <Text style={styles.outlineBtnText}>Mi direccion</Text>
        </Pressable>
        <Pressable style={styles.outlineBtn} onPress={usarUbicacionActual} disabled={locLoading}>
          <Text style={styles.outlineBtnText}>{locLoading ? '...' : 'Ubicacion actual'}</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Fotos (opcional)</Text>
      <Pressable style={styles.outlineBtn} onPress={elegirFoto}>
        <Text style={styles.outlineBtnText}>Agregar foto</Text>
      </Pressable>
      {fotos.length > 0 ? (
        <View style={styles.fotosWrap}>
          {fotos.map((uri, idx) => (
            <View key={idx} style={styles.fotoItem}>
              <Text style={styles.fotoLabel}>Foto {idx + 1}</Text>
              <Pressable style={styles.fotoRemoveBtn} onPress={() => removerFoto(idx)}>
                <Text style={styles.fotoRemoveText}>X</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Pressable style={[styles.btn, loading && styles.btnDis]} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enviar solicitud</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  pad: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', padding: 24 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  badgeText: { color: '#312e81', fontWeight: '600', fontSize: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  textarea: { minHeight: 100 },
  inputLike: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  inputLikeText: { fontSize: 16, color: '#0f172a' },
  rowBtns: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  outlineBtnText: { color: '#334155', fontWeight: '500', fontSize: 14 },
  fotosWrap: { marginTop: 10, gap: 8 },
  fotoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fotoLabel: { fontSize: 14, color: '#334155', fontWeight: '500' },
  fotoRemoveBtn: {
    backgroundColor: '#fca5a5',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoRemoveText: { color: '#7f1d1d', fontWeight: '700', fontSize: 14 },
  err: { color: '#b91c1c', marginTop: 12, marginBottom: 8 },
  btn: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  btnDis: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
