import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useUsuario } from '../../context/UsuarioContext';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { usuario, setUsuario } = useUsuario();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '232006316621-q60k6o6dej1eqheb3blk96e3235ktmu1.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (
      response?.type === 'success' &&
      response.authentication &&
      response.authentication.accessToken
    ) {
      const fetchUserInfo = async () => {
        const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: {
            Authorization: `Bearer ${response.authentication!.accessToken}`,
          },
        });
        const user = await res.json();
        setUsuario(user);
        router.replace('/pregunteros');
      };

      fetchUserInfo();
    }
  }, [response]);

  return (
    <View style={styles.container}>
      {!usuario ? (
        <>
          <Text style={styles.title}>Iniciar sesión con Google</Text>
          <Button title="Ingresar con Google" disabled={!request} onPress={() => promptAsync()} />
        </>
      ) : (
        <>
          <Text style={styles.title}>¡Bienvenido, {usuario.name}!</Text>
          <Image source={{ uri: usuario.picture }} style={styles.avatar} />
          <Text style={styles.email}>{usuario.email}</Text>
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
