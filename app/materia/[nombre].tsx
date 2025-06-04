import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function MateriaScreen() {
  const { nombre } = useLocalSearchParams();

  const secciones = [
    { ruta: 'preguntero', texto: 'preguntero' },
    { ruta: 'apuntes', texto: 'apuntes' },
    { ruta: 'ejerciciospracticos', texto: 'ejercicios prácticos' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{nombre}</Text>
      {secciones.map((sec, i) => (
        <TouchableOpacity
          key={i}
          style={styles.boton}
          onPress={() => router.push(`/${sec.ruta}?materia=${nombre}`)}
        >
          <Text style={styles.texto}>{sec.texto}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 24, marginBottom: 30 },
  boton: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 10,
    width: '80%',
    borderRadius: 20,
    alignItems: 'center',
  },
  texto: { fontSize: 18 },
});
