import React, { useState, useEffect, useRef } from 'react';
import {
    Building, Plus, Pencil, Trash2, Loader2, Save, X, Stethoscope, AlertCircle, Users,
    Search, LayoutGrid, List, MapPin, Phone, Mail
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface HospitalContact {
    id?: string;
    hospital_id?: string;
    name: string;
    role: string;
    phone: string;
    whatsapp?: string;
    email: string;
    notes: string;
}

interface Hospital {
    id: string;
    clinic_id: string;
    name: string;
    legal_name: string;
    cnpj: string;
    cnes: string;
    type: string;
    status: string;
    notes: string;
    zip_code: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    phone: string;
    email: string;
    website: string;
    hospital_contacts?: HospitalContact[];
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

export const HospitalSettings: React.FC = () => {
    const { profile } = useAuth();
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // View States
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [formMode, setFormMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
    const [hospitalToDelete, setHospitalToDelete] = useState<Hospital | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form states
    const [saving, setSaving] = useState(false);
    const [currentHospital, setCurrentHospital] = useState<Partial<Hospital> | null>(null);
    const [contacts, setContacts] = useState<HospitalContact[]>([]);
    const [deletedContactIds, setDeletedContactIds] = useState<string[]>([]);

    useEffect(() => {
        fetchHospitals();
    }, [profile?.clinic_id]);

    const fetchHospitals = async () => {
        if (!profile?.clinic_id) return;
        try {
            setLoading(true);

            const { data: hospData, error: hospErr } = await supabase
                .from('hospitals')
                .select('*, hospital_contacts(*)')
                .eq('clinic_id', profile.clinic_id)
                .order('name');

            if (hospErr) throw hospErr;
            setHospitals(hospData || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentHospital || !profile?.clinic_id || formMode === 'view') return;

        try {
            setSaving(true);
            const payload = { ...currentHospital, clinic_id: profile.clinic_id };
            delete payload.hospital_contacts;

            let finalHospitalId = currentHospital.id;

            if (finalHospitalId) {
                const { error: updateErr } = await supabase.from('hospitals').update(payload).eq('id', finalHospitalId);
                if (updateErr) throw updateErr;
            } else {
                const { data: insertedData, error: insertErr } = await supabase.from('hospitals').insert([payload]).select('id').single();
                if (insertErr) throw insertErr;
                finalHospitalId = insertedData.id;
            }

            if (deletedContactIds.length > 0) {
                await supabase.from('hospital_contacts').delete().in('id', deletedContactIds);
            }

            if (contacts.length > 0) {
                const contactsPayload = contacts.map(c => {
                    const mapped: any = {
                        hospital_id: finalHospitalId,
                        name: c.name,
                        role: c.role,
                        phone: c.phone || null,
                        email: c.email || null,
                        notes: c.notes || null,
                    };
                    if (c.id && !c.id.startsWith('temp-')) mapped.id = c.id;
                    return mapped;
                });

                const { error: contactsErr } = await supabase.from('hospital_contacts').upsert(contactsPayload);
                if (contactsErr) throw contactsErr;
            }

            setFormMode('list');
            setCurrentHospital(null);
            setContacts([]);
            setDeletedContactIds([]);

            await fetchHospitals();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!hospitalToDelete) return;
        try {
            setDeleting(true);
            const { error: delErr } = await supabase.from('hospitals').delete().eq('id', hospitalToDelete.id);
            if (delErr) throw delErr;

            await fetchHospitals();
            setHospitalToDelete(null);

            // If we deleted from inside the View mode, go back to list
            if (formMode !== 'list' && currentHospital?.id === hospitalToDelete.id) {
                setFormMode('list');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const openCreateForm = () => {
        setCurrentHospital({ status: 'ativo', type: 'hospital' });
        setContacts([]);
        setDeletedContactIds([]);
        setFormMode('create');
    };

    const openEditForm = (hospital: Hospital) => {
        setCurrentHospital(hospital);
        setContacts(hospital.hospital_contacts || []);
        setDeletedContactIds([]);
        setFormMode('edit');
    };

    const viewHospitalDetails = (hospital: Hospital) => {
        setCurrentHospital(hospital);
        setContacts(hospital.hospital_contacts || []);
        setDeletedContactIds([]);
        setFormMode('view');
    };

    const addContact = () => setContacts([...contacts, { id: `temp-${Date.now()}`, name: '', role: '', phone: '', email: '', notes: '' }]);
    const removeContact = (index: number) => {
        const c = contacts[index];
        if (c.id && !c.id.startsWith('temp-')) setDeletedContactIds([...deletedContactIds, c.id]);
        setContacts(contacts.filter((_, i) => i !== index));
    };
    const updateContact = (index: number, field: keyof HospitalContact, value: string) => {
        const newContacts = [...contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setContacts(newContacts);
    };

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.cnpj && h.cnpj.includes(searchTerm)) ||
        (h.legal_name && h.legal_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <p className="text-slate-500">Carregando hospitais parceiros...</p>
            </div>
        );
    }

    const isReadOnly = formMode === 'view';

    // ----------------------------------------------------
    // FORM RENDER
    // ----------------------------------------------------
    if (formMode !== 'list') {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between p-6 pb-0">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Building className="w-6 h-6 text-indigo-500" />
                        {formMode === 'create' ? 'Novo Parceiro' : formMode === 'view' ? 'Detalhes do Parceiro' : 'Editar Parceiro'}
                    </h3>
                    <button
                        type="button"
                        onClick={() => { setFormMode('list'); setCurrentHospital(null); }}
                        className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 pt-0">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1 lg:col-span-2">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Nome da Instituição *</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    value={currentHospital?.name || ''}
                                    onChange={e => setCurrentHospital({ ...currentHospital, name: e.target.value })}
                                    disabled={isReadOnly}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Tipo</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white capitalize disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    value={currentHospital?.type || 'hospital'}
                                    onChange={e => setCurrentHospital({ ...currentHospital, type: e.target.value })}
                                    disabled={isReadOnly}
                                >
                                    <option value="hospital">Hospital Geral</option>
                                    <option value="day_clinic">Day Clinic</option>
                                    <option value="ambulatorio">Ambulatório</option>
                                    <option value="pronto_socorro">Pronto Socorro</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">CNPJ</label>
                                <input
                                    type="text"
                                    placeholder="00.000.000/0000-00"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    value={currentHospital?.cnpj || ''}
                                    onChange={e => setCurrentHospital({ ...currentHospital, cnpj: formatCNPJ(e.target.value) })}
                                    disabled={isReadOnly}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Telefone Principal</label>
                                <PhoneWithRamalInput
                                    placeholder="(00) 0000-0000"
                                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                                    value={currentHospital?.phone || ''}
                                    onChange={(v: string) => !isReadOnly && setCurrentHospital({ ...currentHospital, phone: v })}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">E-mail Principal</label>
                                <input
                                    type="email"
                                    pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white invalid:border-red-500 invalid:text-red-500 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    value={currentHospital?.email || ''}
                                    onChange={e => setCurrentHospital({ ...currentHospital, email: e.target.value })}
                                    disabled={isReadOnly}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Observações/Termos</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[80px] disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    value={currentHospital?.notes || ''}
                                    onChange={e => setCurrentHospital({ ...currentHospital, notes: e.target.value })}
                                    disabled={isReadOnly}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO DE CONTATOS POR SETOR */}
                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    Lista de Contatos por Setor
                                </h4>
                            </div>
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    onClick={addContact}
                                    className="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" /> Adicionar Setor
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
                                                type="text" required placeholder="Ex: Financeiro"
                                                className="w-full px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                                value={contact.role}
                                                onChange={e => updateContact(index, 'role', e.target.value)}
                                                disabled={isReadOnly}
                                                readOnly={isReadOnly}
                                            />
                                        </div>
                                        <div className="space-y-1 lg:col-span-2">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">Nome do Contato *</label>
                                            <input
                                                type="text" required placeholder="Ex: Roberto"
                                                className="w-full px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                                value={contact.name}
                                                onChange={e => updateContact(index, 'name', e.target.value)}
                                                disabled={isReadOnly}
                                                readOnly={isReadOnly}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">Telefone / Ramal</label>
                                            <PhoneWithRamalInput
                                                placeholder="(11) 3222-2222"
                                                className="px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={contact.phone || ''}
                                                onChange={(v: string) => !isReadOnly && updateContact(index, 'phone', v)}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div className="space-y-1 lg:col-span-2">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">E-mail</label>
                                            <input
                                                type="email"
                                                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                                                className="w-full px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none invalid:border-red-500 invalid:text-red-500 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                                value={contact.email || ''}
                                                onChange={e => updateContact(index, 'email', e.target.value)}
                                                disabled={isReadOnly}
                                                readOnly={isReadOnly}
                                            />
                                        </div>
                                        <div className="space-y-1 lg:col-span-2">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">Observações</label>
                                            <input
                                                type="text" placeholder="Ex: Ligar das 10h as 12h"
                                                className="w-full px-3 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                                value={contact.notes || ''}
                                                onChange={e => updateContact(index, 'notes', e.target.value)}
                                                disabled={isReadOnly}
                                                readOnly={isReadOnly}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {contacts.length === 0 && (
                                <div className="text-center py-6 text-sm text-slate-500 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                    Nenhum contato cadastrado.
                                </div>
                            )}
                        </div>
                    </div>

                    {isReadOnly ? (
                        <div className="flex justify-between items-center w-full pt-4 border-t border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => { setFormMode('list'); setCurrentHospital(null); }}
                                className="px-5 py-2.5 rounded-lg font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                Voltar
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setHospitalToDelete(currentHospital as Hospital)}
                                    className="px-5 py-2.5 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Excluir Parceiro
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormMode('edit')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm"
                                >
                                    <Pencil className="w-4 h-4" /> Editar Parceiro
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    if (formMode === 'edit') setFormMode('view');
                                    else { setFormMode('list'); setCurrentHospital(null); }
                                }}
                                className="px-5 py-2.5 rounded-lg font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white shadow-md shadow-indigo-600/20 px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Salvar Alterações
                            </button>
                        </div>
                    )}
                </form>

                {/* MODAL DE EXCLUSÃO */}
                {hospitalToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Excluir Parceiro
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Tem certeza que deseja excluir o parceiro <strong>{hospitalToDelete.name}</strong>? Esta ação removerá também todos os contatos vinculados e não poderá ser desfeita.
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3 rounded-b-2xl">
                                <button
                                    onClick={() => setHospitalToDelete(null)}
                                    className="px-5 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                                    disabled={deleting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
                                >
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir Definitivamente'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ----------------------------------------------------
    // LIST/GRID MAIN RENDER
    // ----------------------------------------------------
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
                            <Building className="w-6 h-6 text-indigo-500" />
                            Hospitais Parceiros
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Gerencie clínicas, hospitais e setores com os quais seu corpo clínico atua.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openCreateForm}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Cadastrar
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, razão social ou CNPJ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                        />
                    </div>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Visualização em Bloco"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Visualização em Lista"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6">
                {filteredHospitals.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-600 font-medium dark:text-slate-300">{hospitals.length === 0 ? 'Nenhum hospital cadastrado' : 'Nenhum resultado encontrado'}</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-4">
                            {hospitals.length === 0 ? 'Cadastre hospitais para expandir sua rede de parceiros.' : 'Tente buscar por outro termo ou limpe o filtro.'}
                        </p>
                        {hospitals.length > 0 && searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-indigo-600 font-medium text-sm hover:underline">
                                Limpar Busca
                            </button>
                        )}
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredHospitals.map(hosp => (
                                <div
                                    key={hosp.id}
                                    onClick={() => viewHospitalDetails(hosp)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between hover:border-indigo-200 dark:hover:border-indigo-800/50"
                                >
                                    <div>
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                                <Stethoscope className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 dark:text-white leading-tight truncate">{hosp.name}</h3>
                                                <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">
                                                    {hosp.type?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                                            {hosp.cnpj && <div className="flex items-center gap-2"><Building className="w-3.5 h-3.5 text-slate-400" /> <span className="font-mono text-xs pt-0.5">{hosp.cnpj}</span></div>}
                                            {hosp.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> <span>{hosp.phone}</span></div>}
                                            {hosp.city && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{hosp.city}{hosp.state ? ` - ${hosp.state}` : ''}</span></div>}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setHospitalToDelete(hosp); }}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 whitespace-nowrap">Instituição / Tipo</th>
                                        <th className="px-5 py-3 whitespace-nowrap">CNPJ</th>
                                        <th className="px-5 py-3 whitespace-nowrap">Contato Principal</th>
                                        <th className="px-5 py-3 text-right whitespace-nowrap">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {filteredHospitals.map(hosp => (
                                        <tr
                                            key={hosp.id}
                                            onClick={() => viewHospitalDetails(hosp)}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors cursor-pointer"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <Stethoscope className="w-3.5 h-3.5 text-indigo-400" /> {hosp.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-wider font-semibold">{hosp.type?.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">{hosp.cnpj || '-'}</td>
                                            <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {hosp.phone ? <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{hosp.phone}</span> : '-'}
                                                {hosp.email && <span className="flex items-center gap-1.5 mt-0.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{hosp.email}</span>}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setHospitalToDelete(hosp); }}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); viewHospitalDetails(hosp); }} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-2">
                                                        Visualizar
                                                    </button>
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

            {/* MODAL DE EXCLUSÃO (DA LISTA) */}
            {hospitalToDelete && formMode === 'list' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                Excluir Parceiro
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Tem certeza que deseja excluir o parceiro <strong>{hospitalToDelete.name}</strong>? Esta ação removerá também todos os contatos vinculados e não poderá ser desfeita.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setHospitalToDelete(null)}
                                className="px-5 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir Definitivamente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
