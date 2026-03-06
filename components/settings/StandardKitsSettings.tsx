import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Package, Plus, Search, CheckCircle, AlertCircle, Edit2, Trash2, X, FileText, Users, Activity, ListTodo } from 'lucide-react';
import { useDoctors } from '../../hooks/useDoctors';

export const StandardKitsSettings: React.FC = () => {
    const { profile, selectedClinic } = useAuth();
    const [kits, setKits] = useState<any[]>([]);
    const [selectedKit, setSelectedKit] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [kitForm, setKitForm] = useState({ id: '', name: '', description: '', status: 'active' });

    // Inner Tabs for a selected kit
    const [innerTab, setInnerTab] = useState<'procedures' | 'exams' | 'documents' | 'opme' | 'equipments' | 'participants'>('procedures');
    const [kitItems, setKitItems] = useState<any[]>([]);

    // Add Item Form Modal
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [itemForm, setItemForm] = useState<any>({});

    const { doctors } = useDoctors();
    const [availableEquipments, setAvailableEquipments] = useState<string[]>([]);
    const [availableRoles, setAvailableRoles] = useState<any[]>([]);

    const [isSearchingCbhpm, setIsSearchingCbhpm] = useState(false);
    const [cbhpmResults, setCbhpmResults] = useState<any[]>([]);
    const [showCbhpmResults, setShowCbhpmResults] = useState(false);

    useEffect(() => {
        if (selectedClinic?.clinic_id) fetchKits();
    }, [selectedClinic?.clinic_id]);

    const fetchKits = async () => {
        if (!selectedClinic?.clinic_id) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('standard_kits')
                .select('*')
                .eq('clinic_id', selectedClinic.clinic_id)
                .order('name');
            if (error) throw error;
            setKits(data || []);
        } catch (e: any) {
            toast.error('Erro ao buscar kits: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchKitItems = async (kitId: string, tab: string) => {
        try {
            const table = `standard_kit_${tab}`;
            const { data, error } = await supabase.from(table).select('*').eq('kit_id', kitId).order('created_at');
            if (error) throw error;
            setKitItems(data || []);
        } catch (e: any) {
            toast.error('Erro ao buscar itens: ' + e.message);
        }
    };

    useEffect(() => {
        if (selectedKit) {
            fetchKitItems(selectedKit.id, innerTab);
        } else {
            setKitItems([]);
        }
    }, [selectedKit, innerTab]);

    useEffect(() => {
        const fetchEquipments = async () => {
            try {
                if (selectedClinic?.clinic_id) {
                    const { data } = await supabase.from('protocols').select('name').eq('type', 'equipment').eq('clinic_id', selectedClinic.clinic_id).eq('active', true).order('name');
                    if (data && data.length > 0) {
                        setAvailableEquipments(data.map(e => e.name));
                        return;
                    }
                }
            } catch (e) { }
            setAvailableEquipments(['Arco Cirúrgico', 'Torre de Vídeo', 'Microscópio', 'Bisturi Elétrico', 'Motor de Ortopedia', 'Monitor Multiparamétrico']);
        };
        fetchEquipments();
    }, [selectedClinic?.clinic_id]);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                if (selectedClinic?.clinic_id) {
                    const { data } = await supabase.from('protocols').select('id, name').eq('type', 'team').eq('clinic_id', selectedClinic.clinic_id).eq('active', true).order('name');
                    if (data && data.length > 0) {
                        setAvailableRoles(data);
                        return;
                    }
                }
            } catch (e) { }
            setAvailableRoles([]);
        };
        fetchRoles();
    }, [selectedClinic?.clinic_id]);

    const searchCBHPM = async (term: string, type: 'procedure' | 'exam') => {
        if (term.length < 3) {
            setCbhpmResults([]);
            setShowCbhpmResults(false);
            return;
        }
        setIsSearchingCbhpm(true);
        try {
            const cleanTerm = term.replace(/\D/g, '');
            let query = supabase.from('cbhpm').select('codigo_anatomico, descricao_procedimento, diretriz_utilizacao');
            if (type === 'exam') query = query.not('codigo_anatomico', 'ilike', '3%');
            const searchOr = [`descricao_procedimento.ilike.%${term}%`, `codigo_anatomico.ilike.%${term}%`];
            if (cleanTerm.length >= 3) searchOr.push(`codigo_anatomico.ilike.%${cleanTerm}%`);
            query = query.or(searchOr.join(','));
            const { data, error } = await query.order('descricao_procedimento').limit(15);
            if (!error && data) {
                setCbhpmResults(data);
                setShowCbhpmResults(data.length > 0);
            }
        } catch (err) { } finally {
            setIsSearchingCbhpm(false);
        }
    };

    const handleSelectCbhpm = (item: any) => {
        if (innerTab === 'procedures') {
            setItemForm({ ...itemForm, code: item.codigo_anatomico, name: item.descricao_procedimento });
        } else if (innerTab === 'exams') {
            setItemForm({ ...itemForm, exam_type: item.codigo_anatomico, exam_name: item.descricao_procedimento, justification: item.diretriz_utilizacao || itemForm.justification });
        }
        setShowCbhpmResults(false);
    };

    const handleSaveKit = async () => {
        if (!kitForm.name.trim()) return toast.error('Nome obrigatório');
        try {
            const payload = {
                clinic_id: selectedClinic?.clinic_id,
                name: kitForm.name,
                description: kitForm.description,
                status: kitForm.status
            };

            if (kitForm.id) {
                const { error } = await supabase.from('standard_kits').update(payload).eq('id', kitForm.id);
                if (error) throw error;
                toast.success('Kit atualizado');
            } else {
                const { data, error } = await supabase.from('standard_kits').insert([payload]).select().single();
                if (error) throw error;
                toast.success('Kit criado');
                setSelectedKit(data);
            }
            setIsEditModalOpen(false);
            fetchKits();
        } catch (e: any) {
            toast.error('Erro: ' + e.message);
        }
    };

    const handleDeleteKit = async (id: string) => {
        if (!window.confirm('Excluir este kit? Todos os itens serão perdidos.')) return;
        try {
            const { error } = await supabase.from('standard_kits').delete().eq('id', id);
            if (error) throw error;
            toast.success('Kit excluído');
            if (selectedKit?.id === id) setSelectedKit(null);
            fetchKits();
        } catch (e: any) {
            toast.error('Erro ao excluir: ' + e.message);
        }
    };

    const openEditKit = (kit?: any) => {
        if (kit) {
            setKitForm({ id: kit.id, name: kit.name, description: kit.description || '', status: kit.status });
        } else {
            setKitForm({ id: '', name: '', description: '', status: 'active' });
        }
        setIsEditModalOpen(true);
    };

    const handleSaveItem = async () => {
        if (!selectedKit) return;
        try {
            const table = `standard_kit_${innerTab}`;
            const payload = { ...itemForm, kit_id: selectedKit.id };
            if (payload.id) {
                const { error } = await supabase.from(table).update(payload).eq('id', payload.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(table).insert([payload]);
                if (error) throw error;
            }
            toast.success('Item salvo');
            setIsAddItemModalOpen(false);
            fetchKitItems(selectedKit.id, innerTab);
        } catch (e: any) {
            toast.error('Erro: ' + e.message);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!window.confirm('Excluir este item?')) return;
        try {
            const table = `standard_kit_${innerTab}`;
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            toast.success('Item excluído');
            fetchKitItems(selectedKit.id, innerTab);
        } catch (e: any) {
            toast.error('Erro ao excluir: ' + e.message);
        }
    };

    const openAddItem = (item?: any) => {
        if (item) {
            setItemForm(item);
        } else {
            let initial = {};
            if (innerTab === 'procedures') initial = { code: '', name: '', description: '', quantity: 1, is_main: false };
            else if (innerTab === 'exams') initial = { exam_name: '', exam_type: '', justification: '', quantity: 1 };
            else if (innerTab === 'documents') initial = { document_type: '', template_name: '', is_required: false };
            else if (innerTab === 'opme') initial = { name: '', description: '', quantity: 1, justification: '' };
            else if (innerTab === 'equipments') initial = { name: '', description: '', quantity: 1 };
            else if (innerTab === 'participants') initial = { role: '', specialty: '' };
            setItemForm(initial);
        }
        setIsAddItemModalOpen(true);
    };

    const filteredKits = kits.filter(k => k.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-180px)] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            {/* Sidebar Kits */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => openEditKit()} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors">
                        <Plus className="w-4 h-4" /> Novo Kit Padrão
                    </button>
                    <div className="mt-4 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar kits..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            title="Buscar kits"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredKits.map(kit => (
                        <div
                            key={kit.id}
                            onClick={() => setSelectedKit(kit)}
                            className={`p-3 rounded-lg cursor-pointer mb-1 border transition-all ${selectedKit?.id === kit.id ? 'bg-white shadow-sm border-primary-200 dark:bg-slate-800/80 dark:border-primary-900 ring-1 ring-primary-500' : 'border-transparent hover:bg-white hover:border-slate-200 dark:hover:bg-slate-800/50 dark:hover:border-slate-700'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className={`font-bold text-sm ${selectedKit?.id === kit.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-800 dark:text-white'}`}>{kit.name}</h4>
                                    {kit.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{kit.description}</p>}
                                </div>
                                {kit.status === 'active' ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredKits.length === 0 && (
                        <div className="p-6 text-center text-slate-500 text-sm">
                            Nenhum kit encontrado.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Details */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                {selectedKit ? (
                    <>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedKit.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedKit.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {selectedKit.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{selectedKit.description || 'Sem descrição.'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditKit(selectedKit)} className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" title="Editar Kit"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteKit(selectedKit.id)} className="p-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Excluir Kit"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Inner Tabs for Items */}
                        <div className="px-6 border-b border-slate-200 flex gap-1 overflow-x-auto hide-scrollbar">
                            {[
                                { id: 'procedures', icon: Activity, label: 'Procedimentos' },
                                { id: 'exams', icon: FileText, label: 'Exames' },
                                { id: 'documents', icon: FileText, label: 'Documentos' },
                                { id: 'opme', icon: Package, label: 'OPME' },
                                { id: 'equipments', icon: Package, label: 'Equipamentos' },
                                { id: 'participants', icon: Users, label: 'Participantes' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setInnerTab(t.id as any)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors text-sm whitespace-nowrap ${innerTab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                                >
                                    <t.icon className="w-4 h-4" /> {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Items List */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-800 dark:text-white">Itens ({kitItems.length})</h4>
                                <button onClick={() => openAddItem()} className="flex items-center gap-2 text-sm text-primary-600 font-bold hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200">
                                    <Plus className="w-4 h-4" /> Adicionar
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {kitItems.map((item, idx) => (
                                    <div key={item.id || idx} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
                                        <div>
                                            <h5 className="font-bold text-slate-800">
                                                {innerTab === 'participants'
                                                    ? (availableRoles.find(r => r.id === item.role)?.name || item.role)
                                                    : (item.name || item.exam_name || item.document_type || item.role)}
                                            </h5>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {innerTab === 'participants'
                                                    ? (doctors.find(d => d.id === item.specialty)?.full_name || item.specialty)
                                                    : (item.description || item.justification || item.specialty || item.template_name || item.code)}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex justify-between items-center border-t border-slate-100 pt-3">
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                Qtd: {item.quantity || (item.is_required ? 'Obrigatório' : 'Opcional')}
                                            </span>
                                            <div className="flex gap-1">
                                                <button onClick={() => openAddItem(item)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {kitItems.length === 0 && (
                                <div className="text-center p-12 bg-slate-50 border border-slate-100 rounded-xl border-dashed">
                                    <ListTodo className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">Nenhum item adicionado a esta seção.</p>
                                    <button onClick={() => openAddItem()} className="text-primary-600 font-bold text-sm mt-2 hover:underline">Adicionar o primeiro</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <Package className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Configure Kits Padrão</h3>
                        <p className="text-slate-500 max-w-sm">Selecione um kit ao lado ou crie um novo para padronizar os dados recorrentes em suas cirurgias.</p>
                    </div>
                )}
            </div>

            {/* Modals... */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">{kitForm.id ? 'Editar Kit' : 'Novo Kit Padrão'}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Kit</label>
                                <input type="text" value={kitForm.name} onChange={e => setKitForm({ ...kitForm, name: e.target.value })} className="w-full p-2.5 border rounded-lg" placeholder="Ex: Colecistectomia Vídeo" title="Nome do Kit" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                <textarea value={kitForm.description} onChange={e => setKitForm({ ...kitForm, description: e.target.value })} className="w-full p-2.5 border rounded-lg" rows={3} title="Descrição do Kit"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                                <select value={kitForm.status} onChange={e => setKitForm({ ...kitForm, status: e.target.value })} className="w-full p-2.5 border rounded-lg" title="Status do Kit">
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancelar</button>
                            <button onClick={handleSaveKit} className="px-4 py-2 font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700">Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {isAddItemModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">{itemForm.id ? 'Editar Item' : 'Novo Item'}</h2>
                            <button onClick={() => setIsAddItemModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Inputs dinâmicos baseados na innerTab */}
                            {innerTab === 'procedures' && (
                                <>
                                    <div className="relative">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Buscar Procedimento</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={itemForm.code || ''}
                                                onChange={e => {
                                                    setItemForm({ ...itemForm, code: e.target.value });
                                                    searchCBHPM(e.target.value, 'procedure');
                                                }}
                                                className="w-full p-2.5 border rounded-lg pr-10"
                                                placeholder="Digite o código TUSS ou nome..."
                                                title="Buscar Procedimento"
                                            />
                                            {isSearchingCbhpm && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>}
                                        </div>
                                        {showCbhpmResults && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {cbhpmResults.map((item, idx) => (
                                                    <button key={idx} onClick={() => handleSelectCbhpm(item)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                                        <p className="text-[10px] font-bold text-primary-600 mb-0.5">{item.codigo_anatomico}</p>
                                                        <p className="text-sm text-slate-700 leading-tight">{item.descricao_procedimento}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome/Descrição</label>
                                        <input type="text" value={itemForm.name || ''} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="w-full p-2.5 border rounded-lg" title="Nome do Item" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Detalhes Adicionais</label>
                                        <textarea value={itemForm.description || ''} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full p-2.5 border rounded-lg" rows={2} title="Detalhes"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Quantidade</label>
                                        <input type="number" min="1" value={itemForm.quantity || 1} onChange={e => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) })} className="w-full p-2.5 border rounded-lg" title="Quantidade" />
                                    </div>
                                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                                        <input type="checkbox" checked={itemForm.is_main || false} onChange={e => setItemForm({ ...itemForm, is_main: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" title="Procedimento Principal" />
                                        <span className="text-sm font-medium text-slate-700">Procedimento Principal?</span>
                                    </label>
                                </>
                            )}
                            {innerTab === 'exams' && (
                                <>
                                    <div className="relative">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Buscar Exame</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={itemForm.exam_type || ''}
                                                onChange={e => {
                                                    setItemForm({ ...itemForm, exam_type: e.target.value });
                                                    searchCBHPM(e.target.value, 'exam');
                                                }}
                                                className="w-full p-2.5 border rounded-lg pr-10"
                                                placeholder="Digite o código TUSS ou nome do exame..."
                                                title="Buscar Exame"
                                            />
                                            {isSearchingCbhpm && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>}
                                        </div>
                                        {showCbhpmResults && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {cbhpmResults.map((item, idx) => (
                                                    <button key={idx} onClick={() => handleSelectCbhpm(item)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                                        <p className="text-[10px] font-bold text-primary-600 mb-0.5">{item.codigo_anatomico}</p>
                                                        <p className="text-sm text-slate-700 leading-tight">{item.descricao_procedimento}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                        <input type="text" value={itemForm.exam_name || ''} onChange={e => setItemForm({ ...itemForm, exam_name: e.target.value })} className="w-full p-2.5 border rounded-lg" title="Nome do Exame" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Diretrizes (Justificativa)</label>
                                        <textarea value={itemForm.justification || ''} onChange={e => setItemForm({ ...itemForm, justification: e.target.value })} className="w-full p-2.5 border rounded-lg" rows={2} title="Justificativa"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Quantidade</label>
                                        <input type="number" min="1" value={itemForm.quantity || 1} onChange={e => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) })} className="w-full p-2.5 border rounded-lg" title="Quantidade" />
                                    </div>
                                </>
                            )}
                            {innerTab === 'documents' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Documento</label>
                                        <select value={itemForm.document_type || ''} onChange={e => setItemForm({ ...itemForm, document_type: e.target.value })} className="w-full p-2.5 border rounded-lg" title="Tipo">
                                            <option value="">Selecione...</option>
                                            <option value="termo_consentimento">Termo de Consentimento</option>
                                            <option value="termo_anestesico">Termo Anestésico</option>
                                            <option value="documento_identificacao">Documento de Identificação</option>
                                            <option value="carteira_convenio">Carteira do Convênio</option>
                                            <option value="guia_autorizacao">Guia/Autorização</option>
                                            <option value="risco_cirurgico">Risco Cirúrgico</option>
                                            <option value="lista_medicamentos">Lista de Medicamentos</option>
                                            <option value="exame_laboratorial">Exame Laboratorial</option>
                                            <option value="exame_imagem">Exame de Imagem</option>
                                            <option value="personalizado">Outro/Personalizado</option>
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                                        <input type="checkbox" checked={itemForm.is_required || false} onChange={e => setItemForm({ ...itemForm, is_required: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" title="Obrigatório" />
                                        <span className="text-sm font-medium text-slate-700">Documento Obrigatório?</span>
                                    </label>
                                </>
                            )}
                            {innerTab === 'opme' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                        <input type="text" value={itemForm.name || ''} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="w-full p-2.5 border rounded-lg" title="Descrição do Item" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Fabricante/Fornecedor Sugerido</label>
                                        <textarea value={itemForm.description || ''} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full p-2.5 border rounded-lg" rows={2} title="Detalhes"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Justificativa de Uso</label>
                                        <textarea value={itemForm.justification || ''} onChange={e => setItemForm({ ...itemForm, justification: e.target.value })} className="w-full p-2.5 border rounded-lg" rows={2} title="Justificativa"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Quantidade</label>
                                        <input type="number" min="1" value={itemForm.quantity || 1} onChange={e => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) })} className="w-full p-2.5 border rounded-lg" title="Quantidade" />
                                    </div>
                                </>
                            )}
                            {innerTab === 'equipments' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Equipamento</label>
                                        <select
                                            value={itemForm.name || ''}
                                            onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg"
                                            title="Equipamento"
                                        >
                                            <option value="">Selecione o Equipamento...</option>
                                            {availableEquipments.map(eq => (
                                                <option key={eq} value={eq}>{eq}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Observações Técnicas</label>
                                        <textarea value={itemForm.description || ''} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full p-2.5 border rounded-lg" rows={2} title="Detalhes"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Quantidade</label>
                                        <input type="number" min="1" value={itemForm.quantity || 1} onChange={e => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) })} className="w-full p-2.5 border rounded-lg" title="Quantidade" />
                                    </div>
                                </>
                            )}
                            {innerTab === 'participants' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Cargo/Função</label>
                                        <select
                                            value={itemForm.role || ''}
                                            onChange={e => setItemForm({ ...itemForm, role: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg"
                                            title="Cargo"
                                        >
                                            <option value="">Selecione o Cargo/Função...</option>
                                            {availableRoles.map(role => (
                                                <option key={role.id} value={role.id}>{role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Profissional (Opcional)</label>
                                        <select
                                            value={itemForm.specialty || ''}
                                            onChange={e => setItemForm({ ...itemForm, specialty: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg"
                                            title="Profissional Especialista"
                                        >
                                            <option value="">A Definir Especialista (Opcional)...</option>
                                            {doctors.map(doc => (
                                                <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1">Pode ser deixado em branco para definição futura na cirurgia.</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsAddItemModalOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancelar</button>
                            <button onClick={handleSaveItem} className="px-4 py-2 font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700">Salvar Item</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
