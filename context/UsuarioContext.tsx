import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { router } from 'expo-router';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../config/firebase';

type Usuario = {
  uid: string;
  name: string;
  email: string;
  picture: string;
};

type UsuarioContextType = {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  cerrarSesion: () => void;
  loading: boolean;
};

const UsuarioContext = createContext<UsuarioContextType>({
  usuario: null,
  setUsuario: () => {},
  cerrarSesion: () => {},
  loading: true,
});

export const useUsuario = () => useContext(UsuarioContext);

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🛡️ Sincronizar el estado del contexto con Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setUsuario({
          uid: user.uid,
          name: user.displayName || 'Usuario',
          email: user.email || '',
          picture: user.photoURL || '',
        });
      } else {
        setUsuario(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      setUsuario(null);
      router.replace('/LoginScreen');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <UsuarioContext.Provider value={{ usuario, setUsuario, cerrarSesion, loading }}>
      {children}
    </UsuarioContext.Provider>
  );
};
