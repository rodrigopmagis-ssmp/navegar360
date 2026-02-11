import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Lock, Mail, Eye, EyeOff, ShieldCheck, Cloud, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('seu@hospital.com.br');
  const [password, setPassword] = useState('password');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Left Side - Brand Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
               backgroundSize: '24px 24px' 
             }}>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
              <RotateCw className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">NAVEGAR 360</span>
          </div>

          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Você opera,<br />nós navegamos.
          </h1>
          <p className="text-pink-100 text-lg max-w-lg leading-relaxed">
            A plataforma completa de gestão cirúrgica. Sincronize equipes, materiais e processos em um único fluxo de navegação inteligente.
          </p>
        </div>

        {/* Bottom Feature Box */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mt-12">
            <div className="flex items-start gap-4">
                <div className="bg-primary-500 p-3 rounded-lg shadow-lg">
                    <RotateCw className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-1">Visão 360º do Processo</h3>
                    <p className="text-sm text-pink-100 opacity-90">Do agendamento ao pós-operatório, tudo sob controle.</p>
                </div>
            </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 mt-8">
             <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/150?u=${i+10}`} className="w-10 h-10 rounded-full border-2 border-primary-600" alt="User" />
                ))}
             </div>
             <p className="text-sm font-medium">+2.500 cirurgiões utilizam diariamente</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Acesso ao Sistema</h2>
            <p className="mt-2 text-slate-500">Entre com suas credenciais NAVEGAR 360.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">E-mail Institucional</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="seu@hospital.com.br"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">Senha</label>
                <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">Esqueci minha senha</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                Lembrar neste dispositivo
              </label>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all transform hover:scale-[1.01]"
            >
              Entrar no Sistema
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-slate-500">Não possui uma conta? </span>
            <a href="#" className="text-sm font-bold text-primary-600 hover:text-primary-500">Criar nova conta</a>
          </div>

          <div className="pt-8 flex justify-center gap-6 text-slate-400">
             <CheckCircle className="w-6 h-6" />
             <Cloud className="w-6 h-6" />
             <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-center text-xs text-slate-400 uppercase tracking-wide">
             © 2024 NAVEGAR 360. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};