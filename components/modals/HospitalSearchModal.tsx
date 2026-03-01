import React, { useState } from 'react';
import { X, Search, CheckCircle2, Bed } from 'lucide-react';

interface Hospital {
    id: string;
    name: string;
    cnpj?: string;
}

interface HospitalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (hospital: Hospital) => void;
    hospitals: Hospital[];
}

export const HospitalSearchModal: React.FC<HospitalSearchModalProps> = ({ isOpen, onClose, onSelect, hospitals }) => {
    const [nameFilter, setNameFilter] = useState('');
    const [cnpjFilter, setCnpjFilter] = useState('');

    if (!isOpen) return null;

    const canSearch = nameFilter.length >= 3 || cnpjFilter.trim().length > 0;

    let results: Hospital[] = [];
    if (canSearch) {
        results = hospitals.filter(h => {
            const matchName = nameFilter ? h.name.toLowerCase().includes(nameFilter.toLowerCase()) : true;
            const matchCnpj = cnpjFilter ? (h.cnpj || '').includes(cnpjFilter) : true;
            return matchName && matchCnpj;
        });
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Localizar Local de Execução (Hospital)</h2>
                        <p className="text-sm text-slate-500 mt-1">Busque um hospital parceiro da sua clínica.</p>
                    </div>
                    <button onClick={onClose} title="Fechar modal" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Form */}
                <div className="p-6 border-b border-slate-100 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Nome Fantasia (Mín 3 letras)</label>
                            <input
                                type="text"
                                placeholder="Ex: Hospital do Coração"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">CNPJ</label>
                            <input
                                type="text"
                                placeholder="Ex: 00.000.000/0001-00"
                                value={cnpjFilter}
                                onChange={(e) => setCnpjFilter(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {!canSearch ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                            <Search className="w-10 h-10 text-slate-300 mb-3" />
                            <p className="text-sm font-medium">Digite os critérios acima para buscar os locais de atendimento.</p>
                            <p className="text-xs">Para buscar apenas por nome, digite no mínimo 3 caracteres.</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                            <Bed className="w-10 h-10 text-slate-300 mb-3" />
                            <p className="text-sm font-medium">Nenhum local encontrado na busca.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {results.map(hospital => (
                                <div key={hospital.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary-300 transition-colors">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{hospital.name}</h3>
                                        {hospital.cnpj && (
                                            <p className="text-sm text-slate-500 mt-1 uppercase font-medium">CNPJ: {hospital.cnpj}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            onSelect(hospital);
                                            onClose();
                                        }}
                                        className="shrink-0 flex items-center justify-center gap-2 bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Selecionar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
