import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUsuario } from '../context/UsuarioContext';

export default function IndexScreen() {
  const { usuario } = useUsuario();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Pequeño retardo para asegurar que el Layout raíz esté completamente montado
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Redirección basada en el usuario
  if (usuario) {
    return <Redirect href="/materias" />;
  } else {
    return <Redirect href="/LoginScreen" />;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});
