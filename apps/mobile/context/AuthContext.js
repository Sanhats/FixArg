import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiRequest, bearerHeaders } from '@fixarg/api-client';
import { registerExpoPushIfPossible } from '../lib/registerExpoPush';

const TOKEN_KEY = 'fixarg_token';
const USER_KEY = 'fixarg_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, uJson] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (cancelled) return;
        if (t && uJson) {
          setToken(t);
          setUser(JSON.parse(uJson));
        }
      } catch (e) {
        console.warn('Auth hydrate', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistUser = useCallback(async (nextUser) => {
    if (nextUser) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
    setUser(nextUser);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!data.token || !data.user) throw new Error('Respuesta inválida del servidor');
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    registerExpoPushIfPossible(data.token).catch(() => {});
    return data;
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const data = await apiRequest('/api/users/me', {
      headers: bearerHeaders(token),
    });
    if (data?.user) {
      await persistUser(data.user);
      return data.user;
    }
    return null;
  }, [token, persistUser]);

  const updateProfile = useCallback(
    async (fields) => {
      if (!token) throw new Error('No hay sesión');
      const data = await apiRequest('/api/users/me', {
        method: 'PATCH',
        headers: bearerHeaders(token),
        body: JSON.stringify(fields),
      });
      if (data?.user) {
        await persistUser(data.user);
        return data.user;
      }
      throw new Error('No se pudo actualizar');
    },
    [token, persistUser]
  );

  useEffect(() => {
    if (token && user) {
      registerExpoPushIfPossible(token).catch(() => {});
    }
  }, [token, user?._id]);

  const value = {
    user,
    token,
    isLoading,
    isLoggedIn: !!token && !!user,
    login,
    logout,
    refreshUser,
    updateProfile,
    setUser: persistUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth dentro de AuthProvider');
  return ctx;
}
