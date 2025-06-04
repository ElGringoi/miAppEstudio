import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';

export default function NuevaPreguntaScreen() {
  const { materia } = useLocalSearchParams();
  const [pregunta, setPregunta] = useState('');

  const guardarPregunta = async () => {
    if (pregunta.trim() !== '') {
      const clave = `preguntas_${materia}`;
      const guardadas = await AsyncStorage.getItem(clave);
      const preguntas = guardadas ? JSON.parse(guardadas) : [];
      preguntas.push(pregunta.trim());
      await AsyncStorage.setItem(clave, JSON.stringify(preguntas));
      alert(`Pregunta guardada en ${materia}`);
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Nueva pregunta - {materia}</Text>
      <TextInput
        placeholder="Escribí la pregunta"
        placeholderTextColor="#888"
        style={styles.input}
        value={pregunta}
        onChangeText={setPregunta}
      />
      <TouchableOpacity style={styles.boton} onPress={guardarPregunta}>
        <Text style={styles.textoBoton}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000', justifyContent: 'center' },
  titulo: { color: '#fff', fontSize: 24, marginBottom: 20 },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  boton: {
    backgroundColor: '#444',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
  },
});