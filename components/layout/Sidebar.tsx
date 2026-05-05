import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Image } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUsuario } from '@/context/UsuarioContext';
import { QF } from '@/constants/questflow';

type Props = { open: boolean; onClose: () => void };

const NAV_ITEMS = [
  { label: 'Battle HQ',   route: '/(tabs)/dashboard', icon: 'shield-outline' as const },
  { label: 'Battle Log',  route: '/(tabs)/calendar',  icon: 'calendar-outline' as const },
  { label: 'Gym',         route: '/(tabs)/gym',        icon: 'barbell-outline' as const },
  { label: 'RPG',         route: '/(tabs)/rpg',        icon: 'star-outline' as const },
  { label: 'Estudio',     route: '/(tabs)/materias',   icon: 'book-outline' as const },
];

export default function Sidebar({ open, onClose }: Props) {
  const { usuario, cerrarSesion } = useUsuario();
  const pathname = usePathname();

  if (!usuario || !open) return null;

  return (
    <>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sidebar}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color={QF.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.profile}>
          {usuario.picture ? (
            <Image source={{ uri: usuario.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={28} color={QF.colors.textMuted} />
            </View>
          )}
          <Text style={styles.userName}>{usuario.name}</Text>
          <Text style={styles.userEmail}>{usuario.email}</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>⚔️ HERO</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {NAV_ITEMS.map(item => {
          const active = pathname.includes(item.route.replace('/(tabs)', ''));
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => { router.push(item.route as any); onClose(); }}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? QF.colors.accent : QF.colors.textSecondary}
                style={styles.navIcon}
              />
              <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
              {active && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.navItem} onPress={cerrarSesion}>
          <Ionicons name="log-out-outline" size={20} color={QF.colors.danger} style={styles.navIcon} />
          <Text style={[styles.navText, { color: QF.colors.danger }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: QF.colors.overlay, zIndex: 200,
  },
  sidebar: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: 270,
    backgroundColor: QF.colors.surface, zIndex: 300,
    paddingTop: 56, paddingHorizontal: 20,
    borderRightWidth: 1, borderRightColor: QF.colors.cardBorder,
  },
  closeBtn: { position: 'absolute', top: 16, right: 16 },

  profile: { paddingBottom: 4, alignItems: 'flex-start' },
  avatar: { width: 58, height: 58, borderRadius: 29, marginBottom: 10, borderWidth: 2, borderColor: QF.colors.accent },
  avatarPlaceholder: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: QF.colors.elevated, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  userName: { color: QF.colors.textPrimary, fontSize: QF.font.md, fontWeight: '700' },
  userEmail: { color: QF.colors.textMuted, fontSize: QF.font.xs, marginTop: 2 },
  heroBadge: {
    marginTop: 8, backgroundColor: QF.colors.accentGlow,
    borderRadius: QF.radius.full, borderWidth: 1, borderColor: QF.colors.accent,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '800', color: QF.colors.accent, letterSpacing: 1 },

  divider: { height: 1, backgroundColor: QF.colors.cardBorder, marginVertical: 16 },

  navItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    paddingHorizontal: 10, borderRadius: QF.radius.lg, marginBottom: 4,
  },
  navItemActive: { backgroundColor: QF.colors.accentGlow },
  navIcon: { marginRight: 12 },
  navText: { flex: 1, color: QF.colors.textSecondary, fontSize: QF.font.md, fontWeight: '500' },
  navTextActive: { color: QF.colors.accent, fontWeight: '700' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: QF.colors.accent },
});
