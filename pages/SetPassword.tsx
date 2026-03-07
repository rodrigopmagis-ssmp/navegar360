import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Lock, Eye, EyeOff, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const SetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Check if we have a session (user clicked the invite link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, they might be accessing the page directly without a token
                // We should check if there's a token in the URL (Supabase handles this automatically on load usually)
                // but just in case, if after 1s there is no session, redirect to login
                const timer = setTimeout(() => {
                    supabase.auth.getSession().then(({ data: { session: s } }) => {
                        if (!s) {
                            navigate('/login');
                            toast.error('Sessão expirada ou convite inválido.');
                        }
                    });
                }, 1500);
                return () => clearTimeout(timer);
            }
        };
        checkSession();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            toast.success('Senha definida com sucesso!');

            // Wait 2 seconds and redirect to dashboard
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Erro ao definir senha.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-4">
                <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-center">
                        <div className="bg-emerald-100 p-4 rounded-full">
                            <CheckCircle className="w-16 h-16 text-emerald-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Senha Definida!</h1>
                    <p className="text-slate-500">
                        Sua conta foi ativada com sucesso. Você será redirecionado para o sistema em instantes...
                    </p>
                    <div className="flex justify-center">
                        <RotateCw className="w-6 h-6 animate-spin text-primary-600" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-white">
            {/* Left Side - Brand Content */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary-600 relative overflow-hidden flex-col justify-between p-12 text-white">
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
                        Bem-vindo(a)<br />ao time.
                    </h1>
                    <p className="text-primary-100 text-lg max-w-lg leading-relaxed">
                        Você foi convidado(a) para a plataforma de gestão cirúrgica mais completa do mercado. Defina sua senha para começar.
                    </p>
                </div>

                <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mt-12">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary-500 p-3 rounded-lg shadow-lg">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Conta Protegida</h3>
                            <p className="text-sm text-primary-100 opacity-90">Sua senha é criptografada e segue os mais altos padrões de segurança.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 py-4">
                    <p className="text-center text-xs text-primary-200 uppercase tracking-widest">
                        NAVEGAR 360 • SEGURANÇA MÁXIMA
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900">Definir Senha</h2>
                        <p className="mt-2 text-slate-500">
                            Crie uma senha segura para acessar sua conta institucional.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nova Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
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
                            <p className="mt-1.5 text-xs text-slate-400 italic">Mínimo de 6 caracteres.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all transform hover:scale-[1.01] disabled:opacity-50"
                        >
                            {loading ? (
                                <RotateCw className="w-5 h-5 animate-spin" />
                            ) : (
                                'Ativar Minha Conta'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 uppercase tracking-wide pt-8">
                        © 2024 NAVEGAR 360. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};
