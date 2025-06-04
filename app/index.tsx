// app/index.tsx
import { useEffect, useContext } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { UsuarioContext } from '../context/UsuarioContext';

export default function IndexScreen() {
  const { usuario } = useContext(UsuarioContext);

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
