import React, { useState, useEffect } from 'react';
import { X, User, Phone, Shield, FileText, Save, Search, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { HealthInsurer, InsurancePlan } from '../../types';
import { validateCPF, formatCPF } from '../../lib/validations';
import { useAuth } from '../../contexts/AuthContext';

interface QuickPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const QuickPatientModal: React.FC<QuickPatientModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        whatsapp: '',
        cpf: '',
        medical_record_number: '',
        insurer_id: '',
        plan_id: '',
        card_number: '',
    });

    const [insurers, setInsurers] = useState<HealthInsurer[]>([]);
    const [plans, setPlans] = useState<InsurancePlan[]>([]);
    const [searchingInsurers, setSearchingInsurers] = useState(false);
    const [insurerSearchQuery, setInsurerSearchQuery] = useState('');
    const { selectedClinic } = useAuth();

    useEffect(() => {
        if (isOpen) {
            setFormData({
                full_name: '',
                whatsapp: '',
                cpf: '',
                medical_record_number: '',
                insurer_id: '',
                plan_id: '',
                card_number: '',
            });
            setInsurers([]);
            setPlans([]);
            setInsurerSearchQuery('');
        }
    }, [isOpen]);

    const handleSearchInsurers = async () => {
        if (!insurerSearchQuery.trim()) return;
        setSearchingInsurers(true);
        try {
            let query = supabase.from('health_insurers').select('*');
            if (selectedClinic?.id) {
                query = query.eq('clinic_id', selectedClinic.id);
            }
            query = query.ilike('name', `%${insurerSearchQuery}%`);

            const { data, error } = await query.order('name');
            if (error) throw error;
            setInsurers(data || []);
        } catch (err) {
            console.error('Error searching insurers:', err);
        } finally {
            setSearchingInsurers(false);
        }
    };

    const fetchPlans = async (insurerId: string) => {
        try {
            const { data, error } = await supabase
                .from('insurance_plans')
                .select('*')
                .eq('insurer_id', insurerId)
                .order('plan_name');
            if (error) throw error;
            setPlans(data || []);
        } catch (err) {
            console.error('Error fetching plans:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name) {
            alert('Nome completo é obrigatório');
            return;
        }

        setLoading(true);
        try {
            if (!selectedClinic?.id) throw new Error('Clínica não encontrada');

            // 1. Create Patient
            const { data: patient, error: patientError } = await supabase
                .from('patients_v2')
                .insert([{
                    full_name: formData.full_name,
                    whatsapp: formData.whatsapp,
                    cpf: formData.cpf,
                    medical_record_number: formData.medical_record_number,
                    clinic_id: selectedClinic.id,
                    status: 'ativo',
                    lgpd_consent: true,
                    lgpd_consent_at: new Date().toISOString(),
                }])
                .select()
                .single();

            if (patientError) throw patientError;

            // 2. Create Insurance if selected
            if (formData.insurer_id && formData.plan_id) {
                const { error: insError } = await supabase
                    .from('patient_insurances')
                    .insert([{
                        clinic_id: selectedClinic.id,
                        patient_id: patient.id,
                        plan_id: formData.plan_id,
                        card_number: formData.card_number,
                        is_primary: true,
                    }]);
                if (insError) throw insError;
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            alert(`Erro ao cadastrar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Cadastro Rápido de Paciente</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Preencha os dados essenciais para o registro</p>
                        </div>
                    </div>
                    <button onClick={onClose} title="Fechar modal" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelCls}>Nome Completo *</label>
                            <input
                                required
                                type="text"
                                value={formData.full_name}
                                onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))}
                                className={inputCls}
                                placeholder="Nome completo do paciente"
                            />
                        </div>

                        <div>
                            <label className={labelCls}>WhatsApp / Telefone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    value={formData.whatsapp}
                                    onChange={e => setFormData(f => ({ ...f, whatsapp: e.target.value }))}
                                    className={`${inputCls} pl-10`}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>CPF</label>
                            <input
                                type="text"
                                value={formData.cpf}
                                onChange={e => setFormData(f => ({ ...f, cpf: formatCPF(e.target.value) }))}
                                className={inputCls}
                                placeholder="000.000.000-00"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Prontuário (Nº Registro)</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    value={formData.medical_record_number}
                                    onChange={e => setFormData(f => ({ ...f, medical_record_number: e.target.value }))}
                                    className={`${inputCls} pl-10`}
                                    placeholder="Ex: 123456"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Shield className="w-3 h-3" /> Convênio e Carteira
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelCls}>Buscar Operadora</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={insurerSearchQuery}
                                            onChange={e => setInsurerSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchInsurers())}
                                            className={inputCls}
                                            placeholder="Digita e clica na lupa..."
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSearchInsurers}
                                            disabled={searchingInsurers}
                                            title="Buscar operadoras"
                                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                                        >
                                            {searchingInsurers ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {insurers.length > 0 && (
                                        <select
                                            value={formData.insurer_id}
                                            onChange={e => {
                                                const id = e.target.value;
                                                setFormData(f => ({ ...f, insurer_id: id, plan_id: '' }));
                                                if (id) fetchPlans(id);
                                            }}
                                            className={inputCls}
                                            title="Selecionar Operadora"
                                        >
                                            <option value="">-- Selecione a Operadora --</option>
                                            {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                        </select>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className={labelCls}>Plano</label>
                                    <select
                                        disabled={!formData.insurer_id}
                                        value={formData.plan_id}
                                        onChange={e => setFormData(f => ({ ...f, plan_id: e.target.value }))}
                                        className={inputCls}
                                        title="Selecionar Plano"
                                    >
                                        <option value="">-- Selecione o Plano --</option>
                                        {plans.map(p => <option key={p.id} value={p.id}>{p.plan_name}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelCls}>Nº do Cartão / Carteira</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input
                                            type="text"
                                            value={formData.card_number}
                                            onChange={e => setFormData(f => ({ ...f, card_number: e.target.value }))}
                                            className={`${inputCls} pl-10`}
                                            placeholder="Número do cartão de saúde"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            title="Cancelar e fechar"
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            title="Salvar cadastro"
                            className="flex-1 py-3 px-4 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Salvar Cadastro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
