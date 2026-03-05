import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
    SurgeryCase, PatientV2, OrderDocument, OrderOpme, OrderEquipment, Doctor
} from '../types';
import {
    ChevronLeft, FileText, Users, Activity, Package, Check,
    AlertCircle, Clock, Save, MoreHorizontal, Download,
    Share2, Flag, Upload, MessageSquare, MapPin, Phone,
    Eye, Trash2, Filter, CheckCircle, Calendar as CalendarIcon,
    ChevronDown, ChevronUp, Send, ShieldCheck, Wrench, AlertTriangle,
    Printer, ExternalLink, Plus, Microscope, Search, Scale, ClipboardCheck, X, XCircle,
    ListTodo, ThumbsUp, ThumbsDown, Camera, History, Copy, Mail, RefreshCcw, List, Quote, ChevronRight, Settings, Heart
} from 'lucide-react';
import { DUTModal } from '../components/modals/DUTModal';

enum EquipmentStatus {
    Ready = 'Ready',
    Pending = 'Pending',
    Critical = 'Critical'
}

const TabButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
    <button
        onClick={onClick}
        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${active
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
    >
        {label}
    </button>
);

const SectionHeader: React.FC<{
    icon: React.ElementType;
    title: string;
    actionLabel?: string;
    onAction?: () => void
}> = ({ icon: Icon, title, actionLabel, onAction }) => (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary-600" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
        </div>
        {actionLabel && (
            <button
                onClick={onAction}
                className="flex items-center gap-1 text-primary-600 text-sm font-bold hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
            >
                <Plus className="w-4 h-4" /> {actionLabel}
            </button>
        )}
    </div>
);

// --- Overview Tab Components ---

const OverviewStatusCard: React.FC<{
    icon: React.ElementType;
    title: string;
    subtitle: string;
    status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
    progress: number;
    onClick?: () => void;
}> = ({ icon: Icon, title, subtitle, status, progress, onClick }) => {
    let colorClass = '';
    let bgClass = '';
    let textClass = '';
    let statusLabel = '';
    let barColor = '';

    switch (status) {
        case 'OK':
            colorClass = 'text-emerald-500';
            bgClass = 'bg-emerald-50';
            textClass = 'text-emerald-600';
            statusLabel = 'OK';
            barColor = 'bg-emerald-500';
            break;
        case 'WARNING':
            colorClass = 'text-amber-500';
            bgClass = 'bg-amber-50';
            textClass = 'text-amber-600';
            statusLabel = 'ALERTA';
            barColor = 'bg-amber-400';
            break;
        case 'CRITICAL':
            colorClass = 'text-red-500';
            bgClass = 'bg-red-50';
            textClass = 'text-red-600';
            statusLabel = 'CRÍTICO';
            barColor = 'bg-red-500';
            break;
        case 'PENDING':
            colorClass = 'text-amber-500';
            bgClass = 'bg-amber-50';
            textClass = 'text-amber-600';
            statusLabel = 'PENDENTE';
            barColor = 'bg-amber-400';
            break;
    }

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl p-5 border shadow-sm relative overflow-hidden ${status === 'CRITICAL' ? 'border-red-200' : 'border-slate-200'} ${onClick ? 'cursor-pointer hover:border-primary-300 hover:shadow-md transition-all' : ''}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgClass} ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`}>{statusLabel}</span>
            </div>
            <div>
                <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
                <p className="text-xs text-slate-500 mb-4 h-5 truncate">{subtitle}</p>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progresso</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{progress}%</span>
                </div>
            </div>
        </div>
    );
};

const TimelineItem: React.FC<{ icon: React.ElementType; color: string; title: string; desc: string; time: string }> = ({ icon: Icon, color, title, desc, time }) => (
    <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0 shadow-sm text-white border-2 border-white ring-1 ring-slate-100`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
            <div className="flex justify-between items-start">
                <h5 className="font-bold text-slate-800 text-sm">{title}</h5>
                <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
    </div>
)

const SummaryRow: React.FC<{ icon: React.ElementType; bg: string; text: string; label: string; sub: string }> = ({ icon: Icon, bg, text, label, sub }) => (
    <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg} ${text}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-sm font-bold text-white">{label}</p>
            <p className="text-xs text-slate-400">{sub}</p>
        </div>
    </div>
)

const OverviewTab: React.FC<{
    documents: OrderDocument[];
    opmeItems: OrderOpme[];
    equipmentItems: any[];
    surgeryCase: SurgeryCase;
    onNavigate?: (tab: string) => void;
}> = ({ documents, opmeItems, equipmentItems, surgeryCase, onNavigate }) => {

    // Progress calculations
    const docsProgress = documents.length > 0 ? Math.round((documents.filter(d => d.status === 'received').length / documents.length) * 100) : 100;
    const opmeProgress = opmeItems.length > 0 ? (opmeItems.every(o => o.manufacturer) ? 100 : 50) : 100;
    const eqProgress = equipmentItems.length > 0 ? Math.round((equipmentItems.filter(e => e.status === 'ready').length / equipmentItems.length) * 100) : 100;
    const teamProgress = (surgeryCase as any).anesthesiologist_id && (surgeryCase as any).assistant_id ? 100 : 50;

    const totalProgress = Math.round((docsProgress + opmeProgress + eqProgress + teamProgress) / 4);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Status Consolidated */}
            <div>
                <h3 className="font-bold text-lg text-slate-800 mb-4">Status Consolidado</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <OverviewStatusCard
                        icon={FileText}
                        title="Documentos"
                        subtitle={`${documents.filter(d => d.status !== 'received').length} pendentes`}
                        status={docsProgress === 100 ? 'OK' : 'PENDING'}
                        progress={docsProgress}
                        onClick={() => onNavigate && onNavigate('Documentos')}
                    />
                    <OverviewStatusCard
                        icon={ShieldCheck}
                        title="Convênio"
                        subtitle="Autorização verificada"
                        status="OK"
                        progress={100}
                    />
                    <OverviewStatusCard
                        icon={Package}
                        title="OPME"
                        subtitle={opmeItems.length > 0 ? `${opmeItems.length} itens identificados` : 'Sem itens OPME'}
                        status={opmeProgress === 100 ? 'OK' : 'PENDING'}
                        progress={opmeProgress}
                        onClick={() => onNavigate && onNavigate('OPME')}
                    />
                    <OverviewStatusCard
                        icon={Wrench}
                        title="Equipamentos"
                        subtitle={`${equipmentItems.filter(e => e.status !== 'ready').length} aguardando logística`}
                        status={eqProgress === 100 ? 'OK' : 'WARNING'}
                        progress={eqProgress}
                        onClick={() => onNavigate && onNavigate('Equipamentos')}
                    />
                    <OverviewStatusCard
                        icon={Users}
                        title="Equipe"
                        subtitle={teamProgress === 100 ? 'Completa' : 'Faltam membros'}
                        status={teamProgress === 100 ? 'OK' : 'WARNING'}
                        progress={teamProgress}
                        onClick={() => onNavigate && onNavigate('Equipe')}
                    />
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline - Static for now but could be dynamic */}
                <div className="lg:col-span-2">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Atividades Recentes</h3>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="space-y-4">
                            <TimelineItem
                                icon={Activity}
                                color="bg-emerald-500"
                                title="Dados carregados do prontuário"
                                desc="Sincronização realizada com sucesso."
                                time="Agora"
                            />
                            <TimelineItem
                                icon={Users}
                                color="bg-primary-500"
                                title="Equipe Médica Assistente"
                                desc={`${surgeryCase.doctor_name || 'Médico'} registrou o pedido.`}
                                time="Histórico"
                            />
                        </div>
                    </div>
                </div>

                {/* Executive Summary */}
                <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Resumo Executivo</h3>
                    <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl h-fit">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Prontidão para Cirurgia</p>

                        <div className="mb-8">
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-4xl font-bold">{totalProgress}%</span>
                                <span className="text-sm text-slate-400 mb-1">concluído</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${totalProgress === 100 ? 'bg-emerald-500' : 'bg-primary-500'} rounded-full transition-all duration-500`}
                                    style={{ width: `${totalProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <SummaryRow icon={Check} bg="bg-emerald-500/20" text="text-emerald-400" label={`${[docsProgress, opmeProgress, eqProgress, teamProgress].filter(p => p === 100).length} Áreas Prontas`} sub="Sem pendências" />
                            <SummaryRow icon={AlertCircle} bg="bg-amber-500/20" text="text-amber-400" label={`${[docsProgress, opmeProgress, eqProgress, teamProgress].filter(p => p < 100).length} Áreas Pendentes`} sub="Aguardando confirmação" />
                        </div>

                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Interno:</p>
                            <p className="text-sm font-bold leading-tight">
                                {totalProgress === 100 ? 'Cirurgia pronta para realização.' : 'Aguardando finalização das etapas de navegação.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- End Overview Tab Components ---

const MedicalOrderTab: React.FC<{
    surgeryCase: SurgeryCase;
    procedures: any[];
    documents: OrderDocument[];
    opmeItems: OrderOpme[];
    equipmentItems: any[];
}> = ({ surgeryCase, procedures, documents, opmeItems, equipmentItems }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isDUTOpen, setIsDUTOpen] = useState(false);
    const [selectedDut, setSelectedDut] = useState({ code: '', description: '', text: '' });

    const openDut = (code: string, desc: string, text: string) => {
        setSelectedDut({ code, description: desc, text });
        setIsDUTOpen(true);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Não informada';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (isEditing) {
        return (
            <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Visualização do Pedido Médico</h3>
                <p className="text-slate-500 font-medium max-w-md mx-auto mt-2">
                    Os dados desta aba são extraídos diretamente do pedido original realizado pelo médico.
                </p>
                <button onClick={() => setIsEditing(false)} className="mt-6 px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors">
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* 1. DADOS DA CIRURGIA */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 z-10">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-primary-600 border border-primary-200 bg-primary-50 px-3 py-1.5 rounded flex items-center gap-2 hover:bg-primary-100 transition-colors"
                    >
                        <Wrench className="w-3 h-3" /> Editar Pedido
                    </button>
                </div>
                <SectionHeader icon={CalendarIcon} title="1. DADOS DA CIRURGIA" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Hospital</label>
                        <p className="text-sm font-medium text-slate-800">{(surgeryCase as any).hospital_ref?.name || surgeryCase.hospital || 'Não informado'}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Data e Hora Prevista</label>
                        <p className="text-sm font-medium text-slate-800">{formatDate(surgeryCase.date || '')}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Necessita de Anestesista?</label>
                        <div className="flex items-center gap-2">
                            <span className={`flex h-2 w-2 rounded-full ${surgeryCase.anesthesia_required ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            <span className="text-sm font-medium text-slate-800">{surgeryCase.anesthesia_required ? 'Sim' : 'Não'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. PROCEDIMENTOS */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader icon={Plus} title="2. PROCEDIMENTOS" />

                <div className="grid grid-cols-12 gap-4 px-2 mb-2 border-b border-slate-100 pb-2">
                    <div className="col-span-8 text-[10px] font-bold text-slate-400 uppercase">Descrição do Procedimento</div>
                    <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase text-center">Porte</div>
                    <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase text-center">Qtd.</div>
                    <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase text-center">Ações</div>
                </div>

                {procedures.map((proc, index) => (
                    <div key={proc.id || index} className="grid grid-cols-12 gap-4 items-center px-2 pt-2 pb-2 border-b border-slate-50 last:border-0 relative">
                        <div className="col-span-8">
                            <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                {proc.is_main && <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-[10px] font-bold uppercase" title="Procedimento Principal">PRIN</span>}
                                {proc.description}
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{proc.code}</div>
                        </div>
                        <div className="col-span-1 text-sm font-bold text-slate-700 text-center">{proc.porte || '-'}</div>
                        <div className="col-span-1 text-sm font-bold text-slate-700 text-center">{proc.quantity || 1}</div>
                        <div className="col-span-2 flex justify-center">
                            {proc.dut ? (
                                <button
                                    onClick={() => openDut(proc.code, proc.description, proc.dut)}
                                    title="Ver Diretriz de Utilização (DUT)"
                                    className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100 flex items-center justify-center"
                                >
                                    <Scale className="w-4 h-4" />
                                </button>
                            ) : (
                                <span className="text-xs text-slate-400">-</span>
                            )}
                        </div>
                    </div>
                ))}

                {(!procedures || procedures.length === 0) && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 px-2 border-b border-slate-100 pb-2">
                            <div className="flex-1 text-sm font-medium text-slate-800">{surgeryCase.main_procedure}</div>
                        </div>
                    </div>
                )}

                <DUTModal
                    isOpen={isDUTOpen}
                    onClose={() => setIsDUTOpen(false)}
                    procedureCode={selectedDut.code}
                    procedureDescription={selectedDut.description}
                    dutText={selectedDut.text}
                />
            </div>

            {/* 4. DOCUMENTOS */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader icon={FileText} title="4. DOCUMENTOS SOLICITADOS" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc) => {
                        const docTitle = doc.type === 'personalizado' ? (doc.custom_name || 'Personalizado') : (doc.type || 'Documento');

                        return (
                            <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <FileText className="w-5 h-5 text-primary-500" />
                                <span className="text-sm font-medium text-slate-700 capitalize">{docTitle.replace('_', ' ')}</span>
                            </div>
                        )
                    })}
                    {documents.length === 0 && <p className="text-xs text-slate-400 italic col-span-2">Nenhum documento solicitado no pedido médico original.</p>}
                </div>
            </div>

            {/* 5. MATERIAIS ESPECIAIS (OPME) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader icon={Package} title="5. MATERIAIS ESPECIAIS (OPME)" />

                <div className="grid grid-cols-12 gap-4 px-2 mb-2 border-b border-slate-100 pb-2">
                    <div className="col-span-10 text-[10px] font-bold text-slate-400 uppercase">Descrição do Material</div>
                    <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase text-center">Qtd.</div>
                </div>

                {opmeItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-2 pt-2">
                        <div className="col-span-10 text-sm font-medium text-slate-800">{item.description}</div>
                        <div className="col-span-2 text-sm font-bold text-slate-800 text-center">{item.quantity}</div>
                    </div>
                ))}
                {opmeItems.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum item OPME solicitado.</p>}
            </div>

            {/* 6. EQUIPAMENTOS DE SALA */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader icon={Wrench} title="6. EQUIPAMENTOS DE SALA" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {equipmentItems.map((eq) => (
                        <div key={eq.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <Wrench className="w-5 h-5 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">{eq.name}</span>
                        </div>
                    ))}
                    {equipmentItems.length === 0 && <p className="text-xs text-slate-400 italic col-span-2">Nenhum equipamento solicitado.</p>}
                </div>
            </div>
        </div>
    );
};


function StatusSummaryCard({ label, count, icon: Icon, color }: { label: string; count: number; icon: React.ElementType; color: string }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold text-slate-800 leading-none">{count}</p>
            </div>
            <div className={`p-2 rounded-lg bg-slate-50 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    );
}



const EquipmentsTab: React.FC<{
    surgeryCase: any;
    equipmentItems: any[];
    onUpdate: () => void;
}> = ({ surgeryCase, equipmentItems, onUpdate }) => {

    const handleChecklistUpdate = async (id: string, field: string, value: boolean) => {
        try {
            const { error } = await supabase
                .from('order_equipments')
                .update({ [field]: value })
                .eq('id', id);

            if (error) throw error;
            onUpdate();
        } catch (error) {
            toast.error('Erro ao atualizar checklist');
        }
    };

    const handleLogisticsUpdate = async (id: string, updates: any) => {
        try {
            const { error } = await supabase
                .from('order_equipments')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            toast.success('Logística atualizada');
            onUpdate();
        } catch (error) {
            toast.error('Erro ao atualizar logística');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Logística de Equipamentos</h3>
                    <p className="text-sm text-slate-500">Gestão de sala, horários e check-list de funcionamento.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        title="Filtrar Equipamentos"
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" /> Filtrar
                    </button>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatusSummaryCard label="Total Solicitado" count={equipmentItems.length} icon={Package} color="text-primary-600" />
                <StatusSummaryCard label="Prontos" count={equipmentItems.filter(e => e.status === 'ready').length} icon={Check} color="text-emerald-500" />
                <StatusSummaryCard label="Pendentes" count={equipmentItems.filter(e => e.status === 'pending').length} icon={MoreHorizontal} color="text-amber-500" />
                <StatusSummaryCard label="Indisponíveis" count={equipmentItems.filter(e => e.status === 'not_available').length} icon={AlertCircle} color="text-red-500" />
            </div>

            {/* Equipment List */}
            <div className="space-y-4">
                {equipmentItems.map(eq => (
                    <EquipmentCard
                        key={eq.id}
                        eq={eq}
                        surgeryCase={surgeryCase}
                        onChecklistUpdate={(field, value) => handleChecklistUpdate(eq.id, field, value)}
                        onLogisticsUpdate={(updates) => handleLogisticsUpdate(eq.id, updates)}
                        onStatusUpdate={(status) => handleLogisticsUpdate(eq.id, { status })}
                    />
                ))}

                {equipmentItems.length === 0 && (
                    <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <Microscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Nenhum equipamento solicitado pelo médico.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const EquipmentCard: React.FC<{
    eq: any;
    surgeryCase: any;
    onChecklistUpdate: (field: string, value: boolean) => void | Promise<void>;
    onLogisticsUpdate: (updates: any) => void | Promise<void>;
    onStatusUpdate: (status: string) => void | Promise<void>;
}> = ({ eq, surgeryCase, onChecklistUpdate, onLogisticsUpdate, onStatusUpdate }) => {
    const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
    const [cancelType, setCancelType] = useState<'waived' | 'not_available'>('waived');
    const [dispenseReason, setDispenseReason] = useState(eq.dispense_reason || '');
    const { user } = useAuth();

    // Protocols state
    const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
    const [stages, setStages] = useState<any[]>([]);
    const [executions, setExecutions] = useState<any[]>([]);
    const [notes, setNotes] = useState<Record<string, any[]>>({});

    // Timeline interaction state
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const [isSkipping, setIsSkipping] = useState<string | null>(null); // stageId being skipped
    const [skipJustification, setSkipJustification] = useState('');
    const [isRegisteringResponse, setIsRegisteringResponse] = useState<string | null>(null); // stageId
    const [responseIsYes, setResponseIsYes] = useState<string | null>(null); // stageId where user said 'yes'
    const [responseIsNo, setResponseIsNo] = useState<string | null>(null); // stageId where user said 'no', showing sub-options
    const [newDeadline, setNewDeadline] = useState('');
    const [tempResponse, setTempResponse] = useState('');
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [contactEvents, setContactEvents] = useState<Record<string, any[]>>({}); // keyed by execution.id
    const [completedActions, setCompletedActions] = useState<Set<string>>(new Set()); // keyed by `stageId-actionIdx`

    // Undo & Activity Log State
    const [equipmentEvents, setEquipmentEvents] = useState<any[]>([]);
    const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
    const [undoReason, setUndoReason] = useState('');
    const [undoActionType, setUndoActionType] = useState<'Desfazer Confirmação' | 'Desfazer Cancelamento' | null>(null);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

    // Derivações de lógica
    const completedStagesCount = stages.filter(s => {
        const exec = executions.find(e => e.stage_id === s.id);
        return exec?.status === 'completed' || exec?.status === 'skipped';
    }).length;

    const allStagesDone = stages.length > 0 && completedStagesCount === stages.length;

    const allChecklistsDone = stages.every(s => {
        if (!s.actions || s.actions.length === 0) return true;
        return s.actions.every((_: any, idx: number) => completedActions.has(`${s.id}-${idx}`));
    });

    const canConfirmAvailability = allStagesDone && allChecklistsDone && eq.status === 'pending';

    const insertEquipmentEvent = async (action: string, justification?: string) => {
        try {
            const { error } = await supabase.from('case_equipment_events').insert({
                equipment_id: eq.id,
                action,
                justification,
                created_by: user?.id
            });
            if (error) {
                console.error('Error inserting equipment event:', error);
                if (error.code === '42P01') {
                    toast.error('Erro de Banco: A tabela de atividades (case_equipment_events) não existe. Execute o arquivo SQL.', { duration: 6000 });
                }
            }

            // Refetch events locally to update timeline
            const { data } = await supabase
                .from('case_equipment_events')
                .select('*')
                .eq('equipment_id', eq.id)
                .order('created_at', { ascending: false });

            if (data) {
                const userIds = Array.from(new Set(data.filter(e => e.created_by).map(e => e.created_by)));
                if (userIds.length > 0) {
                    const { data: profiles } = await supabase.from('profiles').select('id, full_name, name').in('id', userIds);
                    const profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.full_name || p.name }), {});
                    setEquipmentEvents(data.map(e => ({ ...e, user_name: profilesMap[e.created_by] || 'Sistema' })));
                } else {
                    setEquipmentEvents(data.map(e => ({ ...e, user_name: 'Sistema' })));
                }
            }
        } catch (e) {
            console.error('Failed to insert equipment event', e);
        }
    };

    const handleConfirmAvailability = async () => {
        if (!canConfirmAvailability) return;
        try {
            await onStatusUpdate('ready');
            await insertEquipmentEvent('Confirmado');
            toast.success('Disponibilidade confirmada!');
        } catch (error) {
            toast.error('Erro ao confirmar disponibilidade.');
        }
    };

    // Fetch protocol info
    useEffect(() => {
        const fetchProtocolsAndExecutions = async () => {
            if (!eq.name || !surgeryCase?.clinic_id || !surgeryCase?.id) return;

            try {
                // Fetch protocol ID matching the equipment name
                const { data: protocol } = await supabase
                    .from('protocols')
                    .select('id')
                    .eq('clinic_id', surgeryCase.clinic_id)
                    .eq('type', 'equipment')
                    .eq('name', eq.name)
                    .eq('active', true)
                    .single();

                if (protocol) {
                    // Fetch stages for this protocol
                    const { data: stgData } = await supabase
                        .from('protocol_stages')
                        .select('*')
                        .eq('protocol_id', protocol.id)
                        .order('order_index');

                    if (stgData && stgData.length > 0) {
                        const stageIds = stgData.map(s => s.id);

                        // Fetch actions
                        const { data: actionsData } = await supabase
                            .from('protocol_actions')
                            .select('*')
                            .in('stage_id', stageIds);

                        const stagesWithActions = stgData.map(stg => ({
                            ...stg,
                            actions: actionsData ? actionsData.filter(a => a.stage_id === stg.id) : []
                        }));

                        setStages(stagesWithActions);

                        // Fetch executions — filtered by entity_id (eq.id) to isolate per equipment instance
                        const { data: execData } = await supabase
                            .from('case_protocol_executions')
                            .select('*')
                            .eq('case_id', surgeryCase.id)
                            .eq('entity_id', eq.id)
                            .in('stage_id', stageIds);

                        setExecutions(execData || []);

                        if (execData && execData.length > 0) {
                            // Hydrate completed actions
                            const loadedActions = new Set<string>();
                            execData.forEach((exec: any) => {
                                try {
                                    let parsedActions = exec.completed_actions;
                                    if (typeof parsedActions === 'string') {
                                        parsedActions = JSON.parse(parsedActions);
                                    }
                                    if (Array.isArray(parsedActions)) {
                                        parsedActions.forEach((idx: number) => {
                                            loadedActions.add(`${exec.stage_id}-${idx}`);
                                        });
                                    }
                                } catch (e) {
                                    console.error("Error parsing completed_actions for stage", exec.stage_id, e);
                                }
                            });
                            setCompletedActions(loadedActions);

                            const execIds = execData.map(e => e.id);

                            // Fetch notes
                            const { data: notesData } = await supabase
                                .from('case_protocol_notes')
                                .select('*')
                                .in('execution_id', execIds)
                                .order('created_at', { ascending: true });

                            if (notesData) {
                                const notesMap: Record<string, any[]> = {};
                                notesData.forEach(note => {
                                    if (!notesMap[note.execution_id]) notesMap[note.execution_id] = [];
                                    notesMap[note.execution_id].push(note);
                                });
                                setNotes(notesMap);
                            }

                            // Fetch contact events history
                            const { data: eventsData } = await supabase
                                .from('case_contact_events')
                                .select('*')
                                .in('execution_id', execIds)
                                .order('created_at', { ascending: true });

                            if (eventsData) {
                                const eventsMap: Record<string, any[]> = {};
                                eventsData.forEach(ev => {
                                    if (!eventsMap[ev.execution_id]) eventsMap[ev.execution_id] = [];
                                    eventsMap[ev.execution_id].push(ev);
                                });
                                setContactEvents(eventsMap);
                            }
                        }
                    } else {
                        setStages([]);
                        setExecutions([]);
                        setNotes({});
                        setContactEvents({});
                    }
                }

                // 6. Fetch equipment events
                const { data: eqEventsData } = await supabase
                    .from('case_equipment_events')
                    .select('*')
                    .eq('equipment_id', eq.id)
                    .order('created_at', { ascending: false });

                if (eqEventsData) {
                    const userIds = Array.from(new Set(eqEventsData.filter(e => e.created_by).map(e => e.created_by)));
                    if (userIds.length > 0) {
                        const { data: profiles } = await supabase.from('profiles').select('id, full_name, name').in('id', userIds);
                        const profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.full_name || p.name }), {});
                        setEquipmentEvents(eqEventsData.map(e => ({ ...e, user_name: profilesMap[e.created_by] || 'Sistema' })));
                    } else {
                        setEquipmentEvents(eqEventsData.map(e => ({ ...e, user_name: 'Sistema' })));
                    }
                }

            } catch (error) {
                console.error("Error fetching protocols:", error);
            }
        };

        if (isProtocolModalOpen) {
            fetchProtocolsAndExecutions();
        }
    }, [isProtocolModalOpen, eq.name, surgeryCase?.clinic_id, surgeryCase?.id, eq.id]);

    const handleUndoAction = async () => {
        if (!undoReason || undoReason.trim().length < 10) {
            toast.error('Justificativa deve ter pelo menos 10 caracteres.');
            return;
        }

        if (!undoActionType) return;

        try {
            await onLogisticsUpdate({
                status: 'pending',
                dispense_reason: null
            });
            await insertEquipmentEvent(undoActionType, undoReason.trim());
            setIsUndoModalOpen(false);
            setUndoReason('');
            setUndoActionType(null);
            toast.success(`Ação desfeita com sucesso. Equipamento voltou para pendente.`);
        } catch (error) {
            console.error('Error undoing action:', error);
            toast.error('Erro ao desfazer ação.');
        }
    };

    const handleDispense = async () => {
        if (!dispenseReason || dispenseReason.trim().length < 10) {
            toast.error('Justificativa deve ter pelo menos 10 caracteres.');
            return;
        }

        try {
            await onLogisticsUpdate({
                status: cancelType,
                dispense_reason: dispenseReason.trim()
            });
            await insertEquipmentEvent(cancelType === 'waived' ? 'Dispensado' : 'Indisponível', dispenseReason.trim());
            setIsDispenseModalOpen(false);
            setDispenseReason('');
            toast.success(`Equipamento ${cancelType === 'waived' ? 'dispensado' : 'marcado como indisponível'}.`);
        } catch (error) {
            console.error('Error dispensing equipment:', error);
            toast.error('Erro ao atualizar status do equipamento.');
        }
    };

    const handleUpdateExecution = async (stageId: string, updates: any) => {
        try {
            const existing = executions.find(e => e.stage_id === stageId);
            if (existing) {
                const { data, error } = await supabase
                    .from('case_protocol_executions')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', existing.id)
                    .select()
                    .single();
                if (error) throw error;
                setExecutions(prev => prev.map(e => e.id === existing.id ? { ...e, ...data } : e));
            } else {
                // Need protocol_id for new records
                const { data: protocol } = await supabase
                    .from('protocols')
                    .select('id')
                    .eq('clinic_id', surgeryCase.clinic_id)
                    .eq('type', 'equipment')
                    .eq('name', eq.name)
                    .single();

                const { data, error } = await supabase
                    .from('case_protocol_executions')
                    .insert({
                        case_id: surgeryCase.id,
                        protocol_id: protocol?.id,
                        entity_id: eq.id,
                        entity_type: 'equipment',
                        stage_id: stageId,
                        ...updates
                    }).select().single();
                if (error) throw error;
                if (!data) throw new Error("Insert blocked by RLS. No rows returned.");
                setExecutions(prev => [...prev, data]);
            }
            return true;
        } catch (e: any) {
            console.error("Error updating execution:", e);
            if (e?.code === '42703' || (e?.message && e.message.includes('completed_actions'))) {
                toast.error('A coluna "completed_actions" não existe. Execute o script no Supabase SQL Editor.', { duration: 6000 });
            } else if (e?.code === 'PGRST116') {
                toast.error('Erro de Permissão RLS ou Falha ao salvar (Nenhuma linha afetada).', { duration: 6000 });
            } else {
                toast.error(`Erro ao atualizar etapa. Motivo: ${e?.message || 'Desconhecido'}`);
            }
            return false;
        }
    };

    const handleAddNote = async (executionId: string, content: string) => {
        if (!content.trim()) return;
        try {
            const { data, error } = await supabase
                .from('case_protocol_notes')
                .insert({
                    execution_id: executionId,
                    clinic_id: surgeryCase.clinic_id,
                    content
                }).select().single();

            if (error) throw error;
            setNotes(prev => ({
                ...prev,
                [executionId]: [...(prev[executionId] || []), data]
            }));
            toast.success('Nota adicionada');
        } catch (e) {
            toast.error('Erro ao salvar nota');
        }
    };



    // Auto-expand the first non-completed stage when modal opens
    useEffect(() => {
        if (isProtocolModalOpen && stages.length > 0) {
            const firstPending = stages.find(s => {
                const exec = executions.find(e => e.stage_id === s.id);
                return !exec || (exec.status !== 'completed' && exec.status !== 'skipped');
            });
            setExpandedStage(firstPending ? firstPending.id : stages[stages.length - 1].id);
        }
    }, [isProtocolModalOpen, stages.length]);

    const handleCopyScript = async (text: string, stageId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyFeedback(stageId);
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch {
            toast.error('Não foi possível copiar.');
        }
    };

    const insertContactEvent = async (executionId: string, eventType: string, content?: string) => {
        if (!executionId) return null;
        const { data, error } = await supabase
            .from('case_contact_events')
            .insert({ execution_id: executionId, event_type: eventType, content: content || null })
            .select()
            .single();
        if (error) { console.error('Contact event insert error:', error); return null; }
        // Update local state immediately
        if (data) {
            setContactEvents(prev => ({
                ...prev,
                [executionId]: [...(prev[executionId] || []), data]
            }));
        }
        return data;
    };

    const handleSendWhatsApp = (stageId: string, text: string, phone: string) => {
        const encoded = encodeURIComponent(text);
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
        const exec = executions.find(e => e.stage_id === stageId);
        const now = new Date().toISOString();
        // Insert event (fire-and-forget)
        if (exec?.id) insertContactEvent(exec.id, 'sent_whatsapp');
        // Update execution current state
        handleUpdateExecution(stageId, {
            message_sent_at: now,
            responded_status: null,
            response_content: null,
            responded_at: null
        });
    };

    const handleSendEmail = (text: string, email: string) => {
        const encoded = encodeURIComponent(text);
        window.open(`mailto:${email}?body=${encoded}`, '_blank');
    };

    const handleRegisterSent = (stageId: string) => {
        const exec = executions.find(e => e.stage_id === stageId);
        const now = new Date().toISOString();
        if (exec?.id) insertContactEvent(exec.id, 'sent_manual');
        handleUpdateExecution(stageId, {
            message_sent_at: now,
            responded_status: null,
            response_content: null,
            responded_at: null
        });
    };

    const handleSaveResponse = (stageId: string, responded: boolean, content?: string) => {
        const exec = executions.find(e => e.stage_id === stageId);
        const eventType = responded ? 'responded_yes' : 'responded_no';
        const finalContent = responded ? (content || '') : 'Finalizado sem retorno';
        if (exec?.id) insertContactEvent(exec.id, eventType, finalContent);
        handleUpdateExecution(stageId, {
            responded_status: responded ? 'sim_respondeu' : 'nao_respondeu',
            response_content: finalContent,
            responded_at: new Date().toISOString()
        });
        setIsRegisteringResponse(null);
        setResponseIsYes(null);
        setResponseIsNo(null);
        setTempResponse('');
        setNewDeadline('');
    };

    const handleSetNewDeadline = (stageId: string, deadline: string) => {
        if (!deadline) { toast.error('Informe uma data para o novo prazo.'); return; }
        const exec = executions.find(e => e.stage_id === stageId);
        if (exec?.id) insertContactEvent(exec.id, 'postponed', `Novo prazo: ${deadline}`);
        handleUpdateExecution(stageId, {
            responded_status: 'aguardando_retorno',
            response_content: `Novo prazo: ${deadline}`,
            responded_at: new Date().toISOString()
        });
        setIsRegisteringResponse(null);
        setResponseIsNo(null);
        setNewDeadline('');
    };

    const handleSkipStage = (stageId: string) => {
        if (!skipJustification || skipJustification.trim().length < 10) {
            toast.error('Informe uma justificativa com pelo menos 10 caracteres.');
            return;
        }
        handleUpdateExecution(stageId, {
            status: 'skipped',
            skip_justification: skipJustification.trim()
        });
        setIsSkipping(null);
        setSkipJustification('');
    };

    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 overflow-hidden transition-all ${eq.status === 'ready' ? 'border-l-emerald-500' :
            eq.status === 'waived' ? 'border-l-slate-400' :
                eq.status === 'pending' ? 'border-l-amber-400' : 'border-l-red-500'
            }`}>
            <div className="p-6 flex justify-between items-center">
                <div className="flex gap-4 items-center flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${eq.status === 'ready' ? 'bg-emerald-50 text-emerald-600' :
                        eq.status === 'waived' ? 'bg-slate-50 text-slate-600' :
                            eq.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                        }`}>
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {eq.name}
                                {eq.status === 'not_available' && (
                                    <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" title="Equipamento Indisponível" />
                                )}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${eq.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                                eq.status === 'waived' ? 'bg-slate-100 text-slate-700' :
                                    eq.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {eq.status === 'ready' ? 'Confirmado' : eq.status === 'waived' ? 'Dispensado' : eq.status === 'pending' ? 'Pendente' : 'Indisponível'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                            {eq.room ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {eq.room}</span> : <span>Sala não alocada</span>}
                            {eq.scheduled_time && <span>• {new Date(eq.scheduled_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                            <span className="ml-2 font-bold text-primary-600 border-l border-slate-200 pl-3">
                                {stages.length > 0 ? `${completedStagesCount} de ${stages.length} etapas` : 'Nenhum protocolo'}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setIsProtocolModalOpen(true)}
                        title="Abrir Protocolo de Navegação"
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide flex items-center gap-2"
                    >
                        Abrir Protocolo
                    </button>
                </div>
            </div>

            {isDispenseModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in ring-1 ring-slate-900/5">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Cancelar Equipamento</h3>
                                <p className="text-sm text-slate-500 mt-1">Selecione o motivo do cancelamento</p>
                            </div>
                            <button
                                onClick={() => setIsDispenseModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Motivo do Cancelamento</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => setCancelType('waived')}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${cancelType === 'waived'
                                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/10'
                                            : 'border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cancelType === 'waived' ? 'border-amber-500' : 'border-slate-300'}`}>
                                            {cancelType === 'waived' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">Dispensado pelo profissional</p>
                                            <p className="text-xs text-slate-500">O equipamento não será necessário</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setCancelType('not_available')}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${cancelType === 'not_available'
                                            ? 'border-red-500 bg-red-50/50 ring-2 ring-red-500/10'
                                            : 'border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cancelType === 'not_available' ? 'border-red-500' : 'border-slate-300'}`}>
                                            {cancelType === 'not_available' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">Indisponível na data</p>
                                            <p className="text-xs text-slate-500">Hospital não possui o equipamento</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Justificativa (Mín. 10 letras)</label>
                                <textarea
                                    value={dispenseReason}
                                    onChange={(e) => setDispenseReason(e.target.value)}
                                    placeholder="Explique o motivo do cancelamento..."
                                    className="w-full h-32 p-4 text-sm bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none shadow-inner"
                                />
                                <div className="flex justify-between mt-1">
                                    <span className={`text-[10px] font-bold ${dispenseReason.length < 10 ? 'text-red-400' : 'text-emerald-500'}`}>
                                        {dispenseReason.length}/10 caracteres
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsDispenseModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleDispense}
                                disabled={dispenseReason.trim().length < 10}
                                className="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Confirmar Cancelamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isUndoModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in ring-1 ring-slate-900/5">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">{undoActionType}</h3>
                                <p className="text-sm text-slate-500 mt-1">Por favor, justifique esta ação</p>
                            </div>
                            <button onClick={() => setIsUndoModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Justificativa (Mín. 10 letras)</label>
                            <textarea
                                value={undoReason}
                                onChange={(e) => setUndoReason(e.target.value)}
                                placeholder="Descreva o motivo..."
                                className="w-full h-32 p-4 text-sm bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none shadow-inner"
                            />
                            <div className="flex justify-between mt-1">
                                <span className={`text-[10px] font-bold ${undoReason.length < 10 ? 'text-red-400' : 'text-emerald-500'}`}>
                                    {undoReason.length}/10 caracteres
                                </span>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsUndoModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">Voltar</button>
                            <button
                                onClick={handleUndoAction}
                                disabled={undoReason.trim().length < 10}
                                className="px-6 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <RefreshCcw className="w-4 h-4" /> Confirmar Desfazer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Protocol Modal */}
            {isProtocolModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 animate-fade-in shadow-lg">
                    <div className="bg-white w-full max-w-6xl rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden ring-1 ring-slate-900/5 relative">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 tracking-tight flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-primary-500" /> Protocolo de Navegação: {eq.name}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Acompanhe as etapas e controle a disponibilidade deste equipamento.</p>
                            </div>
                            <div className="flex items-center gap-5">
                                <button
                                    onClick={() => setIsActivityLogOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-bold ring-1 ring-blue-500/20 active:scale-95"
                                >
                                    <List className="w-4 h-4" /> Registro de Atividades
                                </button>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Status:</label>
                                    {(() => {
                                        const s = eq.status;
                                        const cfg = s === 'ready'
                                            ? { label: 'Confirmado', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
                                            : s === 'waived'
                                                ? { label: 'Dispensado', cls: 'bg-slate-100 text-slate-600 border border-slate-200' }
                                                : s === 'not_available'
                                                    ? { label: 'Indisponível', cls: 'bg-red-100 text-red-700 border border-red-200' }
                                                    : { label: 'Pendente', cls: 'bg-amber-100 text-amber-700 border border-amber-200' };
                                        return (
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${cfg.cls}`}>
                                                {cfg.label}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <button
                                    onClick={() => setIsProtocolModalOpen(false)}
                                    title="Fechar protocolo"
                                    className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <h5 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <ListTodo className="w-4 h-4 text-slate-400" />
                                    Etapas do Protocolo
                                </h5>
                                <span className="text-xs font-bold text-slate-400">
                                    {completedStagesCount} de {stages.length} concluídas
                                </span>
                            </div>

                            {stages.length > 0 ? (
                                <div className="relative space-y-3 before:content-[''] before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200">
                                    {stages.map((stage, idx) => {
                                        const execution = executions.find(e => e.stage_id === stage.id);
                                        const status = execution?.status || 'pending';
                                        const messageSentAt = execution?.message_sent_at;
                                        const respondedStatus = execution?.responded_status;
                                        const responseContent = execution?.response_content;

                                        const isCompleted = status === 'completed';
                                        const isSkipped = status === 'skipped';
                                        const isActive = !isCompleted && !isSkipped && stages.slice(0, idx).every(s => {
                                            const prevExec = executions.find(e => e.stage_id === s.id);
                                            return prevExec?.status === 'completed' || prevExec?.status === 'skipped';
                                        });
                                        const isOpen = expandedStage === stage.id;
                                        const phone = surgeryCase?.patient?.phone || surgeryCase?.patient?.whatsapp || '';
                                        const email = surgeryCase?.patient?.email || '';

                                        return (
                                            <div key={stage.id} className="relative pl-12">
                                                {/* Circle icon */}
                                                <div className={`absolute left-0 top-3 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm transition-all ${isSkipped ? 'bg-amber-400 text-white' :
                                                    isCompleted ? 'bg-emerald-500 text-white' :
                                                        isActive ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                                                            'bg-slate-200 text-slate-500'
                                                    }`}>
                                                    {isSkipped ? <span className="text-xs font-bold">→</span> :
                                                        isCompleted ? <Check className="w-4 h-4" /> :
                                                            <span className="text-xs font-bold">{idx + 1}</span>}
                                                </div>

                                                {/* Card */}
                                                <div className={`rounded-xl border-2 shadow-sm overflow-hidden transition-all duration-200 ${isSkipped ? 'border-amber-200 opacity-80' :
                                                    isCompleted ? 'border-emerald-100 opacity-80' :
                                                        isActive ? 'border-primary-200' :
                                                            'border-slate-100 opacity-60'
                                                    }`}>
                                                    {/* Card Header */}
                                                    <button
                                                        type="button"
                                                        className={`w-full px-5 py-4 flex justify-between items-center text-left transition-colors ${isSkipped ? 'bg-amber-50/60 hover:bg-amber-50' :
                                                            isCompleted ? 'bg-emerald-50/50 hover:bg-emerald-50' :
                                                                isActive ? 'bg-primary-50/40 hover:bg-primary-50/60' :
                                                                    'bg-slate-50/60 hover:bg-slate-100'
                                                            }`}
                                                        onClick={() => setExpandedStage(isOpen ? null : stage.id)}
                                                        aria-expanded={isOpen}
                                                        title={isOpen ? 'Recolher etapa' : 'Expandir etapa'}
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h3 className={`font-bold text-sm leading-none ${isSkipped ? 'text-amber-700' :
                                                                    isCompleted ? 'text-emerald-700' :
                                                                        isActive ? 'text-primary-700' :
                                                                            'text-slate-400'
                                                                    }`}>
                                                                    {stage.title}
                                                                </h3>
                                                                {isSkipped && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-widest">Etapa Pulada</span>}
                                                                {isCompleted && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-widest">Concluído</span>}
                                                                {isActive && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 uppercase tracking-widest">Em Andamento</span>}
                                                                {!isActive && !isCompleted && !isSkipped && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-widest">Aguardando</span>}
                                                            </div>
                                                            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isSkipped ? 'text-amber-500' : isCompleted ? 'text-emerald-500' : isActive ? 'text-primary-500/80' : 'text-slate-400'
                                                                }`}>
                                                                {isSkipped ? 'Ignorado' : isCompleted ? 'Finalizado' : isActive ? 'Em Andamento' : 'Futuro'}
                                                            </p>
                                                        </div>
                                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {/* Expanded content */}
                                                    {isOpen && (
                                                        <div className="p-5 bg-white border-t border-slate-100 animate-in slide-in-from-top-1 duration-200">

                                                            {/* Script section */}
                                                            <div className="mb-5 rounded-xl border border-slate-200 overflow-hidden">
                                                                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                                                                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                                                                        Script Sugerido
                                                                    </label>
                                                                    {isActive && (
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => handleCopyScript(stage.message_template || '', stage.id)}
                                                                                title="Copiar para clipboard"
                                                                                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 hover:bg-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-transparent hover:border-slate-200"
                                                                            >
                                                                                {copyFeedback === stage.id ? <><Check className="w-3 h-3 text-emerald-500" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                                                                            </button>
                                                                            {phone && (
                                                                                <button
                                                                                    onClick={() => handleSendWhatsApp(stage.id, stage.message_template || '', phone)}
                                                                                    title="Enviar via WhatsApp"
                                                                                    className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5C] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                                                                                >
                                                                                    <Send className="w-3 h-3" /> WhatsApp
                                                                                </button>
                                                                            )}
                                                                            {email && (
                                                                                <button
                                                                                    onClick={() => handleSendEmail(stage.message_template || '', email)}
                                                                                    title="Enviar via Email"
                                                                                    className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                                                                                >
                                                                                    <Mail className="w-3 h-3" /> Email
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="p-4 bg-white">
                                                                    <p className="text-[13px] text-slate-700 leading-relaxed font-medium whitespace-pre-wrap select-text">
                                                                        {stage.message_template || <span className="text-slate-400 italic font-normal">Nenhum modelo configurado para esta etapa.</span>}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Contact Control — sequential flow */}

                                                            <div className={`rounded-xl border p-4 mb-5 ${!messageSentAt ? 'bg-slate-50 border-slate-200 border-dashed' :
                                                                respondedStatus ? (respondedStatus === 'sim_respondeu' ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200') :
                                                                    'bg-blue-50/50 border-blue-200'
                                                                }`}>
                                                                <h6 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-3">
                                                                    <Phone className="w-3.5 h-3.5" /> Controle de Contato
                                                                </h6>

                                                                {/* Contact Event Timeline */}
                                                                {(() => {
                                                                    const execEvents: any[] = execution?.id ? (contactEvents[execution.id] || []) : [];
                                                                    const lastEvent = execEvents[execEvents.length - 1];
                                                                    const lastEventType = lastEvent?.event_type || null;
                                                                    // Determine if we're still awaiting response (last action was a send or postponement)
                                                                    const awaitingResponse = !lastEvent || lastEventType === 'sent_manual' || lastEventType === 'sent_whatsapp' || lastEventType === 'postponed';
                                                                    const isClosed = lastEventType === 'responded_yes' || lastEventType === 'responded_no';

                                                                    const formatDT = (iso: string) =>
                                                                        new Date(iso).toLocaleDateString('pt-BR') + ' · ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                                                                    const EventIcon = ({ type }: { type: string }) => {
                                                                        if (type === 'sent_whatsapp') return <MessageSquare className="w-3.5 h-3.5" />;
                                                                        if (type === 'sent_manual') return <Check className="w-3.5 h-3.5" />;
                                                                        if (type === 'postponed') return <Clock className="w-3.5 h-3.5" />;
                                                                        if (type === 'responded_yes') return <ThumbsUp className="w-3.5 h-3.5" />;
                                                                        if (type === 'responded_no') return <ThumbsDown className="w-3.5 h-3.5" />;
                                                                        return <Clock className="w-3.5 h-3.5" />;
                                                                    };

                                                                    const eventColor = (type: string) => {
                                                                        if (type === 'sent_whatsapp' || type === 'sent_manual') return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-500', text: 'text-emerald-700' };
                                                                        if (type === 'postponed') return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-500', text: 'text-amber-700' };
                                                                        if (type === 'responded_yes') return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-600', text: 'text-emerald-700' };
                                                                        if (type === 'responded_no') return { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-500', text: 'text-rose-700' };
                                                                        return { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-400', text: 'text-slate-600' };
                                                                    };

                                                                    const eventLabel = (type: string) => {
                                                                        if (type === 'sent_whatsapp') return 'Enviado via WhatsApp';
                                                                        if (type === 'sent_manual') return 'Envio registrado manualmente';
                                                                        if (type === 'postponed') return 'Prorrogado';
                                                                        if (type === 'responded_yes') return 'Parceiro respondeu';
                                                                        if (type === 'responded_no') return 'Finalizado sem retorno';
                                                                        return type;
                                                                    };

                                                                    return (
                                                                        <div className="space-y-2">
                                                                            {/* No events yet — Phase 1 */}
                                                                            {execEvents.length === 0 && (
                                                                                <div className="flex items-center justify-between py-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="size-2 rounded-full bg-slate-400 animate-pulse" />
                                                                                        <p className="text-sm font-medium text-slate-600">
                                                                                            {isActive ? 'Aguardando envio da mensagem...' : 'Nenhum contato registrado.'}
                                                                                        </p>
                                                                                    </div>
                                                                                    {isActive && (
                                                                                        <button
                                                                                            onClick={() => handleRegisterSent(stage.id)}
                                                                                            title="Registrar que a mensagem foi enviada manualmente"
                                                                                            className="text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                                                                        >
                                                                                            Registrar Envio Manualmente
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {/* Event timeline rows */}
                                                                            {execEvents.map((ev, idx) => {
                                                                                const colors = eventColor(ev.event_type);
                                                                                const isLast = idx === execEvents.length - 1;
                                                                                const deadlineRaw = ev.event_type === 'postponed' ? (ev.content || '').replace('Novo prazo: ', '').trim() : null;
                                                                                const deadlineFormatted = deadlineRaw
                                                                                    ? new Date(deadlineRaw + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                                                                                    : null;
                                                                                return (
                                                                                    <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border} ${!isLast ? 'opacity-80' : ''}`}>
                                                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colors.icon} text-white`}>
                                                                                            <EventIcon type={ev.event_type} />
                                                                                        </div>
                                                                                        <div className="flex-1 space-y-0.5">
                                                                                            <p className={`text-[10px] font-bold uppercase tracking-wide ${colors.text}`}>{eventLabel(ev.event_type)}</p>
                                                                                            <p className="text-[10px] text-slate-400 font-medium">{formatDT(ev.created_at)}</p>
                                                                                            {ev.event_type === 'postponed' && deadlineFormatted && (
                                                                                                <p className="text-xs font-bold text-amber-800 mt-1">Novo prazo: {deadlineFormatted}</p>
                                                                                            )}
                                                                                            {(ev.event_type === 'responded_yes' || ev.event_type === 'responded_no') && ev.content && ev.content !== 'Finalizado sem retorno' && (
                                                                                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{ev.content}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}

                                                                            {/* Awaiting response connector + action */}
                                                                            {execEvents.length > 0 && awaitingResponse && isActive && (
                                                                                <div className="flex items-center justify-between pl-3 ml-3 border-l-2 border-dashed border-slate-300 py-2">
                                                                                    <p className="text-xs font-medium text-slate-500 italic">Aguardando retorno do parceiro...</p>
                                                                                    {isRegisteringResponse !== stage.id && (
                                                                                        <button
                                                                                            onClick={() => setIsRegisteringResponse(stage.id)}
                                                                                            title="Registrar resposta do parceiro"
                                                                                            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
                                                                                        >
                                                                                            <MessageSquare className="w-3 h-3" /> Registrar Solicitação
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {/* Closed state: allow new send if desired */}
                                                                            {isClosed && isActive && (
                                                                                <button
                                                                                    onClick={() => handleRegisterSent(stage.id)}
                                                                                    title="Registrar novo envio de mensagem"
                                                                                    className="w-full text-[10px] font-bold text-slate-500 hover:text-primary-600 border border-dashed border-slate-300 hover:border-primary-300 py-1.5 rounded-lg transition-colors mt-1"
                                                                                >
                                                                                    + Registrar Novo Envio
                                                                                </button>
                                                                            )}

                                                                            {/* Registering response form */}
                                                                            {isRegisteringResponse === stage.id && (
                                                                                <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                                                                    {responseIsYes !== stage.id && responseIsNo !== stage.id && (
                                                                                        <>
                                                                                            <p className="text-sm font-bold text-slate-800 text-center">Parceiro respondeu?</p>
                                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                                <button onClick={() => setResponseIsYes(stage.id)} title="Parceiro respondeu" className="px-3 py-3 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                                                                                    <ThumbsUp className="w-4 h-4" /> Sim, respondeu
                                                                                                </button>
                                                                                                <button onClick={() => setResponseIsNo(stage.id)} title="Parceiro não respondeu" className="px-3 py-3 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                                                                                    <ThumbsDown className="w-4 h-4" /> Não respondeu
                                                                                                </button>
                                                                                            </div>
                                                                                            <button onClick={() => setIsRegisteringResponse(null)} className="w-full text-[10px] text-slate-400 hover:text-slate-600 text-center py-1 transition-colors">Cancelar</button>
                                                                                        </>
                                                                                    )}
                                                                                    {responseIsYes === stage.id && (
                                                                                        <>
                                                                                            <p className="text-xs font-bold text-slate-700">Resumo da resposta:</p>
                                                                                            <textarea
                                                                                                value={tempResponse}
                                                                                                onChange={e => setTempResponse(e.target.value)}
                                                                                                placeholder="Descreva o que o parceiro respondeu..."
                                                                                                className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                                                                                            />
                                                                                            <div className="flex gap-2 justify-end">
                                                                                                <button onClick={() => setResponseIsYes(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Voltar</button>
                                                                                                <button onClick={() => handleSaveResponse(stage.id, true, tempResponse)} className="px-4 py-1.5 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                                                                                                    <Check className="w-3 h-3" /> Salvar Resposta
                                                                                                </button>
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                    {responseIsNo === stage.id && (
                                                                                        <div className="space-y-3 animate-in fade-in duration-200">
                                                                                            <p className="text-xs font-bold text-rose-700 text-center">Parceiro não respondeu. O que deseja fazer?</p>
                                                                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                                                                                                <p className="text-[10px] font-bold uppercase text-amber-700">Registrar novo prazo de retorno</p>
                                                                                                <input
                                                                                                    type="date"
                                                                                                    value={newDeadline}
                                                                                                    onChange={e => setNewDeadline(e.target.value)}
                                                                                                    title="Nova data para retorno"
                                                                                                    className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-300"
                                                                                                />
                                                                                                <button onClick={() => handleSetNewDeadline(stage.id, newDeadline)} title="Salvar novo prazo" className="w-full py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all">Salvar Novo Prazo</button>
                                                                                            </div>
                                                                                            <button onClick={() => handleSaveResponse(stage.id, false)} title="Finalizar sem retorno" className="w-full py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all">
                                                                                                Finalizar como Sem Retorno
                                                                                            </button>
                                                                                            <button onClick={() => setResponseIsNo(null)} className="w-full text-[10px] text-slate-400 hover:text-slate-600 text-center py-1 transition-colors">Voltar</button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>

                                                            {/* Checklist de Ações */}
                                                            {stage.actions && stage.actions.length > 0 && (
                                                                <div className="mb-5 rounded-xl border border-slate-200 overflow-hidden">
                                                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                                                                            <ListTodo className="w-3.5 h-3.5 text-primary-500" />
                                                                            Checklist de Ações ({stage.actions.length})
                                                                        </label>
                                                                    </div>
                                                                    <ul className="p-4 space-y-2 bg-white">
                                                                        {stage.actions.map((action: any, aIdx: number) => {
                                                                            const actionKey = `${stage.id}-${aIdx}`;
                                                                            const isChecked = completedActions.has(actionKey);
                                                                            const desc = typeof action === 'string' ? action : action.description;
                                                                            return (
                                                                                <li key={aIdx} className="flex items-center gap-3">
                                                                                    <button
                                                                                        type="button"
                                                                                        title={isChecked ? 'Desmarcar ação' : 'Marcar ação como feita'}
                                                                                        onClick={async () => {
                                                                                            const prevState = new Set(completedActions);
                                                                                            const nextState = new Set(completedActions);
                                                                                            if (nextState.has(actionKey)) nextState.delete(actionKey); else nextState.add(actionKey);
                                                                                            setCompletedActions(nextState);

                                                                                            const currentStageCompleted = Array.from(nextState as Set<string>)
                                                                                                .filter(k => k.startsWith(`${stage.id}-`))
                                                                                                .map(k => parseInt(k.slice(stage.id.length + 1), 10)); // Extract the numbers AFTER the UUID and hyphen

                                                                                            const success = await handleUpdateExecution(stage.id, { completed_actions: currentStageCompleted });
                                                                                            if (!success) {
                                                                                                setCompletedActions(prevState);
                                                                                            }
                                                                                        }}
                                                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-primary-400'}`}
                                                                                    >
                                                                                        {isChecked && <Check className="w-3 h-3" />}
                                                                                    </button>
                                                                                    <span className={`text-sm leading-snug ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{desc}</span>
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {/* Footer actions */}
                                                            {isActive && (
                                                                <div className="border-t border-slate-100 pt-4">
                                                                    {isSkipping === stage.id ? (
                                                                        <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in duration-200">
                                                                            <p className="text-xs font-bold text-amber-700">Justificativa para pular esta etapa (mín. 10 caracteres):</p>
                                                                            <textarea
                                                                                value={skipJustification}
                                                                                onChange={e => setSkipJustification(e.target.value)}
                                                                                placeholder="Informe o motivo..."
                                                                                className="w-full h-20 p-3 text-sm bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                                                                            />
                                                                            <div className="flex gap-2 justify-end">
                                                                                <button onClick={() => setIsSkipping(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                                                                                <button
                                                                                    onClick={() => handleSkipStage(stage.id)}
                                                                                    className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition-all"
                                                                                >
                                                                                    Confirmar Skip
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex gap-2 justify-end">
                                                                            <button
                                                                                onClick={() => { setIsSkipping(stage.id); setSkipJustification(''); }}
                                                                                title="Pular esta etapa com justificativa"
                                                                                className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all"
                                                                            >
                                                                                Pular Etapa
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleUpdateExecution(stage.id, { status: 'completed', completed_at: new Date().toISOString() })}
                                                                                title="Marcar esta etapa como concluída"
                                                                                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                                                                            >
                                                                                <Check className="w-3.5 h-3.5" /> Concluir Etapa
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                            }

                                                            {/* Skip justification display */}
                                                            {
                                                                isSkipped && execution?.skip_justification && (
                                                                    <div className="border-t border-amber-100 pt-3 mt-2">
                                                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Justificativa:</p>
                                                                        <p className="text-xs text-amber-800 italic">{execution.skip_justification}</p>
                                                                    </div>
                                                                )
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                    <Clock className="w-12 h-12 text-slate-300 mb-4" />
                                    <h4 className="text-sm font-bold text-slate-700">Protocolo de navegação vazio</h4>
                                    <p className="text-[13px] text-slate-500 mt-2 text-center max-w-sm leading-relaxed">Não encontramos estágios configurados para este equipamento. Acesse as configurações de protocolos.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer actions */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                            <div>
                                {eq.status === 'pending' && (
                                    <button
                                        onClick={() => setIsDispenseModalOpen(true)}
                                        className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Cancelar Equipamento
                                    </button>
                                )}
                                {(eq.status === 'waived' || eq.status === 'not_available') && (
                                    <button
                                        onClick={() => {
                                            setUndoActionType('Desfazer Cancelamento');
                                            setUndoReason('');
                                            setIsUndoModalOpen(true);
                                        }}
                                        className="px-4 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                                    >
                                        <RefreshCcw className="w-4 h-4" /> Desfazer Cancelamento
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {!allChecklistsDone && allStagesDone && eq.status === 'pending' && (
                                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 animate-pulse">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Checklist pendente
                                    </span>
                                )}

                                {eq.status === 'ready' && (
                                    <button
                                        onClick={() => {
                                            setUndoActionType('Desfazer Confirmação');
                                            setUndoReason('');
                                            setIsUndoModalOpen(true);
                                        }}
                                        className="px-4 py-2.5 rounded-xl font-bold bg-white hover:bg-amber-50 border border-amber-200 text-amber-700 transition-all flex items-center gap-2 text-sm shadow-sm active:scale-95"
                                    >
                                        <RefreshCcw className="w-4 h-4" /> Desfazer Confirmação
                                    </button>
                                )}

                                {eq.status === 'pending' && (
                                    <button
                                        onClick={handleConfirmAvailability}
                                        disabled={!canConfirmAvailability}
                                        className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 ${canConfirmAvailability
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 cursor-pointer'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Confirmar Disponibilidade
                                    </button>
                                )}
                            </div>
                        </div>

                        {isActivityLogOpen && (
                            <div className="absolute inset-y-0 right-0 w-full sm:w-[52rem] bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col z-[130] animate-in slide-in-from-right duration-300">
                                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><List className="w-5 h-5 text-slate-500" /> Registro de Atividades</h3>
                                    <button onClick={() => setIsActivityLogOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    {equipmentEvents.length === 0 ? (
                                        <div className="text-center py-10">
                                            <p className="text-sm font-medium text-slate-500 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">Nenhum evento registrado para este equipamento.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                            {equipmentEvents.map((ev, idx) => (
                                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 bg-white text-slate-500 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                        {ev.action.includes('Desfazer') ? <RefreshCcw className="w-4 h-4 text-amber-500" /> : ev.action === 'Confirmado' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                                    </div>
                                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="font-bold text-slate-800 text-[13px]">{ev.action}</div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            <time>{new Date(ev.created_at).toLocaleString('pt-BR')}</time>
                                                        </div>
                                                        {ev.justification && (
                                                            <div className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic break-words whitespace-pre-wrap word-break">
                                                                <span className="font-bold text-slate-700 not-italic block mb-0.5 uppercase tracking-wider text-[9px]">Justificativa</span>
                                                                <p className="max-w-[250px] sm:max-w-full overflow-hidden text-ellipsis">{ev.justification}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ParticipantCard: React.FC<{
    participant: any;
    surgeryCase: any;
    onStatusUpdate: (status: string) => void | Promise<void>;
    onUpdate: () => void;
}> = ({ participant, surgeryCase, onStatusUpdate, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [stages, setStages] = useState<any[]>([]);
    const [executions, setExecutions] = useState<any[]>([]);
    const [notes, setNotes] = useState<Record<string, any[]>>({});
    const [contactEvents, setContactEvents] = useState<Record<string, any[]>>({});
    const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
    const { user } = useAuth();

    // Modal & Interaction States
    const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
    const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
    const [cancelType, setCancelType] = useState<'waived' | 'not_available'>('waived');
    const [dispenseReason, setDispenseReason] = useState('');
    const [undoReason, setUndoReason] = useState('');
    const [undoActionType, setUndoActionType] = useState<'Desfazer Confirmação' | 'Desfazer Cancelamento' | null>(null);

    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const [isSkipping, setIsSkipping] = useState<string | null>(null);
    const [skipJustification, setSkipJustification] = useState('');
    const [isRegisteringResponse, setIsRegisteringResponse] = useState<string | null>(null);
    const [responseIsYes, setResponseIsYes] = useState<string | null>(null);
    const [responseIsNo, setResponseIsNo] = useState<string | null>(null);
    const [newDeadline, setNewDeadline] = useState('');
    const [tempResponse, setTempResponse] = useState('');
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [participantEvents, setParticipantEvents] = useState<any[]>([]);

    const completedStagesCount = stages.filter(s => {
        const exec = executions.find(e => e.stage_id === s.id);
        return exec?.status === 'completed' || exec?.status === 'skipped';
    }).length;

    const allStagesDone = stages.length === 0 || (stages.length > 0 && completedStagesCount === stages.length);

    const allChecklistsDone = stages.every(s => {
        if (!s.actions || s.actions.length === 0) return true;
        return s.actions.every((_: any, idx: number) => completedActions.has(`${s.id}-${idx}`));
    });

    const canConfirmAvailability = participant.status === 'pending';

    const insertParticipantEvent = async (action: string, justification?: string) => {
        try {
            const { error } = await supabase.from('case_participant_events').insert({
                participant_id: participant.id,
                action,
                justification,
                created_by: user?.id
            });
            if (error) console.error('Error inserting participant event:', error);

            const { data } = await supabase
                .from('case_participant_events')
                .select('*')
                .eq('participant_id', participant.id)
                .order('created_at', { ascending: false });

            if (data) {
                const userIds = Array.from(new Set(data.filter(e => e.created_by).map(e => e.created_by)));
                if (userIds.length > 0) {
                    const { data: profiles } = await supabase.from('profiles').select('id, full_name, name').in('id', userIds);
                    const profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.full_name || p.name }), {});
                    setParticipantEvents(data.map(e => ({ ...e, user_name: profilesMap[e.created_by] || 'Sistema' })));
                } else {
                    setParticipantEvents(data.map(e => ({ ...e, user_name: 'Sistema' })));
                }
            }
        } catch (e) {
            console.error('Failed to insert participant event', e);
        }
    };

    const fetchProtocolsAndExecutions = useCallback(async () => {
        if (!participant.team_role_id || !surgeryCase?.clinic_id || !surgeryCase?.id) return;

        try {
            // Fetch stages for this protocol
            const { data: stgData } = await supabase
                .from('protocol_stages')
                .select('*')
                .eq('protocol_id', participant.team_role_id)
                .order('order_index');

            if (stgData && stgData.length > 0) {
                const stageIds = stgData.map(s => s.id);

                // Fetch actions
                const { data: actionsData } = await supabase
                    .from('protocol_actions')
                    .select('*')
                    .in('stage_id', stageIds);

                const stagesWithActions = stgData.map(stg => ({
                    ...stg,
                    actions: actionsData ? actionsData.filter(a => a.stage_id === stg.id) : []
                }));

                setStages(stagesWithActions);

                // Fetch executions
                const { data: execData } = await supabase
                    .from('case_protocol_executions')
                    .select('*')
                    .eq('case_id', surgeryCase.id)
                    .eq('participant_id', participant.id)
                    .in('stage_id', stageIds);

                setExecutions(execData || []);

                if (execData && execData.length > 0) {
                    const loadedActions = new Set<string>();
                    execData.forEach((exec: any) => {
                        try {
                            let parsedActions = exec.completed_actions;
                            if (typeof parsedActions === 'string') parsedActions = JSON.parse(parsedActions);
                            if (Array.isArray(parsedActions)) {
                                parsedActions.forEach((idx: number) => loadedActions.add(`${exec.stage_id}-${idx}`));
                            }
                        } catch (e) {
                            console.error("Error parsing completed_actions", e);
                        }
                    });
                    setCompletedActions(loadedActions);

                    const execIds = execData.map(e => e.id);

                    // Fetch contact events
                    const { data: contactEvs } = await supabase
                        .from('case_contact_events')
                        .select('*')
                        .in('execution_id', execIds)
                        .order('created_at', { ascending: true });

                    if (contactEvs) {
                        const byExec: Record<string, any[]> = {};
                        contactEvs.forEach(ev => {
                            if (!byExec[ev.execution_id]) byExec[ev.execution_id] = [];
                            byExec[ev.execution_id].push(ev);
                        });
                        setContactEvents(byExec);
                    }

                    // Fetch notes
                    const { data: notesData } = await supabase
                        .from('case_protocol_notes')
                        .select('*')
                        .in('execution_id', execIds)
                        .order('created_at', { ascending: true });

                    if (notesData) {
                        const notesByExec: Record<string, any[]> = {};
                        notesData.forEach(n => {
                            if (!notesByExec[n.execution_id]) notesByExec[n.execution_id] = [];
                            notesByExec[n.execution_id].push(n);
                        });
                        setNotes(notesByExec);
                    }
                }
            }

            // Fetch activity log (participant events)
            const { data: events } = await supabase
                .from('case_participant_events')
                .select('*')
                .eq('participant_id', participant.id)
                .order('created_at', { ascending: false });

            if (events) {
                const userIds = Array.from(new Set(events.filter(e => e.created_by).map(e => e.created_by)));
                if (userIds.length > 0) {
                    const { data: profiles } = await supabase.from('profiles').select('id, full_name, name').in('id', userIds);
                    const profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.full_name || p.name }), {});
                    setParticipantEvents(events.map(e => ({ ...e, user_name: profilesMap[e.created_by] || 'Sistema' })));
                } else {
                    setParticipantEvents(events.map(e => ({ ...e, user_name: 'Sistema' })));
                }
            }

        } catch (error) {
            console.error('Error fetching participant protocols:', error);
        }
    }, [participant.team_role_id, participant.id, surgeryCase?.id, surgeryCase?.clinic_id]);

    useEffect(() => {
        if (isProtocolModalOpen || isExpanded) fetchProtocolsAndExecutions();
    }, [isProtocolModalOpen, isExpanded, fetchProtocolsAndExecutions]);

    // Auto-expand first non-completed stage
    useEffect(() => {
        if (isProtocolModalOpen && stages.length > 0) {
            const firstPending = stages.find(s => {
                const exec = executions.find(e => e.stage_id === s.id);
                return !exec || (exec.status !== 'completed' && exec.status !== 'skipped');
            });
            setExpandedStage(firstPending ? firstPending.id : stages[stages.length - 1].id);
        }
    }, [isProtocolModalOpen, stages.length]);

    const handleUpdateExecution = async (stageId: string, updates: any) => {
        try {
            const existing = executions.find(e => e.stage_id === stageId);
            if (existing) {
                const { data, error } = await supabase
                    .from('case_protocol_executions')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', existing.id)
                    .select().single();
                if (error) throw error;
                const updatedData = { ...existing, ...data };
                setExecutions(prev => prev.map(e => e.id === existing.id ? updatedData : e));
                return updatedData;
            } else {
                const { data, error } = await supabase
                    .from('case_protocol_executions')
                    .insert({
                        case_id: surgeryCase.id,
                        protocol_id: participant.team_role_id,
                        participant_id: participant.id,
                        entity_id: participant.id,
                        entity_type: 'team',
                        stage_id: stageId,
                        ...updates
                    }).select().single();
                if (error) {
                    console.error('Participant execution insert error:', error);
                    throw error;
                }
                setExecutions(prev => [...prev, data]);
                return data;
            }
        } catch (error: any) {
            console.error('Error in handleUpdateExecution (participant):', error);
            toast.error(`Erro ao atualizar execução: ${error.message || 'Erro desconhecido'}`);
            return null;
        }
    };

    const handleConfirmAvailability = async () => {
        if (!canConfirmAvailability) return;

        // Strict validation for protocols
        if (!allStagesDone || !allChecklistsDone) {
            toast.error("Por favor, conclua todas as etapas e checklists do protocolo antes de confirmar a disponibilidade.");
            return;
        }

        try {
            await onStatusUpdate('ready');
            await insertParticipantEvent('Confirmado');
            toast.success('Disponibilidade confirmada!');
        } catch (error) {
            toast.error('Erro ao confirmar disponibilidade.');
        }
    };

    const handleUndoAction = async () => {
        if (!undoReason || undoReason.trim().length < 10) {
            toast.error('Justificativa deve ter pelo menos 10 caracteres.');
            return;
        }
        if (!undoActionType) return;
        try {
            await onStatusUpdate('pending');
            // Reset dispense reason if needed - assuming onStatusUpdate handles it or we should add another call
            await insertParticipantEvent(undoActionType, undoReason.trim());
            setIsUndoModalOpen(false);
            setUndoReason('');
            setUndoActionType(null);
            toast.success(`Ação desfeita com sucesso.`);
        } catch (error) {
            toast.error('Erro ao desfazer ação.');
        }
    };

    const handleDispense = async () => {
        if (!dispenseReason || dispenseReason.trim().length < 10) {
            toast.error('Justificativa deve ter pelo menos 10 caracteres.');
            return;
        }
        try {
            await onStatusUpdate(cancelType);
            await insertParticipantEvent(cancelType === 'waived' ? 'Dispensado' : 'Indisponível', dispenseReason.trim());
            setIsDispenseModalOpen(false);
            setDispenseReason('');
            toast.success(`Participante ${cancelType === 'waived' ? 'dispensado' : 'marcado como indisponível'}.`);
        } catch (error) {
            toast.error('Erro ao atualizar status.');
        }
    };

    const handleCopyScript = async (text: string, stageId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyFeedback(stageId);
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch {
            toast.error('Não foi possível copiar.');
        }
    };

    const insertContactEvent = async (executionId: string, eventType: string, content?: string) => {
        if (!executionId) return null;
        const { data, error } = await supabase
            .from('case_contact_events')
            .insert({ execution_id: executionId, event_type: eventType, content: content || null })
            .select().single();
        if (error) return null;
        if (data) {
            setContactEvents(prev => ({
                ...prev,
                [executionId]: [...(prev[executionId] || []), data]
            }));
        }
        return data;
    };

    const handleSendWhatsApp = async (stageId: string, text: string, phone: string) => {
        const encoded = encodeURIComponent(text);
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
        const exec = await handleUpdateExecution(stageId, {
            message_sent_at: new Date().toISOString(),
            responded_status: null,
            response_content: null,
            responded_at: null
        });
        if (exec?.id) insertContactEvent(exec.id, 'sent_whatsapp');
    };

    const handleRegisterSent = async (stageId: string) => {
        const exec = await handleUpdateExecution(stageId, {
            message_sent_at: new Date().toISOString(),
            responded_status: null,
            response_content: null,
            responded_at: null
        });
        if (exec?.id) insertContactEvent(exec.id, 'sent_manual');
    };

    const handleSaveResponse = async (stageId: string, responded: boolean, content?: string) => {
        const eventType = responded ? 'responded_yes' : 'responded_no';
        const finalContent = responded ? (content || '') : 'Finalizado sem retorno';
        const exec = await handleUpdateExecution(stageId, {
            responded_status: responded ? 'sim_respondeu' : 'nao_respondeu',
            response_content: finalContent,
            responded_at: new Date().toISOString()
        });
        if (exec?.id) insertContactEvent(exec.id, eventType, finalContent);
        setIsRegisteringResponse(null);
        setResponseIsYes(null);
        setResponseIsNo(null);
        setTempResponse('');
        setNewDeadline('');
    };

    const handleSetNewDeadline = async (stageId: string, deadline: string) => {
        if (!deadline) { toast.error('Informe uma data.'); return; }
        const exec = await handleUpdateExecution(stageId, {
            responded_status: 'aguardando_retorno',
            response_content: `Novo prazo: ${deadline}`,
            responded_at: new Date().toISOString()
        });
        if (exec?.id) insertContactEvent(exec.id, 'postponed', `Novo prazo: ${deadline}`);
        setIsRegisteringResponse(null);
        setResponseIsNo(null);
        setNewDeadline('');
    };

    const handleSkipStage = async (stageId: string) => {
        if (!skipJustification || skipJustification.trim().length < 10) {
            toast.error('Informe justificativa (mín 10 chars).');
            return;
        }
        await handleUpdateExecution(stageId, {
            status: 'skipped',
            skip_justification: skipJustification.trim()
        });
        setIsSkipping(null);
        setSkipJustification('');
    };

    const statusColor = participant.status === 'ready' ? 'bg-emerald-500' :
        participant.status === 'not_available' ? 'bg-red-500' :
            participant.status === 'waived' ? 'bg-slate-400' : 'bg-amber-400';

    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 overflow-hidden transition-all ${participant.status === 'ready' ? 'border-l-emerald-500' :
            participant.status === 'waived' ? 'border-l-slate-400' :
                participant.status === 'pending' ? 'border-l-amber-400' : 'border-l-red-500'
            }`}>
            <div className="p-6 flex justify-between items-center">
                <div className="flex gap-4 items-center flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${participant.status === 'ready' ? 'bg-emerald-50 text-emerald-600' :
                        participant.status === 'waived' ? 'bg-slate-50 text-slate-600' :
                            participant.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                        }`}>
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {participant.protocol_ref?.name || "Participante"}
                                {participant.status === 'not_available' && (
                                    <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" title="Indisponível" />
                                )}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${participant.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                                participant.status === 'waived' ? 'bg-slate-100 text-slate-700' :
                                    participant.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {participant.status === 'ready' ? 'Confirmado' : participant.status === 'waived' ? 'Dispensado' : participant.status === 'pending' ? 'Pendente' : 'Indisponível'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-medium text-slate-700">{participant.doctor_ref?.full_name || "Aguardando escala"}</span>
                            <span className="ml-2 font-bold text-primary-600 border-l border-slate-200 pl-3">
                                {stages.length > 0 ? `${completedStagesCount} de ${stages.length} etapas` : 'Nenhum protocolo'}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setIsProtocolModalOpen(true)}
                        title="Abrir Protocolo de Navegação"
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide flex items-center gap-2"
                    >
                        Abrir Protocolo
                    </button>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-slate-400 hover:text-slate-600 transition-transform focus:outline-none">
                        {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-slate-100 p-6 bg-slate-50/30 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contato Profissional</span>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Phone className="w-4 h-4 text-primary-500" />
                                {participant.doctor_ref?.phone || "Não informado"}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Progresso</span>
                                <div className="text-sm font-bold text-slate-700">{completedStagesCount} de {stages.length} concluídas</div>
                            </div>
                            <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
                                <span className="text-[10px] font-bold text-primary-600">{Math.round((completedStagesCount / (stages.length || 1)) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isDispenseModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in ring-1 ring-slate-900/5">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Cancelar Participante</h3>
                                <p className="text-sm text-slate-500 mt-1">Selecione o motivo</p>
                            </div>
                            <button onClick={() => setIsDispenseModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => setCancelType('waived')}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${cancelType === 'waived' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-100'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cancelType === 'waived' ? 'border-amber-500' : 'border-slate-300'}`}>
                                            {cancelType === 'waived' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">Dispensado</p>
                                            <p className="text-xs text-slate-500">O profissional não será necessário</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setCancelType('not_available')}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${cancelType === 'not_available' ? 'border-red-500 bg-red-50/50' : 'border-slate-100'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cancelType === 'not_available' ? 'border-red-500' : 'border-slate-300'}`}>
                                            {cancelType === 'not_available' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">Indisponível</p>
                                            <p className="text-xs text-slate-500">Profissional não possui agenda</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Justificativa (Mín. 10 letras)</label>
                                <textarea
                                    value={dispenseReason}
                                    onChange={(e) => setDispenseReason(e.target.value)}
                                    placeholder="Explique o motivo..."
                                    className="w-full h-32 p-4 text-sm bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                />
                                <div className="flex justify-between mt-1">
                                    <span className={`text-[10px] font-bold ${dispenseReason.length < 10 ? 'text-red-400' : 'text-emerald-500'}`}>
                                        {dispenseReason.length}/10 caracteres
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsDispenseModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl">Voltar</button>
                            <button onClick={handleDispense} disabled={dispenseReason.trim().length < 10} className="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl disabled:opacity-50">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {isUndoModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-slate-900/5">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">{undoActionType}</h3>
                                <p className="text-sm text-slate-500 mt-1">Justifique esta ação</p>
                            </div>
                            <button onClick={() => setIsUndoModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Justificativa (Mín. 10 letras)</label>
                            <textarea
                                value={undoReason}
                                onChange={(e) => setUndoReason(e.target.value)}
                                placeholder="Descreva o motivo..."
                                className="w-full h-32 p-4 text-sm bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsUndoModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600">Voltar</button>
                            <button onClick={handleUndoAction} disabled={undoReason.trim().length < 10} className="px-6 py-2 text-sm font-bold text-white bg-amber-500 rounded-xl disabled:opacity-50 flex items-center gap-2">
                                <RefreshCcw className="w-4 h-4" /> Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isProtocolModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
                    <div className="bg-white w-full max-w-6xl rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden relative border border-slate-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 tracking-tight flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-primary-500" /> Protocolo: {participant.protocol_ref?.name}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Acompanhe as etapas de preparação da equipe.</p>
                            </div>
                            <div className="flex items-center gap-5">
                                <button
                                    onClick={() => setIsActivityLogOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold ring-1 ring-blue-500/20 shadow-sm hover:bg-blue-100 transition-colors"
                                >
                                    <History className="w-4 h-4" /> Registro de Atividades
                                </button>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Status:</label>
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${participant.status === 'ready' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                        participant.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                            participant.status === 'waived' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                        }`}>
                                        {participant.status === 'ready' ? 'Confirmado' : participant.status === 'waived' ? 'Dispensado' : participant.status === 'pending' ? 'Pendente' : 'Indisponível'}
                                    </span>
                                </div>
                                <X className="w-5 h-5 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setIsProtocolModalOpen(false)} />
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-white">
                            <div className="flex items-center justify-between mb-6">
                                <h5 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <ListTodo className="w-4 h-4 text-slate-400" /> Etapas do Protocolo
                                </h5>
                                <span className="text-xs font-bold text-slate-400">{completedStagesCount} de {stages.length} concluídas</span>
                            </div>

                            {stages.length > 0 ? (
                                <div className="relative space-y-3 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200">
                                    {stages.map((stage, idx) => {
                                        const execution = executions.find(e => e.stage_id === stage.id);
                                        const status = execution?.status || 'pending';
                                        const messageSentAt = execution?.message_sent_at;
                                        const respondedStatus = execution?.responded_status;
                                        const responseContent = execution?.response_content;
                                        const isOpen = expandedStage === stage.id;
                                        const isCompleted = status === 'completed';
                                        const isSkipped = status === 'skipped';
                                        const isActive = !isCompleted && !isSkipped && stages.slice(0, idx).every(s => {
                                            const prevExec = executions.find(e => e.stage_id === s.id);
                                            return prevExec?.status === 'completed' || prevExec?.status === 'skipped';
                                        });

                                        const phone = participant.doctor_ref?.phone || participant.doctor_ref?.whatsapp || '';

                                        return (
                                            <div key={stage.id} className="relative pl-12">
                                                <div className={`absolute left-0 top-3 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm ${isSkipped ? 'bg-amber-400 text-white' : isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary-600 text-white shadow-lg ring-4 ring-primary-50' : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                    {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                                </div>

                                                <div className={`rounded-xl border transition-all ${isSkipped ? 'border-amber-200' : isCompleted ? 'border-emerald-100' : isActive ? 'border-primary-200 shadow-md' : 'border-slate-100'
                                                    }`}>
                                                    <button onClick={() => setExpandedStage(isOpen ? null : stage.id)} className={`w-full px-5 py-4 flex justify-between items-center text-left ${isOpen ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/50'}`}>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h3 className={`font-bold text-sm ${isActive ? 'text-primary-700' : 'text-slate-600'}`}>{stage.name || stage.title}</h3>
                                                            </div>
                                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{status}</p>
                                                        </div>
                                                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {isOpen && (
                                                        <div className="p-5 bg-white border-t border-slate-100">
                                                            {stage.message_template && (
                                                                <div className="mb-5 rounded-xl border border-slate-200 overflow-hidden bg-slate-50/30">
                                                                    <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                                                                        <label className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Script Sugerido</label>
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => handleCopyScript(stage.message_template, stage.id)} className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                                                                {copyFeedback === stage.id ? 'Copiado' : 'Copiar'}
                                                                            </button>
                                                                            {phone && (
                                                                                <button onClick={() => handleSendWhatsApp(stage.id, stage.message_template, phone)} className="text-[10px] font-bold px-2 py-1 bg-[#25D366] text-white rounded-lg hover:bg-[#1EBE5C] transition-colors">WhatsApp</button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-4 bg-white text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{stage.message_template}</div>
                                                                </div>
                                                            )}

                                                            {/* Contact Control — sequential flow */}
                                                            {stage.message_template && (
                                                                <div className={`rounded-xl border p-4 mb-5 ${!messageSentAt ? 'bg-slate-50 border-slate-200 border-dashed' :
                                                                    respondedStatus ? (respondedStatus === 'sim_respondeu' ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200') :
                                                                        'bg-blue-50/50 border-blue-200'
                                                                    }`}>
                                                                    <h6 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-3">
                                                                        <Phone className="w-3.5 h-3.5" /> Controle de Contato
                                                                    </h6>

                                                                    {/* Contact Event Timeline */}
                                                                    {(() => {
                                                                        const execEvents: any[] = execution?.id ? (contactEvents[execution.id] || []) : [];
                                                                        const lastEvent = execEvents[execEvents.length - 1];
                                                                        const lastEventType = lastEvent?.event_type || null;
                                                                        // Determine if we're still awaiting response (last action was a send or postponement)
                                                                        const awaitingResponse = !lastEvent || lastEventType === 'sent_manual' || lastEventType === 'sent_whatsapp' || lastEventType === 'postponed';
                                                                        const isClosed = lastEventType === 'responded_yes' || lastEventType === 'responded_no';

                                                                        const formatDT = (iso: string) =>
                                                                            new Date(iso).toLocaleDateString('pt-BR') + ' · ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                                                                        const EventIcon = ({ type }: { type: string }) => {
                                                                            if (type === 'sent_whatsapp') return <MessageSquare className="w-3.5 h-3.5" />;
                                                                            if (type === 'sent_manual') return <Check className="w-3.5 h-3.5" />;
                                                                            if (type === 'postponed') return <Clock className="w-3.5 h-3.5" />;
                                                                            if (type === 'responded_yes') return <ThumbsUp className="w-3.5 h-3.5" />;
                                                                            if (type === 'responded_no') return <ThumbsDown className="w-3.5 h-3.5" />;
                                                                            return <Clock className="w-3.5 h-3.5" />;
                                                                        };

                                                                        const eventColor = (type: string) => {
                                                                            if (type === 'sent_whatsapp' || type === 'sent_manual') return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-500', text: 'text-emerald-700' };
                                                                            if (type === 'postponed') return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-500', text: 'text-amber-700' };
                                                                            if (type === 'responded_yes') return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-600', text: 'text-emerald-700' };
                                                                            if (type === 'responded_no') return { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-500', text: 'text-rose-700' };
                                                                            return { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-400', text: 'text-slate-600' };
                                                                        };

                                                                        const eventLabel = (type: string) => {
                                                                            if (type === 'sent_whatsapp') return 'Enviado via WhatsApp';
                                                                            if (type === 'sent_manual') return 'Envio registrado manualmente';
                                                                            if (type === 'postponed') return 'Prorrogado';
                                                                            if (type === 'responded_yes') return 'Parceiro respondeu';
                                                                            if (type === 'responded_no') return 'Finalizado sem retorno';
                                                                            return type;
                                                                        };

                                                                        return (
                                                                            <div className="space-y-2">
                                                                                {/* No events yet — Phase 1 */}
                                                                                {execEvents.length === 0 && (
                                                                                    <div className="flex items-center justify-between py-1">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="size-2 rounded-full bg-slate-400 animate-pulse" />
                                                                                            <p className="text-sm font-medium text-slate-600">
                                                                                                {isActive ? 'Aguardando envio da mensagem...' : 'Nenhum contato registrado.'}
                                                                                            </p>
                                                                                        </div>
                                                                                        {isActive && (
                                                                                            <button
                                                                                                onClick={() => handleRegisterSent(stage.id)}
                                                                                                title="Registrar que a mensagem foi enviada manualmente"
                                                                                                className="text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                                                                            >
                                                                                                Registrar Envio Manualmente
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {/* Event timeline rows */}
                                                                                {execEvents.map((ev, idx) => {
                                                                                    const colors = eventColor(ev.event_type);
                                                                                    const isLast = idx === execEvents.length - 1;
                                                                                    const deadlineRaw = ev.event_type === 'postponed' ? (ev.content || '').replace('Novo prazo: ', '').trim() : null;
                                                                                    const deadlineFormatted = deadlineRaw
                                                                                        ? new Date(deadlineRaw + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                                                                                        : null;
                                                                                    return (
                                                                                        <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border} ${!isLast ? 'opacity-80' : ''}`}>
                                                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colors.icon} text-white`}>
                                                                                                <EventIcon type={ev.event_type} />
                                                                                            </div>
                                                                                            <div className="flex-1 space-y-0.5">
                                                                                                <p className={`text-[10px] font-bold uppercase tracking-wide ${colors.text}`}>{eventLabel(ev.event_type)}</p>
                                                                                                <p className="text-[10px] text-slate-400 font-medium">{formatDT(ev.created_at)}</p>
                                                                                                {ev.event_type === 'postponed' && deadlineFormatted && (
                                                                                                    <p className="text-xs font-bold text-amber-800 mt-1">Novo prazo: {deadlineFormatted}</p>
                                                                                                )}
                                                                                                {(ev.event_type === 'responded_yes' || ev.event_type === 'responded_no') && ev.content && ev.content !== 'Finalizado sem retorno' && (
                                                                                                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{ev.content}</p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}

                                                                                {/* Awaiting response connector + action */}
                                                                                {execEvents.length > 0 && awaitingResponse && isActive && (
                                                                                    <div className="flex items-center justify-between pl-3 ml-3 border-l-2 border-dashed border-slate-300 py-2">
                                                                                        <p className="text-xs font-medium text-slate-500 italic">Aguardando retorno do parceiro...</p>
                                                                                        {isRegisteringResponse !== stage.id && (
                                                                                            <button
                                                                                                onClick={() => setIsRegisteringResponse(stage.id)}
                                                                                                title="Registrar resposta do parceiro"
                                                                                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
                                                                                            >
                                                                                                <MessageSquare className="w-3 h-3" /> Registrar Solicitação
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {/* Closed state: allow new send if desired */}
                                                                                {isClosed && isActive && (
                                                                                    <button
                                                                                        onClick={() => handleRegisterSent(stage.id)}
                                                                                        title="Registrar novo envio de mensagem"
                                                                                        className="w-full text-[10px] font-bold text-slate-500 hover:text-primary-600 border border-dashed border-slate-300 hover:border-primary-300 py-1.5 rounded-lg transition-colors mt-1"
                                                                                    >
                                                                                        + Registrar Novo Envio
                                                                                    </button>
                                                                                )}

                                                                                {/* Registering response form */}
                                                                                {isRegisteringResponse === stage.id && (
                                                                                    <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                                                                        {responseIsYes !== stage.id && responseIsNo !== stage.id && (
                                                                                            <>
                                                                                                <p className="text-sm font-bold text-slate-800 text-center">Parceiro respondeu?</p>
                                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                                    <button onClick={() => setResponseIsYes(stage.id)} title="Parceiro respondeu" className="px-3 py-3 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                                                                                        <ThumbsUp className="w-4 h-4" /> Sim, respondeu
                                                                                                    </button>
                                                                                                    <button onClick={() => setResponseIsNo(stage.id)} title="Parceiro não respondeu" className="px-3 py-3 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                                                                                        <ThumbsDown className="w-4 h-4" /> Não respondeu
                                                                                                    </button>
                                                                                                </div>
                                                                                                <button onClick={() => setIsRegisteringResponse(null)} className="w-full text-[10px] text-slate-400 hover:text-slate-600 text-center py-1 transition-colors">Cancelar</button>
                                                                                            </>
                                                                                        )}
                                                                                        {responseIsYes === stage.id && (
                                                                                            <>
                                                                                                <p className="text-xs font-bold text-slate-700">Resumo da resposta:</p>
                                                                                                <textarea
                                                                                                    value={tempResponse}
                                                                                                    onChange={e => setTempResponse(e.target.value)}
                                                                                                    placeholder="Descreva o que o parceiro respondeu..."
                                                                                                    className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                                                                                                />
                                                                                                <div className="flex gap-2 justify-end">
                                                                                                    <button onClick={() => setResponseIsYes(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Voltar</button>
                                                                                                    <button onClick={() => handleSaveResponse(stage.id, true, tempResponse)} className="px-4 py-1.5 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                                                                                                        <Check className="w-3 h-3" /> Salvar Resposta
                                                                                                    </button>
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                        {responseIsNo === stage.id && (
                                                                                            <div className="space-y-3 animate-in fade-in duration-200">
                                                                                                <p className="text-xs font-bold text-rose-700 text-center">Parceiro não respondeu. O que deseja fazer?</p>
                                                                                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                                                                                                    <p className="text-[10px] font-bold uppercase text-amber-700">Registrar novo prazo de retorno</p>
                                                                                                    <input
                                                                                                        type="date"
                                                                                                        value={newDeadline}
                                                                                                        onChange={e => setNewDeadline(e.target.value)}
                                                                                                        title="Nova data para retorno"
                                                                                                        className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-300"
                                                                                                    />
                                                                                                    <button onClick={() => handleSetNewDeadline(stage.id, newDeadline)} title="Salvar novo prazo" className="w-full py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all">Salvar Novo Prazo</button>
                                                                                                </div>
                                                                                                <button onClick={() => handleSaveResponse(stage.id, false)} title="Finalizar sem retorno" className="w-full py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all">
                                                                                                    Finalizar como Sem Retorno
                                                                                                </button>
                                                                                                <button onClick={() => setResponseIsNo(null)} className="w-full text-[10px] text-slate-400 hover:text-slate-600 text-center py-1 transition-colors">Voltar</button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            )}

                                                            {stage.actions && stage.actions.length > 0 && (
                                                                <div className="mb-5 space-y-3">
                                                                    <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-widest">Procedimentos desta etapa</label>
                                                                    {stage.actions.map((action: any, aIdx: number) => {
                                                                        const isChecked = completedActions.has(`${stage.id}-${aIdx}`);
                                                                        return (
                                                                            <div key={aIdx} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={async () => {
                                                                                const newSet = new Set(completedActions);
                                                                                if (isChecked) newSet.delete(`${stage.id}-${aIdx}`);
                                                                                else newSet.add(`${stage.id}-${aIdx}`);
                                                                                setCompletedActions(newSet);
                                                                                const arr = Array.from(newSet).filter((s: any) => s.startsWith(`${stage.id}-`)).map((s: any) => parseInt(s.split('-')[1]));
                                                                                await handleUpdateExecution(stage.id, { completed_actions: arr });
                                                                            }}>
                                                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                                                                                    {isChecked && <Check className="w-4 h-4" />}
                                                                                </div>
                                                                                <span className={`text-sm ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>{action.description || action.title || action}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                                                                {!isCompleted && !isSkipped && !isSkipping && (
                                                                    <button onClick={(e) => { e.stopPropagation(); setIsSkipping(stage.id); }} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Pular Etapa</button>
                                                                )}
                                                                {isSkipping === stage.id && (
                                                                    <div className="flex-1 flex gap-2">
                                                                        <input value={skipJustification} onChange={e => setSkipJustification(e.target.value)} placeholder="Justificativa (mín 10 chars)" className="flex-1 text-xs border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
                                                                        <button onClick={() => handleSkipStage(stage.id)} disabled={skipJustification.trim().length < 10} className="px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg disabled:opacity-50">Confirmar</button>
                                                                        <button onClick={() => setIsSkipping(null)} className="px-3 py-2 text-xs font-bold text-slate-400">Cancelar</button>
                                                                    </div>
                                                                )}
                                                                {!isCompleted && !isSkipped && (
                                                                    <button
                                                                        onClick={() => handleUpdateExecution(stage.id, { status: 'completed', completed_at: new Date().toISOString() })}
                                                                        disabled={!stage.actions?.every((_: any, idx: number) => completedActions.has(`${stage.id}-${idx}`))}
                                                                        className="px-6 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 hover:bg-emerald-600 transition-colors"
                                                                    >
                                                                        Concluir Etapa
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-400 font-medium tracking-tight">Nenhum protocolo cadastrado para esta função.</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                            <div className="flex gap-2">
                                {(participant.status === 'ready' || participant.status === 'waived' || participant.status === 'not_available') ? (
                                    <button
                                        onClick={() => {
                                            setUndoActionType(participant.status === 'ready' ? 'Desfazer Confirmação' : 'Desfazer Cancelamento');
                                            setIsUndoModalOpen(true);
                                        }}
                                        className="px-6 py-2 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <RefreshCcw className="w-4 h-4" /> Desfazer Ação
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsDispenseModalOpen(true)}
                                        className="px-6 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4 text-red-400" /> Cancelar Participante
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleConfirmAvailability}
                                disabled={participant.status !== 'pending'}
                                title={!allStagesDone || !allChecklistsDone ? "Ainda há etapas pendentes no protocolo" : "Confirmar que o profissional está pronto"}
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Confirmar Disponibilidade
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isActivityLogOpen && (
                <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-200">
                        <div className="p-6 border-b flex justify-between items-center bg-blue-50/50">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-blue-500" /> Registro de Atividades</h3>
                                <p className="text-xs text-slate-500">Histórico completo de ações e marcos do participante</p>
                            </div>
                            <button onClick={() => setIsActivityLogOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-white space-y-8">
                            {participantEvents.length > 0 ? (
                                <div className="max-w-3xl mx-auto space-y-6">
                                    {participantEvents.map((ev, i) => (
                                        <div key={i} className="relative pl-8 pb-8 border-l-2 border-slate-100 last:pb-0 last:border-l-transparent">
                                            <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-md ${ev.action.includes('Confirmado') ? 'bg-emerald-500' : ev.action.includes('Desfazer') ? 'bg-amber-500' : 'bg-red-500'
                                                }`} />
                                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:bg-white transition-colors group">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-base font-bold text-slate-800 leading-tight block mb-1">{ev.action}</span>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            <Clock className="w-3 h-3" /> {new Date(ev.created_at).toLocaleString('pt-BR')}
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                                                        <Users className="w-3 h-3" /> {ev.user_name}
                                                    </div>
                                                </div>
                                                {ev.justification && (
                                                    <div className="relative">
                                                        <Quote className="absolute -left-1 -top-1 w-4 h-4 text-slate-200" />
                                                        <p className="text-sm text-slate-600 italic bg-white p-4 rounded-xl border border-slate-100 pl-8">
                                                            {ev.justification}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-400 italic">
                                    <List className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Nenhuma atividade registrada ainda para este participante.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Beneficiary Communication Components ---

const CommunicationJourneyCard: React.FC<{
    journey: any;
    surgeryCase: any;
    patient: any;
    onUpdate: () => void;
}> = ({ journey, surgeryCase, patient, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [stages, setStages] = useState<any[]>([]);
    const [executions, setExecutions] = useState<any[]>([]);
    const [contactEvents, setContactEvents] = useState<Record<string, any[]>>({});
    const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [isSkipping, setIsSkipping] = useState<string | null>(null);
    const [skipJustification, setSkipJustification] = useState('');
    const [isRegisteringResponse, setIsRegisteringResponse] = useState<string | null>(null);
    const [responseIsYes, setResponseIsYes] = useState<string | null>(null);
    const [responseIsNo, setResponseIsNo] = useState<string | null>(null);
    const [tempResponse, setTempResponse] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const { permissions } = useAuth();

    const fetchStagesAndExecutions = useCallback(async () => {
        if (!journey.protocol_id || !surgeryCase?.id) return;
        try {
            const { data: stgData } = await supabase
                .from('protocol_stages')
                .select('*')
                .eq('protocol_id', journey.protocol_id)
                .order('order_index');

            if (stgData) {
                const stageIds = stgData.map(s => s.id);
                const { data: actionsData } = await supabase.from('protocol_actions').select('*').in('stage_id', stageIds);
                const stagesWithActions = stgData.map(stg => ({
                    ...stg,
                    actions: actionsData ? actionsData.filter(a => a.stage_id === stg.id) : []
                }));
                setStages(stagesWithActions);

                const { data: execData } = await supabase
                    .from('case_protocol_executions')
                    .select('*')
                    .eq('case_id', surgeryCase.id)
                    .eq('entity_id', journey.id)
                    .eq('entity_type', 'beneficiary');
                setExecutions(execData || []);

                if (execData && execData.length > 0) {
                    const loadedActions = new Set<string>();
                    execData.forEach((exec: any) => {
                        try {
                            let parsed = exec.completed_actions;
                            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                            if (Array.isArray(parsed)) parsed.forEach((idx: number) => loadedActions.add(`${exec.stage_id}-${idx}`));
                        } catch (e) { }
                    });
                    setCompletedActions(loadedActions);

                    const execIds = execData.map(e => e.id);
                    const { data: contactEvs } = await supabase
                        .from('case_contact_events')
                        .select('*')
                        .in('execution_id', execIds)
                        .order('created_at', { ascending: true });

                    if (contactEvs) {
                        const byExec: Record<string, any[]> = {};
                        contactEvs.forEach(ev => {
                            if (!byExec[ev.execution_id]) byExec[ev.execution_id] = [];
                            byExec[ev.execution_id].push(ev);
                        });
                        setContactEvents(byExec);
                    }
                }
            }
        } catch (e) { console.error(e); }
    }, [journey.protocol_id, journey.id, surgeryCase.id]);

    useEffect(() => {
        if (isExpanded) fetchStagesAndExecutions();
    }, [isExpanded, fetchStagesAndExecutions]);

    const handleUpdateExecution = async (stageId: string, updates: any) => {
        const existing = executions.find(e => e.stage_id === stageId);
        if (existing) {
            const { data, error } = await supabase.from('case_protocol_executions').update(updates).eq('id', existing.id).select().single();
            if (error) throw error;
            setExecutions(prev => prev.map(e => e.id === existing.id ? data : e));
            if (updates.status === 'completed') setExpandedStage(null);
            return data;
        } else {
            const { data, error } = await supabase.from('case_protocol_executions').insert({
                case_id: surgeryCase.id,
                protocol_id: journey.protocol_id,
                entity_id: journey.id,
                entity_type: 'beneficiary',
                stage_id: stageId,
                ...updates
            }).select().single();
            if (error) throw error;
            setExecutions(prev => [...prev, data]);
            if (updates.status === 'completed') setExpandedStage(null);
            return data;
        }
    };

    const handleCopyScript = (text: string, stageId: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(stageId);
        setTimeout(() => setCopyFeedback(null), 2000);
        toast.success('Script copiado!');
    };

    const insertContactEvent = async (executionId: string, eventType: string, content?: string) => {
        if (!executionId) return null;
        const { data, error } = await supabase
            .from('case_contact_events')
            .insert({ execution_id: executionId, event_type: eventType, content: content || null })
            .select()
            .single();
        if (error) { console.error('Contact event insert error:', error); return null; }
        if (data) {
            setContactEvents(prev => ({
                ...prev,
                [executionId]: [...(prev[executionId] || []), data]
            }));
        }
        return data;
    };

    const handleSendWhatsApp = async (stageId: string, message: string, phone: string) => {
        const win = window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        if (win) {
            const exec = await handleUpdateExecution(stageId, {
                message_sent_at: new Date().toISOString(),
                responded_status: null,
                response_content: null,
                responded_at: null
            });
            if (exec?.id) {
                await insertContactEvent(exec.id, 'sent_whatsapp', 'Enviado via WhatsApp (link externo)');
            }
        }
    };

    const handleRegisterSent = async (stageId: string) => {
        const exec = await handleUpdateExecution(stageId, {
            message_sent_at: new Date().toISOString(),
            responded_status: null,
            response_content: null,
            responded_at: null
        });
        if (exec?.id) {
            await insertContactEvent(exec.id, 'sent_manual', 'Envio registrado manualmente');
            toast.success('Envio registrado!');
        }
    };

    const handleSaveResponse = async (stageId: string, responded: boolean, content?: string) => {
        const exec = executions.find(e => e.stage_id === stageId);
        if (!exec) return;
        const eventType = responded ? 'responded_yes' : 'responded_no';
        const finalContent = responded ? (content || '') : 'Finalizado sem retorno';

        await insertContactEvent(exec.id, eventType, finalContent);
        await handleUpdateExecution(stageId, {
            responded_status: responded ? 'sim_respondeu' : 'nao_respondeu',
            response_content: finalContent,
            responded_at: new Date().toISOString()
        });
        setIsRegisteringResponse(null);
        setResponseIsYes(null);
        setResponseIsNo(null);
        setTempResponse('');
        setNewDeadline('');
    };

    const handleSetNewDeadline = async (stageId: string, deadline: string) => {
        if (!deadline) { toast.error('Informe uma data para o novo prazo.'); return; }
        const exec = executions.find(e => e.stage_id === stageId);
        if (!exec) return;
        await insertContactEvent(exec.id, 'postponed', `Novo prazo: ${deadline}`);
        await handleUpdateExecution(stageId, {
            responded_status: 'aguardando_retorno',
            response_content: `Novo prazo: ${deadline}`,
            responded_at: new Date().toISOString()
        });
        setIsRegisteringResponse(null);
        setResponseIsNo(null);
        setNewDeadline('');
    };

    const handleToggleAction = async (stageId: string, actionIdx: number) => {
        const currentActions = new Set(completedActions);
        const key = `${stageId}-${actionIdx}`;
        if (currentActions.has(key)) currentActions.delete(key);
        else currentActions.add(key);

        const stageExecActions = Array.from(currentActions)
            .filter((k): k is string => typeof k === 'string' && k.startsWith(`${stageId}-`))
            .map(k => parseInt(k.split('-')[1]));

        await handleUpdateExecution(stageId, {
            completed_actions: JSON.stringify(stageExecActions)
        });
        setCompletedActions(currentActions);
    };

    const handleSkipStage = async (stageId: string) => {
        if (!skipJustification || skipJustification.trim().length < 10) {
            toast.error('Informe justificativa (mín 10 chars).');
            return;
        }
        await handleUpdateExecution(stageId, {
            status: 'skipped',
            skip_justification: skipJustification.trim()
        });
        setIsSkipping(null);
        setSkipJustification('');
        fetchStagesAndExecutions();
    };

    const handleDeleteJourney = async () => {
        if (!window.confirm('Tem certeza que deseja remover esta jornada de comunicação?')) return;
        try {
            await supabase.from('case_beneficiary_communications').delete().eq('id', journey.id);
            onUpdate();
            toast.success('Jornada removida');
        } catch (e) { toast.error('Erro ao remover jornada'); }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{journey.protocol_ref?.name || 'Protocolo'}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Jornada de Comunicação</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {permissions.can_delete_schedule && (
                        <button onClick={handleDeleteJourney} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Remover jornada">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-6 bg-slate-50/50">
                    <div className="space-y-4 max-w-full">
                        {stages.map((stage, idx) => {
                            const execution = executions.find(e => e.stage_id === stage.id);
                            const isOpen = expandedStage === stage.id;
                            const isCompleted = execution?.status === 'completed';
                            const isSkipped = execution?.status === 'skipped';
                            const isActive = !isCompleted && !isSkipped && stages.slice(0, idx).every(s => {
                                const prevExec = executions.find(e => e.stage_id === s.id);
                                return prevExec?.status === 'completed' || prevExec?.status === 'skipped';
                            });

                            const allActionsDone = !stage.actions || stage.actions.length === 0 ||
                                stage.actions.every((_: any, aIdx: number) => completedActions.has(`${stage.id}-${aIdx}`));

                            const contactDone = !stage.message_template ||
                                (execution?.responded_status === 'sim_respondeu' || execution?.responded_status === 'nao_respondeu');

                            const canComplete = allActionsDone && contactDone;

                            return (
                                <div key={stage.id} className={`bg-white rounded-2xl border transition-all duration-300 ${isOpen ? 'border-primary-200 shadow-md ring-4 ring-primary-500/5' : 'border-slate-200 shadow-sm'}`}>
                                    <div className="p-4 flex items-center gap-4 cursor-pointer select-none" onClick={() => setExpandedStage(isOpen ? null : stage.id)}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${isSkipped ? 'bg-amber-400 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-sm font-bold transition-colors ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{stage.name}</h3>
                                            {stage.description && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{stage.description}</p>}
                                        </div>
                                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>

                                    {isOpen && (
                                        <div className="px-5 pb-6 pt-2 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200 border-t border-slate-50">
                                            {stage.message_template && (
                                                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/30">
                                                    <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                                                        <label className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Script Sugerido</label>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleCopyScript(stage.message_template, stage.id)} className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                                                {copyFeedback === stage.id ? 'Copiado' : 'Copiar'}
                                                            </button>
                                                            {(patient?.phone || patient?.whatsapp) && (
                                                                <button onClick={() => handleSendWhatsApp(stage.id, stage.message_template, patient?.phone || patient?.whatsapp)} className="text-[10px] font-bold px-2 py-1 bg-[#25D366] text-white rounded-lg hover:bg-[#1EBE5C] transition-colors">WhatsApp</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-white text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{stage.message_template}</div>
                                                </div>
                                            )}

                                            {/* Contact Control — sequential flow */}
                                            {stage.message_template && (
                                                <div className={`rounded-xl border p-4 mb-5 ${!execution?.message_sent_at ? 'bg-slate-50 border-slate-200 border-dashed' :
                                                    execution?.responded_status ? (execution?.responded_status === 'sim_respondeu' ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200') :
                                                        'bg-blue-50/50 border-blue-200'
                                                    }`}>
                                                    <h6 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-3">
                                                        <Phone className="w-3.5 h-3.5" /> Controle de Contato
                                                    </h6>

                                                    {(() => {
                                                        const execEvents: any[] = execution?.id ? (contactEvents[execution.id] || []) : [];
                                                        const lastEvent = execEvents[execEvents.length - 1];
                                                        const lastEventType = lastEvent?.event_type || null;
                                                        const awaitingResponse = !lastEvent || lastEventType === 'sent_manual' || lastEventType === 'sent_whatsapp' || lastEventType === 'postponed';
                                                        const isClosed = lastEventType === 'responded_yes' || lastEventType === 'responded_no';

                                                        const formatDT = (iso: string) =>
                                                            new Date(iso).toLocaleDateString('pt-BR') + ' · ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                                                        const EventIcon = ({ type }: { type: string }) => {
                                                            if (type === 'sent_whatsapp') return <MessageSquare className="w-3.5 h-3.5" />;
                                                            if (type === 'sent_manual') return <Check className="w-3.5 h-3.5" />;
                                                            if (type === 'postponed') return <Clock className="w-3.5 h-3.5" />;
                                                            if (type === 'responded_yes') return <ThumbsUp className="w-3.5 h-3.5" />;
                                                            if (type === 'responded_no') return <ThumbsDown className="w-3.5 h-3.5" />;
                                                            return <Clock className="w-3.5 h-3.5" />;
                                                        };

                                                        const eventColor = (type: string) => {
                                                            if (type === 'sent_whatsapp' || type === 'sent_manual') return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-500', text: 'text-emerald-700' };
                                                            if (type === 'postponed') return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-500', text: 'text-amber-700' };
                                                            if (type === 'responded_yes') return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-600', text: 'text-emerald-700' };
                                                            if (type === 'responded_no') return { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-500', text: 'text-rose-700' };
                                                            return { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-400', text: 'text-slate-600' };
                                                        };

                                                        const eventLabel = (type: string) => {
                                                            if (type === 'sent_whatsapp') return 'Enviado via WhatsApp';
                                                            if (type === 'sent_manual') return 'Envio registrado manualmente';
                                                            if (type === 'postponed') return 'Prorrogado';
                                                            if (type === 'responded_yes') return 'Paciente respondeu';
                                                            if (type === 'responded_no') return 'Finalizado sem retorno';
                                                            return type;
                                                        };

                                                        return (
                                                            <div className="space-y-2">
                                                                {execEvents.length === 0 && (
                                                                    <div className="flex items-center justify-between py-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="size-2 rounded-full bg-slate-400 animate-pulse" />
                                                                            <p className="text-sm font-medium text-slate-600">
                                                                                {isActive ? 'Aguardando envio da mensagem...' : 'Nenhum contato registrado.'}
                                                                            </p>
                                                                        </div>
                                                                        {isActive && (
                                                                            <button
                                                                                onClick={() => handleRegisterSent(stage.id)}
                                                                                className="text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                                                            >
                                                                                Registrar Envio Manualmente
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {execEvents.map((ev, idx) => {
                                                                    const colors = eventColor(ev.event_type);
                                                                    const isLast = idx === execEvents.length - 1;
                                                                    const deadlineRaw = ev.event_type === 'postponed' ? (ev.content || '').replace('Novo prazo: ', '').trim() : null;
                                                                    const deadlineFormatted = deadlineRaw
                                                                        ? new Date(deadlineRaw + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                                                                        : null;
                                                                    return (
                                                                        <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border} ${!isLast ? 'opacity-80' : ''}`}>
                                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colors.icon} text-white`}>
                                                                                <EventIcon type={ev.event_type} />
                                                                            </div>
                                                                            <div className="flex-1 space-y-0.5">
                                                                                <p className={`text-[10px] font-bold uppercase tracking-wide ${colors.text}`}>{eventLabel(ev.event_type)}</p>
                                                                                <p className="text-[10px] text-slate-400 font-medium">{formatDT(ev.created_at)}</p>
                                                                                {ev.event_type === 'postponed' && deadlineFormatted && (
                                                                                    <p className="text-xs font-bold text-amber-800 mt-1">Novo prazo: {deadlineFormatted}</p>
                                                                                )}
                                                                                {(ev.event_type === 'responded_yes' || ev.event_type === 'responded_no') && ev.content && ev.content !== 'Finalizado sem retorno' && (
                                                                                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{ev.content}</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {execEvents.length > 0 && awaitingResponse && isActive && (
                                                                    <div className="flex items-center justify-between pl-3 ml-3 border-l-2 border-dashed border-slate-300 py-2">
                                                                        <p className="text-xs font-medium text-slate-500 italic">Aguardando retorno do paciente...</p>
                                                                        {isRegisteringResponse !== stage.id && (
                                                                            <button
                                                                                onClick={() => setIsRegisteringResponse(stage.id)}
                                                                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
                                                                            >
                                                                                <MessageSquare className="w-3 h-3" /> Registrar Resposta
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {isClosed && isActive && (
                                                                    <button
                                                                        onClick={() => handleRegisterSent(stage.id)}
                                                                        className="w-full text-[10px] font-bold text-slate-500 hover:text-primary-600 border border-dashed border-slate-300 hover:border-primary-300 py-1.5 rounded-lg transition-colors mt-1"
                                                                    >
                                                                        + Registrar Novo Envio
                                                                    </button>
                                                                )}

                                                                {isRegisteringResponse === stage.id && (
                                                                    <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                                                        {responseIsYes !== stage.id && responseIsNo !== stage.id && (
                                                                            <>
                                                                                <p className="text-sm font-bold text-slate-800 text-center">Paciente respondeu?</p>
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <button onClick={() => setResponseIsYes(stage.id)} className="px-3 py-3 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                                                                        <ThumbsUp className="w-4 h-4" /> Sim, respondeu
                                                                                    </button>
                                                                                    <button onClick={() => setResponseIsNo(stage.id)} className="px-3 py-3 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                                                                        <ThumbsDown className="w-4 h-4" /> Não respondeu
                                                                                    </button>
                                                                                </div>
                                                                                <button onClick={() => setIsRegisteringResponse(null)} className="w-full text-[10px] text-slate-400 hover:text-slate-600 text-center py-1 transition-colors">Cancelar</button>
                                                                            </>
                                                                        )}
                                                                        {responseIsYes === stage.id && (
                                                                            <>
                                                                                <p className="text-xs font-bold text-slate-700">Resumo da resposta:</p>
                                                                                <textarea
                                                                                    value={tempResponse}
                                                                                    onChange={e => setTempResponse(e.target.value)}
                                                                                    placeholder="Descreva o que o paciente respondeu..."
                                                                                    className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                                                                                />
                                                                                <div className="flex gap-2 justify-end">
                                                                                    <button onClick={() => setResponseIsYes(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Voltar</button>
                                                                                    <button onClick={() => handleSaveResponse(stage.id, true, tempResponse)} className="px-4 py-1.5 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                                                                                        <Check className="w-3 h-3" /> Salvar Resposta
                                                                                    </button>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                        {responseIsNo === stage.id && (
                                                                            <div className="space-y-3 animate-in fade-in duration-200">
                                                                                <p className="text-xs font-bold text-rose-700 text-center">Paciente não respondeu. O que deseja fazer?</p>
                                                                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                                                                                    <p className="text-[10px] font-bold uppercase text-amber-700">Registrar novo prazo de retorno</p>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={newDeadline}
                                                                                        onChange={e => setNewDeadline(e.target.value)}
                                                                                        className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-300"
                                                                                    />
                                                                                    <button onClick={() => handleSetNewDeadline(stage.id, newDeadline)} className="w-full py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all">Salvar Novo Prazo</button>
                                                                                </div>
                                                                                <button onClick={() => handleSaveResponse(stage.id, false)} className="w-full py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all">
                                                                                    Finalizar como Sem Retorno
                                                                                </button>
                                                                                <button onClick={() => setResponseIsNo(null)} className="w-full text-[10px] text-slate-400 hover:text-slate-600 text-center py-1 transition-colors">Voltar</button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {/* Checklist de Ações */}
                                            {stage.actions && stage.actions.length > 0 && (
                                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                                        <label className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1.5"><ListTodo className="w-3.5 h-3.5" /> Checklist de Ações ({stage.actions.length})</label>
                                                    </div>
                                                    <div className="divide-y divide-slate-100">
                                                        {stage.actions.map((action: any, aIdx: number) => {
                                                            const isActionDone = completedActions.has(`${stage.id}-${aIdx}`);
                                                            return (
                                                                <div key={aIdx} className="p-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleToggleAction(stage.id, aIdx)}>
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isActionDone ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-200'}`}>
                                                                        {isActionDone && <Check className="w-3 h-3" />}
                                                                    </div>
                                                                    <span className={`text-xs font-medium ${isActionDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{action.title || action.name || `Ação ${aIdx + 1}`}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Stage Footer actions */}
                                            {isSkipping === stage.id ? (
                                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <h6 className="text-[10px] font-bold text-amber-700 uppercase">Justificativa para pular</h6>
                                                        <button onClick={() => setIsSkipping(null)} className="text-amber-700 hover:text-amber-900"><X className="w-4 h-4" /></button>
                                                    </div>
                                                    <textarea
                                                        value={skipJustification}
                                                        onChange={(e) => setSkipJustification(e.target.value)}
                                                        className="w-full h-24 p-2 text-xs bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                                                        placeholder="Descreva o motivo..."
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setIsSkipping(null)} className="px-3 py-1.5 text-[10px] font-bold text-amber-700 hover:bg-amber-100 rounded-lg">Cancelar</button>
                                                        <button onClick={() => handleSkipStage(stage.id)} disabled={skipJustification.trim().length < 10} className="px-4 py-1.5 text-[10px] font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">Confirmar Pular</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-3 pt-2">
                                                    {!isCompleted && !isSkipped && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setIsSkipping(stage.id); }}
                                                            className="px-4 py-2 rounded-lg font-bold text-[10px] text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-200"
                                                        >
                                                            Pular Etapa
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateExecution(stage.id, { status: isCompleted ? 'pending' : 'completed' }); }}
                                                        disabled={!isCompleted && !canComplete}
                                                        title={!isCompleted && !canComplete ? "Conclua todas as ações e o contato para finalizar esta etapa" : ""}
                                                        className={`px-5 py-2 rounded-lg font-bold text-[10px] transition-all flex items-center gap-2 ${isCompleted ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' :
                                                            canComplete ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' :
                                                                'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'}`}
                                                    >
                                                        {isCompleted ? <RefreshCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 font-black" />}
                                                        {isCompleted ? 'Voltar para Pendente' : 'Concluir Etapa'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
};


function TeamMemberCard({ role, type, name, phone, status, pendingDocs, onUpdate }: {
    role: string;
    type: string;
    name: string;
    phone?: string;
    status: 'OK' | 'Warning';
    pendingDocs?: boolean;
    onUpdate?: () => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center justify-between">
                <div
                    className="flex items-center gap-4 cursor-pointer flex-1"
                    onClick={() => setIsExpanded(!isExpanded)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
                >
                    <div className="relative">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className={`absolute -bottom-1 -right-1 flex h-4 w-4 rounded-full border-2 border-white ${status === 'OK' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">{role}</h3>
                        <p className="text-xs text-slate-500 uppercase font-medium">{type}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {status === 'OK' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Alocado</span>
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                    ) : (
                        <button className="text-sm font-medium text-primary-600 hover:underline">Escalar Profissional</button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="ml-2 focus:outline-none"
                        aria-label={isExpanded ? "Recolher" : "Expandir"}
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-tight">Nome</span>
                            <span className="text-sm font-medium text-slate-700">{name}</span>
                        </div>
                        {phone && (
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 uppercase font-bold tracking-tight">Contato</span>
                                <span className="text-sm font-medium text-slate-700">{phone}</span>
                            </div>
                        )}
                    </div>

                    {pendingDocs && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="text-[10px] font-bold text-red-500 uppercase mb-2">Pendente</h4>
                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded text-red-700 text-xs">
                                <AlertCircle className="w-4 h-4" />
                                <span>Aguardando entrega de documentação</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex gap-2">
                        <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-white transition-colors">
                            <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const TeamTab: React.FC<{
    surgeryCase: SurgeryCase;
    participantItems: any[];
    onUpdate: () => void;
}> = ({ surgeryCase, participantItems, onUpdate }) => {

    // Configuração de prioridade de exibição na lista de equipe
    const sortedParticipants = [...participantItems].sort((a, b) => {
        const nameA = (a.protocol_ref?.name || '').toLowerCase();
        const nameB = (b.protocol_ref?.name || '').toLowerCase();

        const isSurgeonA = nameA.includes('cirurgião principal') || nameA === 'cirurgião' || nameA === 'médico cirurgião';
        const isSurgeonB = nameB.includes('cirurgião principal') || nameB === 'cirurgião' || nameB === 'médico cirurgião';

        if (isSurgeonA && !isSurgeonB) return -1;
        if (!isSurgeonA && isSurgeonB) return 1;
        return nameA.localeCompare(nameB);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Equipe Cirúrgica</h3>
                    <p className="text-sm text-slate-500 font-medium">Controle de presença e documentação dos profissionais.</p>
                </div>
                <button
                    title="Adicionar Membro"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Adicionar Membro
                </button>
            </div>

            <div className="space-y-4">
                {sortedParticipants.map(item => (
                    <ParticipantCard
                        key={item.id}
                        participant={item}
                        surgeryCase={surgeryCase}
                        onStatusUpdate={async (status) => {
                            await supabase.from('order_participants').update({ status }).eq('id', item.id);
                            onUpdate();
                        }}
                        onUpdate={onUpdate}
                    />
                ))}

                {sortedParticipants.length === 0 && (
                    <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium italic">Nenhum integrante na equipe.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


function TimelineStepCard({ step, title, status, statusLabel, children, isLast }: {
    step: number;
    title: string;
    status: 'CONCLUÍDO' | 'EM ANDAMENTO' | 'ATRASADO' | 'AGUARDANDO';
    statusLabel: string;
    children: React.ReactNode;
    isLast?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const getColors = () => {
        switch (status) {
            case 'CONCLUÍDO': return { border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-600', circle: 'bg-emerald-500' };
            case 'EM ANDAMENTO': return { border: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-600', circle: 'bg-amber-400' };
            case 'ATRASADO': return { border: 'border-l-red-500', badge: 'bg-red-100 text-red-700', text: 'text-red-500', circle: 'bg-red-500' };
            default: return { border: 'border-l-slate-300', badge: 'bg-slate-100 text-slate-600', text: 'text-slate-500', circle: 'bg-slate-300' };
        }
    };

    const colors = getColors();

    return (
        <div className="relative pl-10 pb-8 last:pb-0">
            {/* Timeline Line */}
            {!isLast && <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-slate-200"></div>}

            {/* Number Bubble */}
            <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm z-10 ${colors.circle}`}>
                {status === 'CONCLUÍDO' ? <Check className="w-5 h-5" /> : step}
            </div>

            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all ${colors.border} border-l-4`}>
                <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                    onClick={() => setIsOpen(!isOpen)}
                    role="button"
                    tabIndex={0}
                >
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>{statusLabel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${colors.badge}`}>{statusLabel}</span>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                </div>

                {isOpen && (
                    <div className="px-5 pb-5 border-t border-slate-100 mt-2 pt-4">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}


// Detailed Document Card for DocumentsTab
const DetailedDocumentCard: React.FC<{
    status: 'valid' | 'critical' | 'pending';
    title: string;
    dateValue: string;
    isExpired?: boolean;
    hasFile?: boolean;
    fileName?: string;
    fileDate?: string;
    showFluxo?: boolean;
    showFollowUp?: boolean;
}> = ({ status, title, dateValue, isExpired, hasFile, fileName, fileDate, showFluxo, showFollowUp }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const borderColor = status === 'valid' ? 'border-emerald-200' : 'border-red-200';
    const textColor = status === 'valid' ? 'text-emerald-500' : 'text-red-500';
    const statusText = status === 'valid' ? 'VALIDADO' : 'CRÍTICO';

    return (
        <div className="flex items-start gap-4">
            {/* Status Icon Outside */}
            <div className={`mt-6 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${status === 'valid' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {status === 'valid' ? <Check className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>

            {/* Main Card */}
            <div className={`flex-1 bg-white rounded-xl border ${borderColor} shadow-sm overflow-hidden`}>
                {/* Header */}
                <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                    role="button"
                    tabIndex={0}
                >
                    <div className="flex items-center gap-3">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{title}</h4>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>{statusText}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {status === 'critical' && (
                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded uppercase border border-red-100">Atenção</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                </div>

                {/* Body */}
                {isExpanded && (
                    <div className="px-5 pb-6 border-t border-slate-100">
                        {/* Main Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Data de Validade</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        title="Data de Validade informada pelo paciente"
                                        placeholder="Ex: 31/12/2026"
                                        defaultValue={dateValue}
                                        className={`w-full pl-4 pr-10 py-2.5 border rounded-lg text-sm font-medium outline-none focus:ring-2 transition-all ${isExpired ? 'border-red-300 text-red-600 focus:ring-red-200 bg-red-50' : 'border-slate-200 text-slate-700 focus:ring-primary-100 focus:border-primary-400'}`}
                                    />
                                    <CalendarIcon className={`absolute right-3 top-2.5 w-5 h-5 ${isExpired ? 'text-red-400' : 'text-slate-400'}`} />
                                </div>
                                {isExpired && (
                                    <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> VENCIDO NA DATA DA CIRURGIA
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4 h-full pt-6">
                                <span className="text-sm font-medium text-slate-700">Paciente já enviou?</span>
                                {/* Toggle Switch */}
                                <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${status === 'valid' ? 'bg-primary-600' : 'bg-slate-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${status === 'valid' ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                                </div>
                            </div>
                        </div>

                        {/* File Attachment */}
                        {hasFile && (
                            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-100 p-2 rounded text-primary-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{fileName}</p>
                                        <p className="text-xs text-slate-500">{fileDate}</p>
                                    </div>
                                </div>
                                <button className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline">Visualizar</button>
                            </div>
                        )}

                        {/* Request Flow */}
                        {showFluxo && (
                            <div className="mt-6 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                                <h5 className="text-xs font-bold text-slate-600 uppercase mb-4">Fluxo de Solicitação</h5>
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prazo de Resposta</label>
                                        <select
                                            title="Prazo de Resposta"
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
                                        >
                                            <option>24 horas</option>
                                            <option>48 horas</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lembrete de Follow-up</label>
                                        <select
                                            title="Lembrete de Follow-up"
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
                                        >
                                            <option>A cada 12h</option>
                                            <option>Diário</option>
                                        </select>
                                    </div>
                                    <button className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 flex items-center justify-center gap-2">
                                        <Send className="w-4 h-4" /> Solicitar ao Paciente
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Follow Up Section */}
                        {showFollowUp && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-amber-800 uppercase">Seção de Follow-up</p>
                                        <p className="text-sm text-amber-700">Aguardando resposta do paciente via SMS/WhatsApp</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-amber-800 uppercase mr-2">Respondeu?</span>
                                    <button className="px-4 py-1.5 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded hover:bg-amber-100">SIM</button>
                                    <button className="px-4 py-1.5 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded hover:bg-amber-100 opacity-50">NÃO</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    exames: 'Exames',
    pedido_medico: 'Pedido Médico',
    laudo: 'Laudos de Exames',
    risco_cirurgico: 'Risco Cirúrgico',
    termo_consentimento: 'Termo de Consentimento',
    documento_acompanhante: 'Documentos do Acompanhante',
    lista_medicamentos: 'Lista de Medicamentos',
    personalizado: 'Personalizado',
};

const DocumentsTab: React.FC<{
    documents: OrderDocument[];
    onUpdate: () => void;
}> = ({ documents, onUpdate }) => {

    const [updating, setUpdating] = useState<string | null>(null);
    const { permissions } = useAuth();

    const handleStatusUpdate = async (docId: string, status: string) => {
        setUpdating(docId);
        try {
            const { error } = await supabase
                .from('medical_order_documents')
                .update({
                    status,
                    validated_at: status === 'received' ? new Date().toISOString() : null
                })
                .eq('id', docId);

            if (error) throw error;
            toast.success('Status do documento atualizado');
            onUpdate();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary-600" /> DOCUMENTOS DO PROCESSO
                    </h3>
                    <button
                        className="text-primary-600 text-sm font-bold flex items-center gap-2 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Novo Documento
                    </button>
                </div>

                <div className="space-y-4">
                    {documents.length > 0 && (
                        <div className="grid grid-cols-12 gap-4 px-2 mb-2">
                            <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">Tipo de Documento</div>
                            <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">Data de Validade</div>
                            <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase text-center">Arquivo / Anexo</div>
                            <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase text-center">Já Anexado?</div>
                            <div className="col-span-1"></div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {documents.map((doc) => {
                            const isAnnexed = doc.status === 'received' || doc.is_annexed_locally || !!doc.file_url;

                            return (
                                <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl items-center animate-in fade-in slide-in-from-top-2">
                                    <div className="col-span-3 space-y-2">
                                        <div className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none flex items-center justify-between">
                                            <span>{doc.type === 'personalizado' ? (doc.custom_name || 'Personalizado') : (DOCUMENT_TYPE_LABELS[doc.type as string] || doc.type || 'Documento')}</span>
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="col-span-3 flex items-center gap-2">
                                        <div
                                            className={`flex-1 p-2 bg-white border flex items-center justify-between border-slate-200 rounded-lg text-sm text-slate-700 outline-none ${doc.has_no_expiry ? 'opacity-50 bg-slate-100' : ''}`}
                                        >
                                            <span>{doc.has_no_expiry ? 'dd/mm/aaaa' : (doc.valid_until ? new Date(doc.valid_until).toLocaleDateString('pt-BR') : 'dd/mm/aaaa')}</span>
                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div
                                            className={`shrink-0 p-2 rounded-lg border ${doc.has_no_expiry ? 'bg-amber-100 border-amber-200 text-amber-700 font-bold text-[10px]' : 'bg-white border-slate-200 text-slate-400 text-[10px]'}`}
                                            title="Marcar como sem validade"
                                        >
                                            {doc.has_no_expiry ? 'SEM VAL' : 'S/ VAL'}
                                        </div>
                                    </div>

                                    <div className="col-span-3 flex justify-center">
                                        {doc.file_url ? (
                                            <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                                <Check className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[100px]">{doc.file_url.split('/').pop() || 'Arquivo anexado'}</span>
                                                <button title="Remover anexo" className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                                <Upload className="w-3.5 h-3.5" /> Anexar Arquivo
                                            </button>
                                        )}
                                    </div>

                                    <div className="col-span-2 flex justify-center">
                                        <button
                                            onClick={() => handleStatusUpdate(doc.id, isAnnexed ? 'pending' : 'received')}
                                            disabled={updating === doc.id}
                                            className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-[10px] font-black transition-all border ${isAnnexed ? 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50' : 'bg-white border-slate-200 text-slate-400'}`}
                                        >
                                            {updating === doc.id ? (
                                                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                            ) : isAnnexed ? (
                                                <><ClipboardCheck className="w-3.5 h-3.5" /> JÁ ANEXADO</>
                                            ) : 'NÃO ANEXADO'}
                                        </button>
                                    </div>

                                    <div className="col-span-1 flex justify-end">
                                        {permissions.can_delete_schedule && (
                                            <button title="Excluir documento" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {documents.length === 0 && (
                            <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">Nenhum documento solicitado para esta cirurgia.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar History (Simplified for brevity) */}
            <div className="w-full lg:w-80 shrink-0">
                <div className="bg-white rounded-xl border border-slate-200 p-6 h-full shadow-sm">
                    <h4 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Validação de Navegação
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                        Verifique se os documentos anexados correspondem ao solicitado e estão dentro da validade antes de marcar como "Recebido".
                    </p>
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Status de Auditoria</p>
                            <p className="text-xs text-emerald-600">Todos os documentos marcados como recebidos serão auditados pela coordenação.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OpmeCard: React.FC<{
    item: OrderOpme;
    onUpdate?: (updates: Partial<OrderOpme>) => Promise<void>;
}> = ({ item, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const [authValue, setAuthValue] = useState(item.authorized_value?.toString() || '');
    const [authSupplier, setAuthSupplier] = useState(item.authorized_supplier_id || item.supplier || item.suggested_vendor || '');

    const itemName = item.description || 'Item sem nome';
    const description = item.manufacturer ? `Fabricante: ${item.manufacturer}` : 'Fabricante não informado';
    const supplier = item.supplier || item.suggested_vendor || 'Fornecedor não indicado';
    const qty = Number(item.quantity) || 1;
    const value = item.authorized_value ? `R$ ${item.authorized_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00';
    const status = item.is_authorized ? 'Autorizado' : 'Cotado';

    const handleSave = async () => {
        if (!onUpdate) return;
        try {
            await onUpdate({
                is_authorized: true,
                authorized_value: parseFloat(authValue.replace(',', '.')) || 0,
                supplier: authSupplier
            });
            toast.success('Autorização atualizada');
        } catch (error) {
            toast.error('Erro ao atualizar autorização');
        }
    };
    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4 ${status === 'Autorizado' ? 'border-l-emerald-500' :
            status === 'Cotado' ? 'border-l-primary-500' : 'border-l-amber-500'
            }`}>
            <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                onClick={() => setIsExpanded(!isExpanded)}
                role="button"
                tabIndex={0}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status === 'Autorizado' ? 'bg-emerald-50 text-emerald-600' :
                        status === 'Cotado' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{itemName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">{description}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase">{supplier}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right mr-2">
                        <p className="text-sm font-bold text-slate-800">{value}</p>
                        <span className={`text-[10px] font-bold uppercase block ${status === 'Autorizado' ? 'text-emerald-600' :
                            status === 'Cotado' ? 'text-primary-600' : 'text-amber-600'
                            }`}>{status}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
            </div>

            {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Quantidade</label>
                            <input
                                title="Quantidade"
                                type="number"
                                defaultValue={qty}
                                className="w-full p-2 border border-slate-200 rounded text-sm font-bold text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Valor Unitário Autorizado (R$)</label>
                            <input
                                title="Valor Autorizado"
                                type="number"
                                step="0.01"
                                value={authValue}
                                onChange={e => setAuthValue(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded text-sm font-bold text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Fornecedor / Fabricante</label>
                            <input
                                title="Fornecedor"
                                value={authSupplier}
                                onChange={e => setAuthSupplier(e.target.value)}
                                placeholder="Nome do fornecedor autorizado"
                                className="w-full p-2 border border-slate-200 rounded text-sm font-bold text-slate-700"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        {item.is_authorized && (
                            <button
                                onClick={async () => {
                                    if (onUpdate) await onUpdate({ is_authorized: false });
                                    toast.success('Autorização removida');
                                }}
                                className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                            >
                                Cancelar Autorização
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm"
                        >
                            <Check className="w-3 h-3" /> {item.is_authorized ? 'Atualizar Dados' : 'Autorizar OPME'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const OpmeTab: React.FC<{ opmeItems: OrderOpme[], onUpdate: () => void }> = ({ opmeItems, onUpdate }) => {

    const handleOpmeUpdate = async (id: string, updates: Partial<OrderOpme>) => {
        try {
            const { error } = await supabase
                .from('order_opme')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            onUpdate();
        } catch (error) {
            console.error('Error updating OPME', error);
            throw error;
        }
    };
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Gestão de OPME</h3>
                    <p className="text-sm text-slate-500">Cotações e autorizações de materiais especiais.</p>
                </div>
                <button
                    title="Nova Solicitação"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Nova Solicitação
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusSummaryCard label="Total Itens" count={opmeItems.length} icon={Package} color="text-primary-600" />
                <StatusSummaryCard label="Autorizados" count={opmeItems.filter(o => o.is_authorized).length} icon={Check} color="text-emerald-500" />
                <StatusSummaryCard label="Em Cotação" count={opmeItems.filter(o => !o.is_authorized).length} icon={Activity} color="text-amber-500" />
            </div>

            <div className="space-y-4">
                {opmeItems.map((item) => (
                    <OpmeCard
                        key={item.id}
                        item={item}
                        onUpdate={(updates) => handleOpmeUpdate(item.id, updates)}
                    />
                ))}

                {opmeItems.length === 0 && (
                    <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Nenhum item OPME solicitado para esta cirurgia.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const HistoryTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Histórico de Evolução Clínica</h3>
                    <p className="text-sm text-slate-500 font-medium">Registros cronológicos do acompanhamento do paciente.</p>
                </div>
                <button
                    title="Novo Registro"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Novo Registro
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data/Hora</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evolução / Nota</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[1, 2].map((i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-700">02/03/2026</div>
                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">14:30 PM</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-primary-50 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-600 border border-primary-100">
                                                DR
                                            </div>
                                            <div className="text-sm font-medium text-slate-700">Dr. Ricardo Santos</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-md">
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                {i === 1
                                                    ? 'Paciente apresenta boa evolução no pré-operatório. Documentação de anestesia revisada e validada.'
                                                    : 'Solicitada avaliação complementar de cardiologia para liberação definitiva.'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button title="Editar" className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors">
                                            <Wrench className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <p className="text-sm text-slate-400 italic font-medium">Fim dos registros de evolução.</p>
            </div>
        </div>
    );
};

export const CaseDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Visão Geral');
    const [loading, setLoading] = useState(true);

    // Case Data
    const [surgeryCase, setSurgeryCase] = useState<SurgeryCase | null>(null);
    const [patient, setPatient] = useState<PatientV2 | null>(null);
    const [documents, setDocuments] = useState<OrderDocument[]>([]);
    const [opmeItems, setOpmeItems] = useState<OrderOpme[]>([]);
    const [equipmentItems, setEquipmentItems] = useState<any[]>([]);
    const [procedures, setProcedures] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [participantItems, setParticipantItems] = useState<any[]>([]);
    const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
    const [beneficiaryJourneys, setBeneficiaryJourneys] = useState<any[]>([]);
    const [isProtocolSearchOpen, setIsProtocolSearchOpen] = useState(false);
    const [beneficiaryProtocols, setBeneficiaryProtocols] = useState<any[]>([]);


    const fetchData = useCallback(async (isInitial = false) => {
        if (!id) return;
        if (isInitial) setLoading(true);
        try {
            // 1. Fetch Surgery Case (Primary Data)
            const { data: caseData, error: caseError } = await supabase
                .from('surgery_cases')
                .select('*')
                .eq('id', id)
                .single();

            if (caseError) {
                console.error('Case fetch error:', caseError);
                throw new Error(`Cirurgia não encontrada no banco (ID: ${id}). Verifique se o registro existe.`);
            }

            setSurgeryCase(caseData);

            // 2. Fetch Patient Data separately
            if (caseData.patient_id) {
                const { data: pData } = await supabase
                    .from('patients_v2')
                    .select('*')
                    .eq('id', caseData.patient_id)
                    .single();
                if (pData) setPatient(pData);
            }

            // 3. Fetch Doctor & Hospital if IDs exist (for header)
            if (caseData.doctor_id) {
                const { data: dData } = await supabase.from('doctors').select('*').eq('id', caseData.doctor_id).single();
                if (dData) (caseData as any).doctor_ref = dData;
            }
            if (caseData.hospital_id) {
                const { data: hData } = await supabase.from('hospitals').select('*').eq('id', caseData.hospital_id).single();
                if (hData) (caseData as any).hospital_ref = hData;
            }

            // 4. Fetch Documents
            const { data: docData } = await supabase
                .from('medical_order_documents')
                .select('*')
                .eq('order_id', id);
            setDocuments(docData || []);

            // 5. Fetch OPME
            const { data: opmeData } = await supabase
                .from('order_opme')
                .select('*')
                .eq('order_id', id);
            setOpmeItems(opmeData || []);

            const { data: eqData } = await supabase
                .from('order_equipments')
                .select('*')
                .eq('order_id', id);
            setEquipmentItems(eqData || []);

            // 6.1. Fetch Participants
            const { data: partData } = await supabase
                .from('order_participants')
                .select('*, doctor_ref:doctors(*), protocol_ref:protocols(name)')
                .eq('case_id', id);
            setParticipantItems(partData || []);

            // 7. Fetch Procedures
            const { data: procData } = await supabase
                .from('order_procedures')
                .select('*')
                .eq('order_id', id)
                .order('is_main', { ascending: false });

            if (caseData) {
                // Update surgeryCase with main procedure for UI consistency
                caseData.main_procedure = procData?.find(p => p.is_main)?.description || procData?.[0]?.description || 'N/A';
                setSurgeryCase({ ...caseData });
            }
            setProcedures(procData || []);

            // 8. Fetch Doctors for team selection
            const { data: doctorData } = await supabase.from('doctors').select('*');
            setDoctors(doctorData || []);

            // 9. Fetch Beneficiary Communications
            const { data: journeyData } = await supabase
                .from('case_beneficiary_communications')
                .select('*, protocol_ref:protocols(name)')
                .eq('case_id', id);
            setBeneficiaryJourneys(journeyData || []);


        } catch (error: any) {
            console.error('Error fetching case details:', error);
            toast.error(error.message || 'Erro ao carregar detalhes da cirurgia');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!surgeryCase) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-bold">Cirurgia não encontrada</h2>
                <button onClick={() => navigate('/atendimento')} className="text-primary-600 font-bold">Voltar para lista</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
                <div>
                    {patient?.id && (
                        <button
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            title="Voltar ao perfil do paciente"
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 mb-2 group transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Voltar ao perfil de {patient?.full_name?.split(' ')[0] || 'Paciente'}
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-slate-800">Detalhes da Cirurgia</h1>
                    <p className="text-xs text-slate-500 mt-1">ID da Operação: #{surgeryCase.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCommunicationOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
                        title="Central de Comunicação com o Paciente"
                    >
                        <Mail className="w-4 h-4" /> Comunicação
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                        <Printer className="w-4 h-4" /> Exportar PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all">
                        <FileText className="w-4 h-4" /> Relatório Completo
                    </button>
                </div>
            </div>

            {/* Patient Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Paciente</span>
                            {patient?.id ? (
                                <button
                                    onClick={() => navigate(`/patients/${patient.id}`)}
                                    title="Abrir perfil do paciente"
                                    className="text-2xl font-bold text-slate-800 leading-tight hover:text-primary-600 transition-colors flex items-center gap-1.5 group"
                                >
                                    {patient?.full_name || surgeryCase.patientName || 'Paciente não identificado'}
                                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" />
                                </button>
                            ) : (
                                <h2 className="text-2xl font-bold text-slate-800 leading-tight">{patient?.full_name || surgeryCase.patientName || 'Paciente não identificado'}</h2>
                            )}
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {surgeryCase.main_procedure || 'Procedimento não informado'}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {(surgeryCase as any).hospital_ref?.name || surgeryCase.hospital || 'Hospital não informado'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center min-w-[240px]">
                        <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1">Data Agendada</p>
                        <div className="text-2xl font-bold text-primary-700 font-mono">
                            {surgeryCase.date ? new Date(surgeryCase.date).toLocaleDateString('pt-BR') : '--/--/--'}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            Horário: {surgeryCase.date ? new Date(surgeryCase.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs (Modified) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50 mb-6">
                {['Visão Geral', 'Pedido Médico', 'Equipamentos', 'Equipe', 'Documentos', 'OPME', 'Histórico'].map((tab) => (
                    <TabButton
                        key={tab}
                        active={activeTab === tab}
                        label={tab}
                        onClick={() => setActiveTab(tab)}
                    />
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
                {activeTab === 'Visão Geral' && <OverviewTab surgeryCase={surgeryCase} documents={documents} opmeItems={opmeItems} equipmentItems={equipmentItems} onNavigate={setActiveTab} />}
                {activeTab === 'Pedido Médico' && <MedicalOrderTab surgeryCase={surgeryCase} procedures={procedures} documents={documents} opmeItems={opmeItems} equipmentItems={equipmentItems} />}
                {activeTab === 'Equipamentos' && <EquipmentsTab surgeryCase={surgeryCase} equipmentItems={equipmentItems} onUpdate={fetchData} />}
                {activeTab === 'Equipe' && <TeamTab surgeryCase={surgeryCase} participantItems={participantItems} onUpdate={fetchData} />}
                {activeTab === 'Documentos' && <DocumentsTab documents={documents} onUpdate={fetchData} />}
                {activeTab === 'OPME' && <OpmeTab opmeItems={opmeItems} onUpdate={fetchData} />}
                {activeTab === 'Histórico' && <HistoryTab />}
            </div>

            {/* Central de Comunicação (Slide-over Right) */}
            {isCommunicationOpen && (
                <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-4xl bg-slate-50 h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-200">
                        <div className="p-6 border-b flex justify-between items-center bg-white">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Mail className="w-5 h-5 text-primary-600" /> Central de Comunicação</h3>
                                <p className="text-xs text-slate-500">Gestão de jornadas de comunicação com o paciente</p>
                            </div>
                            <button onClick={() => setIsCommunicationOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Jornadas Ativas</h4>
                                <button
                                    onClick={async () => {
                                        const { data } = await supabase.from('protocols').select('*').eq('type', 'beneficiary').eq('active', true);
                                        setBeneficiaryProtocols(data || []);
                                        setIsProtocolSearchOpen(true);
                                    }}
                                    className="px-4 py-2 bg-primary-600 text-white font-bold text-xs rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2 shadow-lg shadow-primary-600/20"
                                >
                                    <Plus className="w-4 h-4" /> Incluir Jornada
                                </button>
                            </div>

                            {beneficiaryJourneys.length > 0 ? (
                                <div className="space-y-4">
                                    {beneficiaryJourneys.map(journey => (
                                        <CommunicationJourneyCard
                                            key={journey.id}
                                            journey={journey}
                                            surgeryCase={surgeryCase}
                                            patient={patient}
                                            onUpdate={fetchData}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-32 bg-white rounded-3xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                        <MessageSquare className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-400 tracking-tight">Nenhuma jornada de comunicação iniciada.</p>
                                        <p className="text-xs text-slate-400 mt-1">Clique no botão acima para selecionar um protocolo.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Protocol Selection Modal */}
            {isProtocolSearchOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Selecionar Protocolo</h3>
                            <button onClick={() => setIsProtocolSearchOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
                            {beneficiaryProtocols.length > 0 ? beneficiaryProtocols.map(proto => (
                                <button
                                    key={proto.id}
                                    onClick={async () => {
                                        const { error } = await supabase.from('case_beneficiary_communications').insert({
                                            case_id: surgeryCase.id,
                                            protocol_id: proto.id,
                                            status: 'pending'
                                        });
                                        if (error) toast.error('Erro ao incluir jornada');
                                        else {
                                            toast.success('Jornada incluída com sucesso');
                                            setIsProtocolSearchOpen(false);
                                            fetchData();
                                        }
                                    }}
                                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 rounded-xl border border-slate-100 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Heart className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{proto.name}</div>
                                            <div className="text-xs text-slate-400">Clique para selecionar</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 transition-all group-hover:translate-x-1" />
                                </button>
                            )) : (
                                <p className="text-center py-10 text-slate-400 font-medium italic">Nenhum protocolo configurado nas configurações.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
