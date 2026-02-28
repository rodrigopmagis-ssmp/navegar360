import React, { useState } from 'react';
import {
    Search, Plus, Filter, MoreHorizontal, User,
    Phone, Mail, Calendar, FileText, ChevronLeft,
    ChevronRight, Activity, Edit2, Eye, LayoutGrid, List,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';
import { PatientV2 } from '../types';
import { PatientModal } from '../components/PatientModal';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string; bg: string }> = ({ label, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: PatientV2['status'] }> = ({ status }) => {
    const configs: Record<string, { dot: string; bg: string; text: string; label: string }> = {
        ativo: { dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Ativo' },
        inativo: { dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700', label: 'Inativo' },
    };
    const cfg = configs[status] ?? configs.ativo;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tighter ${cfg.bg} ${cfg.text} border-current/20`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

// ── Patient Card Component (Grid View) ──────────────────────────────────────
const PatientCard: React.FC<{
    patient: PatientV2;
    onEdit: (p: PatientV2) => void;
    onView: (id: string) => void;
}> = ({ patient, onEdit, onView }) => {
    const initials = patient.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const formatBirthDate = (date?: string) => {
        if (!date) return 'Não informado';
        const [y, m, d] = date.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col group">
            {/* Card Header */}
            <div className="p-5 flex items-start gap-4">
                <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-600/20">
                        {initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" title="Ativo" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-800 leading-tight text-sm leading-snug">{patient.full_name}</h3>
                        <StatusBadge status={patient.status} />
                    </div>
                    {patient.cpf && (
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">CPF: {patient.cpf}</p>
                    )}
                </div>
            </div>

            {/* Card Body – Info List */}
            <div className="px-5 pb-4 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>{formatBirthDate(patient.birth_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>{patient.whatsapp || patient.phone || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="truncate">{patient.email || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>Não agendado</span>
                </div>
            </div>

            {/* Card Footer – Actions */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-center gap-2">
                <button
                    onClick={() => onView(patient.id)}
                    title="Ver Prontuário"
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onEdit(patient)}
                    title="Editar"
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    title="Mais opções"
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
export const Patients: React.FC = () => {
    const { patients, loading, error, refetch } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patientToEdit, setPatientToEdit] = useState<PatientV2 | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const navigate = useNavigate();

    const filteredPatients = patients.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf?.includes(searchTerm) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (patient: PatientV2) => {
        setPatientToEdit(patient);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setPatientToEdit(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestão de Pacientes</h1>
                    <p className="text-slate-500 text-sm">Base unificada de prontuários e históricos clínico.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-lg shadow-primary-600/20"
                >
                    <Plus className="w-4 h-4" /> Novo Paciente
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total de Pacientes" value={patients.length} icon={User} color="text-primary-600" bg="bg-primary-50" />
                <StatCard label="Pacientes Ativos" value={patients.filter(p => p.status === 'ativo').length} icon={Activity} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard label="Pacientes Inativos" value={patients.filter(p => p.status === 'inativo').length} icon={Calendar} color="text-red-600" bg="bg-red-50" />
                <StatCard label="Cadastrados Este Mês" value={patients.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth() && new Date(p.created_at).getFullYear() === new Date().getFullYear()).length} icon={FileText} color="text-amber-600" bg="bg-amber-50" />
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, CPF ou e-mail..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap">
                        <Filter className="w-4 h-4" /> Filtrar Status
                    </button>
                    {/* View Toggle */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setViewMode('list')}
                            title="Visualização em Lista"
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            title="Visualização em Grade"
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="p-20 text-center bg-white rounded-xl border border-slate-200">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent mx-auto rounded-full"></div>
                    <p className="mt-4 text-sm font-medium text-slate-500">Sincronizando Banco...</p>
                </div>
            ) : error ? (
                <div className="p-20 text-center text-red-600 font-bold bg-white rounded-xl border border-slate-200">
                    Erro: {error}
                </div>
            ) : viewMode === 'grid' ? (
                /* ── Grid View ── */
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredPatients.map((patient) => (
                            <PatientCard
                                key={patient.id}
                                patient={patient}
                                onEdit={handleEdit}
                                onView={(id) => navigate(`/patients/${id}`)}
                            />
                        ))}
                    </div>
                    {filteredPatients.length === 0 && (
                        <div className="py-20 text-center text-slate-400">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Nenhum paciente encontrado</p>
                        </div>
                    )}
                </div>
            ) : (
                /* ── List View ── */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paciente</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contato</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                                                    {patient.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{patient.full_name}</p>
                                                    <p className="text-xs text-slate-500">CPF: {patient.cpf || '---'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                    <Phone className="w-3 h-3 text-slate-400" /> {patient.whatsapp || patient.phone || 'S/M'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                    <Mail className="w-3 h-3 text-slate-400" /> {patient.email || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={patient.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/patients/${patient.id}`)}
                                                    title="Ver Prontuário"
                                                    className="p-2 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(patient)}
                                                    title="Editar Dados"
                                                    className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button className="text-slate-400 hover:text-primary-600 p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Mais opções">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {filteredPatients.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-500">Total de <span className="font-bold text-slate-800">{filteredPatients.length}</span> pacientes localizados</p>
                            <div className="flex items-center gap-2">
                                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 flex items-center justify-center rounded bg-primary-600 text-white font-bold text-sm">1</button>
                                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {filteredPatients.length === 0 && (
                        <div className="py-20 text-center text-slate-400">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Nenhum paciente encontrado</p>
                        </div>
                    )}
                </div>
            )}

            <PatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refetch}
                patientToEdit={patientToEdit}
            />
        </div>
    );
};
