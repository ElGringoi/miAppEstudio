import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const materias = ['matematica', 'lengua', 'fisica'];

export default function MateriasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>materias</Text>
      {materias.map((materia, index) => (
        <TouchableOpacity
          key={index}
          style={styles.boton}
          onPress={() => router.push(`/materia/${materia}`)}
        >
          <Text style={styles.texto}>{materia}</Text>
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
