import { Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { RUBROS_SERVICIO } from '../constants/rubros';

export default function ServiciosScreen({ navigation }) {
  return (
    <FlatList
      data={RUBROS_SERVICIO}
      keyExtractor={(item) => item.value}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() =>
            navigation.navigate('NuevaSolicitud', {
              servicioRubro: item.value,
              servicioLabel: item.label,
            })
          }
        >
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.chev}>›</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  label: { fontSize: 17, color: '#0f172a', fontWeight: '500' },
  chev: { fontSize: 22, color: '#94a3b8' },
});
