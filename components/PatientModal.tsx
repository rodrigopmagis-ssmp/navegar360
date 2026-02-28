import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, CreditCard, Save, MapPin, Shield, ChevronRight, ChevronLeft, ArrowRight, Search, Users2, Plus, Trash2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { HealthInsurer, InsurancePlan, PatientV2 } from '../types';
import { validateCPF, validateRG, formatCPF } from '../lib/validations';

interface PatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    patientToEdit?: PatientV2 | null;
}

type Tab = 'personal' | 'address' | 'insurance' | 'contacts';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'insurance', label: 'Convênio', icon: Shield },
    { id: 'contacts', label: 'Contatos', icon: Users2 },
];

const EMPTY_PERSONAL = {
    full_name: '',
    whatsapp: '',
    phone: '',
    email: '',
    birth_date: '',
    cpf: '',
    gender: '',
    marital_status: '',
    profession: '',
    rg: '',
    cnpj: '',
    ethnicity: '',
    origin: '',
    // Nationality
    nationality: 'brasileiro' as 'brasileiro' | 'estrangeiro',
    country_of_origin: '',
    document_type: '' as '' | 'passaporte' | 'crnm' | 'protocolo_refugio',
    document_number: '',
    document_validity: '',
    has_brazilian_cpf: false,
    // Family
    father_name: '',
    mother_name: '',
    rg_issuer: '',
};

const EMPTY_ADDRESS = {
    address_zipcode: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
};

const EMPTY_INSURANCE = {
    insurer_id: '',
    plan_id: '',
    card_number: '',
    holder_name: '',
    holder_cpf: '',
    valid_from: '',
    valid_until: '',
    is_primary: true,
};

export const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSuccess, patientToEdit }) => {
    const [activeTab, setActiveTab] = useState<Tab>('personal');
    const [loading, setLoading] = useState(false);
    const [personal, setPersonal] = useState({ ...EMPTY_PERSONAL });
    const [address, setAddress] = useState({ ...EMPTY_ADDRESS });
    const [insurance, setInsurance] = useState({ ...EMPTY_INSURANCE });
    const [hasInsurance, setHasInsurance] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Emergency Contacts
    type ContactForm = {
        id?: string;
        full_name: string;
        relationship: string;
        phone: string;
        phone_secondary: string;
        email: string;
        is_whatsapp: boolean;
        is_emergency_contact: boolean;
        can_receive_medical_info: boolean;
        can_authorize: boolean;
        is_financial_responsible: boolean;
        priority: number;
    };
    const emptyContact = (): ContactForm => ({
        full_name: '',
        relationship: '',
        phone: '',
        phone_secondary: '',
        email: '',
        is_whatsapp: false,
        is_emergency_contact: true,
        can_receive_medical_info: false,
        can_authorize: false,
        is_financial_responsible: false,
        priority: 1,
    });
    const [contacts, setContacts] = useState<ContactForm[]>([]);

    const [insurers, setInsuers] = useState<HealthInsurer[]>([]);
    const [plans, setPlans] = useState<InsurancePlan[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchInsurers();
            if (patientToEdit) {
                // ... existing personal/address setters ...
                setPersonal({
                    full_name: patientToEdit.full_name || '',
                    whatsapp: patientToEdit.whatsapp || '',
                    phone: patientToEdit.phone || '',
                    email: patientToEdit.email || '',
                    birth_date: patientToEdit.birth_date || '',
                    cpf: patientToEdit.cpf || '',
                    gender: patientToEdit.gender || '',
                    marital_status: patientToEdit.marital_status || '',
                    profession: patientToEdit.profession || '',
                    rg: patientToEdit.rg || '',
                    cnpj: patientToEdit.cnpj || '',
                    ethnicity: patientToEdit.ethnicity || '',
                    origin: patientToEdit.origin || '',
                    nationality: (patientToEdit.nationality as 'brasileiro' | 'estrangeiro') || 'brasileiro',
                    country_of_origin: patientToEdit.country_of_origin || '',
                    document_type: (patientToEdit.document_type as '' | 'passaporte' | 'crnm' | 'protocolo_refugio') || '',
                    document_number: patientToEdit.document_number || '',
                    document_validity: patientToEdit.document_validity || '',
                    has_brazilian_cpf: patientToEdit.has_brazilian_cpf || false,
                    father_name: patientToEdit.father_name || '',
                    mother_name: patientToEdit.mother_name || '',
                    rg_issuer: patientToEdit.rg_issuer || '',
                });
                setAddress({
                    address_zipcode: patientToEdit.address_zipcode || '',
                    address_street: patientToEdit.address_street || '',
                    address_number: patientToEdit.address_number || '',
                    address_complement: patientToEdit.address_complement || '',
                    address_neighborhood: patientToEdit.address_neighborhood || '',
                    address_city: patientToEdit.address_city || '',
                    address_state: patientToEdit.address_state || '',
                });
                fetchPatientInsurance(patientToEdit.id);
                fetchPatientContacts(patientToEdit.id);
            } else {
                resetForm();
            }
        }
    }, [isOpen, patientToEdit]);

    const fetchPatientInsurance = async (patientId: string) => {
        const { data } = await supabase
            .from('patient_insurances')
            .select('*')
            .eq('patient_id', patientId)
            .eq('is_primary', true)
            .maybeSingle();

        if (data) {
            setInsurance({
                insurer_id: data.insurer_id || '',
                plan_id: data.plan_id || '',
                card_number: data.card_number || '',
                holder_name: data.holder_name || '',
                holder_cpf: data.holder_cpf || '',
                valid_from: data.valid_from || '',
                valid_until: data.valid_until || '',
                is_primary: data.is_primary ?? true,
            });
            setHasInsurance(true);
        } else {
            setInsurance({ ...EMPTY_INSURANCE });
            setHasInsurance(false);
        }
    };

    const fetchPatientContacts = async (patientId: string) => {
        const { data } = await supabase
            .from('patient_emergency_contacts')
            .select('*')
            .eq('patient_id', patientId)
            .order('priority');
        if (data) {
            setContacts(data.map(d => ({
                id: d.id,
                full_name: d.full_name || '',
                relationship: d.relationship || '',
                phone: d.phone || '',
                phone_secondary: d.phone_secondary || '',
                email: d.email || '',
                is_whatsapp: d.is_whatsapp ?? false,
                is_emergency_contact: d.is_emergency_contact ?? true,
                can_receive_medical_info: d.can_receive_medical_info ?? false,
                can_authorize: d.can_authorize ?? false,
                is_financial_responsible: d.is_financial_responsible ?? false,
                priority: d.priority ?? 1,
            })));
        }
    };

    const saveContacts = async (patientId: string, clinicId: string) => {
        if (contacts.length === 0) return;
        // Upsert each contact
        for (const c of contacts) {
            const payload = { patient_id: patientId, clinic_id: clinicId, ...c };
            await supabase.from('patient_emergency_contacts').upsert(payload, { onConflict: 'id' });
        }
    };

    useEffect(() => {
        if (insurance.insurer_id) fetchPlans(insurance.insurer_id);
        else setPlans([]);
    }, [insurance.insurer_id]);

    const fetchInsurers = async () => {
        const { data } = await supabase.from('health_insurers').select('*').order('name');
        setInsuers(data || []);
    };

    const fetchPlans = async (insurerId: string) => {
        const { data } = await supabase
            .from('insurance_plans')
            .select('*')
            .eq('insurer_id', insurerId)
            .order('plan_name');
        setPlans(data || []);
    };

    const fetchAddress = async () => {
        const clean = address.address_zipcode.replace(/\D/g, '');
        if (clean.length !== 8) {
            alert('Por favor, informe um CEP válido com 8 dígitos.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
            const data = await res.json();
            if (data.erro) {
                alert('CEP não encontrado.');
            } else {
                setAddress(prev => ({
                    ...prev,
                    address_street: data.logradouro,
                    address_neighborhood: data.bairro,
                    address_city: data.localidade,
                    address_state: data.uf,
                }));
            }
        } catch (e) {
            alert('Erro ao buscar o CEP. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleZipcodeChange = (zip: string) => {
        // Apenas atualiza o estado do campo, sem disparar a busca automática
        setAddress(prev => ({ ...prev, address_zipcode: zip }));
    };

    const resetForm = () => {
        setPersonal({ ...EMPTY_PERSONAL });
        setAddress({ ...EMPTY_ADDRESS });
        setInsurance({ ...EMPTY_INSURANCE });
        setHasInsurance(false);
        setContacts([]);
        setActiveTab('personal');
        setErrors({});
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (personal.nationality === 'brasileiro') {
            // Brasileiro: CPF obrigatório se preenchido
            if (personal.cpf && !validateCPF(personal.cpf)) {
                newErrors.cpf = 'Por favor informe um CPF válido';
            }
            if (personal.rg && !validateRG(personal.rg)) {
                newErrors.rg = 'RG inválido (mínimo 7 dígitos)';
            }
        } else {
            // Estrangeiro: documento obrigatório
            if (!personal.country_of_origin) {
                newErrors.country_of_origin = 'Informe o país de origem';
            }
            if (!personal.document_number) {
                newErrors.document_number = 'Informe o número do documento';
            }
            // CPF apenas se marcou que possui
            if (personal.has_brazilian_cpf && personal.cpf && !validateCPF(personal.cpf)) {
                newErrors.cpf = 'Por favor informe um CPF válido';
            }
        }

        if (hasInsurance && insurance.holder_cpf && !validateCPF(insurance.holder_cpf)) {
            newErrors.holder_cpf = 'Por favor informe um CPF válido para o titular';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            if (activeTab !== 'insurance' && activeTab !== 'contacts') return;
        }

        if (!validate()) {
            if (errors.cpf || errors.rg) setActiveTab('personal');
            else if (errors.holder_cpf) setActiveTab('insurance');
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: profile } = await supabase
                .from('profiles')
                .select('clinic_id')
                .eq('id', user.id)
                .single();

            if (!profile?.clinic_id) throw new Error('Clínica não encontrada');

            let patientId = patientToEdit?.id;

            if (patientToEdit) {
                const { error: updateError } = await supabase
                    .from('patients_v2')
                    .update({
                        ...personal,
                        ...address,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', patientToEdit.id);

                if (updateError) throw updateError;
            } else {
                const { data: patient, error: patientError } = await supabase
                    .from('patients_v2')
                    .insert([{
                        ...personal,
                        ...address,
                        clinic_id: profile.clinic_id,
                        status: 'ativo',
                        lgpd_consent: true,
                        lgpd_consent_at: new Date().toISOString(),
                    }])
                    .select()
                    .single();

                if (patientError) throw patientError;
                patientId = patient.id;
            }

            if (patientId) {
                if (hasInsurance) {
                    const { data: existingIns } = await supabase
                        .from('patient_insurances')
                        .select('id')
                        .eq('patient_id', patientId)
                        .eq('is_primary', true)
                        .maybeSingle();

                    if (existingIns) {
                        await supabase
                            .from('patient_insurances')
                            .update({ ...insurance })
                            .eq('id', existingIns.id);
                    } else {
                        await supabase
                            .from('patient_insurances')
                            .insert([{
                                ...insurance,
                                clinic_id: profile.clinic_id,
                                patient_id: patientId,
                            }]);
                    }
                }

                // Save emergency contacts
                await saveContacts(patientId, profile.clinic_id);
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (err: any) {
            alert(`Erro ao salvar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputCls = (error?: string) => `w-full bg-slate-50 border ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all`;
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">

                {/* ── Header ── */}
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{patientToEdit ? 'Editar Paciente' : 'Novo Paciente'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{patientToEdit ? 'Atualize as informações do cadastro' : 'Preencha as etapas abaixo para concluir o cadastro'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        title="Fechar"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Step Indicator ── */}
                <div className="px-8 py-5 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center">
                        {TABS.map((tab, index) => {
                            const tabOrder: Tab[] = ['personal', 'address', 'insurance', 'contacts'];
                            const currentIdx = tabOrder.indexOf(activeTab);
                            const tabIdx = tabOrder.indexOf(tab.id);
                            const isCompleted = tabIdx < currentIdx;
                            const isActive = tab.id === activeTab;
                            const Icon = tab.icon;
                            return (
                                <React.Fragment key={tab.id}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className="flex flex-col items-center gap-2 group focus:outline-none"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200'
                                            : isActive
                                                ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200'
                                                : 'bg-white border-slate-200 text-slate-400 group-hover:border-primary-300 group-hover:text-primary-500'
                                            }`}>
                                            {isCompleted
                                                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                : <Icon className="w-4 h-4" />
                                            }
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-wide uppercase whitespace-nowrap transition-colors ${isCompleted ? 'text-emerald-600'
                                            : isActive ? 'text-primary-600'
                                                : 'text-slate-400 group-hover:text-slate-600'
                                            }`}>{tab.label}</span>
                                    </button>
                                    {index < TABS.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full transition-all ${tabIdx < currentIdx ? 'bg-emerald-400' : 'bg-slate-150'
                                            }`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="overflow-y-auto flex-1 p-6">

                        {activeTab === 'personal' && (
                            <div className="space-y-4">
                                {/* Nacionalidade */}
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className={"block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3"}>Nacionalidade</p>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="nationality"
                                                value="brasileiro"
                                                checked={personal.nationality === 'brasileiro'}
                                                onChange={() => setPersonal(p => ({ ...p, nationality: 'brasileiro', country_of_origin: '', document_type: '', document_number: '', document_validity: '', has_brazilian_cpf: false }))}
                                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                                            />
                                            <span className="text-sm font-semibold text-slate-700">🇧🇷 Brasileiro</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="nationality"
                                                value="estrangeiro"
                                                checked={personal.nationality === 'estrangeiro'}
                                                onChange={() => setPersonal(p => ({ ...p, nationality: 'estrangeiro', rg: '', cpf: '' }))}
                                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                                            />
                                            <span className="text-sm font-semibold text-slate-700">🌍 Estrangeiro</span>
                                        </label>
                                    </div>

                                    {personal.nationality === 'estrangeiro' && (
                                        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                                            <div className="col-span-2">
                                                <label className={"block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"}>País de Origem *</label>
                                                <input
                                                    type="text"
                                                    value={personal.country_of_origin}
                                                    onChange={e => setPersonal(p => ({ ...p, country_of_origin: e.target.value }))}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                    placeholder="Ex: Argentina, Portugal..."
                                                    className={`w-full bg-white border ${errors.country_of_origin ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all`}
                                                />
                                                {errors.country_of_origin && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.country_of_origin}</p>}
                                            </div>
                                            <div>
                                                <label className={"block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"}>Tipo de Documento *</label>
                                                <select
                                                    value={personal.document_type}
                                                    onChange={e => setPersonal(p => ({ ...p, document_type: e.target.value as any }))}
                                                    title="Tipo de documento"
                                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all appearance-none"
                                                >
                                                    <option value="">Selecione...</option>
                                                    <option value="passaporte">Passaporte</option>
                                                    <option value="crnm">CRNM (Registro Nacional Migratório)</option>
                                                    <option value="protocolo_refugio">Protocolo de Refúgio</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={"block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"}>Número do Documento *</label>
                                                <input
                                                    type="text"
                                                    value={personal.document_number}
                                                    onChange={e => setPersonal(p => ({ ...p, document_number: e.target.value }))}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                    placeholder="Nº do documento"
                                                    className={`w-full bg-white border ${errors.document_number ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all`}
                                                />
                                                {errors.document_number && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.document_number}</p>}
                                            </div>
                                            <div>
                                                <label className={"block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"}>Validade do Documento</label>
                                                <input
                                                    type="date"
                                                    value={personal.document_validity}
                                                    onChange={e => setPersonal(p => ({ ...p, document_validity: e.target.value }))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex items-center">
                                                <label className="flex items-center gap-3 cursor-pointer mt-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={personal.has_brazilian_cpf}
                                                        onChange={e => setPersonal(p => ({ ...p, has_brazilian_cpf: e.target.checked, cpf: e.target.checked ? p.cpf : '' }))}
                                                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">Possui CPF no Brasil?</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className={labelCls}>Nome Completo *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                required
                                                type="text"
                                                value={personal.full_name}
                                                onChange={e => setPersonal(p => ({ ...p, full_name: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                placeholder="Ex: Maria Oliveira"
                                                className={inputCls().replace('px-4', 'pl-10 pr-4')}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelCls}>WhatsApp / Telefone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="tel" value={personal.whatsapp} onChange={e => setPersonal(p => ({ ...p, whatsapp: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="(00) 00000-0000" className={inputCls().replace('px-4', 'pl-10 pr-4')} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelCls}>E-mail</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="email" value={personal.email} onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="paciente@exemplo.com" className={inputCls().replace('px-4', 'pl-10 pr-4')} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Data de Nascimento</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="date" value={personal.birth_date} onChange={e => setPersonal(p => ({ ...p, birth_date: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} className={inputCls().replace('px-4', 'pl-10 pr-4')} />
                                        </div>
                                    </div>

                                    {(personal.nationality === 'brasileiro' || personal.has_brazilian_cpf) && (
                                        <div>
                                            <label className={labelCls}>
                                                CPF {personal.nationality === 'brasileiro' ? '(Opcional)' : ''}
                                            </label>
                                            <input
                                                type="text"
                                                value={personal.cpf}
                                                onChange={e => setPersonal(p => ({ ...p, cpf: formatCPF(e.target.value) }))}
                                                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                placeholder="000.000.000-00"
                                                className={inputCls(errors.cpf)}
                                            />
                                            {errors.cpf && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.cpf}</p>}
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelCls}>Gênero</label>
                                        <select value={personal.gender} onChange={e => setPersonal(p => ({ ...p, gender: e.target.value }))} title="Gênero" className={inputCls() + ' appearance-none'}>
                                            <option value="">Selecione...</option>
                                            <option>Masculino</option>
                                            <option>Feminino</option>
                                            <option>Não-binário</option>
                                            <option>Prefiro não informar</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Estado Civil</label>
                                        <select value={personal.marital_status} onChange={e => setPersonal(p => ({ ...p, marital_status: e.target.value }))} title="Estado Civil" className={inputCls() + ' appearance-none'}>
                                            <option value="">Selecione...</option>
                                            <option>Solteiro(a)</option>
                                            <option>Casado(a)</option>
                                            <option>Divorciado(a)</option>
                                            <option>Viúvo(a)</option>
                                            <option>União Estável</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Profissão</label>
                                        <input type="text" value={personal.profession} onChange={e => setPersonal(p => ({ ...p, profession: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="Ex: Advogada" className={inputCls()} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>RG</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={personal.rg}
                                                onChange={e => setPersonal(p => ({ ...p, rg: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                placeholder="00.000.000-0"
                                                className={inputCls(errors.rg).replace('px-4', 'pl-10 pr-4')}
                                            />
                                        </div>
                                        {errors.rg && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.rg}</p>}
                                    </div>

                                    <div>
                                        <label className={labelCls}>Órgão Emissor (RG)</label>
                                        <input
                                            type="text"
                                            value={personal.rg_issuer}
                                            onChange={e => setPersonal(p => ({ ...p, rg_issuer: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                            placeholder="Ex: SSP/SP"
                                            className={inputCls()}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelCls}>CNPJ (Opcional)</label>
                                        <input type="text" value={personal.cnpj} onChange={e => setPersonal(p => ({ ...p, cnpj: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} placeholder="00.000.000/0000-00" className={inputCls()} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Cor / Raça</label>
                                        <select value={personal.ethnicity} onChange={e => setPersonal(p => ({ ...p, ethnicity: e.target.value }))} title="Cor / Raça" className={inputCls() + ' appearance-none'}>
                                            <option value="">Selecione...</option>
                                            <option>Branca</option>
                                            <option>Preta</option>
                                            <option>Parda</option>
                                            <option>Amarela</option>
                                            <option>Indígena</option>
                                            <option>Não declarado</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Origem</label>
                                        <select value={personal.origin} onChange={e => setPersonal(p => ({ ...p, origin: e.target.value }))} title="Origem" className={inputCls() + ' appearance-none'}>
                                            <option value="">Selecione...</option>
                                            <option>Indicação Médica</option>
                                            <option>Plano de Saúde</option>
                                            <option>Busca Online</option>
                                            <option>Redes Sociais</option>
                                            <option>Indicação de Paciente</option>
                                            <option>Outro</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Nome do Pai</label>
                                        <input
                                            type="text"
                                            value={personal.father_name}
                                            onChange={e => setPersonal(p => ({ ...p, father_name: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                            placeholder="Nome completo do pai"
                                            className={inputCls()}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Nome da Mãe</label>
                                        <input
                                            type="text"
                                            value={personal.mother_name}
                                            onChange={e => setPersonal(p => ({ ...p, mother_name: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                            placeholder="Nome completo da mãe"
                                            className={inputCls()}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'address' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>CEP</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={address.address_zipcode}
                                                onChange={e => handleZipcodeChange(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), fetchAddress())}
                                                placeholder="00000-000"
                                                className={inputCls().replace('px-4', 'pl-4 pr-10')}
                                            />
                                            <button
                                                type="button"
                                                onClick={fetchAddress}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Localizar CEP"
                                            >
                                                <Search className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Bairro</label>
                                        <input type="text" value={address.address_neighborhood} onChange={e => setAddress(a => ({ ...a, address_neighborhood: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} className={inputCls()} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelCls}>Logradouro (Rua / Av.)</label>
                                        <input type="text" value={address.address_street} onChange={e => setAddress(a => ({ ...a, address_street: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} className={inputCls()} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Número</label>
                                        <input type="text" value={address.address_number} onChange={e => setAddress(a => ({ ...a, address_number: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} className={inputCls()} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Complemento</label>
                                        <input type="text" value={address.address_complement} onChange={e => setAddress(a => ({ ...a, address_complement: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} className={inputCls()} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Cidade</label>
                                        <input type="text" value={address.address_city} onChange={e => setAddress(a => ({ ...a, address_city: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} className={inputCls()} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Estado (UF)</label>
                                        <input type="text" value={address.address_state} onChange={e => setAddress(a => ({ ...a, address_state: e.target.value }))} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} maxLength={2} className={inputCls() + ' uppercase'} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'insurance' && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">Paciente possui convênio?</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Ativando, os dados do plano serão vinculados ao paciente</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHasInsurance(v => !v)}
                                        title={hasInsurance ? "Remover Convênio" : "Adicionar Convênio"}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${hasInsurance ? 'bg-primary-600' : 'bg-slate-300'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hasInsurance ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>

                                {hasInsurance && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className={labelCls}>Operadora</label>
                                            <select
                                                value={insurance.insurer_id}
                                                onChange={e => setInsurance(i => ({ ...i, insurer_id: e.target.value, plan_id: '' }))}
                                                title="Operadora de saúde"
                                                className={inputCls() + ' appearance-none'}
                                            >
                                                <option value="">Selecione a operadora...</option>
                                                {insurers.map(ins => (
                                                    <option key={ins.id} value={ins.id}>{ins.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {insurance.insurer_id && (
                                            <div className="col-span-2">
                                                <label className={labelCls}>Plano</label>
                                                <select
                                                    value={insurance.plan_id}
                                                    onChange={e => setInsurance(i => ({ ...i, plan_id: e.target.value }))}
                                                    title="Plano de saúde"
                                                    className={inputCls() + ' appearance-none'}
                                                >
                                                    <option value="">Selecione o plano...</option>
                                                    {plans.map(plan => (
                                                        <option key={plan.id} value={plan.id}>
                                                            {plan.plan_name} — {plan.accommodation_type} / {plan.coverage_type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className={labelCls}>Nº do Cartão</label>
                                            <input type="text" value={insurance.card_number} onChange={e => setInsurance(i => ({ ...i, card_number: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="0000 0000 0000 0000" className={inputCls()} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Nome do Titular</label>
                                            <input type="text" value={insurance.holder_name} onChange={e => setInsurance(i => ({ ...i, holder_name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Nome como no cartão" className={inputCls()} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>CPF do Titular</label>
                                            <input
                                                type="text"
                                                value={insurance.holder_cpf}
                                                onChange={e => setInsurance(i => ({ ...i, holder_cpf: formatCPF(e.target.value) }))}
                                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                                placeholder="000.000.000-00"
                                                className={inputCls(errors.holder_cpf)}
                                            />
                                            {errors.holder_cpf && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.holder_cpf}</p>}
                                        </div>
                                        <div />
                                        <div>
                                            <label className={labelCls}>Válido a partir de</label>
                                            <input type="date" value={insurance.valid_from} onChange={e => setInsurance(i => ({ ...i, valid_from: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSubmit()} className={inputCls()} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Válido até</label>
                                            <input type="date" value={insurance.valid_until} onChange={e => setInsurance(i => ({ ...i, valid_until: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSubmit()} className={inputCls()} />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={insurance.is_primary}
                                                    onChange={e => setInsurance(i => ({ ...i, is_primary: e.target.checked }))}
                                                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                                                />
                                                <span className="text-sm font-medium text-slate-700">Marcar como convênio principal</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'contacts' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={labelCls}>Contatos de Emergência</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Adicione pessoas de referência para contato, emergência e autorizações.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setContacts(c => [...c, { ...emptyContact(), priority: c.length + 1 }])}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Adicionar Contato
                                    </button>
                                </div>

                                {contacts.length === 0 && (
                                    <div className="py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                        <Users2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-slate-400">Nenhum contato cadastrado</p>
                                        <p className="text-xs text-slate-300 mt-1">Clique em "Adicionar Contato" para incluir pessoas de referência.</p>
                                    </div>
                                )}

                                {contacts.map((c, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                        {/* Card header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-black flex items-center justify-center">{i + 1}</span>
                                                <span className="text-xs font-bold text-slate-600">{c.full_name || 'Novo contato'}</span>
                                                {c.is_emergency_contact && (
                                                    <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold rounded border border-red-100 uppercase">Emergência</span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                title="Remover contato"
                                                onClick={async () => {
                                                    if (c.id) {
                                                        await supabase.from('patient_emergency_contacts').delete().eq('id', c.id);
                                                    }
                                                    setContacts(prev => prev.filter((_, idx) => idx !== i));
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Fields */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <label className={labelCls}>Nome Completo *</label>
                                                <input
                                                    type="text"
                                                    value={c.full_name}
                                                    onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, full_name: e.target.value } : x))}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                    placeholder="Nome completo"
                                                    className={inputCls()}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Parentesco / Vínculo</label>
                                                <select
                                                    value={c.relationship}
                                                    onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, relationship: e.target.value } : x))}
                                                    title="Parentesco"
                                                    className={inputCls() + ' appearance-none'}
                                                >
                                                    <option value="">Selecione...</option>
                                                    <option>Mãe</option>
                                                    <option>Pai</option>
                                                    <option>Cônjuge</option>
                                                    <option>Filho(a)</option>
                                                    <option>Irmão / Irmã</option>
                                                    <option>Amigo(a)</option>
                                                    <option>Responsável Legal</option>
                                                    <option>Outro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Prioridade</label>
                                                <select
                                                    value={c.priority}
                                                    onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, priority: Number(e.target.value) } : x))}
                                                    title="Prioridade"
                                                    className={inputCls() + ' appearance-none'}
                                                >
                                                    <option value={1}>1º Prioridade</option>
                                                    <option value={2}>2º Prioridade</option>
                                                    <option value={3}>3º Prioridade</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Telefone Principal *</label>
                                                <input
                                                    type="tel"
                                                    value={c.phone}
                                                    onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                    placeholder="(00) 00000-0000"
                                                    className={inputCls()}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Telefone Secundário</label>
                                                <input
                                                    type="tel"
                                                    value={c.phone_secondary}
                                                    onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, phone_secondary: e.target.value } : x))}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                    placeholder="(00) 00000-0000"
                                                    className={inputCls()}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={labelCls}>E-mail</label>
                                                <input
                                                    type="email"
                                                    value={c.email}
                                                    onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, email: e.target.value } : x))}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                    placeholder="contato@email.com"
                                                    className={inputCls()}
                                                />
                                            </div>
                                        </div>

                                        {/* Permissions */}
                                        <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                                            {[
                                                { key: 'is_whatsapp', label: 'WhatsApp disponível' },
                                                { key: 'is_emergency_contact', label: 'Contato de emergência' },
                                                { key: 'can_receive_medical_info', label: 'Recebe informações médicas' },
                                                { key: 'can_authorize', label: 'Pode autorizar procedimentos' },
                                                { key: 'is_financial_responsible', label: 'Responsável financeiro' },
                                            ].map(({ key, label }) => (
                                                <label key={key} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={(c as any)[key]}
                                                        onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, [key]: e.target.checked } : x))}
                                                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                                                    />
                                                    <span className="text-xs font-medium text-slate-600">{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
                        <div className="flex gap-2">
                            {TABS.map((tab, i) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    title={tab.label}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${activeTab === tab.id ? 'bg-primary-600 w-6' : 'bg-slate-200'}`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-3">
                            {activeTab !== 'personal' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const order: Tab[] = ['personal', 'address', 'insurance', 'contacts'];
                                        const idx = order.indexOf(activeTab);
                                        if (idx > 0) setActiveTab(order[idx - 1]);
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Anterior
                                </button>
                            )}
                            {activeTab !== 'contacts' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const order: Tab[] = ['personal', 'address', 'insurance', 'contacts'];
                                        const idx = order.indexOf(activeTab);
                                        if (idx < order.length - 1) setActiveTab(order[idx + 1]);
                                    }}
                                    className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl text-sm hover:bg-primary-700 transition-colors"
                                >
                                    Próximo <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleSubmit()}
                                    disabled={loading || !personal.full_name}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {patientToEdit ? 'Salvar Alterações' : 'Salvar Paciente'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
