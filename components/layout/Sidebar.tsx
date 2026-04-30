import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Image } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUsuario } from '@/context/UsuarioContext';

type Props = {
  open: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { label: 'Materias',    route: '/materias',    icon: 'book-outline'          },
  { label: 'Pregunteros', route: '/pregunteros', icon: 'help-circle-outline'   },
  { label: 'Agenda',      route: '/agenda',      icon: 'calendar-outline'      },
  { label: 'Gym',         route: '/gym',         icon: 'barbell-outline'       },
  { label: 'RPG',         route: '/rpg',         icon: 'star-outline'          },
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
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {usuario.picture ? (
          <Image source={{ uri: usuario.picture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={30} color="#888" />
          </View>
        )}
        <Text style={styles.userName}>{usuario.name}</Text>
        <Text style={styles.userEmail}>{usuario.email}</Text>

        <View style={styles.divider} />

        {NAV_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.navItem, pathname === item.route && styles.navItemActive]}
            onPress={() => { router.push(item.route as any); onClose(); }}
          >
            <Ionicons
              name={item.icon as any}
              size={20}
              color={pathname === item.route ? '#fff' : '#aaa'}
              style={styles.navIcon}
            />
            <Text style={[styles.navText, pathname === item.route && styles.navTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.navItem} onPress={cerrarSesion}>
          <Ionicons name="log-out-outline" size={20} color="#ff6b6b" style={styles.navIcon} />
          <Text style={[styles.navText, { color: '#ff6b6b' }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 200,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    backgroundColor: '#111',
    zIndex: 300,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
    marginTop: 10,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  userName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#666',
    fontSize: 13,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#2a2a2a',
  },
  navIcon: {
    marginRight: 12,
  },
  navText: {
    color: '#aaa',
    fontSize: 16,
  },
  navTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
