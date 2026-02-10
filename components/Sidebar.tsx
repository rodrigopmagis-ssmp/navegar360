import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, FileText, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/dashboard' },
    { icon: Users, label: 'Pacientes', path: '/patients' },
    { icon: Calendar, label: 'Agenda', path: '/calendar' },
    { icon: FileText, label: 'Relatórios', path: '/reports' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  return (
    <aside 
      className={`${
        isExpanded ? 'w-64' : 'w-20'
      } bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 transition-all duration-300 relative z-20 pt-6`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-primary-600 shadow-sm z-30 flex items-center justify-center transition-colors"
        title={isExpanded ? "Recolher menu" : "Expandir menu"}
      >
        {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2 overflow-x-hidden mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center px-2'} py-3 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap group ${
                isActive
                  ? 'bg-primary-50 text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`
            }
            title={!isExpanded ? item.label : undefined}
          >
            <item.icon className={`w-5 h-5 shrink-0 transition-colors ${!isExpanded ? 'group-hover:text-primary-600' : ''}`} />
            <span className={`transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden'}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className={`flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center px-2'} py-3 w-full text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 whitespace-nowrap group`}
          title={!isExpanded ? "Sair" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span className={`transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden'}`}>
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
};