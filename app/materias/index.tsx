import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';

type Materia = {
  id: string;
  nombre: string;
};

export default function MateriasScreen() {
  const { usuario } = useUsuario();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [mostrarInput, setMostrarInput] = useState(false);

  useEffect(() => {
    if (!usuario) return;

    const ref = collection(db, 'usuarios', usuario.uid, 'materias');
    const q = query(ref, orderBy('nombre'));
    const cancelar = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, nombre: d.data().nombre as string }));
      setMaterias(data);
    });
    return cancelar;
  }, [usuario]);

  const agregarMateria = async () => {
    if (!usuario || !nuevaMateria.trim()) return;
    const nombre = nuevaMateria.trim();
    const yaExiste = materias.some((m) => m.nombre.toLowerCase() === nombre.toLowerCase());
    if (yaExiste) return;

    await addDoc(collection(db, 'usuarios', usuario.uid, 'materias'), { nombre });
    setNuevaMateria('');
    setMostrarInput(false);
  };

  const eliminarMateria = async (id: string) => {
    if (!usuario) return;
    await deleteDoc(doc(db, 'usuarios', usuario.uid, 'materias', id));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.icono} onPress={() => router.push('/plantillaPreguntas')}>
        <Ionicons name="document-text-outline" size={28} color="#333" />
      </TouchableOpacity>
      <Text style={styles.titulo}>materias</Text>

      {materias.map((materia) => (
        <View key={materia.id} style={styles.fila}>
          <TouchableOpacity
            style={[styles.boton, { flex: 1 }]}
            onPress={() => router.push(`/materia/${materia.nombre}`)}
          >
            <Text style={styles.texto}>{materia.nombre}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => eliminarMateria(materia.id)} style={styles.eliminar}>
            <Text style={{ color: 'tomato', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {mostrarInput ? (
        <>
          <TextInput
            placeholder="Nueva materia"
            placeholderTextColor="#666"
            style={styles.input}
            value={nuevaMateria}
            onChangeText={setNuevaMateria}
            autoFocus
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
  fila: { flexDirection: 'row', alignItems: 'center', width: '80%', marginVertical: 8 },
  boton: {
    backgroundColor: '#fff',
    padding: 20,
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
  eliminar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
