import React, { useState, useEffect } from 'react';
import { X, User, Phone, Stethoscope, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Doctor } from '../types';

interface DoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    doctorToEdit?: Doctor | null;
}

type Tab = 'professional' | 'contact';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'professional', label: 'Dados Profissionais', icon: Stethoscope },
    { id: 'contact', label: 'Contato & Observações', icon: Phone },
];

const COUNCILS = ['CRM', 'CRO', 'CREFITO', 'CFN', 'COREN', 'CFF'];
const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const ROLE_LABELS: Record<string, string> = {
    cirurgiao: 'Cirurgião Principal',
    assistente: 'Médico Assistente',
    anestesista: 'Anestesista',
    residente: 'Residente',
};

const defaultProfessional = {
    full_name: '',
    council: 'CRM',
    council_number: '',
    council_state: 'SP',
    rqe: '',
    specialty: '',
    subspecialty: '',
    role_type: 'cirurgiao' as Doctor['role_type'],
    status: 'ativo' as Doctor['status'],
};

const defaultContact = {
    phone: '',
    whatsapp: '',
    email: '',
    notes: '',
};

export const DoctorModal: React.FC<DoctorModalProps> = ({ isOpen, onClose, onSuccess, doctorToEdit }) => {
    const [activeTab, setActiveTab] = useState<Tab>('professional');
    const [professional, setProfessional] = useState(defaultProfessional);
    const [contact, setContact] = useState(defaultContact);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        if (doctorToEdit) {
            setProfessional({
                full_name: doctorToEdit.full_name,
                council: doctorToEdit.council,
                council_number: doctorToEdit.council_number || '',
                council_state: doctorToEdit.council_state || 'SP',
                rqe: doctorToEdit.rqe || '',
                specialty: doctorToEdit.specialty || '',
                subspecialty: doctorToEdit.subspecialty || '',
                role_type: doctorToEdit.role_type,
                status: doctorToEdit.status,
            });
            setContact({
                phone: doctorToEdit.phone || '',
                whatsapp: doctorToEdit.whatsapp || '',
                email: doctorToEdit.email || '',
                notes: doctorToEdit.notes || '',
            });
        } else {
            setProfessional(defaultProfessional);
            setContact(defaultContact);
        }
        setActiveTab('professional');
        setErrors({});
    }, [isOpen, doctorToEdit]);

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!professional.full_name.trim()) errs.full_name = 'Nome é obrigatório';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) { setActiveTab('professional'); return; }
        setSaving(true);
        try {
            const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single();
            if (!profile) throw new Error('Perfil não encontrado');

            const payload = {
                ...professional,
                ...contact,
                clinic_id: profile.clinic_id,
            };

            if (doctorToEdit) {
                const { error } = await supabase.from('doctors').update(payload).eq('id', doctorToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('doctors').insert([payload]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setErrors({ submit: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const inputCls = (err?: string) =>
        `w-full bg-slate-50 border ${err ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all`;
    const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5';

    const tabOrder: Tab[] = ['professional', 'contact'];
    const currentIdx = tabOrder.indexOf(activeTab);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{doctorToEdit ? 'Editar Médico' : 'Novo Médico'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Cadastre as informações do profissional</p>
                    </div>
                    <button onClick={onClose} title="Fechar" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-8 py-5 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center">
                        {TABS.map((tab, index) => {
                            const tabIdx = tabOrder.indexOf(tab.id);
                            const isCompleted = tabIdx < currentIdx;
                            const isActive = tab.id === activeTab;
                            const Icon = tab.icon;
                            return (
                                <React.Fragment key={tab.id}>
                                    <button type="button" onClick={() => setActiveTab(tab.id)} className="flex flex-col items-center gap-2 group focus:outline-none">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                isActive ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200' :
                                                    'bg-white border-slate-200 text-slate-400 group-hover:border-primary-300'}`}>
                                            {isCompleted
                                                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                : <Icon className="w-4 h-4" />}
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-wide uppercase whitespace-nowrap ${isCompleted ? 'text-emerald-600' : isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                                            {tab.label}
                                        </span>
                                    </button>
                                    {index < TABS.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full ${tabIdx < currentIdx ? 'bg-emerald-400' : 'bg-slate-150'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.submit}</div>
                    )}

                    {activeTab === 'professional' && (
                        <div className="space-y-5">
                            {/* Nome + Status */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className={labelCls}>Nome Completo *</label>
                                    <input title="Nome completo" placeholder="Dr. João da Silva" className={inputCls(errors.full_name)} value={professional.full_name} onChange={e => setProfessional(p => ({ ...p, full_name: e.target.value }))} />
                                    {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>Status</label>
                                    <select title="Status" className={inputCls()} value={professional.status} onChange={e => setProfessional(p => ({ ...p, status: e.target.value as Doctor['status'] }))}>
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            {/* Conselho */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                <p className={labelCls}>Registro Profissional</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelCls}>Conselho</label>
                                        <select title="Conselho" className={inputCls()} value={professional.council} onChange={e => setProfessional(p => ({ ...p, council: e.target.value }))}>
                                            {COUNCILS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Número</label>
                                        <input title="Número do conselho" placeholder="123456" className={inputCls()} value={professional.council_number} onChange={e => setProfessional(p => ({ ...p, council_number: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Estado</label>
                                        <select title="Estado" className={inputCls()} value={professional.council_state} onChange={e => setProfessional(p => ({ ...p, council_state: e.target.value }))}>
                                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>RQE (Qualificação de Especialista)</label>
                                        <input title="RQE" placeholder="Ex: 12345" className={inputCls()} value={professional.rqe} onChange={e => setProfessional(p => ({ ...p, rqe: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Tipo de Atuação</label>
                                        <select title="Tipo de atuação" className={inputCls()} value={professional.role_type} onChange={e => setProfessional(p => ({ ...p, role_type: e.target.value as Doctor['role_type'] }))}>
                                            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Especialidade */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Especialidade</label>
                                    <input title="Especialidade" placeholder="Ex: Neurocirurgia" className={inputCls()} value={professional.specialty} onChange={e => setProfessional(p => ({ ...p, specialty: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={labelCls}>Subespecialidade</label>
                                    <input title="Subespecialidade" placeholder="Ex: Coluna, Pediátrica..." className={inputCls()} value={professional.subspecialty} onChange={e => setProfessional(p => ({ ...p, subspecialty: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Telefone</label>
                                    <input title="Telefone" placeholder="(11) 3000-0000" className={inputCls()} value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={labelCls}>WhatsApp</label>
                                    <input title="WhatsApp" placeholder="(11) 99000-0000" className={inputCls()} value={contact.whatsapp} onChange={e => setContact(c => ({ ...c, whatsapp: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>E-mail</label>
                                <input title="E-mail" type="email" placeholder="dr.joao@clinica.com.br" className={inputCls()} value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Observações</label>
                                <textarea title="Observações" placeholder="Informações adicionais sobre o médico..." rows={4} className={`${inputCls()} resize-none`} value={contact.notes} onChange={e => setContact(c => ({ ...c, notes: e.target.value }))} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab(tabOrder[currentIdx - 1])}
                        disabled={currentIdx === 0}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>

                    {activeTab !== 'contact' ? (
                        <button
                            type="button"
                            onClick={() => setActiveTab(tabOrder[currentIdx + 1])}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-colors"
                        >
                            Próximo <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-60"
                        >
                            {saving ? 'Salvando...' : doctorToEdit ? 'Salvar Alterações' : 'Cadastrar Médico'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
