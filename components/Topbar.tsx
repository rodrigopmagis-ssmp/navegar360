import React, { useEffect, useState } from 'react';
import { Bell, Search, RotateCw, Moon, Sun, User, Zap, Plus, UserPlus } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { QuickPatientModal } from './modals/QuickPatientModal';

export const Topbar: React.FC = () => {
  const { isDark, toggle } = useDarkMode();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || null);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error('Error fetching user data for Topbar:', err);
      }
    };

    fetchUserData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isQuickMenuOpen) return;
    const handleClick = () => setIsQuickMenuOpen(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isQuickMenuOpen]);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 h-20 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 transition-colors">
      {/* Brand Section */}
      <div className="flex items-center gap-3 pr-10 border-r border-slate-100 dark:border-slate-700 lg:min-w-[260px]">
        <div className="bg-primary-600 p-2.5 rounded-lg shrink-0 shadow-lg shadow-primary-600/30">
          <RotateCw className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl leading-tight text-slate-800 dark:text-white whitespace-nowrap tracking-tight">NAVEGAR 360</h1>
          <p className="text-[11px] text-primary-600 font-bold uppercase tracking-wider whitespace-nowrap">Você opera, nós navegamos</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-1 px-6">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por paciente, médico ou procedimento..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Access Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickMenuOpen(!isQuickMenuOpen);
            }}
            title="Acesso Rápido"
            className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Zap className="w-5 h-5 fill-primary-600 dark:fill-primary-400" />
            <span className="text-xs font-bold hidden lg:block">Acesso Rápido</span>
          </button>

          {isQuickMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atalhos de Cadastro</p>
              </div>
              <button
                onClick={() => {
                  setIsPatientModalOpen(true);
                  setIsQuickMenuOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Cadastro de Paciente</p>
                  <p className="text-[10px] text-slate-400">Registro rápido e essencial</p>
                </div>
              </button>

              <button
                disabled
                className="w-full px-4 py-3 flex items-center gap-3 opacity-50 cursor-not-allowed text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">Novo Agendamento</p>
                  <p className="text-[10px] text-slate-400">Em breve...</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all hover:scale-105 active:scale-95"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button title="Notificações" className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all hover:scale-105 active:scale-95">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
              {profile?.full_name || userEmail?.split('@')[0] || 'Carregando...'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
              {userEmail || '---'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl border-2 border-white dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            <User className="w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>

      <QuickPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={() => {
          setIsPatientModalOpen(false);
          // Optional: refresh patient list if on patient page
        }}
      />
    </header>
  );
};
