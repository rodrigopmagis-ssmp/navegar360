import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Filter, MoreHorizontal,
    Phone, Mail, Edit2, Eye, LayoutGrid, List,
    Stethoscope, Users, UserCheck, UserX, Activity
} from 'lucide-react';
import { useDoctors } from '../hooks/useDoctors';
import { Doctor } from '../types';
import { DoctorModal } from '../components/DoctorModal';


// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
    cirurgiao: 'Cirurgião',
    assistente: 'Assistente',
    anestesista: 'Anestesista',
    residente: 'Residente',
};

const ROLE_COLORS: Record<string, string> = {
    cirurgiao: 'bg-primary-50 text-primary-700',
    assistente: 'bg-amber-50 text-amber-700',
    anestesista: 'bg-purple-50 text-purple-700',
    residente: 'bg-slate-100 text-slate-600',
};

// ── Sub-components ────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: number; icon: React.ElementType; color: string; bg: string }> = ({ label, value, icon: Icon, color, bg }) => (
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

const StatusBadge: React.FC<{ status: Doctor['status'] }> = ({ status }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tighter ${status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'ativo' ? 'bg-emerald-400' : 'bg-red-400'}`} />
        {status === 'ativo' ? 'Ativo' : 'Inativo'}
    </span>
);

const RoleBadge: React.FC<{ role: Doctor['role_type'] }> = ({ role }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${ROLE_COLORS[role] || ROLE_COLORS.residente}`}>
        {ROLE_LABELS[role] || role}
    </span>
);

// ── Doctor Card (Grid View) ───────────────────────────────────────────────────
const DoctorCard: React.FC<{
    doctor: Doctor;
    onEdit: (d: Doctor) => void;
    onView: (d: Doctor) => void;
}> = ({ doctor, onEdit, onView }) => {
    const initials = doctor.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col group">
            <div className="p-5 flex items-start gap-4">
                <div className="shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-600/20">
                        {initials}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-800 text-sm leading-snug">{doctor.full_name}</h3>
                        <StatusBadge status={doctor.status} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {doctor.council} {doctor.council_number}{doctor.council_state ? `/${doctor.council_state}` : ''}
                    </p>
                </div>
            </div>

            <div className="px-5 pb-4 flex-1 space-y-2">
                {doctor.specialty && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span>{doctor.specialty}{doctor.subspecialty ? ` · ${doctor.subspecialty}` : ''}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>{doctor.whatsapp || doctor.phone || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="truncate">{doctor.email || 'Não informado'}</span>
                </div>
                <div className="pt-1">
                    <RoleBadge role={doctor.role_type} />
                    {doctor.rqe && (
                        <span className="ml-2 text-[10px] text-slate-400 font-medium">RQE {doctor.rqe}</span>
                    )}
                </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-center gap-2">
                <button title="Ver detalhes" onClick={() => onView(doctor)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all">
                    <Eye className="w-4 h-4" />
                </button>
                <button title="Editar" onClick={() => onEdit(doctor)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all">
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const Doctors: React.FC = () => {
    const { doctors, loading, error, refetch } = useDoctors();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const filtered = doctors.filter(d =>
        d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.council_number?.includes(searchTerm) ||
        d.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (doctor: Doctor) => { setDoctorToEdit(doctor); setIsModalOpen(true); };
    const handleView = (doctor: Doctor) => { navigate(`/doctors/${doctor.id}`); };
    const handleNew = () => { setDoctorToEdit(null); setIsModalOpen(true); };

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestão de Médicos</h1>
                    <p className="text-slate-500 text-sm">Cadastro de cirurgiões, assistentes e anestesistas.</p>
                </div>
                <button onClick={handleNew}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-lg shadow-primary-600/20">
                    <Plus className="w-4 h-4" /> Novo Médico
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total de Médicos" value={doctors.length} icon={Users} color="text-primary-600" bg="bg-primary-50" />
                <StatCard label="Cirurgiões" value={doctors.filter(d => d.role_type === 'cirurgiao').length} icon={Stethoscope} color="text-primary-600" bg="bg-primary-50" />
                <StatCard label="Assistentes / Anest." value={doctors.filter(d => ['assistente', 'anestesista'].includes(d.role_type)).length} icon={Activity} color="text-amber-600" bg="bg-amber-50" />
                <StatCard label="Inativos" value={doctors.filter(d => d.status === 'inativo').length} icon={UserX} color="text-red-600" bg="bg-red-50" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, CRM ou especialidade..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap">
                        <Filter className="w-4 h-4" /> Filtrar Tipo
                    </button>
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                        <button onClick={() => setViewMode('list')} title="Lista"
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <List className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('grid')} title="Grade"
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="p-20 text-center bg-white rounded-xl border border-slate-200">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent mx-auto rounded-full" />
                    <p className="mt-4 text-sm font-medium text-slate-500">Carregando médicos...</p>
                </div>
            ) : error ? (
                <div className="p-20 text-center text-red-600 font-bold bg-white rounded-xl border border-slate-200">Erro: {error}</div>
            ) : viewMode === 'grid' ? (
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map(d => <DoctorCard key={d.id} doctor={d} onEdit={handleEdit} onView={handleView} />)}
                    </div>
                    {filtered.length === 0 && (
                        <div className="py-20 text-center text-slate-400">
                            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Nenhum médico encontrado</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Médico</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registro</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Especialidade</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(doctor => (
                                    <tr key={doctor.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                                                    {doctor.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{doctor.full_name}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Mail className="w-3 h-3 text-slate-300" /> {doctor.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700">{doctor.council} {doctor.council_number}</p>
                                            <p className="text-xs text-slate-400">{doctor.council_state}{doctor.rqe ? ` · RQE ${doctor.rqe}` : ''}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-700">{doctor.specialty || '—'}</p>
                                            {doctor.subspecialty && <p className="text-xs text-slate-400">{doctor.subspecialty}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleBadge role={doctor.role_type} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={doctor.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleView(doctor)} title="Ver detalhes"
                                                    className="p-2 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg transition-colors">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleEdit(doctor)} title="Editar"
                                                    className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors">
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filtered.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100">
                            <p className="text-xs text-slate-500">Total de <span className="font-bold text-slate-800">{filtered.length}</span> médico(s) encontrado(s)</p>
                        </div>
                    )}

                    {filtered.length === 0 && (
                        <div className="py-20 text-center text-slate-400">
                            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Nenhum médico encontrado</p>
                        </div>
                    )}
                </div>
            )}

            <DoctorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refetch}
                doctorToEdit={doctorToEdit}
            />
        </div>
    );
};
