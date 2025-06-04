import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function EjerciciosPracticosScreen() {
  const { materia } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Ejercicios prácticos de: {materia}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  texto: { color: '#fff', fontSize: 22 },
});