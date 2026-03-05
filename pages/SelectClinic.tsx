import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, ArrowRight, UserCircle, LogOut, Clock, AlertTriangle, Search, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const SelectClinic: React.FC = () => {
    const { user, profile, userClinics, selectClinic, signOut } = useAuth();
    const navigate = useNavigate();

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [allClinics, setAllClinics] = useState<any[]>([]);
    const [loadingClinics, setLoadingClinics] = useState(false);
    const [selectedClinicId, setSelectedClinicId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        if (isRequestModalOpen) {
            fetchClinics();
        }
    }, [isRequestModalOpen]);

    const fetchClinics = async () => {
        setLoadingClinics(true);
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('id, name');
            if (error) throw error;
            setAllClinics(data || []);
        } catch (error: any) {
            toast.error('Erro ao carregar lista de clínicas.');
        } finally {
            setLoadingClinics(false);
        }
    };

    const handleRequestAccess = async () => {
        if (!selectedClinicId || !user) return;
        setRequesting(true);
        try {
            // Check if user already has a pending/active request for this clinic
            const existing = userClinics.find(uc => uc.clinic_id === selectedClinicId);
            if (existing) {
                toast.error(`Você já possui um vínculo (${existing.status}) com esta clínica.`);
                setRequesting(false);
                return;
            }

            const { error } = await supabase.from('user_clinics').insert({
                user_id: user.id,
                clinic_id: selectedClinicId,
                role: 'user', // Default role for new users
                status: 'pending'
            });

            if (error) throw error;

            toast.success('Solicitação enviada! Aguarde a aprovação do administrador.');
            setIsRequestModalOpen(false);
            // Optionally reload auth data here by forcing a refresh, or user can just see it when they reload
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao solicitar acesso.');
        } finally {
            setRequesting(false);
        }
    };

    const handleSelect = async (clinicId: string) => {
        try {
            await selectClinic(clinicId);
            navigate('/');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao selecionar clínica.');
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const activeClinics = userClinics.filter(c => c.status === 'active');
    const pendingClinics = userClinics.filter(c => c.status === 'pending');
    const inactiveClinics = userClinics.filter(c => c.status === 'inactive');
    const filteredClinics = allClinics.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#f6f6f8] flex flex-col justify-center items-center p-6">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center mb-6">
                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UserCircle className="w-8 h-8 text-primary-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        Olá, {profile?.full_name || user?.email}
                    </h2>

                    {activeClinics.length > 0 ? (
                        <p className="text-slate-500 mb-8">
                            Selecione a clínica que deseja acessar.
                        </p>
                    ) : pendingClinics.length > 0 ? (
                        <p className="text-slate-500 mb-8">
                            Seu acesso está aguardando aprovação do administrador.
                        </p>
                    ) : inactiveClinics.length > 0 ? (
                        <p className="text-red-500 mb-8 font-medium">
                            Sua conta foi inativada pelo administrador.
                        </p>
                    ) : (
                        <p className="text-slate-500 mb-8">
                            Você ainda não possui vínculo com nenhuma clínica. Solicite acesso ao administrador.
                        </p>
                    )}

                    <div className="space-y-3 relative text-left">
                        {activeClinics.map((uc) => (
                            <button
                                key={uc.id}
                                onClick={() => handleSelect(uc.clinic_id)}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                        <Building2 className="w-5 h-5 text-slate-600 group-hover:text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 group-hover:text-primary-700">
                                            {uc.clinics?.name || 'Clínica Desconhecida'}
                                        </p>
                                        <p className="text-xs text-slate-500 capitalize">{uc.role}</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-transform group-hover:translate-x-1" />
                            </button>
                        ))}

                        {activeClinics.length === 0 && pendingClinics.map((uc) => (
                            <div key={uc.id} className="flex flex-col items-center justify-center p-6 bg-amber-50 rounded-xl border border-amber-200 border-dashed text-center">
                                <Clock className="w-8 h-8 text-amber-500 mb-3" />
                                <p className="text-sm font-medium text-amber-800 mb-1">Acesso Pendente</p>
                                <p className="text-xs text-amber-600">
                                    Na clínica: {uc.clinics?.name || 'Desconhecida'}.
                                </p>
                            </div>
                        ))}

                        {activeClinics.length === 0 && inactiveClinics.map((uc) => (
                            <div key={uc.id} className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-xl border border-red-200 border-dashed text-center">
                                <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
                                <p className="text-sm font-medium text-red-800 mb-1">Acesso Bloqueado</p>
                                <p className="text-xs text-red-600">
                                    Na clínica: {uc.clinics?.name || 'Desconhecida'}.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center space-y-4">
                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="inline-flex w-full justify-center items-center gap-2 py-3 px-4 border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl font-bold transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Solicitar Acesso a Nova Clínica
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair com outra conta
                    </button>
                </div>
            </div>

            {/* Request Access Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 relative overflow-hidden">
                            <h2 className="text-xl font-bold text-slate-800 relative z-10">Solicitar Acesso</h2>
                            <button
                                onClick={() => setIsRequestModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors relative z-10"
                            >
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Busque o nome da clínica da qual deseja participar e envie uma solicitação. O administrador da clínica precisará aprovar seu acesso.
                            </p>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar clínica..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 rounded-lg p-2 bg-slate-50">
                                {loadingClinics ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                    </div>
                                ) : filteredClinics.length > 0 ? (
                                    filteredClinics.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedClinicId(c.id)}
                                            className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors ${selectedClinicId === c.id ? 'bg-primary-100 text-primary-800 border border-primary-300' : 'bg-white text-slate-700 border border-slate-200 hover:border-primary-300 hover:bg-primary-50'}`}
                                        >
                                            {c.name}
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-sm text-slate-500">
                                        Nenhuma clínica encontrada.
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsRequestModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRequestAccess}
                                disabled={!selectedClinicId || requesting}
                                className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 rounded-lg transition-colors"
                            >
                                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Enviar Solicitação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
