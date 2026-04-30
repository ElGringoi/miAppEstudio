import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';

export default function NuevaPreguntaScreen() {
  const { materia } = useLocalSearchParams<{ materia: string }>();
  const { usuario } = useUsuario();
  const [pregunta, setPregunta] = useState('');

  const guardarPregunta = async () => {
    if (!usuario || !pregunta.trim()) return;

    await addDoc(collection(db, 'usuarios', usuario.uid, 'preguntas'), {
      materia,
      contenido: pregunta.trim(),
    });

    alert(`Pregunta guardada en ${materia}`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Nueva pregunta — {materia}</Text>
      <TextInput
        placeholder="Escribí la pregunta"
        placeholderTextColor="#888"
        style={styles.input}
        value={pregunta}
        onChangeText={setPregunta}
        multiline
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  boton: { backgroundColor: '#444', padding: 16, borderRadius: 10, alignItems: 'center' },
  textoBoton: { color: '#fff', fontSize: 16 },
});
