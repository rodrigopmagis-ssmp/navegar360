import React, { useState } from 'react';
import { X, Search, CheckCircle2 } from 'lucide-react';
import { Doctor } from '../../types';

interface DoctorSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (doctor: Doctor) => void;
    doctors: Doctor[];
}

export const DoctorSearchModal: React.FC<DoctorSearchModalProps> = ({ isOpen, onClose, onSelect, doctors }) => {
    const [nameFilter, setNameFilter] = useState('');
    const [councilFilter, setCouncilFilter] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('');

    if (!isOpen) return null;

    const canSearch = nameFilter.length >= 3 || councilFilter.trim().length > 0 || specialtyFilter.trim().length > 0;

    let results: Doctor[] = [];
    if (canSearch) {
        results = doctors.filter(d => {
            const matchName = nameFilter ? d.full_name.toLowerCase().includes(nameFilter.toLowerCase()) : true;
            const matchCouncil = councilFilter ? (d.council_number || '').includes(councilFilter) : true;
            const matchSpecialty = specialtyFilter ? (d.specialty || '').toLowerCase().includes(specialtyFilter.toLowerCase()) : true;
            return matchName && matchCouncil && matchSpecialty;
        });
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Localizar Profissional Solicitante</h2>
                        <p className="text-sm text-slate-500 mt-1">Busque detalhadamente pelo médico.</p>
                    </div>
                    <button onClick={onClose} title="Fechar modal" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Form */}
                <div className="p-6 border-b border-slate-100 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Nome do Médico (Mín 3 letras)</label>
                            <input
                                type="text"
                                placeholder="Ex: João da Silva"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Registro Profissional</label>
                            <input
                                type="text"
                                placeholder="Ex: CRM / Número"
                                value={councilFilter}
                                onChange={(e) => setCouncilFilter(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Especialidade</label>
                            <input
                                type="text"
                                placeholder="Ex: Ortopedia"
                                value={specialtyFilter}
                                onChange={(e) => setSpecialtyFilter(e.target.value)}
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
                            <p className="text-sm font-medium">Digite os critérios acima para buscar.</p>
                            <p className="text-xs">Para buscar apenas por nome, digite no mínimo 3 caracteres.</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                            <AlertCircleIcon className="w-10 h-10 text-slate-300 mb-3" />
                            <p className="text-sm font-medium">Nenhum profissional encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {results.map(doctor => (
                                <div key={doctor.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary-300 transition-colors">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{doctor.full_name}</h3>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                                {doctor.council} {doctor.council_number} {doctor.council_state ? `- ${doctor.council_state}` : ''}
                                            </span>
                                            {doctor.specialty && (
                                                <span className="text-primary-600 font-bold">{doctor.specialty}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            onSelect(doctor);
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

// Generic warning icon
const AlertCircleIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);
