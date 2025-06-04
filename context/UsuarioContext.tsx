import React, { createContext, useState, useContext, ReactNode } from 'react';
import { router } from 'expo-router';

type Usuario = {
  name: string;
  email: string;
  picture: string;
};

type UsuarioContextType = {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  cerrarSesion: () => void;
};

const UsuarioContext = createContext<UsuarioContextType>({
  usuario: null,
  setUsuario: () => {},
  cerrarSesion: () => {},
});

export const useUsuario = () => useContext(UsuarioContext);

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const cerrarSesion = () => {
    setUsuario(null);
    router.replace('/LoginScreen'); // 🔁 vuelve al login
  };

  return (
    <UsuarioContext.Provider value={{ usuario, setUsuario, cerrarSesion }}>
      {children}
    </UsuarioContext.Provider>
  );
};
