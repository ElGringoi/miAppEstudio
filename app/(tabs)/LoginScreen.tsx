import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { auth } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';

WebBrowser.maybeCompleteAuthSession();

// Client ID de Google OAuth (Web client ID del proyecto Firebase)
const GOOGLE_CLIENT_ID = '232006316621-q60k6o6dej1eqheb3blk96e3235ktmu1.apps.googleusercontent.com';

export default function LoginScreen() {
  const { usuario } = useUsuario();
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });
  const [cargando, setCargando] = React.useState(false);

  React.useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      const iniciarSesion = async () => {
        setCargando(true);
        try {
          // Usa el access token de Google para autenticarse en Firebase
          const credential = GoogleAuthProvider.credential(
            null,
            response.authentication!.accessToken
          );
          await signInWithCredential(auth, credential);
          // onAuthStateChanged en UsuarioContext actualiza el usuario automáticamente
          router.replace('/materias');
        } catch (e) {
          console.error('Error al iniciar sesión con Firebase:', e);
        } finally {
          setCargando(false);
        }
      };
      iniciarSesion();
    }
  }, [response]);

  if (usuario) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>miAppEstudio</Text>
      <Text style={styles.subtitulo}>Tu app de estudio personal</Text>

      {cargando ? (
        <ActivityIndicator color="#fff" size="large" style={{ marginTop: 40 }} />
      ) : (
        <TouchableOpacity
          style={[styles.boton, !request && styles.botonDeshabilitado]}
          disabled={!request}
          onPress={() => promptAsync()}
        >
          <Text style={styles.textoBoton}>Ingresar con Google</Text>
        </TouchableOpacity>
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
