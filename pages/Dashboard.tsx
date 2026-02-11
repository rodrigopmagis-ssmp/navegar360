import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Activity, CheckCircle, AlertTriangle, ChevronLeft, 
  ChevronRight, Filter, Plus, FileText, Package, Wrench, Users, ArrowRight 
} from 'lucide-react';
import { SurgeryCase, CaseStatus } from '../types';

const mockSurgeries: SurgeryCase[] = [
  {
    id: 'SRG-88291',
    patientName: 'Maria Oliveira Silva',
    procedure: 'Artroplastia de Quadril (E)',
    hospital: 'Hosp. Albert Einstein',
    doctor: 'Dr. Ricardo Santos',
    date: '2023-10-24',
    time: '08:30',
    status: CaseStatus.Scheduled,
    countdown: '18h 45m',
    progress: { docs: 100, anesthesia: 100, opme: 25, equipment: 60, team: 100 }
  },
  {
    id: 'SRG-88292',
    patientName: 'Carlos Roberto Souza',
    procedure: 'Colecistectomia Videolaparoscópica',
    hospital: 'Hosp. Sírio-Libanês',
    doctor: 'Dr. Fernando Costa',
    date: '2023-10-18',
    time: '14:00',
    status: CaseStatus.Scheduled,
    countdown: '3 dias',
    progress: { docs: 80, anesthesia: 60, opme: 100, equipment: 80, team: 100 }
  },
  {
    id: 'SRG-88293',
    patientName: 'Joana D\'Arc Mendes',
    procedure: 'Reconstrução de LCA',
    hospital: 'Hosp. das Clínicas',
    doctor: 'Dra. Juliana Menezes',
    date: '2023-10-25',
    time: '07:00',
    status: CaseStatus.Scheduled,
    countdown: '10 dias',
    progress: { docs: 100, anesthesia: 20, opme: 40, equipment: 40, team: 80 }
  },
  {
    id: 'SRG-88294',
    patientName: 'Fernando Henrique Luz',
    procedure: 'Hernioplastia Inguinal',
    hospital: 'Hosp. Santa Catarina',
    doctor: 'Dr. Ricardo Santos',
    date: '2023-10-20',
    time: '11:30',
    status: CaseStatus.Scheduled,
    countdown: '5 dias',
    progress: { docs: 100, anesthesia: 80, opme: 80, equipment: 100, team: 100 }
  }
];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Navegação Cirúrgica</h2>
          <p className="text-slate-500 text-sm">Você opera, nós navegamos.</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Dr. Ricardo Almeida</span>
            <span className="text-xs text-slate-400">Diretor Clínico</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Cirurgias no Mês" value="42" icon={Calendar} color="text-primary-600" bg="bg-primary-50" />
        <StatCard title="Pendências Críticas" value="07" icon={AlertTriangle} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Concluídas" value="128" icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
            <input 
                type="text" 
                placeholder="Buscar por paciente ou procedimento..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
             <select className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm font-medium text-slate-600 outline-none cursor-pointer">
                 <option>Filtrar por Médico</option>
             </select>
             <select className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm font-medium text-slate-600 outline-none cursor-pointer">
                 <option>Filtrar por Hospital</option>
             </select>
             <select className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm font-medium text-slate-600 outline-none cursor-pointer">
                 <option>Todos os Status</option>
             </select>
             <button 
                onClick={() => navigate('/new-order')}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
             >
                 <Plus className="w-4 h-4" /> Nova Cirurgia
             </button>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Cirurgias Agendadas</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exibindo 4 de 42 agendamentos</span>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Paciente e Procedimento</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hospital e Data/Hora</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Timer Regressivo</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso Geral</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ação</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {mockSurgeries.map((surgery) => (
                        <tr key={surgery.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <p className="font-bold text-slate-800">{surgery.patientName}</p>
                                <p className="text-sm text-slate-500">{surgery.procedure}</p>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-sm font-medium text-slate-800">{surgery.hospital}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    {surgery.date}, {surgery.time}
                                </p>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                    surgery.countdown?.includes('h') ? 'bg-red-50 text-red-600 border border-red-100' : 
                                    parseInt(surgery.countdown?.split(' ')[0] || '0') <= 5 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                    <Activity className="w-3 h-3" />
                                    {surgery.countdown}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <ProgressBarGroup progress={surgery.progress} />
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => navigate(`/case/${surgery.id}`)}
                                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-sm ml-auto"
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary-600 text-white font-bold text-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium">3</button>
            <span className="text-slate-400">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium">4</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};