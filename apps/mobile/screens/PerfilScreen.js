import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function PerfilScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    street: user?.street || '',
    streetNumber: user?.streetNumber || '',
    locality: user?.locality || '',
    province: user?.province || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi perfil</Text>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={form.firstName}
        onChangeText={(v) => setForm((p) => ({ ...p, firstName: v }))}
      />
      <Text style={styles.label}>Apellido</Text>
      <TextInput
        style={styles.input}
        value={form.lastName}
        onChangeText={(v) => setForm((p) => ({ ...p, lastName: v }))}
      />
      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        value={form.phone}
        onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
      />
      <Text style={styles.label}>Calle</Text>
      <TextInput
        style={styles.input}
        value={form.street}
        onChangeText={(v) => setForm((p) => ({ ...p, street: v }))}
      />
      <Text style={styles.label}>Número</Text>
      <TextInput
        style={styles.input}
        value={form.streetNumber}
        onChangeText={(v) => setForm((p) => ({ ...p, streetNumber: v }))}
      />
      <Text style={styles.label}>Localidad</Text>
      <TextInput
        style={styles.input}
        value={form.locality}
        onChangeText={(v) => setForm((p) => ({ ...p, locality: v }))}
      />
      <Text style={styles.label}>Provincia</Text>
      <TextInput
        style={styles.input}
        value={form.province}
        onChangeText={(v) => setForm((p) => ({ ...p, province: v }))}
      />
      <Pressable style={styles.btn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar cambios</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  label: { fontSize: 13, color: '#64748b', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
