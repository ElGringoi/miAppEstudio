import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUsuario } from '../context/UsuarioContext';

export default function IndexScreen() {
  const { usuario, cargando } = useUsuario();

  useEffect(() => {
    // Espera a que Firebase resuelva la sesión antes de redirigir
    if (cargando) return;
    if (usuario) {
      router.replace('/materias');
    } else {
      router.replace('/LoginScreen');
    }
  }, [usuario, cargando]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});
