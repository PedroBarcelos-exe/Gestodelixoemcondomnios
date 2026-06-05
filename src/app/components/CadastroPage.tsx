import { Leaf, Recycle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function CadastroPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    apartamento: '',
    bloco: '',
    telefone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        nome: form.nome,
        email: form.email,
        password: form.password,
        role: 'morador',
        apartamento: form.apartamento || undefined,
        bloco: form.bloco || undefined,
        telefone: form.telefone || undefined,
      });
      navigate('/login');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-green-900 to-green-800 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20"
        >
          ← Voltar
        </Button>
      </div>
      <Card className="w-full max-w-md shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <Recycle className="w-12 h-12 text-green-600" />
              <Leaf className="w-6 h-6 text-emerald-500 absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-green-800">Criar Conta</CardTitle>
          <CardDescription>Cadastre-se como morador do condomínio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                type="text"
                placeholder="João da Silva"
                value={form.nome}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="apartamento">Apartamento</Label>
                <Input
                  id="apartamento"
                  type="text"
                  placeholder="301"
                  value={form.apartamento}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloco">Bloco</Label>
                <Input
                  id="bloco"
                  type="text"
                  placeholder="Torre A"
                  value={form.bloco}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.telefone}
                onChange={handleChange}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-green-700 font-medium hover:underline"
              >
                Entrar
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
