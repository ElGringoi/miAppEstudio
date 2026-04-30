import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, Image, ActivityIndicator } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useUsuario } from '../../context/UsuarioContext';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { auth } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { usuario, loading } = useUsuario();

  // 📝 IMPORTANTE: Debes configurar tus IDs de cliente para cada plataforma
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '232006316621-q60k6o6dej1eqheb3blk96e3235ktmu1.apps.googleusercontent.com',
    iosClientId: 'TU_IOS_CLIENT_ID',
    androidClientId: 'TU_ANDROID_CLIENT_ID',
  });
  const [cargando, setCargando] = React.useState(false);

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
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 60,
  },
  boton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  botonDeshabilitado: {
    opacity: 0.4,
  },
  textoBoton: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
