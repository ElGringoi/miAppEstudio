import { Slot } from 'expo-router';
import { UsuarioProvider } from '../context/UsuarioContext';

export default function RootLayout() {
  return (
    <UsuarioProvider>
      <Slot />
    </UsuarioProvider>
  );
}

