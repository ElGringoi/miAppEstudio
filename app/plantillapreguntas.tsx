import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';

type GrupoMateria = {
  materia: string;
  contenido: string[];
};

export default function PlantillaPreguntas() {
  const { usuario } = useUsuario();
  const [grupos, setGrupos] = useState<GrupoMateria[]>([]);

  useEffect(() => {
    if (!usuario) return;

    const q = query(
      collection(db, 'usuarios', usuario.uid, 'preguntas'),
      orderBy('materia')
    );
    const cancelar = onSnapshot(q, (snap) => {
      const mapa: Record<string, string[]> = {};
      snap.docs.forEach((d) => {
        const { materia, contenido } = d.data() as { materia: string; contenido: string };
        if (!mapa[materia]) mapa[materia] = [];
        mapa[materia].push(contenido);
      });
      setGrupos(
        Object.entries(mapa).map(([materia, contenido]) => ({ materia, contenido }))
      );
    });
    return cancelar;
  }, [usuario]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Plantilla de Preguntas</Text>
      {grupos.map((grupo, idx) => (
        <View key={idx} style={styles.bloqueMateria}>
          <Text style={styles.materia}>{grupo.materia.toUpperCase()}</Text>
          {grupo.contenido.map((preg, i) => (
            <Text key={i} style={styles.pregunta}>
              {preg}
            </Text>
          ))}
        </View>
      ))}
      {grupos.length === 0 && (
        <Text style={styles.sinPreguntas}>No hay preguntas cargadas aún.</Text>
      )}
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
