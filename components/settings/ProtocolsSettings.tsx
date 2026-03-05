import React, { useState, useEffect } from 'react';
import { Package, Users, FileText, Plus, Clock, MessageSquare, ListTodo, Settings as SettingsIcon, ChevronRight, X, Calendar, Video, Check, Edit2, Trash2, AlertCircle, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

type TabType = 'equipment' | 'team' | 'document' | 'beneficiary';

export const ProtocolsSettings: React.FC = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('equipment');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [itemsList, setItemsList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [protocolStages, setProtocolStages] = useState<any[]>([]);
    const [isStagesLoading, setIsStagesLoading] = useState(false);

    // Configurações do Modal de Estágio (Protocolo)
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'basic' | 'message' | 'actions' | 'config'>('basic');
    const [newStage, setNewStage] = useState<any>({
        title: '',
        trigger_type: 'interval',
        trigger_days: 2,
        trigger_unit: 'dias',
        trigger_relation: 'after',
        message_template: '',
        is_auto_send: false,
        attach_pdf: false,
        actions: []
    });
    const [newActionText, setNewActionText] = useState('');

    // Configurações do Modal de Edição de Catálogo (CRUD)
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [catalogItemForm, setCatalogItemForm] = useState<any>({});

    // Modal de Confirmação (Substituindo window.confirm)
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

    // Carregar Dados do Catálogo
    const fetchCatalogItems = async () => {
        if (!profile?.clinic_id) return;
        setIsLoading(true);
        try {
            const clinic_id = profile.clinic_id;

            if (activeTab === 'equipment') {
                const { data, error } = await supabase.from('protocols').select('*').eq('type', 'equipment').eq('clinic_id', clinic_id).order('name');
                if (error) throw error;
                setItemsList(data || []);
            } else if (activeTab === 'team') {
                const { data, error } = await supabase.from('protocols').select('*').eq('type', 'team').eq('clinic_id', clinic_id).order('name');
                if (error) throw error;
                setItemsList(data || []);
            } else if (activeTab === 'document') {
                const { data, error } = await supabase.from('protocols').select('*').eq('type', 'document').eq('clinic_id', clinic_id).order('name');
                if (error) throw error;
                setItemsList(data || []);
            } else if (activeTab === 'beneficiary') {
                const { data, error } = await supabase.from('protocols').select('*').eq('type', 'beneficiary').eq('clinic_id', clinic_id).order('name');
                if (error) throw error;
                setItemsList(data || []);
            }
            setSelectedItem(null);
        } catch (error: any) {
            toast.error(`Erro ao carregar lista: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogItems();
    }, [activeTab, profile?.clinic_id]);

    const fetchProtocolStages = async () => {
        if (!selectedItem) {
            setProtocolStages([]);
            return;
        }
        setIsStagesLoading(true);
        try {
            const { data: stagesData, error: stagesError } = await supabase
                .from('protocol_stages')
                .select('*')
                .eq('protocol_id', selectedItem.id)
                .order('order_index');

            if (stagesError) throw stagesError;

            if (stagesData && stagesData.length > 0) {
                const stageIds = stagesData.map(s => s.id);
                const { data: actionsData, error: actionsError } = await supabase
                    .from('protocol_actions')
                    .select('*')
                    .in('stage_id', stageIds);
                if (actionsError) throw actionsError;

                const combined = stagesData.map(stage => ({
                    ...stage,
                    actions: actionsData?.filter(a => a.stage_id === stage.id).map(a => a.description) || []
                }));
                setProtocolStages(combined);
            } else {
                setProtocolStages([]);
            }
        } catch (e: any) {
            toast.error('Erro ao carregar estágios');
        } finally {
            setIsStagesLoading(false);
        }
    };

    useEffect(() => {
        fetchProtocolStages();
    }, [selectedItem]);

    // Tratar Adição Rápida de Ações
    const addQuickAction = (text: string) => {
        setNewStage({ ...newStage, actions: [...newStage.actions, text] });
        toast.success('Ação adicionada ao estágio!');
    };

    const addCustomAction = () => {
        if (!newActionText.trim()) return;
        setNewStage({ ...newStage, actions: [...newStage.actions, newActionText] });
        setNewActionText('');
    };

    const removeAction = (index: number) => {
        const updated = [...newStage.actions];
        updated.splice(index, 1);
        setNewStage({ ...newStage, actions: updated });
    };

    // Ações de CRUD do Catálogo
    const handleSaveCatalogItem = async () => {
        if (!catalogItemForm.name || !catalogItemForm.name.trim()) {
            toast.error('O nome do campo é obrigatório.');
            return;
        }

        const itemName = catalogItemForm.name.trim();

        try {
            const clinic_id = profile?.clinic_id;
            if (!clinic_id) throw new Error('Não foi possível identificar a clínica do usuário.');

            // Checagem de duplicação
            const { data: existingRecords } = await supabase
                .from('protocols')
                .select('id, name')
                .eq('clinic_id', clinic_id)
                .eq('type', activeTab)
                .ilike('name', itemName);

            const isDuplicate = existingRecords && existingRecords.some(r => r.id !== catalogItemForm.id && r.name.toLowerCase() === itemName.toLowerCase());
            if (isDuplicate) {
                toast.error(`Já existe um ${activeTab === 'equipment' ? 'equipamento' : activeTab === 'team' ? 'papel de equipe' : activeTab === 'document' ? 'documento' : 'beneficiário'} cadastrado com esse nome.`);
                return;
            }

            const payload = {
                name: itemName,
                type: activeTab,
                active: catalogItemForm.active !== false
            };

            if (catalogItemForm.id) {
                const { error } = await supabase.from('protocols').update(payload).eq('id', catalogItemForm.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('protocols').insert([{ ...payload, clinic_id }]);
                if (error) throw error;
            }

            toast.success('Item salvo com sucesso!');
            setIsCatalogModalOpen(false);
            fetchCatalogItems();
        } catch (error: any) {
            toast.error(`Erro ao salvar: ${error.message}`);
        }
    };

    const handleSaveStage = async () => {
        if (!newStage.title || !newStage.title.trim()) {
            toast.error('O título do estágio é obrigatório');
            return;
        }
        try {
            const payload = {
                protocol_id: selectedItem.id,
                title: newStage.title,
                trigger_type: newStage.trigger_type,
                trigger_days: newStage.trigger_days,
                trigger_unit: newStage.trigger_unit,
                trigger_relation: newStage.trigger_relation,
                message_template: newStage.message_template,
                is_auto_send: newStage.is_auto_send,
                attach_pdf: newStage.attach_pdf,
                order_index: newStage.id ? newStage.order_index : protocolStages.length
            };

            let stageId = newStage.id;
            if (stageId) {
                const { error } = await supabase.from('protocol_stages').update(payload).eq('id', stageId);
                if (error) throw error;
                // delete old actions
                await supabase.from('protocol_actions').delete().eq('stage_id', stageId);
            } else {
                const { data, error } = await supabase.from('protocol_stages').insert([payload]).select().single();
                if (error) throw error;
                stageId = data.id;
            }

            if (newStage.actions && newStage.actions.length > 0) {
                const actionsPayload = newStage.actions.map((desc: string) => ({
                    stage_id: stageId,
                    type: 'custom',
                    description: desc
                }));
                const { error: actError } = await supabase.from('protocol_actions').insert(actionsPayload);
                if (actError) throw actError;
            }

            toast.success('Estágio salvo com sucesso!');
            setIsStageModalOpen(false);
            fetchProtocolStages();
        } catch (e: any) {
            toast.error(`Erro ao salvar estágio: ${e.message}`);
        }
    };

    const handleDeleteStage = async (stage: any) => {
        setConfirmModal({
            isOpen: true,
            title: 'Excluir Estágio',
            message: `Tem certeza que deseja excluir o estágio "${stage.title}"?`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    const { error } = await supabase.from('protocol_stages').delete().eq('id', stage.id);
                    if (error) throw error;
                    toast.success('Estágio excluído com sucesso');
                    fetchProtocolStages();
                } catch (e: any) {
                    toast.error(`Erro ao excluir estágio: ${e.message}`);
                }
            }
        });
    };

    const handleDeleteCatalogItem = async (item: any) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir "${item.name}"? O sistema verificará se o item já foi utilizado em alguma cirurgia.`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    if (activeTab === 'equipment') {
                        // Equipamentos salvos em Protocols também só inativam
                        await supabase.from('protocols').update({ active: false }).eq('id', item.id);
                        toast.success('Equipamento inativado com sucesso.');
                    } else if (activeTab === 'team') {
                        await supabase.from('protocols').update({ active: false }).eq('id', item.id);
                        toast.success('Papel de equipe inativado com sucesso.');
                    } else if (activeTab === 'document') {
                        // Protocolos de documento
                        await supabase.from('protocols').update({ active: false }).eq('id', item.id);
                        toast.success('Tipo de documento inativado com sucesso.');
                    } else if (activeTab === 'beneficiary') {
                        // Protocolos de beneficiário
                        await supabase.from('protocols').update({ active: false }).eq('id', item.id);
                        toast.success('Protocolo de beneficiário inativado com sucesso.');
                    }
                    fetchCatalogItems();
                } catch (error: any) {
                    toast.error(`Falha ao excluir/inativar: ${error.message}`);
                }
            }
        });
    };

    const renderList = () => {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">Catálogo</h3>
                    <button
                        onClick={() => {
                            setCatalogItemForm({});
                            setIsCatalogModalOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Cadastrar
                    </button>
                </div>

                <div className="p-3 space-y-2 overflow-y-auto max-h-[600px]">
                    {isLoading ? (
                        <div className="text-center p-4 text-slate-400 text-sm animate-pulse">Carregando itens...</div>
                    ) : itemsList.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 text-sm border border-dashed rounded-xl border-slate-200">
                            Nenhum item cadastrado. <br /> Clique em Cadastrar para iniciar.
                        </div>
                    ) : (
                        itemsList.map(item => (
                            <div
                                key={item.id}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${selectedItem?.id === item.id
                                    ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800'
                                    : 'bg-white border-slate-200 hover:border-primary-300 dark:bg-slate-900 dark:border-slate-800'
                                    } ${(item.status === 'inativo' || item.status === 'Inactive' || item.active === false) ? 'opacity-50' : ''}`}
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="flex flex-col">
                                    <span className={`font-medium ${selectedItem?.id === item.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {item.name}
                                    </span>
                                    {((item.status === 'inativo') || (item.status === 'Inactive') || item.active === false) && (
                                        <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">(Inativo)</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                                        onClick={(e) => { e.stopPropagation(); setCatalogItemForm(item); setIsCatalogModalOpen(true); }}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCatalogItem(item); }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    const renderProtocolDetail = () => {
        if (!selectedItem) return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 shadow-sm">
                    <ListTodo className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">Nenhum item selecionado</h3>
                <p className="text-sm">Selecione um item ao lado para configurar seus protocolos cirúrgicos.</p>
            </div>
        );

        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex justify-between items-start sm:items-center mb-8 flex-col sm:flex-row gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Protocolo: <span className="text-primary-600">{selectedItem.name}</span>
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Sequência de acompanhamento para este {activeTab === 'equipment' ? 'equipamento' : activeTab === 'team' ? 'profissional' : activeTab === 'document' ? 'documento' : 'beneficiário'}.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setNewStage({ title: '', trigger_type: 'interval', trigger_days: 2, trigger_unit: 'dias', trigger_relation: 'after', message_template: '', is_auto_send: false, attach_pdf: false, actions: [] });
                            setModalTab('basic');
                            setIsStageModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm shadow-md shadow-primary-600/20 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" /> Novo Estágio
                    </button>
                </div>

                {/* Timeline de Estágios */}
                <div className="space-y-4">
                    {isStagesLoading ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <div className="text-slate-400 text-sm animate-pulse">Carregando estágios...</div>
                        </div>
                    ) : protocolStages.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <h4 className="text-sm font-semibold text-slate-600 mb-1">Nenhum estágio configurado</h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">Crie estágios utilizando o botão acima para definir a linha do tempo de acompanhamento para este item.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8 pb-4 mt-8">
                            {protocolStages.map((stage, idx) => (
                                <div key={stage.id} className="relative pl-8 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="absolute -left-[11px] top-4 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-primary-500 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">{stage.title}</h4>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                                    <Clock className="w-4 h-4" />
                                                    {stage.trigger_type === 'interval'
                                                        ? `${stage.trigger_days} ${stage.trigger_unit || 'dia(s)'} ${stage.trigger_relation === 'before' ? 'antes' : 'após'}`
                                                        : 'Horário Específico'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setNewStage({
                                                            id: stage.id,
                                                            title: stage.title,
                                                            trigger_type: stage.trigger_type,
                                                            trigger_days: stage.trigger_days,
                                                            trigger_unit: stage.trigger_unit || 'dias',
                                                            trigger_relation: stage.trigger_relation || 'after',
                                                            message_template: stage.message_template || '',
                                                            is_auto_send: stage.is_auto_send,
                                                            attach_pdf: stage.attach_pdf,
                                                            actions: [...stage.actions]
                                                        });
                                                        setModalTab('basic');
                                                        setIsStageModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Editar Estágio"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStage(stage)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Excluir Estágio"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {stage.message_template && (
                                                <div className="flex gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
                                                    <MessageSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <span className="text-xs font-bold text-green-700 uppercase block mb-1">Mensagem (WhatsApp)</span>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{stage.message_template}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {stage.actions && stage.actions.length > 0 && (
                                                <div className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <ListTodo className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                                                    <div className="w-full">
                                                        <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Checklist de Ações ({stage.actions.length})</span>
                                                        <ul className="space-y-1.5">
                                                            {stage.actions.map((act: string, aIdx: number) => (
                                                                <li key={aIdx} className="text-sm text-slate-600 flex items-start gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></div>
                                                                    <span>{act}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Protocolos Cirúrgicos</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie seu catálogo de itens e seus fluxos automatizados (estágios e ações).</p>
                </div>
            </div>

            {/* Tabs Padrão Tema Navegar 360 */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => { setActiveTab('equipment'); setSelectedItem(null); }}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'equipment' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    <Package className="w-4 h-4" /> Equipamentos
                </button>
                <button
                    onClick={() => { setActiveTab('team'); setSelectedItem(null); }}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'team' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    <Users className="w-4 h-4" /> Equipe Médica
                </button>
                <button
                    onClick={() => { setActiveTab('document'); setSelectedItem(null); }}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'document' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    <FileText className="w-4 h-4" /> Documentos
                </button>
                <button
                    onClick={() => { setActiveTab('beneficiary'); setSelectedItem(null); }}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'beneficiary' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    <Heart className="w-4 h-4" /> Beneficiário
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 h-[600px]">
                    {renderList()}
                </div>
                <div className="lg:col-span-2">
                    {renderProtocolDetail()}
                </div>
            </div>

            {/* Modal Novo Estágio (Protocolo) */}
            {isStageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col mb-[10vh]">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Novo Estágio</h2>
                            <button onClick={() => setIsStageModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal SubTabs */}
                        <div className="px-6 flex gap-4 border-b border-slate-100 mt-2">
                            <button onClick={() => setModalTab('basic')} className={`flex items-center gap-2 pb-3 pt-2 font-medium text-sm transition-colors border-b-2 ${modalTab === 'basic' ? 'text-primary-600 border-primary-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
                                <Clock className="w-4 h-4" /> Básico
                            </button>
                            <button onClick={() => setModalTab('message')} className={`flex items-center gap-2 pb-3 pt-2 font-medium text-sm transition-colors border-b-2 ${modalTab === 'message' ? 'text-primary-600 border-primary-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
                                <MessageSquare className="w-4 h-4" /> Mensagem
                            </button>
                            <button onClick={() => setModalTab('actions')} className={`flex items-center gap-2 pb-3 pt-2 font-medium text-sm transition-colors border-b-2 ${modalTab === 'actions' ? 'text-primary-600 border-primary-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
                                <ListTodo className="w-4 h-4" /> Ações
                            </button>
                            <button onClick={() => setModalTab('config')} className={`flex items-center gap-2 pb-3 pt-2 font-medium text-sm transition-colors border-b-2 ${modalTab === 'config' ? 'text-primary-600 border-primary-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
                                <SettingsIcon className="w-4 h-4" /> Config
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 bg-slate-50/50 min-h-[350px]">
                            {modalTab === 'basic' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Título do Estágio</label>
                                        <input
                                            value={newStage.title}
                                            onChange={(e) => setNewStage({ ...newStage, title: e.target.value })}
                                            type="text"
                                            placeholder="Ex: Check-in 48h"
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                            <Clock className="w-4 h-4" /> Quando executar este estágio?
                                        </label>
                                        <div className="space-y-3">
                                            <label className="flex items-start gap-3 p-4 border border-primary-200 bg-white rounded-xl cursor-pointer shadow-sm">
                                                <div className="flex items-center h-5 mt-1">
                                                    <input type="radio" name="trigger" defaultChecked className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-primary-700 mb-2">Após um intervalo</div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="number"
                                                            value={newStage.trigger_days}
                                                            onChange={(e) => setNewStage({ ...newStage, trigger_days: e.target.value })}
                                                            className="w-20 h-10 px-3 border border-slate-200 rounded-lg text-center bg-slate-50 text-slate-700 font-medium font-mono"
                                                        />
                                                        <select
                                                            value={newStage.trigger_unit}
                                                            onChange={(e) => setNewStage({ ...newStage, trigger_unit: e.target.value })}
                                                            className="h-10 px-3 border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
                                                        >
                                                            <option value="dias">dias</option>
                                                            <option value="horas">horas</option>
                                                        </select>
                                                        <select
                                                            value={newStage.trigger_relation || 'after'}
                                                            onChange={(e) => setNewStage({ ...newStage, trigger_relation: e.target.value })}
                                                            className="h-10 px-3 border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
                                                        >
                                                            <option value="after">desde a cirurgia</option>
                                                            <option value="before">antes da cirurgia</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalTab === 'message' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Modelo de Mensagem WhatsApp</label>
                                        <textarea
                                            value={newStage.message_template}
                                            onChange={(e) => setNewStage({ ...newStage, message_template: e.target.value })}
                                            placeholder="Olá #NomePaciente, tudo bem com você?..."
                                            className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white resize-none"
                                        ></textarea>

                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => setNewStage({ ...newStage, message_template: newStage.message_template + ' #NomePaciente' })}
                                                className="px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-600 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-colors"
                                            >
                                                + #NomePaciente
                                            </button>
                                            <button
                                                onClick={() => setNewStage({ ...newStage, message_template: newStage.message_template + ' #NomeClinica' })}
                                                className="px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-600 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-colors"
                                            >
                                                + #NomeClinica
                                            </button>
                                            <button
                                                onClick={() => setNewStage({ ...newStage, message_template: newStage.message_template + ' #ItemNome' })}
                                                className="px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-600 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-colors"
                                            >
                                                + #ItemNome
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalTab === 'actions' && (
                                <div className="space-y-5 animate-in fade-in duration-300">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800 mb-1">Checklist de Ações</h3>
                                        <p className="text-xs text-slate-500 mb-4">Defina as tarefas que devem ser executadas neste estágio do protocolo.</p>

                                        {newStage.actions.length === 0 ? (
                                            <div className="text-center py-6 bg-white border border-dashed border-slate-200 rounded-xl mb-6">
                                                <ListTodo className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                                <span className="text-sm font-medium text-slate-500">Nenhuma ação vinculada a esse estágio.</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 mb-6 max-h-40 overflow-y-auto pr-2">
                                                {newStage.actions.map((action: string, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl">
                                                        <div className="flex items-center gap-3">
                                                            <Check className="w-5 h-5 text-emerald-500" />
                                                            <span className="text-sm font-medium text-slate-700">{action}</span>
                                                        </div>
                                                        <button onClick={() => removeAction(idx)} className="text-slate-400 hover:text-red-500 p-1">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block border-t pt-4 border-slate-200">Adicionar Ações Rápidas:</span>
                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => addQuickAction('Enviar mensagem WhatsApp')} className="px-3 py-2 border border-slate-200 bg-white flex items-center gap-2 text-xs font-semibold text-slate-600 rounded-lg hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                                                    <MessageSquare className="w-4 h-4" /> Enviar WhatsApp
                                                </button>
                                                <button onClick={() => addQuickAction('Solicitar fotos de equipamento')} className="px-3 py-2 border border-slate-200 bg-white flex items-center gap-2 text-xs font-semibold text-slate-600 rounded-lg hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                                                    <Video className="w-4 h-4" /> Solicitar Fotos
                                                </button>
                                                <button onClick={() => addQuickAction('Confirmação de Dispensa Presencial')} className="px-3 py-2 border border-slate-200 bg-white flex items-center gap-2 text-xs font-semibold text-slate-600 rounded-lg hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                                                    <Calendar className="w-4 h-4" /> Confirmação de Dispensa Presencial
                                                </button>
                                            </div>

                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="text"
                                                    placeholder="Digite uma ação personalizada..."
                                                    value={newActionText}
                                                    onChange={(e) => setNewActionText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') addCustomAction();
                                                    }}
                                                    className="flex-1 h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                                                />
                                                <button
                                                    onClick={addCustomAction}
                                                    className="px-5 py-2 bg-slate-800 text-white rounded-lg font-medium text-sm hover:bg-slate-900 transition-colors">
                                                    Inserir
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalTab === 'config' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Configurações de Envio</h3>

                                    <label className="flex items-start gap-4 p-4 border border-slate-200 bg-white rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                                        <div className="mt-1">
                                            <input
                                                type="checkbox"
                                                checked={newStage.is_auto_send}
                                                onChange={(e) => setNewStage({ ...newStage, is_auto_send: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800">Envio Automático</div>
                                            <p className="text-sm text-slate-500 mt-0.5">A mensagem será enviada automaticamente no horário programado.</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-4 p-4 border border-slate-200 bg-white rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                                        <div className="mt-1">
                                            <input
                                                type="checkbox"
                                                checked={newStage.attach_pdf}
                                                onChange={(e) => setNewStage({ ...newStage, attach_pdf: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800">Anexar Documento(s) PDF</div>
                                            <p className="text-sm text-slate-500 mt-0.5">Anexar arquivo de referência ou relatórios.</p>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setIsStageModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveStage}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-md shadow-primary-600/20"
                            >
                                Salvar Estágio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Catálogo CRUD (Criar e Editar) */}
            {isCatalogModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {catalogItemForm.id ? 'Editar Cadastro' : 'Novo Cadastro'}
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">
                                    {activeTab === 'equipment' ? 'Equipamento' : activeTab === 'team' ? 'Equipe Médica' : activeTab === 'document' ? 'Documento' : 'Beneficiário'}
                                </span>
                            </h2>
                            <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome do Item *</label>
                                <input
                                    type="text"
                                    value={catalogItemForm.name || ''}
                                    onChange={(e) => setCatalogItemForm({ ...catalogItemForm, name: e.target.value })}
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                                    placeholder="Nome descritivo"
                                />
                            </div>

                            {activeTab === 'equipment' && (
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500 mt-2">Equipamentos serão listados disponíveis para escolha dentro das cirurgias. Atributos como Quantidade ou Localização foram simplificados nesta versão.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setIsCatalogModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSaveCatalogItem} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-md shadow-primary-600/20">
                                Salvar Cadastro
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Genérico de Confirmação (Destructive) */}
            {confirmModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
                        <p className="text-sm text-slate-500 mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setConfirmModal(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button onClick={confirmModal.onConfirm} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm shadow-red-600/20">
                                Confirmar Ação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
