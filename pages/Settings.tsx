import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Bell, Shield, Sliders, ArrowLeft, LayoutList, Users, Building, FileSignature } from 'lucide-react';
import { ClinicSettings } from '../components/settings/ClinicSettings';
import { FieldsSettings } from '../components/settings/FieldsSettings';
import { UsersSettings } from '../components/settings/UsersSettings';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { HospitalSettings } from '../components/settings/HospitalSettings';
import { CBHPMSettings } from '../components/settings/CBHPMSettings';
import { InsurerSettings } from '../components/settings/InsurerSettings';

const MODULES = [
    {
        id: 'clinic',
        path: '/settings/clinic',
        label: 'Configurações da Clínica',
        description: 'Identidade, endereço, contato e detalhes da assinatura.',
        icon: Building2,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        component: ClinicSettings
    },
    {
        id: 'hospitals',
        path: '/settings/hospitals',
        label: 'Hospitais Parceiros',
        description: 'Centros clínicos, locais de internação e convênios aceitos.',
        icon: Building,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        component: HospitalSettings
    },
    {
        id: 'fields',
        path: '/settings/fields',
        label: 'Campos Obrigatórios',
        description: 'Defina as regras de preenchimento obrigatório para cadastros.',
        icon: LayoutList,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        component: FieldsSettings
    },
    {
        id: 'users',
        path: '/settings/users',
        label: 'Usuários e Permissões',
        description: 'Gerencie a equipe da clínica e seus níveis de acesso.',
        icon: Users,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        component: UsersSettings
    },
    {
        id: 'notifications',
        path: '/settings/notifications',
        label: 'Notificações',
        description: 'Preferências de alertas, e-mails e avisos do sistema.',
        icon: Bell,
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-50 dark:bg-pink-900/20',
        component: NotificationSettings
    },
    {
        id: 'security',
        path: '/settings/security',
        label: 'Segurança',
        description: 'Políticas de acesso, senhas fortes e auditoria (LGPD).',
        icon: Shield,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        component: SecuritySettings
    },
    {
        id: 'cbhpm',
        path: '/settings/cbhpm',
        label: 'Tabela CBHPM (TUSS)',
        description: 'Cadastre e edite procedimentos, portes, anestesia e diretrizes de utilização.',
        icon: FileSignature,
        color: 'text-teal-600 dark:text-teal-400',
        bgColor: 'bg-teal-50 dark:bg-teal-900/20',
        component: CBHPMSettings
    },
    {
        id: 'insurers',
        path: '/settings/insurers',
        label: 'Gestão de Convênios',
        description: 'Configure operadoras de saúde, registros ANS e contatos por setor.',
        icon: Shield,
        color: 'text-cyan-600 dark:text-cyan-400',
        bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
        component: InsurerSettings
    },
];

const SettingsHub: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4 animate-in fade-in duration-500">
            {MODULES.map((module) => (
                <button
                    key={module.id}
                    onClick={() => navigate(module.path)}
                    className="flex flex-col text-left p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <div className={`p-3 rounded-xl w-fit ${module.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                        <module.icon className={`w-6 h-6 ${module.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {module.label}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {module.description}
                    </p>
                </button>
            ))}
        </div>
    );
};

export const Settings: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determina o módulo ativo baseado na URL
    const activeModule = MODULES.find(m => location.pathname.includes(m.path));

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header dinâmico com botão de Voltar condicional */}
            <div className="flex flex-col gap-1">
                {activeModule ? (
                    <button
                        onClick={() => navigate('/settings')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors w-fit mb-4 p-1 -ml-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar às Configurações
                    </button>
                ) : null}

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {activeModule ? (
                        <>
                            {React.createElement(activeModule.icon, { className: "w-6 h-6 text-primary-600" })}
                            {activeModule.label}
                        </>
                    ) : (
                        <>
                            <Sliders className="w-6 h-6 text-primary-600" />
                            Configurações do Sistema
                        </>
                    )}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    {activeModule
                        ? activeModule.description
                        : 'Gerencie todas as preferências, permissões e parâmetros gerais da sua base neste painel central.'
                    }
                </p>
            </div>

            {/* Content Area */}
            <div>
                <Routes>
                    <Route path="/" element={<SettingsHub />} />
                    {MODULES.map((module) => (
                        <Route
                            key={module.id}
                            path={module.id}
                            element={
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-sm animate-in zoom-in-95 duration-200">
                                    <module.component />
                                </div>
                            }
                        />
                    ))}
                </Routes>
            </div>
        </div>
    );
};
