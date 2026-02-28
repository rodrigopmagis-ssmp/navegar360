import React from 'react';
import { Bell, Search, RotateCw, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

export const Topbar: React.FC = () => {
  const { isDark, toggle } = useDarkMode();

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
        {/* Dark Mode Toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
          className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all hover:scale-105 active:scale-95"
        >
          {isDark
            ? <Sun className="w-5 h-5" />
            : <Moon className="w-5 h-5" />
          }
        </button>

        <button title="Notificações" className="relative p-2 text-slate-400 hover:text-primary-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Dr. Ricardo Santos</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Neurocirurgião</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150&h=150"
            alt="Dr. Ricardo"
            className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover"
          />
        </div>
      </div>
    </header>
  );
};