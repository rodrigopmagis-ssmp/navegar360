import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Mail, Clock, CheckCircle, AlertTriangle, Search, Plus, Loader2, X, Shield, Send, Copy, Check, Link2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserClinic } from '../../types';
import toast from 'react-hot-toast';

export const UsersSettings: React.FC = () => {
    const { user, profile, selectedClinic } = useAuth();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'inactive'>('active');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal Permissions
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [permissionsForm, setPermissionsForm] = useState<Record<string, boolean>>({});
    const [savingPermissions, setSavingPermissions] = useState(false);

    // Modal Invite
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'technician' | 'admin'>('technician');
    const [invitePermissions, setInvitePermissions] = useState({
        can_create_case: true,
        can_delete_schedule: false,
        can_access_reports: true,
        can_manage_users: false,
        can_view_financial: false,
    });
    const [inviting, setInviting] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        if (selectedClinic) {
            fetchMembers();
        }
    }, [selectedClinic]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            // Step 1: fetch user_clinics
            const { data: clinicData, error: clinicError } = await supabase
                .from('user_clinics')
                .select('*')
                .eq('clinic_id', selectedClinic?.clinic_id)
                .order('created_at', { ascending: false });

            if (clinicError) throw clinicError;
            if (!clinicData || clinicData.length === 0) {
                setMembers([]);
                return;
            }

            // Step 2: fetch profile names for those user_ids
            const userIds = clinicData.map((uc: any) => uc.user_id);
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);

            if (profileError) console.error('Could not load profiles:', profileError);

            // Step 3: merge
            const profileMap = Object.fromEntries((profileData || []).map((p: any) => [p.id, p]));
            const merged = clinicData.map((uc: any) => ({
                ...uc,
                profiles: profileMap[uc.user_id] || null,
            }));

            setMembers(merged);
        } catch (error: any) {
            console.error('Error fetching members:', error);
            toast.error('Erro ao carregar lista de usuários.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (memberId: string, action: 'approve' | 'inactivate' | 'reactivate') => {
        try {
            let updates: any = {};
            if (action === 'approve' || action === 'reactivate') {
                updates = {
                    status: 'active',
                    approved_by: user?.id,
                    approved_at: new Date().toISOString()
                };
            } else if (action === 'inactivate') {
                updates = {
                    status: 'inactive',
                    inactivated_by: user?.id,
                    inactivated_at: new Date().toISOString()
                };
            }

            const { error } = await supabase
                .from('user_clinics')
                .update(updates)
                .eq('id', memberId);

            if (error) throw error;
            toast.success(action === 'inactivate' ? 'Usuário inativado com sucesso.' : 'Usuário ativado com sucesso.');
            fetchMembers();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar ação.');
        }
    };

    const handleOpenPermissions = (member: any) => {
        setSelectedMember(member);
        setPermissionsForm(member.permissions || {
            can_view_financial: false,
            can_delete_schedule: false,
            can_manage_users: false,
            can_access_reports: false
        });
        setIsPermissionsModalOpen(true);
    };

    const handleSavePermissions = async () => {
        if (!selectedMember) return;
        setSavingPermissions(true);
        try {
            const { error } = await supabase
                .from('user_clinics')
                .update({ permissions: permissionsForm })
                .eq('id', selectedMember.id);

            if (error) throw error;
            toast.success('Permissões atualizadas com sucesso.');
            setIsPermissionsModalOpen(false);
            fetchMembers();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar permissões.');
        } finally {
            setSavingPermissions(false);
        }
    };

    const filteredMembers = members.filter(m => m.status === activeTab && (m.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.role?.toLowerCase().includes(searchQuery.toLowerCase())));

    const handleInvite = async () => {
        if (!inviteEmail.trim() || !selectedClinic) return;
        setInviting(true);
        setInviteLink(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({
                        email: inviteEmail.trim().toLowerCase(),
                        clinic_id: selectedClinic.clinic_id,
                        role: inviteRole,
                        permissions: invitePermissions,
                        invited_by: user?.id,
                    }),
                }
            );
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro ao gerar convite');
            setInviteLink(result.invite_link);
            toast.success('Convite gerado com sucesso!');
            fetchMembers();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao enviar convite.');
        } finally {
            setInviting(false);
        }
    };

    const handleCopyLink = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const resetInviteModal = () => {
        setInviteEmail('');
        setInviteRole('technician');
        setInvitePermissions({ can_create_case: true, can_delete_schedule: false, can_access_reports: true, can_manage_users: false, can_view_financial: false });
        setInviteLink(null);
        setIsInviteModalOpen(false);
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary-600" />
                        Gestão de Equipe
                    </h2>
                    <p className="text-sm text-slate-500">
                        Aprove acessos, defina papéis e ajuste permissões granulares dos membros desta clínica.
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm shadow-primary-600/20 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Convidar Usuário
                    </button>
                    <div className="relative flex-1 md:flex-none md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar usuário..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-primary-600 text-primary-700 bg-primary-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    <CheckCircle className="w-4 h-4" />
                    Ativos ({members.filter(m => m.status === 'active').length})
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-amber-500 text-amber-700 bg-amber-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    <Clock className="w-4 h-4" />
                    Aguardando Aprovação ({members.filter(m => m.status === 'pending').length})
                </button>
                <button
                    onClick={() => setActiveTab('inactive')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inactive' ? 'border-red-500 text-red-700 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    <AlertTriangle className="w-4 h-4" />
                    Inativos ({members.filter(m => m.status === 'inactive').length})
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-slate-100 border-dashed rounded-xl text-center">
                    <Users className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Nenhum Usuário Encontrado</h3>
                    <p className="text-slate-500 max-w-sm">
                        {searchQuery ? 'Tente buscar com outro termo.' : `Não existem usuários com o status "${activeTab}" no momento.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                                    ${activeTab === 'active' ? 'bg-primary-500' : activeTab === 'pending' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                                    {member.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{member.profiles?.full_name || 'Usuário Sem Nome'}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                                            {member.role || 'user'}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Registrado em {new Date(member.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                {activeTab === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(member.id, 'approve')}
                                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                        >
                                            Aprovar
                                        </button>
                                        <button
                                            onClick={() => handleAction(member.id, 'inactivate')}
                                            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            Rejeitar
                                        </button>
                                    </>
                                )}

                                {activeTab === 'active' && (
                                    <>
                                        <button
                                            onClick={() => handleOpenPermissions(member)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Editar Permissões"
                                        >
                                            <Shield className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(member.id, 'inactivate')}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Inativar Usuário"
                                        >
                                            <AlertTriangle className="w-5 h-5" />
                                        </button>
                                    </>
                                )}

                                {activeTab === 'inactive' && (
                                    <button
                                        onClick={() => handleAction(member.id, 'reactivate')}
                                        className="px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                                    >
                                        Reativar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Modal de Convite ─── */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Send className="w-5 h-5 text-primary-600" />
                                Convidar Usuário
                            </h2>
                            <button onClick={resetInviteModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors" title="Fechar">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* E-mail */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail do convidado</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="nome@exemplo.com"
                                        disabled={!!inviteLink}
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Papel */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Papel na clínica</label>
                                <select
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value as 'technician' | 'admin')}
                                    disabled={!!inviteLink}
                                    className="w-full py-2.5 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-50"
                                    title="Papel na clínica"
                                >
                                    <option value="technician">Técnico</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            {/* Permissões iniciais */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Permissões iniciais</label>
                                <div className="space-y-2">
                                    {[
                                        { key: 'can_create_case', label: 'Criar cirurgias' },
                                        { key: 'can_access_reports', label: 'Acessar relatórios' },
                                        { key: 'can_delete_schedule', label: 'Excluir agendamentos' },
                                        { key: 'can_view_financial', label: 'Ver financeiro' },
                                        { key: 'can_manage_users', label: 'Gerenciar usuários' },
                                    ].map(toggle => (
                                        <label key={toggle.key} className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition-colors ${!!inviteLink ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50'} border-slate-200`}>
                                            <input
                                                type="checkbox"
                                                checked={!!invitePermissions[toggle.key as keyof typeof invitePermissions]}
                                                onChange={e => setInvitePermissions(prev => ({ ...prev, [toggle.key]: e.target.checked }))}
                                                className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-slate-700">{toggle.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Link gerado */}
                            {inviteLink && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Link2 className="w-4 h-4 text-emerald-600" />
                                        <p className="text-sm font-bold text-emerald-800">Link de acesso gerado!</p>
                                    </div>
                                    <p className="text-xs text-emerald-700 mb-3">Copie e envie este link para o usuário. Ele expira em 24 horas.</p>
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-bold rounded-lg border transition-colors bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                    >
                                        {linkCopied ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar Link</>}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={resetInviteModal} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                                {inviteLink ? 'Fechar' : 'Cancelar'}
                            </button>
                            {!inviteLink && (
                                <button
                                    onClick={handleInvite}
                                    disabled={inviting || !inviteEmail.trim()}
                                    className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 rounded-lg transition-colors"
                                >
                                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Gerar Convite
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Permissões Específicas */}
            {isPermissionsModalOpen && selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary-600" />
                                Permissões
                            </h2>
                            <button
                                onClick={() => setIsPermissionsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                                title="Fechar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
                                    {selectedMember.profiles?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-primary-900 text-sm">{selectedMember.profiles?.full_name}</h3>
                                    <p className="text-xs text-primary-600 capitalize">{selectedMember.role}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { key: 'can_view_financial', label: 'Ver Painel Financeiro', desc: 'Permite acessar orçamentos e relatórios de faturamento.' },
                                    { key: 'can_delete_schedule', label: 'Excluir Agendamentos', desc: 'Permite apagar agendamentos da agenda.' },
                                    { key: 'can_manage_users', label: 'Gerenciar Usuários', desc: 'Acesso total a esta página de configurações.' },
                                    { key: 'can_access_reports', label: 'Acessar Relatórios', desc: 'Visualizar aba central de métricas.' }
                                ].map(toggle => (
                                    <label key={toggle.key} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center h-5">
                                            <input
                                                type="checkbox"
                                                checked={!!permissionsForm[toggle.key]}
                                                onChange={(e) => setPermissionsForm({ ...permissionsForm, [toggle.key]: e.target.checked })}
                                                className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800">{toggle.label}</span>
                                            <span className="text-xs text-slate-500 mt-0.5">{toggle.desc}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsPermissionsModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePermissions}
                                disabled={savingPermissions}
                                className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 rounded-lg transition-colors"
                            >
                                {savingPermissions ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Salvar Permissões
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
