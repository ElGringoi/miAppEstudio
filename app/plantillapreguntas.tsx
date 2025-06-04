import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PlantillaPreguntas() {
  const [preguntas, setPreguntas] = useState<{ materia: string; contenido: string[] }[]>([]);

  useEffect(() => {
    const cargarPreguntas = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const clavesPreguntas = keys.filter((k: string) => k.startsWith('preguntas_'));

      const resultados: { materia: string; contenido: string[] }[] = [];

      for (const clave of clavesPreguntas) {
        const contenido = await AsyncStorage.getItem(clave);
        if (contenido) {
          resultados.push({
            materia: clave.replace('preguntas_', ''),
            contenido: JSON.parse(contenido),
          });
        }
      }

      setPreguntas(resultados);
    };

    cargarPreguntas();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Plantilla de Preguntas</Text>
      {preguntas.map((grupo, idx) => (
        <View key={idx} style={styles.bloqueMateria}>
          <Text style={styles.materia}>{grupo.materia.toUpperCase()}</Text>
          {grupo.contenido.map((preg, i) => (
            <Text key={i} style={styles.pregunta}>{preg}</Text>
          ))}
        </View>
      ))}
      {preguntas.length === 0 && <Text style={styles.sinPreguntas}>No hay preguntas cargadas aún.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#111', flexGrow: 1 },
  titulo: { fontSize: 24, color: '#fff', marginBottom: 20, textAlign: 'center' },
  bloqueMateria: { marginBottom: 20 },
  materia: { fontSize: 20, color: '#00f', marginBottom: 10 },
  pregunta: { color: '#eee', marginBottom: 6, paddingLeft: 10 },
  sinPreguntas: { color: '#999', textAlign: 'center', marginTop: 50 },
});
