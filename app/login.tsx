import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { auth } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';
import { router } from 'expo-router';
import { colors, font, radius, shadow, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { usuario, loading } = useUsuario();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setCargando(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace('/materias');
    } catch (e: any) {
      setError('No se pudo iniciar sesión. Intentá de nuevo.');
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.logoBox}>
        <MaterialIcons name="auto-awesome" size={36} color="#fff" />
      </View>
      <Text style={s.brand}>QUESTFLOW</Text>
      <Text style={s.tagline}>Tu vida, gamificada</Text>

      {!usuario ? (
        <View style={s.card}>
          <Text style={s.cardTitulo}>Iniciá sesión</Text>
          <Text style={s.cardSub}>Usá tu cuenta de Google para continuar</Text>
          <TouchableOpacity
            style={[s.btnGoogle, cargando && { opacity: 0.5 }]}
            onPress={handleLogin}
            disabled={cargando}
          >
            {cargando
              ? <ActivityIndicator color="#fff" />
              : <>
                  <MaterialIcons name="login" size={20} color="#fff" />
                  <Text style={s.btnGoogleTxt}>Ingresar con Google</Text>
                </>
            }
          </TouchableOpacity>
          {error && <Text style={s.errorTxt}>{error}</Text>}
        </View>
      ) : (
        <View style={s.card}>
          <Image source={{ uri: usuario.picture }} style={s.avatar} />
          <Text style={s.cardTitulo}>¡Bienvenido, {usuario.name}!</Text>
          <Text style={s.cardSub}>{usuario.email}</Text>
          <TouchableOpacity style={s.btnGoogle} onPress={() => router.replace('/materias')}>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            <Text style={s.btnGoogleTxt}>Ir a la app</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.h,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.blue,
  },
  brand: {
    fontSize: font.xxl,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 3,
  },
  tagline: {
    fontSize: font.md,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.h,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.h,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
    gap: spacing.md,
  },
  cardTitulo: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: font.md,
    color: colors.textSec,
    textAlign: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: spacing.sm,
  },
  btnGoogle: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.h,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    ...shadow.blue,
  },
  btnGoogleTxt: {
    color: '#fff',
    fontSize: font.base,
    fontWeight: '700',
  },
  errorTxt: {
    color: colors.error,
    fontSize: font.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
