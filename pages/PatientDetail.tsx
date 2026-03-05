import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar,
    FileText, Plus, Weight, ArrowDownUp, AlertTriangle,
    ClipboardList, CheckCircle2, History, Edit2,
    Stethoscope, Heart, Archive, Users2, Activity,
    XCircle, Info, Filter, Search, ChevronDown, ChevronUp,
    Package, ShieldCheck, Wrench, Eye, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PatientV2, MedicalRecord } from '../types';
import { PatientModal } from '../components/PatientModal';

// ── Helpers ──────────────────────────────────────────────────────────────────
const calcAge = (birthDate?: string): string => {
    if (!birthDate) return '---';
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const adjustedMonths = months < 0 ? months + 12 : months;
    const adjustedYears = months < 0 ? years - 1 : years;
    return `${adjustedYears} Anos e ${adjustedMonths} meses`;
};

const formatDate = (date?: string): string => {
    if (!date) return 'Não informado';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    ativo: { label: 'Ativo', dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    inativo: { label: 'Inativo', dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700' },
};

// ── Tab types ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'atendimento', label: 'Atendimento', icon: Activity },
    { id: 'evolucao', label: 'Evolução', icon: History },
    { id: 'prontuario', label: 'Prontuário', icon: ClipboardList },
    { id: 'relacionamento', label: 'Relacionamento', icon: Heart },
    { id: 'arquivos', label: 'Arquivos', icon: Archive },
] as const;
type TabId = typeof TABS[number]['id'];

// ── Atendimento Components ───────────────────────────────────────────────────
const ProgressMiniBar: React.FC<{ icon: React.ElementType; color: string; progress: number }> = ({ icon: Icon, color, progress }) => (
    <div className="flex flex-col items-center gap-1.5 min-w-[32px]">
        <Icon className={`w-4 h-4 ${color}`} />
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`}
                style={{ "--progress": `${progress}%` } as any}
            />
        </div>
    </div>
);

const SurgeryCard: React.FC<{ surgery: any; onEdit: () => void; onNavigate: () => void }> = ({ surgery, onEdit, onNavigate }) => {
    const statusCfg = {
        eletiva: { label: 'Eletiva', bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100' },
        urgencia: { label: 'Urgência', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' }
    }[surgery.character as 'eletiva' | 'urgencia'] || { label: surgery.character, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' };

    return (
        <div
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 pb-4 border-b border-slate-50">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-800 text-sm">
                                {surgery.procedures?.[0]?.description || 'Procedimento não informado'}
                                {surgery.procedures?.length > 1 && <span className="text-[10px] text-slate-400 ml-1">+{surgery.procedures.length - 1}</span>}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                {statusCfg.label.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {surgery.date ? new Date(surgery.date).toLocaleDateString('pt-BR') : 'Data a definir'}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {surgery.hospitals?.name || 'Local não informado'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 flex flex-col justify-center min-w-[140px]">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status do Pedido</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-xs font-bold text-slate-700">Aguardando OPME</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progresso Geral</p>
                    <div className="flex gap-4">
                        <ProgressMiniBar icon={FileText} color="text-emerald-500" progress={100} /> {/* Docs */}
                        <ProgressMiniBar icon={ShieldCheck} color="text-emerald-500" progress={100} /> {/* Convênio */}
                        <ProgressMiniBar icon={Activity} color="text-emerald-500" progress={100} /> {/* Anestesia */}
                        <ProgressMiniBar icon={Package} color="text-red-500" progress={20} /> {/* OPME */}
                        <ProgressMiniBar icon={Wrench} color="text-amber-500" progress={60} /> {/* Equipamentos */}
                        <ProgressMiniBar icon={Users2} color="text-emerald-500" progress={100} /> {/* Equipe */}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Solicitante</p>
                        <p className="text-xs font-bold text-slate-700">{surgery.doctors?.full_name || '---'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {surgery.doctors?.full_name?.split(' ').map((n: any) => n[0]).slice(0, 2).join('').toUpperCase() || 'DR'}
                    </div>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar Pedido
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-100 text-xs font-bold rounded-xl hover:bg-primary-100 hover:text-primary-800 transition-colors"
                >
                    <Eye className="w-3.5 h-3.5" />
                    Ir para Navegação
                </button>
            </div>
        </div>
    );
};

// ── Sidebar ──────────────────────────────────────────────────────────────────
const PatientSidebar: React.FC<{
    patient: PatientV2;
    records: MedicalRecord[];
    onEdit: () => void;
}> = ({ patient, records, onEdit }) => {
    const statusCfg = STATUS_CONFIG[patient.status] || STATUS_CONFIG.lead;
    const initials = patient.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <aside className="lg:w-56 xl:w-60 shrink-0 space-y-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center pt-8 pb-5 px-5 text-center border-b border-slate-100">
                {/* Status Badge */}
                <span className={`mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} border-current/20`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                </span>

                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center text-2xl font-black shadow-inner">
                        {initials}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                </div>

                <h2 className="mt-4 font-bold text-slate-800 text-sm leading-snug">{patient.full_name}</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">{calcAge(patient.birth_date)}</p>

                <button
                    onClick={onEdit}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs hover:bg-slate-50 transition-colors shadow-sm w-full justify-center"
                >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
            </div>

            {/* Stats */}
            <div className="px-5 py-4 border-b border-slate-100 space-y-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Resumo Clínico</p>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Consultas realizadas:</span>
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 w-6 h-6 flex items-center justify-center rounded-full">{records.length}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Número de faltas:</span>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-full">0</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Número de remarcações:</span>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-full">0</span>
                </div>
            </div>

            {/* Patient Data */}
            <div className="px-5 py-4 space-y-2.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Dados do paciente:</p>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>{formatDate(patient.birth_date)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="truncate">{patient.address_city ? `${patient.address_city}, ${patient.address_state}` : 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="truncate">{patient.email || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>{patient.whatsapp || patient.phone || 'Não informado'}</span>
                </div>
                {(patient.whatsapp && patient.phone && patient.whatsapp !== patient.phone) && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span>{patient.phone}</span>
                    </div>
                )}

                {/* LGPD */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className={`flex items-center gap-2 p-2.5 rounded-xl ${patient.lgpd_consent ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {patient.lgpd_consent
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            : <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        }
                        <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">LGPD</p>
                            <p className={`text-[10px] font-bold ${patient.lgpd_consent ? 'text-emerald-700' : 'text-red-700'}`}>
                                {patient.lgpd_consent ? 'Consentido' : 'Não assinado'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

// ── Tab: Atendimento ─────────────────────────────────────────────────────────
const AtendimentoTab: React.FC<{
    surgeries: any[],
    patientId: string,
    onNewRecord: () => void
}> = ({ surgeries, patientId, onNewRecord }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos os Status');
    const [filterDate, setFilterDate] = useState('');
    const [filterHospital, setFilterHospital] = useState('Todos os Hospitais');
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const navigate = useNavigate();

    const filteredSurgeries = surgeries.filter(s => {
        const matchesSearch = !searchTerm ||
            s.procedures?.[0]?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.doctors?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'Todos os Status' || s.status === filterStatus.toLowerCase();
        const matchesDate = !filterDate || s.date === filterDate;
        const matchesHospital = filterHospital === 'Todos os Hospitais' || s.hospitals?.name === filterHospital;

        return matchesSearch && matchesStatus && matchesDate && matchesHospital;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header com Ações Rápidas */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-2">
                <div>
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary-500" /> Requerimentos Cirúrgicos
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Gestão de pedidos e status de navegação</p>
                </div>
                <button
                    onClick={onNewRecord}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Nova Cirurgia
                </button>
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Pesquisar por procedimento ou cirurgião..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={() => setShowMoreFilters(!showMoreFilters)}
                    className={`px-5 py-3 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all ${showMoreFilters
                        ? 'bg-primary-50 border-primary-200 text-primary-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    Filtros
                    {showMoreFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {showMoreFilters && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Status do Pedido</label>
                        <select
                            title="Status do Pedido"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500 shadow-sm cursor-pointer"
                        >
                            <option>Todos os Status</option>
                            <option value="agendado">Agendado</option>
                            <option value="em_navegacao">Em Navegação</option>
                            <option value="finalizada">Finalizada</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Data da Cirurgia</label>
                        <input
                            title="Data da Cirurgia"
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Hospital / Local</label>
                        <select
                            title="Hospital / Local"
                            value={filterHospital}
                            onChange={(e) => setFilterHospital(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500 shadow-sm cursor-pointer"
                        >
                            <option>Todos os Hospitais</option>
                            {Array.from(new Set(surgeries.filter(s => s.hospitals?.name).map(s => s.hospitals.name))).map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="pt-2">
                {surgeries.length === 0 ? (
                    <div className="py-24 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 mx-auto mb-6 shadow-sm">
                            <Activity className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-base font-bold text-slate-400">Nenhuma cirurgia cadastrada</p>
                        <p className="text-sm text-slate-400 mt-2 max-w-[280px] mx-auto">
                            Registre um novo pedido médico para iniciar o acompanhamento clínico e burocrático.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredSurgeries.map((surgery) => (
                            <SurgeryCard
                                key={surgery.id}
                                surgery={surgery}
                                onEdit={() => navigate('/new-order', { state: { orderId: surgery.id, patientId } })}
                                onNavigate={() => navigate(`/case/${surgery.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const EvolucaoTab: React.FC<{ records: MedicalRecord[], onNewRecord: () => void }> = ({ records, onNewRecord }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
            <div>
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <History className="w-4 h-4 text-primary-500" /> Histórico de Evolução Clínica
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Registros de avaliações, biometria e notas clínicas</p>
            </div>
            <button onClick={onNewRecord} className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Novo Registro
            </button>
        </div>

        {records.length === 0 ? (
            <div className="py-20 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 mx-auto mb-6 shadow-sm">
                    <History className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-base font-bold text-slate-400">Sem histórico de evolução</p>
                <p className="text-sm text-slate-400 mt-2 max-w-[280px] mx-auto">Nenhum atendimento clínico foi registrado para este paciente.</p>
            </div>
        ) : (
            <div className="space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-100">
                {records.map((record) => (
                    <div key={record.id} className="relative flex gap-6 group">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm z-10 group-hover:border-primary-300 transition-colors">
                            <ClipboardList className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm group-hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-50">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avaliação Realizada em</p>
                                    <p className="text-base font-bold text-slate-800">
                                        {new Date(record.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                {record.bmi && (
                                    <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center">
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase">IMC</p>
                                        <p className="text-lg font-black text-emerald-700 leading-tight">{record.bmi?.toFixed(1)}</p>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Biometria</p>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                            <Weight className="w-3.5 h-3.5 text-slate-300" /> {record.weight}kg
                                        </p>
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                            <ArrowDownUp className="w-3.5 h-3.5 text-slate-300" /> {record.height}m
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Comorbidades</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {record.comorbidities.length === 0
                                            ? <span className="text-[10px] text-slate-400 italic">Nenhum registro</span>
                                            : record.comorbidities.map(c => (
                                                <span key={c} className="px-2 py-0.5 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold border border-red-100">{c}</span>
                                            ))
                                        }
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Indicação</p>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{record.surgical_indication || 'Sem indicação específica'}</p>
                                </div>
                            </div>
                            {record.notes && (
                                <div className="mt-5 pt-5 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Evolução e Conduta</p>
                                    <div className="text-sm text-slate-600 bg-slate-50/50 rounded-2xl p-4 border-l-4 border-primary-500 italic leading-relaxed">
                                        "{record.notes}"
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// ── Tab: Placeholder ─────────────────────────────────────────────────────────
const PlaceholderTab: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
    <div className="py-20 text-center">
        <Icon className="w-10 h-10 text-slate-200 mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-300">{label}</p>
        <p className="text-xs text-slate-300 mt-1">Em desenvolvimento</p>
    </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────
export const PatientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<PatientV2 | null>(null);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [surgeries, setSurgeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('atendimento');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: pData, error: pError } = await supabase
                .from('patients_v2')
                .select('*')
                .eq('id', id)
                .single();
            if (pError) throw pError;
            setPatient(pData);

            const { data: rData } = await supabase
                .from('medical_records')
                .select('*')
                .eq('patient_id', id)
                .order('created_at', { ascending: false });
            setRecords(rData || []);

            const { data: sData, error: sError } = await supabase
                .from('surgery_cases')
                .select(`
                    id,
                    date,
                    character,
                    status,
                    created_at,
                    doctor_id,
                    hospital_id,
                    doctors:doctors!doctor_id (id, full_name),
                    hospitals:hospitals!hospital_id (id, name),
                    procedures:order_procedures!order_id (*)
                `)
                .eq('patient_id', id)
                .order('created_at', { ascending: false });

            if (sError) {
                console.error('Surgery fetch error:', sError);
            }
            setSurgeries(sData || []);
        } catch (err) {
            console.error('Error fetching patient detail:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
    );

    if (!patient) return (
        <div className="text-center py-20 text-slate-400 font-medium">Paciente não localizado.</div>
    );

    return (
        <div className="space-y-4 animate-fade-in pb-20">
            {/* Back button */}
            <button
                onClick={() => navigate('/patients')}
                className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-primary-600 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                Voltar para listagem
            </button>

            {/* Main layout: sidebar + content */}
            <div className="flex gap-5 items-start">
                {/* ── Sidebar ── */}
                <PatientSidebar
                    patient={patient}
                    records={records}
                    onEdit={() => setIsEditOpen(true)}
                />

                {/* ── Main Content ── */}
                <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Tab Header */}
                    <div className="flex border-b border-slate-100 bg-white sticky top-0 z-10 px-1">
                        {TABS.map(({ id: tabId, label, icon: Icon }) => {
                            const isActive = activeTab === tabId;
                            return (
                                <button
                                    key={tabId}
                                    onClick={() => setActiveTab(tabId)}
                                    className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${isActive
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'atendimento' && (
                            <AtendimentoTab
                                surgeries={surgeries}
                                patientId={patient.id}
                                onNewRecord={() => setIsActionModalOpen(true)}
                            />
                        )}
                        {activeTab === 'evolucao' && (
                            <EvolucaoTab
                                records={records}
                                onNewRecord={() => setIsActionModalOpen(true)}
                            />
                        )}
                        {activeTab === 'prontuario' && <PlaceholderTab icon={ClipboardList} label="Prontuário" />}
                        {activeTab === 'relacionamento' && <PlaceholderTab icon={Users2} label="Relacionamento" />}
                        {activeTab === 'arquivos' && <PlaceholderTab icon={Archive} label="Arquivos" />}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditOpen && (
                <PatientModal
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSuccess={fetchData}
                    patientToEdit={patient}
                />
            )}

            {/* Action Modal */}
            {isActionModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                Novo Registro
                            </h3>
                            <button
                                onClick={() => setIsActionModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-500 mb-2">Qual tipo de registro deseja registrar para {patient.full_name}?</p>

                            <button
                                onClick={() => {
                                    setIsActionModalOpen(false);
                                    setIsConsultModalOpen(true);
                                }}
                                className="w-full text-left p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group flex gap-4 items-center"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 shrink-0 group-hover:scale-110 transition-transform">
                                    <Stethoscope className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-base">Consulta Clínica</h4>
                                    <p className="text-xs text-slate-500 mt-1">Registrar prescrições, evolução clínica, atestados e anamnese.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setIsActionModalOpen(false);
                                    navigate('/new-order', { state: { patientId: patient.id } });
                                }}
                                className="w-full text-left p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group flex gap-4 items-center"
                            >
                                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                                    <Heart className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-base">Cirurgia / Procedimento</h4>
                                    <p className="text-xs text-slate-500 mt-1">Criar um novo Pedido Médico Detalhado (OPME, Equipamentos, etc).</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dev Notification Modal: Consulta */}
            {isConsultModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mx-auto mb-4">
                            <Info className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                            Em Desenvolvimento
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">
                            A funcionalidade de registro de <strong>Consulta Clínica</strong> estará disponível nas próximas versões do sistema.
                        </p>
                        <button
                            onClick={() => setIsConsultModalOpen(false)}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
