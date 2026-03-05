import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    FileText, Search, Filter, Download, Calendar,
    ChevronLeft, ChevronRight, Activity, ArrowRight,
    CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface ReportSurgery {
    id: string;
    date: string;
    status: string;
    patient_name: string;
    procedure: string;
    hospital: string;
    doctor: string;
    progress: number;
}

export const Reports: React.FC = () => {
    const navigate = useNavigate();
    const [surgeries, setSurgeries] = useState<ReportSurgery[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchReports = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('surgery_cases')
                .select(`
          id,
          date,
          status,
          patients_v2!patient_id (full_name),
          doctors!doctor_id (full_name),
          hospitals!hospital_id (name),
          order_procedures!order_id (description),
          documents:medical_order_documents!order_id (id),
          opme:order_opme!order_id (id),
          equipment:order_equipments!order_id (status)
        `)
                .order('date', { ascending: false });

            if (error) throw error;

            const formatted = (data || []).map(s => {
                const sections = [
                    ...(s.documents || []).map((d: any) => ({ status: 'completed' })),
                    ...(s.opme || []).map((o: any) => ({ status: 'completed' })),
                    ...(s.equipment || [])
                ];
                const completed = sections.filter((i: any) => i.status === 'completed' || i.status === 'validated' || i.status === 'confirmed').length;
                const total = sections.length || 1;
                const progress = Math.round((completed / total) * 100);

                return {
                    id: s.id,
                    date: s.date,
                    status: s.status,
                    patient_name: (s.patients_v2 as any)?.full_name || 'N/A',
                    procedure: (s.order_procedures as any)?.[0]?.description || 'N/A',
                    hospital: (s.hospitals as any)?.name || 'N/A',
                    doctor: (s.doctors as any)?.full_name || 'N/A',
                    progress
                };
            });

            setSurgeries(formatted);
        } catch (err) {
            console.error('Error fetching reports:', err);
            toast.error('Erro ao carregar relatórios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const filtered = surgeries.filter(s => {
        const matchesSearch = s.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.procedure.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'agendado':
                return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase border border-blue-100 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Agendado</span>;
            case 'em_navegacao':
                return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase border border-amber-100 flex items-center gap-1 w-fit"><Activity className="w-3 h-3" /> Navegação</span>;
            case 'finalizada':
                return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase border border-emerald-100 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Finalizada</span>;
            default:
                return <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold uppercase border border-slate-100 flex items-center gap-1 w-fit">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Relatórios de Navegação</h2>
                    <p className="text-slate-500 text-sm">Visão consolidada de todos os casos e status.</p>
                </div>
                <button
                    onClick={() => toast.success('Exportando para Excel...')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                >
                    <Download className="w-4 h-4" /> Exportar Relatório
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        title="Pesquisar Paciente, Médico ou Procedimento"
                        type="text"
                        placeholder="Pesquisar paciente, médico ou procedimento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                    />
                </div>
                <select
                    title="Filtro de Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none cursor-pointer shadow-sm"
                >
                    <option value="all">Todos os Status</option>
                    <option value="agendado">Agendado</option>
                    <option value="em_navegacao">Em Navegação</option>
                    <option value="finalizada">Finalizada</option>
                </select>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Últimos 30 dias</span>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="font-bold">Nenhum registro encontrado</p>
                        <p className="text-sm mt-1">Tente ajustar seus filtros de busca.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paciente / Procedimento</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipe Médica</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital e Data</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status / Progresso</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-slate-800">{s.patient_name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">{s.procedure}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-bold text-slate-700">{s.doctor}</p>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase">Médico Assistente</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-semibold text-slate-700">{s.hospital}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {s.date ? format(new Date(s.date), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'A definir'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-2">
                                                {getStatusBadge(s.status)}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${s.progress === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                                            style={{ width: `${s.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400">{s.progress}%</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => navigate(`/case/${s.id}`)}
                                                className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all shadow-sm ml-auto group-hover:scale-110"
                                                title="Ver Detalhes"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-2">
                <p className="text-xs text-slate-400 font-medium">Exibindo {filtered.length} de {surgeries.length} registros</p>
                <div className="flex items-center gap-2">
                    <button
                        title="Página Anterior"
                        className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                        disabled
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            title="Página 1"
                            className="w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-lg text-xs font-bold shadow-md shadow-primary-600/20"
                        >
                            1
                        </button>
                    </div>
                    <button
                        title="Próxima Página"
                        className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                        disabled
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

