import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { auth } from '@/lib/firebase';

type Usuario = {
  uid: string;
  name: string;
  email: string;
  picture: string;
};

type UsuarioContextType = {
  usuario: Usuario | null;
  // cargando evita redirigir antes de que Firebase resuelva la sesión
  cargando: boolean;
  cerrarSesion: () => Promise<void>;
};

const UsuarioContext = createContext<UsuarioContextType>({
  usuario: null,
  cargando: true,
  cerrarSesion: async () => {},
});

export const useUsuario = () => useContext(UsuarioContext);

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Escucha cambios de sesión de Firebase (login, logout, recarga de app)
    const cancelar = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUsuario({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? '',
          email: firebaseUser.email ?? '',
          picture: firebaseUser.photoURL ?? '',
        });
      } else {
        setUsuario(null);
      }
      setCargando(false);
    });
    return cancelar;
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
    router.replace('/');
  };

  return (
    <UsuarioContext.Provider value={{ usuario, cargando, cerrarSesion }}>
      {children}
    </UsuarioContext.Provider>
  );
};
