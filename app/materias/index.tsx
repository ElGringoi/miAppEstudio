import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MateriasScreen() {
  const [materias, setMaterias] = useState<string[]>([]);
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [mostrarInput, setMostrarInput] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('materias').then((data: string | null) => {
      if (data) setMaterias(JSON.parse(data));
      else setMaterias(['matematica', 'fisica']);
    });
  }, []);

  const agregarMateria = async () => {
    if (nuevaMateria.trim() !== '' && !materias.includes(nuevaMateria.trim())) {
      const actualizadas = [...materias, nuevaMateria.trim()];
      setMaterias(actualizadas);
      await AsyncStorage.setItem('materias', JSON.stringify(actualizadas));
      setNuevaMateria('');
      setMostrarInput(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.icono} onPress={() => router.push('/plantillaPreguntas')}>
        <Ionicons name="document-text-outline" size={28} color="#333" />
      </TouchableOpacity>
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
      {mostrarInput ? (
        <>
          <TextInput
            placeholder="Nueva materia"
            placeholderTextColor="#666"
            style={styles.input}
            value={nuevaMateria}
            onChangeText={setNuevaMateria}
          />
          <TouchableOpacity style={styles.boton} onPress={agregarMateria}>
            <Text style={styles.texto}>Guardar materia</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.boton} onPress={() => setMostrarInput(true)}>
          <Text style={styles.texto}>+ Agregar materia</Text>
        </TouchableOpacity>
      )}
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
  input: {
    backgroundColor: '#eee',
    padding: 14,
    width: '80%',
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  icono: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
});
