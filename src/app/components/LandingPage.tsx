import { Award, BarChart3, CheckCircle, Leaf, Recycle, Star, TrendingUp, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Recycle,
      title: 'Gestão Inteligente',
      description: 'Sistema completo de gerenciamento de resíduos com calendário automatizado e alertas personalizados.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Detalhados',
      description: 'Análises completas de desempenho, economia e impacto ambiental para apresentação em assembleias.'
    },
    {
      icon: Users,
      title: 'Engajamento dos Moradores',
      description: 'Sistema de gamificação com conquistas e rankings que aumenta a participação em até 89%.'
    },
    {
      icon: TrendingUp,
      title: 'Economia Comprovada',
      description: 'Reduza taxas de coleta em até 35% com separação correta e otimização de processos.'
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Mendes',
      role: 'Síndico - Residencial Jardim Verde',
      rating: 5,
      text: 'Desde que implementamos o GreenBin, conseguimos reduzir 28% nos custos de coleta. Os relatórios são perfeitos para as assembleias!',
      image: '👨‍💼'
    },
    {
      name: 'Ana Paula Silva',
      role: 'Moradora - Condomínio Bella Vista',
      rating: 5,
      text: 'Nunca pensei que separar lixo poderia ser tão simples. O sistema de pontos e conquistas tornou tudo mais interessante!',
      image: '👩‍💻'
    },
    {
      name: 'Roberto Santos',
      role: 'Zelador - Edifício Solar',
      rating: 5,
      text: 'O agendamento de volumosos facilitou muito meu trabalho. Agora tenho tudo organizado e não há mais surpresas.',
      image: '👷'
    }
  ];

  const stats = [
    { value: '500+', label: 'Condomínios Ativos' },
    { value: '89%', label: 'Média de Engajamento' },
    { value: 'R$ 2.4M', label: 'Economia Total Gerada' },
    { value: '4.9/5', label: 'Avaliação dos Usuários' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-green-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <Recycle className="w-20 h-20 text-emerald-400" />
            <Leaf className="w-12 h-12 text-green-300 absolute top-0 right-1/2 mr-8" />
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            GreenBin
          </h1>
          <p className="text-2xl md:text-3xl text-emerald-100 mb-4 font-light">
            Gestão Sustentável de Resíduos
          </p>
          <p className="text-lg md:text-xl text-green-200 mb-12 max-w-3xl mx-auto font-light">
            A solução completa que transforma a gestão de resíduos do seu condomínio,
            economiza recursos e promove um futuro mais sustentável.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/cadastro')}
              className="bg-white text-green-900 hover:bg-green-50 px-8 py-6 text-lg h-auto"
            >
              Criar Conta
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg h-auto"
            >
              Já tenho conta
            </Button>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-green-700 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Uma solução completa
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tecnologia de ponta para transformar a gestão de resíduos em resultados reais
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-8">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                        <Icon className="w-8 h-8 text-green-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-gray-600">
              Três perfis de acesso para gestão eficiente
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Moradores',
                description: 'Acesso ao calendário de coletas, agendamento de volumosos e acompanhamento do impacto ambiental pessoal.',
                icon: Users,
                color: 'from-green-500 to-emerald-600'
              },
              {
                title: 'Zeladores',
                description: 'Gestão de tarefas diárias, aprovação de agendamentos e organização da área de coleta.',
                icon: CheckCircle,
                color: 'from-blue-500 to-cyan-600'
              },
              {
                title: 'Síndicos',
                description: 'Relatórios completos, análises financeiras e dados para apresentação em assembleias.',
                icon: Award,
                color: 'from-purple-500 to-pink-600'
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="text-center">
                    <div className={`bg-gradient-to-br ${item.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              O que dizem nossos clientes
            </h2>
            <p className="text-xl text-gray-600">
              Condomínios que já transformaram sua gestão de resíduos
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed italic">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{testimonial.image}</div>
                      <div>
                        <div className="font-bold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-950 via-green-900 to-green-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center px-4 relative z-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para transformar seu condomínio?
          </h2>
          <p className="text-xl text-green-100 mb-10">
            Junte-se a centenas de condomínios que já estão economizando e contribuindo para um planeta mais sustentável.
          </p>
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            className="bg-white text-green-900 hover:bg-green-50 px-12 py-7 text-xl h-auto"
          >
            Começar Gratuitamente
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Recycle className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-white">GreenBin</span>
          </div>
          <p className="text-sm">
            © 2026 GreenBin. Todos os direitos reservados. Gestão sustentável para um futuro melhor.
          </p>
        </div>
      </footer>
    </div>
  );
}
