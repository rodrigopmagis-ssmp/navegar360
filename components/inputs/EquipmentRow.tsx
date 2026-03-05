import React from 'react';
import { Trash2, Microscope, Settings } from 'lucide-react';

export interface OrderEquipment {
    id: string;
    name: string;
    notes?: string;
}

interface EquipmentRowProps {
    item: OrderEquipment;
    onChange: (id: string, updates: Partial<OrderEquipment>) => void;
    onRemove: (id: string) => void;
    availableEquipments: string[];
}

export const EquipmentRow: React.FC<EquipmentRowProps> = ({ item, onChange, onRemove, availableEquipments }) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-primary-200 transition-all group animate-in shadow-sm">
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                        <Microscope className="w-4 h-4" />
                    </div>
                    <select
                        title="Equipamento"
                        value={item.name}
                        onChange={(e) => onChange(item.id, { name: e.target.value })}
                        className="flex-1 bg-transparent border-none font-bold text-slate-700 outline-none focus:ring-0 placeholder:text-slate-300 h-10"
                    >
                        <option value="">Selecione o Equipamento...</option>
                        {availableEquipments.map(eq => (
                            <option key={eq} value={eq}>{eq}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 px-1">
                    <Settings className="w-3.5 h-3.5 text-slate-300" />
                    <input
                        type="text"
                        title="Observações Técnicas"
                        placeholder="Observações técnicas (ex: voltagem, acessórios)..."
                        value={item.notes || ''}
                        onChange={(e) => onChange(item.id, { notes: e.target.value })}
                        className="flex-1 text-xs text-slate-500 bg-transparent border-none outline-none focus:ring-0"
                    />
                </div>
            </div>

            <div className="flex items-center md:border-l md:border-slate-50 md:pl-4">
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remover Equipamento"
                >
                    <Trash2 className="w-4.5 h-4.5" />
                </button>
            </div>
        </div>
    );
};
