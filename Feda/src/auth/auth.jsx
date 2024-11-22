import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from './supabaseclient'; // Asegúrate de tener configurado supabaseClient

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('idle'); // Estado del proceso de autenticación

  useEffect(() => {
    const authenticateUser = async () => {
      setStatus('loading');
      if (!isConnected || !address) {
        setStatus('disconnected');
        return;
      }

      try {
        // Verificar si el usuario ya existe en Supabase
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', address)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error al buscar usuario:', error);
          setStatus('error');
        }

        // Si no existe, crear el usuario en Supabase
        if (!userData) {
          const { data, error: insertError } = await supabase
            .from('users')
            .insert([{ wallet_address: address }])
            .single();

          if (insertError) {
            console.error('Error al crear usuario:', insertError);
            setStatus('error');
          } else {
            setUser(data);
            setStatus('authenticated');
          }
        } else {
          setUser(userData); // Guardar el usuario encontrado
          setStatus('authenticated');
        }
      } catch (err) {
        console.error('Error en autenticación:', err);
        setStatus('error');
      }
    };

    if (isConnected && address) {
      authenticateUser();
    }
  }, [isConnected, address]);

  return (
    <AuthContext.Provider value={{ user, address, status }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acceder al contexto de autenticación
export const useAuth = () => useContext(AuthContext);
