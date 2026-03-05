import React from 'react';
import { Trash2, UserCog, User } from 'lucide-react';
import { OrderParticipant, Doctor } from '../../types';

interface ParticipantRowProps {
    item: OrderParticipant;
    onChange: (id: string, updates: Partial<OrderParticipant>) => void;
    onRemove: (id: string) => void;
    availableRoles: { id: string; name: string }[];
    doctors: Doctor[];
}

export const ParticipantRow: React.FC<ParticipantRowProps> = ({ item, onChange, onRemove, availableRoles, doctors }) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-primary-200 transition-all group animate-in shadow-sm">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                        <UserCog className="w-4 h-4" />
                    </div>
                    <select
                        title="Cargo na Equipe"
                        value={item.team_role_id}
                        onChange={(e) => onChange(item.id, { team_role_id: e.target.value })}
                        className="flex-1 bg-transparent border-none font-bold text-slate-700 outline-none focus:ring-0 placeholder:text-slate-300 h-10"
                    >
                        <option value="">Selecione o Cargo ou Função...</option>
                        {availableRoles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <div className="p-2 text-slate-300">
                        <User className="w-4 h-4" />
                    </div>
                    <select
                        title="Profissional (Opcional)"
                        value={item.professional_id || ''}
                        onChange={(e) => onChange(item.id, { professional_id: e.target.value || undefined })}
                        className="flex-1 bg-transparent border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 h-10 px-3"
                    >
                        <option value="">A Definir Especialista (Opcional)...</option>
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-end md:border-l md:border-slate-50 md:pl-4 mt-2 md:mt-0">
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remover Participante"
                >
                    <Trash2 className="w-4.5 h-4.5" />
                </button>
            </div>
        </div>
    );
};
