'use client';
// lib/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('apts_token');
    if (token) {
      api.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => Cookies.remove('apts_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    Cookies.set('apts_token', r.data.token, { expires: 7 });
    setUser(r.data.user);
    return r.data;
  };

  const register = async (name, email, password) => {
    const r = await api.post('/auth/register', { name, email, password });
    Cookies.set('apts_token', r.data.token, { expires: 7 });
    setUser(r.data.user);
    return r.data;
  };

  const logout = () => {
    Cookies.remove('apts_token');
    setUser(null);
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
