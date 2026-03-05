import React, { useState, useEffect, useRef } from 'react';
import { Shield, Plus, Pencil, Trash2, Loader2, Save, X, Activity, AlertCircle, Users, Search, LayoutGrid, List, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { HealthInsurer, HealthInsurerContact } from '../../types';

const formatCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
};

const formatSuperPhone = (value: string) => {
    let v = value.replace(/[^0-9rR]/g, '').toUpperCase();
    const parts = v.split('R');
    let phonePart = parts[0];
    let extPart = parts.length > 1 ? parts.slice(1).join('') : undefined;

    let phone = phonePart;
    if (phone.length <= 10) {
        phone = phone.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
    } else {
        phone = phone.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '').slice(0, 15);
    }

    if (extPart !== undefined) {
        return `${phone} R ${extPart}`;
    }
    return phone;
};

const PhoneWithRamalInput = ({ value, onChange, placeholder, className, disabled }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);
    const [isEditingExt, setIsEditingExt] = useState(false);

    const parts = value ? value.toUpperCase().split(' R ') : ['', ''];
    const phone = formatSuperPhone(parts[0]);
    const ext = parts.length > 1 ? parts[1] : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const newPhone = formatSuperPhone(e.target.value);
        onChange(ext ? `${newPhone} R ${ext}` : newPhone);
    };

    const handleExtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const newExt = e.target.value.replace(/\D/g, '').slice(0, 5);
        onChange(newExt ? `${phone} R ${newExt}` : phone);
    };

    const showExt = isEditingExt || ext.length > 0;
    const isPhoneValid = phone.replace(/\D/g, '').length >= 10;

    return (
        <div className="flex items-center gap-2 w-full relative">
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                className={`${className} flex-1 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed`}
                value={phone}
                onChange={handleChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={disabled}
                readOnly={disabled}
            />
            {showExt ? (
                <div className="w-20 shrink-0 relative">
                    <span className="text-[10px] font-bold text-slate-500 absolute -top-[22px] left-1 uppercase tracking-wider">Ramal</span>
                    <input
                        type="text"
                        autoFocus={isEditingExt && !ext}
                        placeholder="Ex: 404"
                        className={`${className} w-full text-center px-1 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed`}
                        value={ext}
                        onChange={handleExtChange}
                        onBlur={() => {
                            if (!ext) setIsEditingExt(false);
                        }}
                        disabled={disabled}
                        readOnly={disabled}
                    />
                </div>
            ) : (
                isPhoneValid && !focused && !disabled && (
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setIsEditingExt(true); }}
                        className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded transition-all shrink-0 animate-in fade-in"
                    >
                        + Ramal
                    </button>
                )
            )}
        </div>
    );
};

export const InsurerSettings: React.FC = () => {
    const { profile } = useAuth();
    const [insurers, setInsurers] = useState<HealthInsurer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search criteria states
    const [searchName, setSearchName] = useState('');
    const [searchCnpj, setSearchCnpj] = useState('');
    const [searchAns, setSearchAns] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // View States
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [formMode, setFormMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
    const [insurerToDelete, setInsurerToDelete] = useState<HealthInsurer | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form states
    const [saving, setSaving] = useState(false);
    const [currentInsurer, setCurrentInsurer] = useState<Partial<HealthInsurer> | null>(null);
    const [contacts, setContacts] = useState<HealthInsurerContact[]>([]);
    const [deletedContactIds, setDeletedContactIds] = useState<string[]>([]);

    useEffect(() => {
        setLoading(false);
    }, [profile]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setError(null);
        const nameQuery = searchName.trim();
        const cnpjQuery = searchCnpj.trim();
        const ansQuery = searchAns.trim();

        // Validation: at least one field must be filled
        if (!nameQuery && !cnpjQuery && !ansQuery) {
            setError('Preencha pelo menos um campo para buscar.');
            return;
        }

        // Only enforce 4-char limit if ONLY name is provided
        if (nameQuery && nameQuery.length < 4 && !cnpjQuery && !ansQuery) {
            setError('Para buscar apenas por nome, digite pelo menos 4 caracteres.');
            return;
        }

        try {
            setLoading(true);
            setHasSearched(true);

            let query = supabase
                .from('health_insurers')
                .select('*, insurer_contacts:health_insurer_contacts(*)');

            // Apply clinic filter if available (recommended for RLS)
            if (profile?.clinic_id) {
                query = query.eq('clinic_id', profile.clinic_id);
            }

            if (nameQuery) {
                query = query.or(`name.ilike.%${nameQuery}%,legal_name.ilike.%${nameQuery}%`);
            }
            if (cnpjQuery) query = query.ilike('cnpj', `%${cnpjQuery}%`);
            if (ansQuery) query = query.ilike('ans_code', `%${ansQuery}%`);

            const { data, error: err } = await query.order('name');
            if (err) throw err;
            setInsurers(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentInsurer || !profile?.clinic_id || formMode === 'view') return;

        try {
            setSaving(true);
            const payload: any = { ...currentInsurer, clinic_id: profile.clinic_id };
            delete payload.insurer_contacts;

            let finalId = currentInsurer.id;

            if (finalId) {
                const { error: updateErr } = await supabase.from('health_insurers').update(payload).eq('id', finalId);
                if (updateErr) throw updateErr;
            } else {
                const { data: insertedData, error: insertErr } = await supabase.from('health_insurers').insert([payload]).select('id').single();
                if (insertErr) throw insertErr;
                finalId = insertedData.id;
            }

            if (deletedContactIds.length > 0) {
                await supabase.from('health_insurer_contacts').delete().in('id', deletedContactIds);
            }

            if (contacts.length > 0) {
                const contactsPayload = contacts.map(c => {
                    const mapped: any = {
                        clinic_id: profile.clinic_id,
                        insurer_id: finalId,
                        name: c.name,
                        role: c.role || null,
                        phone: c.phone || null,
                        email: c.email || null,
                        notes: c.notes || null,
                    };
                    if (c.id && !c.id.startsWith('temp-')) mapped.id = c.id;
                    return mapped;
                });

                const { error: contactsErr } = await supabase.from('health_insurer_contacts').upsert(contactsPayload);
                if (contactsErr) throw contactsErr;
            }

            setFormMode('list');
            setCurrentInsurer(null);
            setContacts([]);
            setDeletedContactIds([]);

            await handleSearch();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!insurerToDelete) return;
        try {
            setDeleting(true);
            const { error: delErr } = await supabase.from('health_insurers').delete().eq('id', insurerToDelete.id);
            if (delErr) throw delErr;

            await handleSearch();
            setInsurerToDelete(null);

            if (formMode !== 'list' && currentInsurer?.id === insurerToDelete.id) {
                setFormMode('list');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const openCreateForm = () => {
        setCurrentInsurer({ status: 'ativo' });
        setContacts([]);
        setDeletedContactIds([]);
        setFormMode('create');
    };

    const openEditForm = (insurer: HealthInsurer) => {
        setCurrentInsurer(insurer);
        setContacts(insurer.insurer_contacts || []);
        setDeletedContactIds([]);
        setFormMode('edit');
    };

    const viewDetails = (insurer: HealthInsurer) => {
        setCurrentInsurer(insurer);
        setContacts(insurer.insurer_contacts || []);
        setDeletedContactIds([]);
        setFormMode('view');
    };

    const addContact = () => setContacts([...contacts, { id: `temp-${Date.now()}`, name: '', role: '', phone: '', email: '', notes: '', clinic_id: profile?.clinic_id!, insurer_id: currentInsurer?.id || '', created_at: new Date().toISOString() }]);
    const removeContact = (index: number) => {
        const c = contacts[index];
        if (c.id && !c.id.startsWith('temp-')) setDeletedContactIds([...deletedContactIds, c.id]);
        setContacts(contacts.filter((_, i) => i !== index));
    };
    const updateContact = (index: number, field: keyof HealthInsurerContact, value: string) => {
        const newContacts = [...contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setContacts(newContacts);
    };

    const filteredInsurers = insurers;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <p className="text-slate-500">Carregando operadoras de saúde...</p>
            </div>
        );
    }

    const isReadOnly = formMode === 'view';

    if (formMode !== 'list') {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between p-6 pb-0">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary-500" />
                        {formMode === 'create' ? 'Nova Operadora' : formMode === 'view' ? 'Detalhes da Operadora' : 'Editar Operadora'}
                    </h3>
                    <button
                        type="button"
                        onClick={() => { setFormMode('list'); setCurrentInsurer(null); }}
                        className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 pt-0">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1 lg:col-span-2">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Nome Comercial *</label>
                                <input
                                    type="text" required
                                    placeholder="Ex: Unimed"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    value={currentInsurer?.name || ''}
                                    onChange={e => setCurrentInsurer({ ...currentInsurer, name: e.target.value })}
                                    disabled={isReadOnly}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Registro ANS</label>
                                <input
                                    type="text"
                                    placeholder="00000-0"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    value={currentInsurer?.ans_code || ''}
                                    onChange={e => setCurrentInsurer({ ...currentInsurer, ans_code: e.target.value })}
                                    disabled={isReadOnly}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1 lg:col-span-2">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Razão Social</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    value={currentInsurer?.legal_name || ''}
                                    onChange={e => setCurrentInsurer({ ...currentInsurer, legal_name: e.target.value })}
                                    disabled={isReadOnly}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">CNPJ</label>
                                <input
                                    type="text"
                                    placeholder="00.000.000/0000-00"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    value={currentInsurer?.cnpj || ''}
                                    onChange={e => setCurrentInsurer({ ...currentInsurer, cnpj: formatCNPJ(e.target.value) })}
                                    disabled={isReadOnly}
                                    readOnly={isReadOnly}
                                />
                            </div>

                            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">CEP</label>
                                    <input
                                        type="text"
                                        placeholder="00000-000"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-75"
                                        value={currentInsurer?.zip_code || ''}
                                        onChange={e => setCurrentInsurer({ ...currentInsurer, zip_code: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Logradouro</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-75"
                                        value={currentInsurer?.street || ''}
                                        onChange={e => setCurrentInsurer({ ...currentInsurer, street: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Número</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-75"
                                        value={currentInsurer?.number || ''}
                                        onChange={e => setCurrentInsurer({ ...currentInsurer, number: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Cidade</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-75"
                                        value={currentInsurer?.city || ''}
                                        onChange={e => setCurrentInsurer({ ...currentInsurer, city: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">UF</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-75"
                                        value={currentInsurer?.state || ''}
                                        onChange={e => setCurrentInsurer({ ...currentInsurer, state: e.target.value.toUpperCase() })}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO DE CONTATOS POR SETOR */}
                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary-500" />
                                    Lista de Contatos por Setor
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">Contatos estratégicos da operadora (Comercial, Faturamento, etc.)</p>
                            </div>
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    onClick={addContact}
                                    className="bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" /> Adicionar Contato
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {contacts.map((contact, index) => (
                                <div key={index} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg relative shadow-sm group">
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={() => removeContact(index)}
                                            className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                            title="Remover"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pr-6">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">Setor/Cargo *</label>
                                            <input
                                                type="text" required placeholder="Ex: Comercial"
                                                className="w-full px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-75"
                                                value={contact.role || ''}
                                                onChange={e => updateContact(index, 'role', e.target.value)}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div className="space-y-1 lg:col-span-2">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">Nome do Contato *</label>
                                            <input
                                                type="text" required placeholder="Ex: Roberto Oliveira"
                                                className="w-full px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-75"
                                                value={contact.name}
                                                onChange={e => updateContact(index, 'name', e.target.value)}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">Telefone / Ramal</label>
                                            <PhoneWithRamalInput
                                                placeholder="(11) 3222-2222"
                                                className="px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                value={contact.phone || ''}
                                                onChange={(v: string) => !isReadOnly && updateContact(index, 'phone', v)}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div className="space-y-1 lg:col-span-2">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">E-mail</label>
                                            <input
                                                type="email"
                                                className="w-full px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                value={contact.email || ''}
                                                onChange={e => updateContact(index, 'email', e.target.value)}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div className="space-y-1 lg:col-span-2">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">Observações</label>
                                            <input
                                                type="text" placeholder="Ex: Horário comercial"
                                                className="w-full px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-75"
                                                value={contact.notes || ''}
                                                onChange={e => updateContact(index, 'notes', e.target.value)}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {contacts.length === 0 && (
                                <div className="text-center py-6 text-sm text-slate-500 bg-white/50 rounded-lg border border-dashed border-slate-300">
                                    Nenhum contato cadastrado.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => { setFormMode('list'); setCurrentInsurer(null); }}
                            className="px-5 py-2.5 rounded-lg font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            {isReadOnly ? 'Voltar' : 'Cancelar'}
                        </button>
                        {!isReadOnly && (
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white shadow-md shadow-primary-600/20 px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Salvar Operadora
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setFormMode('edit')}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md shadow-primary-600/20"
                        >
                            <Pencil className="w-4 h-4" /> Editar
                        </button>
                    </div>
                </form>

                {insurerToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Excluir Operadora</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Tem certeza que deseja excluir <strong>{insurerToDelete.name}</strong>? Esta ação é irreversível.
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3 rounded-b-2xl">
                                <button onClick={() => setInsurerToDelete(null)} className="px-5 py-2 font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg">Cancelar</button>
                                <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold">{deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir Definitivamente'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {error && (
                <div className="mx-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            )}

            <div className="p-6 pb-2">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Shield className="w-6 h-6 text-primary-500" />
                            Operadoras de Saúde (Convênios)
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Cadastre e gerencie as operadoras, registros ANS e contatos diretos por setor.
                        </p>
                    </div>
                    <button
                        onClick={openCreateForm}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Cadastrar Operadora
                    </button>
                </div>

                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mt-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="md:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Nome da Operadora (Mín 4 chars)</label>
                        <div className="relative">
                            <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Ex: Unimed"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-sm"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">CNPJ</label>
                        <input
                            type="text"
                            placeholder="00.000.000/0000-00"
                            value={searchCnpj}
                            onChange={(e) => setSearchCnpj(formatCNPJ(e.target.value))}
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-sm"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Registro ANS</label>
                        <input
                            type="text"
                            placeholder="00000-0"
                            value={searchAns}
                            onChange={(e) => setSearchAns(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-sm"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white h-[38px] rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-600/20 disabled:bg-primary-400"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Buscar
                        </button>
                    </div>
                </form>

                <div className="flex items-center justify-between mt-6 px-1">
                    <p className="text-xs text-slate-500">
                        {hasSearched ? `${insurers.length} resultado(s) encontrado(s)` : 'Utilize os filtros acima para pesquisar operadoras.'}
                    </p>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'}`} title="Grade"><LayoutGrid className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'}`} title="Lista"><List className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6">
                {insurers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm text-center px-6">
                        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-primary-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                            {!hasSearched ? 'Inicie sua Pesquisa' : 'Nenhuma Operadora Localizada'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
                            {!hasSearched
                                ? 'Para gerenciar convênios, pesquise por nome, CNPJ ou Registro ANS utilizando os campos acima.'
                                : 'Não encontramos nenhuma operadora com os critérios informados. Verifique se os dados estão corretos ou tente uma busca mais abrangente.'}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50 max-w-sm w-full">
                            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 text-left">Dicas de Busca:</h4>
                            <ul className="text-left space-y-2">
                                <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 shrink-0" />
                                    <span>Ao buscar por <strong>Nome</strong>, digite pelo menos 4 caracteres.</span>
                                </li>
                                <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 shrink-0" />
                                    <span>Busque pelo <strong>CNPJ</strong> completo para resultados exatos.</span>
                                </li>
                                <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 shrink-0" />
                                    <span>O <strong>Registro ANS</strong> é uma excelente forma de localizar operadoras específicas.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredInsurers.map(inst => (
                                <div
                                    key={inst.id}
                                    onClick={() => viewDetails(inst)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between hover:border-primary-200"
                                >
                                    <div>
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 dark:text-white leading-tight truncate">{inst.name}</h3>
                                                {inst.ans_code && <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">ANS: {inst.ans_code}</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-2.5 text-sm text-slate-600 mt-4 border-t border-slate-100 pt-3">
                                            {inst.cnpj && <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /> <span className="font-mono text-xs">{inst.cnpj}</span></div>}
                                            {inst.city && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{inst.city}{inst.state ? ` - ${inst.state}` : ''}</span></div>}
                                            <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" /> <span>{inst.insurer_contacts?.length || 0} contatos setorizados</span></div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                        <button onClick={(e) => { e.stopPropagation(); setInsurerToDelete(inst); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 whitespace-nowrap">Operadora / ANS</th>
                                        <th className="px-5 py-3 whitespace-nowrap">Razão Social / CNPJ</th>
                                        <th className="px-5 py-3 whitespace-nowrap">Localização</th>
                                        <th className="px-5 py-3 text-right whitespace-nowrap">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredInsurers.map(inst => (
                                        <tr key={inst.id} onClick={() => viewDetails(inst)} className="hover:bg-slate-50 group transition-colors cursor-pointer">
                                            <td className="px-5 py-3">
                                                <div className="font-semibold text-slate-800 dark:text-white">{inst.name}</div>
                                                <div className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-wider font-semibold">{inst.ans_code || 'Sem registro ANS'}</div>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-600">
                                                <div className="truncate max-w-[200px]">{inst.legal_name || inst.name}</div>
                                                <div className="text-xs font-mono text-slate-400 mt-0.5">{inst.cnpj || '-'}</div>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-600">
                                                {inst.city ? `${inst.city} - ${inst.state}` : '-'}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); setInsurerToDelete(inst); }} className="p-1.5 text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    <button className="text-sm font-semibold text-primary-600 px-2 transition-colors">Visualizar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
