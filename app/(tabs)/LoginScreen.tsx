import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, Image, ActivityIndicator } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useUsuario } from '../../context/UsuarioContext';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { usuario, loading } = useUsuario();

  // 📝 IMPORTANTE: Debes configurar tus IDs de cliente para cada plataforma
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '232006316621-q60k6o6dej1eqheb3blk96e3235ktmu1.apps.googleusercontent.com',
    iosClientId: 'TU_IOS_CLIENT_ID',
    androidClientId: 'TU_ANDROID_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { idToken } = response.params;
      const credential = GoogleAuthProvider.credential(idToken);
      
      signInWithCredential(auth, credential)
        .then(() => {
          // La navegación y el estado del usuario los maneja el UsuarioContext (onAuthStateChanged)
          router.replace('/materias');
        })
        .catch((error) => {
          console.error("Error al autenticar con Firebase:", error);
        });
    }
  }, [response]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!usuario ? (
        <>
          <Text style={styles.title}>Iniciar sesión con Google</Text>
          <Button 
            title="Ingresar con Google" 
            disabled={!request} 
            onPress={() => promptAsync()} 
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>¡Bienvenido, {usuario.name}!</Text>
          <Image source={{ uri: usuario.picture }} style={styles.avatar} />
          <Text style={styles.email}>{usuario.email}</Text>
          <View style={{ marginTop: 20 }}>
             <Button title="Ir a Materias" onPress={() => router.replace('/materias')} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, color: '#fff', marginBottom: 20 },
  email: { fontSize: 14, color: '#ccc', marginTop: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginTop: 10 },
});
