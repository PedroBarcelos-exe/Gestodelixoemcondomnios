import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar token JWT nas requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Se não autenticado, redireciona pro login
      if (error.response.status === 401) {
        localStorage.clear();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
      
      const msg = error.response.data?.detail || 'Erro na comunicação com o servidor';
      console.warn(`[API Info] ${msg}`);
    } else {
      console.warn('[API Info] Servidor backend offline. Rodando no modo de simulação (Mock).');
    }
    return Promise.reject(error);
  }
);

/**
 * Função utilitária para verificar se a API está online.
 * Permite que o frontend decida dinamicamente se usa dados do backend ou simulação mockada.
 */
export async function isApiOnline(): Promise<boolean> {
  try {
    const res = await axios.get(`${API_URL}/`, { timeout: 1000 });
    return res.data?.status === 'online';
  } catch {
    return false;
  }
}
