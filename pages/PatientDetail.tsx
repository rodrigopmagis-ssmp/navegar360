import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar,
    FileText, Plus, Weight, ArrowDownUp, AlertTriangle,
    ClipboardList, CheckCircle2, History, Edit2,
    Stethoscope, Heart, Archive, Users2, Activity,
    XCircle
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
    { id: 'atendimento', label: 'Atendimento', icon: Stethoscope },
    { id: 'prontuario', label: 'Prontuário', icon: ClipboardList },
    { id: 'relacionamento', label: 'Relacionamento', icon: Heart },
    { id: 'arquivos', label: 'Arquivos', icon: Archive },
] as const;
type TabId = typeof TABS[number]['id'];

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
const AtendimentoTab: React.FC<{ records: MedicalRecord[] }> = ({ records }) => (
    <div className="space-y-5">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <History className="w-4 h-4 text-primary-500" /> Histórico de Atendimentos
            </h3>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Novo Registro
            </button>
        </div>

        {records.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">Nenhum registro de atendimento</p>
            </div>
        ) : (
            <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-100">
                {records.map((record) => (
                    <div key={record.id} className="relative flex gap-5 group">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm z-10 group-hover:border-primary-300 transition-colors">
                            <ClipboardList className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm group-hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Atendimento em</p>
                                    <p className="text-sm font-bold text-slate-800">
                                        {new Date(record.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                {record.bmi && (
                                    <div className="px-3 py-1.5 bg-primary-50 rounded-lg border border-primary-100">
                                        <p className="text-[9px] font-bold text-primary-400 uppercase">IMC</p>
                                        <p className="text-sm font-bold text-primary-700">{record.bmi?.toFixed(1)}</p>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-5">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Biometria</p>
                                    <p className="text-xs text-slate-600 flex items-center gap-1">
                                        <Weight className="w-3 h-3 text-slate-300" /> {record.weight}kg
                                    </p>
                                    <p className="text-xs text-slate-600 flex items-center gap-1">
                                        <ArrowDownUp className="w-3 h-3 text-slate-300" /> {record.height}m
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Comorbidades</p>
                                    <div className="flex flex-wrap gap-1">
                                        {record.comorbidities.length === 0
                                            ? <span className="text-[10px] text-slate-400 italic">Nenhum</span>
                                            : record.comorbidities.map(c => (
                                                <span key={c} className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-bold border border-red-100">{c}</span>
                                            ))
                                        }
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Indicação</p>
                                    <p className="text-xs text-slate-600">{record.surgical_indication || 'Sem indicação'}</p>
                                </div>
                            </div>
                            {record.notes && (
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Evolução Clínica</p>
                                    <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border-l-4 border-primary-500">
                                        {record.notes}
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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('atendimento');
    const [isEditOpen, setIsEditOpen] = useState(false);

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
                        {activeTab === 'atendimento' && <AtendimentoTab records={records} />}
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
        </div>
    );
};
