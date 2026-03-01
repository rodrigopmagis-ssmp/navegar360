import React from 'react';
import { Shield, Key } from 'lucide-react';

export const SecuritySettings: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-2">
                <Shield className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Segurança e Auditoria</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Configure políticas de senha, autenticação em duas etapas (2FA) e acesse logs de auditoria.
            </p>

            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 max-w-lg w-full text-left">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 mb-4">
                    <Key className="w-5 h-5 text-primary-500" />
                    <span className="font-medium">Módulo em desenvolvimento</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Em conformidade com a LGPD, o painel de histórico de acessos avançado e gestão de sessões será liberado nas próximas atualizações.
                </p>
            </div>
        </div>
    );
};
