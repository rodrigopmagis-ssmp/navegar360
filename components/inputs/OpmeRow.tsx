import React from 'react';
import { Trash2, Package, Truck, Factory } from 'lucide-react';
import { OrderOpme } from '../../types';

interface OpmeRowProps {
    item: OrderOpme;
    onChange: (id: string, updates: Partial<OrderOpme>) => void;
    onRemove: (id: string) => void;
}

export const OpmeRow: React.FC<OpmeRowProps> = ({ item, onChange, onRemove }) => {
    return (
        <div className="grid grid-cols-12 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl items-center animate-in fade-in slide-in-from-top-2 hover:bg-white hover:shadow-md transition-all group">
            {/* Descrição */}
            <div className="col-span-5 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Package className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    value={item.description}
                    onChange={(e) => onChange(item.id, { description: e.target.value })}
                    placeholder="Descrição do material..."
                    className="w-full pl-9 p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                />
            </div>

            {/* Quantidade */}
            <div className="col-span-1">
                <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onChange(item.id, { quantity: parseInt(e.target.value) || 1 })}
                    title="Quantidade"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 text-center focus:ring-2 focus:ring-primary-500 outline-none font-bold"
                />
            </div>

            {/* fornecedor Sugerido */}
            <div className="col-span-3 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Truck className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    value={item.suggested_vendor || ''}
                    onChange={(e) => onChange(item.id, { suggested_vendor: e.target.value })}
                    placeholder="Fornecedor sugerido..."
                    className="w-full pl-9 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
            </div>

            {/* Fabricante */}
            <div className="col-span-2 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Factory className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    value={item.manufacturer || ''}
                    onChange={(e) => onChange(item.id, { manufacturer: e.target.value })}
                    placeholder="Fabricante..."
                    className="w-full pl-9 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
            </div>

            {/* Ações */}
            <div className="col-span-1 flex justify-end">
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shadow-sm sm:shadow-none"
                    title="Remover Material"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
