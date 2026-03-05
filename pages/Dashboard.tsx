import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Activity, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Filter, Plus, FileText, Package, Wrench, Users, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

// Tipagem para cirurgia do dashboard
interface DashboardSurgery {
  id: string;
  patient_id: string;
  patient_name: string;
  procedure: string;
  hospital: string;
  doctor: string;
  date: string;
  status: string;
  progress: {
    docs: number;
    anesthesia: number;
    opme: number;
    equipment: number;
    team: number;
  };
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string; bg: string }> = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className={`p-4 rounded-xl ${bg}`}>
      <Icon className={`w-8 h-8 ${color}`} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const ProgressBarGroup: React.FC<{ progress: any }> = ({ progress }) => {
  const getBarColor = (val: number) => {
    if (val === 100) return 'bg-emerald-500';
    if (val < 50) return 'bg-red-500';
    return 'bg-amber-400';
  };

  const getIconColor = (val: number) => {
    if (val === 100) return 'text-emerald-600';
    if (val < 50) return 'text-red-500';
    return 'text-amber-500';
  };

  const steps = [
    { key: 'docs', icon: FileText, label: 'Documentos' },
    { key: 'anesthesia', icon: Activity, label: 'Anestesia' },
    { key: 'opme', icon: Package, label: 'OPME' },
    { key: 'equipment', icon: Wrench, label: 'Equipamentos' },
    { key: 'team', icon: Users, label: 'Equipe' },
  ];

  return (
    <div className="flex gap-3">
      {steps.map((step) => {
        const val = progress[step.key];
        return (
          <div key={step.key} className="flex flex-col items-center gap-1.5" title={`${step.label}: ${val}%`}>
            <step.icon className={`w-4 h-4 ${getIconColor(val)}`} />
            <div className="w-8 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${getBarColor(val)}`} style={{ width: `${val}%` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [surgeries, setSurgeries] = useState<DashboardSurgery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, items: 0, completed: 0 });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Buscar casos de cirurgia com relações
      const { data, error } = await supabase
        .from('surgery_cases')
        .select(`
          id,
          date,
          status,
          patient_id,
          patients_v2!patient_id (full_name),
          doctors!doctor_id (full_name),
          hospitals!hospital_id (name),
          order_procedures!order_id (description),
          documents:medical_order_documents!order_id (id),
          opme:order_opme!order_id (id),
          equipment:order_equipments!order_id (status)
        `)
        .order('date', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formatted = (data || []).map(s => {
        // Cálculo simplificado de progresso para o dashboard
        const calcProg = (arr: any[]) => {
          if (!arr || arr.length === 0) return 100; // Se não tem itens, considera concluído (ou 0 dependendo da lógica)
          const completed = arr.filter(i => i.status === 'completed' || i.status === 'validated' || i.status === 'confirmed').length;
          return Math.round((completed / arr.length) * 100);
        };

        return {
          id: s.id,
          patient_id: s.patient_id,
          patient_name: (s.patients_v2 as any)?.full_name || 'N/A',
          procedure: (s.order_procedures as any)?.[0]?.description || 'N/A',
          hospital: (s.hospitals as any)?.name || 'N/A',
          doctor: (s.doctors as any)?.full_name || 'N/A',
          date: s.date,
          status: s.status,
          progress: {
            docs: calcProg((s.documents || []).map((d: any) => ({ status: 'completed' }))),
            anesthesia: 0,
            opme: calcProg((s.opme || []).map((o: any) => ({ status: 'completed' }))),
            equipment: calcProg(s.equipment || []),
            team: 0
          }
        };
      });

      setSurgeries(formatted);

      // Stats simples (mockando por enquanto baseado no retorno real)
      setStats({
        total: formatted.length,
        items: formatted.filter(s => s.status !== 'finalizada').length,
        completed: formatted.filter(s => s.status === 'finalizada').length
      });

    } catch (err) {
      console.error('Error dashboard:', err);
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filtered = surgeries.filter(s =>
    s.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.procedure.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Navegação Cirúrgica</h2>
          <p className="text-slate-500 text-sm">Acompanhamento de casos e agendamentos.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Cirurgias Ativas" value={stats.items} icon={Calendar} color="text-primary-600" bg="bg-primary-50" />
        <StatCard title="Total de Pedidos" value={stats.total} icon={FileText} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Concluídas" value={stats.completed} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paciente, médico ou procedimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          {permissions.can_create_case && (
            <button
              onClick={() => navigate('/new-order')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors whitespace-nowrap shadow-lg shadow-primary-600/20"
            >
              <Plus className="w-4 h-4" /> Nova Cirurgia
            </button>
          )}
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">Nenhuma cirurgia encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Paciente e Procedimento</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hospital e Médico</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso Geral</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((surgery) => (
                  <tr key={surgery.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{surgery.patient_name}</p>
                      <p className="text-sm text-slate-500 truncate max-w-[200px]">{surgery.procedure}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{surgery.hospital}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{surgery.doctor}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">
                        {surgery.date ? format(new Date(surgery.date), 'dd/MM/yyyy', { locale: ptBR }) : 'A definir'}
                      </p>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        {surgery.status.replace('_', ' ')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <ProgressBarGroup progress={surgery.progress} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/case/${surgery.id}`)}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                        title="Abrir Navegação"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
