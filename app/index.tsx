// app/index.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUsuario } from '../context/UsuarioContext';

export default function IndexScreen() {
  const { usuario } = useUsuario();
  useEffect(() => {
    if (usuario) {
      router.replace('/materias');
    } else {
      router.replace('/LoginScreen');
    }
  }, [usuario]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});


