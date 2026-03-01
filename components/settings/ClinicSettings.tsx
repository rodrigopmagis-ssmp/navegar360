import React, { useState, useEffect } from 'react';
import {
    Building2, MapPin, Phone, Globe, Mail, Save,
    Loader2, BadgeCheck, ShieldAlert, CreditCard,
    Hash, FileText, Smartphone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ClinicData {
    id: string;
    name: string;
    legal_name: string;
    cnpj: string;
    logo_url: string;
    zip_code: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
    status: string;
    plan: string;
}

const formatCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
};

const formatCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d)/, '$1-$2')
        .slice(0, 9);
};

const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 10) {
        return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
    }
    return v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '').slice(0, 15);
};

export const ClinicSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [data, setData] = useState<ClinicData | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const baseInputClass = `w-full py-2.5 rounded-lg border outline-none transition-all
        ${isEditing
            ? 'px-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 dark:text-white'
            : 'px-0 border-transparent bg-transparent text-slate-900 dark:text-slate-100 font-medium'}`;

    useEffect(() => {
        fetchClinicData();
    }, []);

    const fetchClinicData = async () => {
        try {
            setLoading(true);
            // Get current user's clinic_id
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('clinic_id')
                .eq('id', user.id)
                .single();

            if (!profile?.clinic_id) throw new Error('No clinic associated with user');

            const { data: clinic, error: clinicError } = await supabase
                .from('clinics')
                .select('*')
                .eq('id', profile.clinic_id)
                .single();

            if (clinicError) throw clinicError;
            setData(clinic);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const zip = e.target.value.replace(/\D/g, '');
        if (zip.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
                const result = await response.json();
                if (!result.erro) {
                    setData(prev => prev ? {
                        ...prev,
                        street: result.logradouro,
                        neighborhood: result.bairro,
                        city: result.localidade,
                        state: result.uf
                    } : null);
                }
            } catch (err) {
                console.error('Failed to fetch address from ZIP code');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const { error: saveError } = await supabase
                .from('clinics')
                .update({
                    name: data.name,
                    legal_name: data.legal_name,
                    cnpj: data.cnpj,
                    logo_url: data.logo_url,
                    zip_code: data.zip_code,
                    street: data.street,
                    number: data.number,
                    complement: data.complement,
                    neighborhood: data.neighborhood,
                    city: data.city,
                    state: data.state,
                    phone: data.phone,
                    whatsapp: data.whatsapp,
                    email: data.email,
                    website: data.website,
                })
                .eq('id', data.id);

            if (saveError) throw saveError;
            setSuccess(true);
            setIsEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <p className="text-slate-500">Carregando dados da clínica...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6" />
                <p>Não foi possível carregar as informações da clínica.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-700">
            {/* Identity Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    <h2 className="font-semibold text-slate-800 dark:text-white">Identidade da Clínica</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" /> Nome Fantasia
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Nome Fantasia"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.name || ''}
                            onChange={e => setData({ ...data, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" /> Razão Social
                        </label>
                        <input
                            type="text"
                            placeholder="Razão Social"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.legal_name || ''}
                            onChange={e => setData({ ...data, legal_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-slate-400" /> CNPJ
                        </label>
                        <input
                            type="text"
                            placeholder="00.000.000/0000-00"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.cnpj || ''}
                            onChange={e => setData({ ...data, cnpj: formatCNPJ(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" /> URL do Logotipo
                        </label>
                        <input
                            type="text"
                            placeholder="https://..."
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.logo_url || ''}
                            onChange={e => setData({ ...data, logo_url: e.target.value })}
                        />
                    </div>
                </div>
            </section>

            {/* Address Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <h2 className="font-semibold text-slate-800 dark:text-white">Endereço Operacional</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-6">
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CEP</label>
                        <input
                            type="text"
                            maxLength={9}
                            placeholder="00000-000"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.zip_code || ''}
                            onBlur={handleZipCodeBlur}
                            onChange={e => setData({ ...data, zip_code: formatCEP(e.target.value) })}
                        />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Logradouro</label>
                        <input
                            type="text"
                            placeholder="Logradouro"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.street || ''}
                            onChange={e => setData({ ...data, street: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-1 space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nº</label>
                        <input
                            type="text"
                            placeholder="Número"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.number || ''}
                            onChange={e => setData({ ...data, number: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bairro</label>
                        <input
                            type="text"
                            placeholder="Bairro"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.neighborhood || ''}
                            onChange={e => setData({ ...data, neighborhood: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
                        <input
                            type="text"
                            placeholder="Cidade"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.city || ''}
                            onChange={e => setData({ ...data, city: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-1 space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">UF</label>
                        <input
                            type="text"
                            placeholder="UF"
                            maxLength={2}
                            className={`${baseInputClass} uppercase`}
                            disabled={!isEditing}
                            value={data.state || ''}
                            onChange={e => setData({ ...data, state: e.target.value })}
                        />
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                    <Phone className="w-5 h-5 text-primary-600" />
                    <h2 className="font-semibold text-slate-800 dark:text-white">Dados de Contato</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" /> Telefone fixo
                        </label>
                        <input
                            type="tel"
                            placeholder="(00) 0000-0000"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.phone || ''}
                            onChange={e => setData({ ...data, phone: formatPhone(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-slate-400" /> WhatsApp
                        </label>
                        <input
                            type="tel"
                            placeholder="(00) 00000-0000"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.whatsapp || ''}
                            onChange={e => setData({ ...data, whatsapp: formatPhone(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" /> E-mail principal
                        </label>
                        <input
                            type="email"
                            placeholder="contato@clinica.com"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.email || ''}
                            onChange={e => setData({ ...data, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" /> Website
                        </label>
                        <input
                            type="url"
                            className={baseInputClass}
                            disabled={!isEditing}
                            value={data.website || ''}
                            onChange={e => setData({ ...data, website: e.target.value })}
                        />
                    </div>
                </div>
            </section>

            {/* Plan Section - Read Only */}
            <section className="bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl p-1 shadow-lg overflow-hidden">
                <div className="bg-white dark:bg-slate-900 rounded-[10px] overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary-600" />
                            <h2 className="font-semibold text-slate-800 dark:text-white">Assinatura e Limites</h2>
                        </div>
                        <div className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full uppercase tracking-wider">
                            Plano {data.plan || 'Free'}
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="space-y-2">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Status da Conta</p>
                            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                                <BadgeCheck className="w-5 h-5" />
                                {data.status === 'ativo' ? 'Ativo' : data.status}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Renovação</p>
                            <p className="text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">Plano Permanente</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Suporte</p>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">Prioritário 24/7</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                {error && <span className="text-red-500 text-sm flex-1">{error}</span>}
                {success && (
                    <span className="text-green-600 text-sm flex items-center gap-2 animate-in slide-in-from-right-2">
                        <BadgeCheck className="w-4 h-4" /> Alterações salvas com sucesso!
                    </span>
                )}
                {!isEditing ? (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-primary-200 transition-all flex items-center gap-2 active:scale-95"
                    >
                        Editar Configurações
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => { setIsEditing(false); fetchClinicData(); }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-primary-200 transition-all flex items-center gap-2 active:scale-95"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Salvar Alterações
                        </button>
                    </>
                )}
            </div>
        </form>
    );
};
