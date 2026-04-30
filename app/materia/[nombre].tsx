import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors, font, radius, shadow, spacing } from '@/constants/theme';

const SECCIONES = [
  { ruta: 'preguntero', texto: 'Preguntero', icon: 'quiz' as const, desc: 'Practicá con preguntas' },
  { ruta: 'apuntes', texto: 'Apuntes', icon: 'notes' as const, desc: 'Tus notas de la materia' },
  { ruta: 'ejerciciospracticos', texto: 'Ejercicios Prácticos', icon: 'assignment' as const, desc: 'Ejercicios y problemas' },
];

export default function MateriaScreen() {
  const { nombre } = useLocalSearchParams<{ nombre: string }>();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerIcono}>
          <MaterialIcons name="book" size={20} color="#fff" />
        </View>
        <View>
          <Text style={s.materiaNombre}>{nombre}</Text>
          <Text style={s.materiaLabel}>SELECCIONÁ UNA SECCIÓN</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {SECCIONES.map((sec) => (
          <TouchableOpacity
            key={sec.ruta}
            style={s.card}
            onPress={() => router.push(`/${sec.ruta}?materia=${nombre}`)}
            activeOpacity={0.75}
          >
            <View style={s.cardIcono}>
              <MaterialIcons name={sec.icon} size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitulo}>{sec.texto}</Text>
              <Text style={s.cardDesc}>{sec.desc}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcono: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.blue,
  },
  materiaNombre: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  materiaLabel: { fontSize: font.xs, color: colors.textMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  body: { padding: spacing.xl, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardIcono: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitulo: { fontSize: font.base, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: font.sm, color: colors.textSec, marginTop: 2 },
});
