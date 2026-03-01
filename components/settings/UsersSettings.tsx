import React from 'react';
import { Users, ShieldCheck } from 'lucide-react';

export const UsersSettings: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-2">
                <Users className="w-10 h-10 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Usuários e Permissões</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Convide novos membros para sua equipe e defina o que cada um pode acessar no sistema.
            </p>

            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 max-w-lg w-full text-left">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 mb-4">
                    <ShieldCheck className="w-5 h-5 text-primary-500" />
                    <span className="font-medium">Módulo em desenvolvimento</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Em breve você poderá administrar o controle de acesso baseado em funções (RBAC) para médicos, recepcionistas, instrumentadores e administradores.
                </p>
            </div>
        </div>
    );
};
