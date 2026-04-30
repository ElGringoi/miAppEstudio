import { Slot, usePathname } from 'expo-router';
import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UsuarioProvider, useUsuario } from '@/context/UsuarioContext';
import Sidebar from '@/components/layout/Sidebar';

const RUTAS_SIN_MENU = ['/login', '/'];

function AppShell() {
  const [open, setOpen] = useState(false);
  const { usuario } = useUsuario();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const mostrarMenu = !!usuario && !RUTAS_SIN_MENU.includes(pathname);

  return (
    <View style={styles.root}>
      {mostrarMenu && (
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => setOpen(true)} style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.content}>
        <Slot />
      </View>
      <Sidebar open={open} onClose={() => setOpen(false)} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <UsuarioProvider>
      <AppShell />
    </UsuarioProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  menuBtn: { padding: 6 },
  content: { flex: 1 },
});
