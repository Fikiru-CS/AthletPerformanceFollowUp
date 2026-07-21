// lib/api.js  –  Axios instance with JWT injection
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from cookie on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('apts_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('apts_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

export default api;
