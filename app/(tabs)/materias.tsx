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
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';
import { colors, radius, spacing, font, shadow } from '@/constants/theme';

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
    return onSnapshot(q, (snap) => {
      setMaterias(snap.docs.map((d) => ({ id: d.id, nombre: d.data().nombre as string })));
    });
  }, [usuario]);

  const agregarMateria = async () => {
    if (!usuario || !nuevaMateria.trim()) return;
    const nombre = nuevaMateria.trim();
    if (materias.some((m) => m.nombre.toLowerCase() === nombre.toLowerCase())) return;
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBadge}>
            <MaterialIcons name="menu-book" size={22} color={colors.accent} />
          </View>
          <Text style={styles.headerTitulo}>MATERIAS</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {materias.length > 0 && (
          <Text style={styles.label}>{materias.length} {materias.length === 1 ? 'MATERIA' : 'MATERIAS'}</Text>
        )}

        {materias.map((materia) => (
          <View key={materia.id} style={styles.fila}>
            <TouchableOpacity
              style={styles.materiaCard}
              onPress={() => router.push(`/materia/${materia.nombre}`)}
              activeOpacity={0.7}
            >
              <View style={styles.materiaLeft}>
                <View style={styles.materiaIconBadge}>
                  <MaterialIcons name="book" size={16} color={colors.accent} />
                </View>
                <Text style={styles.materiaTexto}>{materia.nombre}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => eliminarMateria(materia.id)} style={styles.btnEliminar}>
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        {mostrarInput ? (
          <View style={styles.formulario}>
            <TextInput
              placeholder="Nombre de la materia"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={nuevaMateria}
              onChangeText={setNuevaMateria}
              autoFocus
              onSubmitEditing={agregarMateria}
            />
            <View style={styles.filaAcciones}>
              <TouchableOpacity style={[styles.btnPrimario, { flex: 1 }]} onPress={agregarMateria}>
                <MaterialIcons name="check" size={18} color="#fff" />
                <Text style={styles.btnPrimarioTexto}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSecundario, { flex: 1 }]}
                onPress={() => { setMostrarInput(false); setNuevaMateria(''); }}
              >
                <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.btnAgregar} onPress={() => setMostrarInput(true)}>
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={styles.btnAgregarTexto}>Agregar materia</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.card,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { fontSize: font.xl, fontWeight: '900', color: colors.text, letterSpacing: 1 },

  scroll: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.hh },

  label: { fontSize: font.xs, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8, marginBottom: spacing.xs },

  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  materiaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  materiaLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  materiaIconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materiaTexto: { fontSize: font.base, color: colors.text, fontWeight: '600' },

  btnEliminar: {
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },

  formulario: { gap: spacing.sm, marginTop: spacing.xs },

  input: {
    backgroundColor: colors.card,
    color: colors.text,
    padding: spacing.md,
    borderRadius: radius.md,
    fontSize: font.base,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filaAcciones: { flexDirection: 'row', gap: spacing.sm },

  btnPrimario: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadow.blue,
  },
  btnPrimarioTexto: { color: '#fff', fontSize: font.base, fontWeight: '700' },

  btnSecundario: {
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecundarioTexto: { color: colors.textSec, fontSize: font.base, fontWeight: '600' },

  btnAgregar: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    ...shadow.blue,
  },
  btnAgregarTexto: { color: '#fff', fontSize: font.base, fontWeight: '700' },
});
