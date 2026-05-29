import { api, isApiOnline } from './api';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: 'morador' | 'zelador' | 'sindico';
  apartamento?: string;
  bloco?: string;
}

export const authService = {
  async login(email: string, role: 'morador' | 'zelador' | 'sindico', password: string): Promise<{ token: string; user: UserProfile }> {
    const online = await isApiOnline();

    if (online) {
      // Backend online: usa credenciais reais — erros propagam para o caller
      const response = await api.post('/auth/login', { email, password, role });
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.nome);
      localStorage.setItem('userApt', user.apartamento || '');
      return { token: access_token, user };
    }

    // Fallback Mock (Backend Offline)
    console.log('Backend offline — usando login simulado (Demo).');
    const mockToken = 'mock_jwt_token_for_demo';
    const mockUser: UserProfile = {
      id: 'mock-uuid-1234',
      nome: email.split('@')[0] || 'Usuario Demo',
      email,
      role,
      apartamento: '301',
      bloco: 'Torre A',
    };
    localStorage.setItem('token', mockToken);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', mockUser.nome);
    localStorage.setItem('userApt', mockUser.apartamento || '301');
    return { token: mockToken, user: mockUser };
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
