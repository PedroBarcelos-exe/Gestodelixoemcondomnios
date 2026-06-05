import { api, isApiOnline } from './api';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: 'morador' | 'zelador' | 'sindico';
  apartamento?: string;
  bloco?: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  password: string;
  role: 'morador' | 'zelador' | 'sindico';
  apartamento?: string;
  bloco?: string;
  telefone?: string;
}

export const authService = {
  async register(data: RegisterPayload): Promise<void> {
    await api.post('/auth/register', data);
  },

  async login(email: string, role: 'morador' | 'zelador' | 'sindico', password: string): Promise<{ token: string; user: UserProfile }> {
    const response = await api.post('/auth/login', { email, password, role });
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userName', user.nome);
    localStorage.setItem('userApt', user.apartamento || '');
    return { token: access_token, user };
  },

  async logout(): Promise<void> {
    const online = await isApiOnline();
    if (online) {
      try {
        await api.post('/auth/logout');
      } catch {}
    }
    localStorage.clear();
  }
};
