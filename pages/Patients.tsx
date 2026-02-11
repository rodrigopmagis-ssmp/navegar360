import React from 'react';
import { 
  Search, Plus, Filter, MoreHorizontal, User, 
  Phone, Mail, Calendar, FileText, ChevronLeft, 
  ChevronRight, Activity, ShieldCheck 
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  cpf: string;
  phone: string;
  email: string;
  insurance: string;
  lastVisit: string;
  status: 'Active' | 'Inactive';
  nextSurgery?: string;
}

const mockPatients: Patient[] = [
  {
    id: 'PAC-001',
    name: 'Maria Oliveira Silva',
    age: 45,
    gender: 'Feminino',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    email: 'maria.silva@email.com',
    insurance: 'Bradesco Saúde',
    lastVisit: '24/09/2023',
    status: 'Active',
    nextSurgery: 'Artroplastia de Quadril'
  },
  {
    id: 'PAC-002',
    name: 'João da Silva Medeiros',
    age: 62,
    gender: 'Masculino',
    cpf: '234.567.890-11',
    phone: '(11) 91234-5678',
    email: 'joao.medeiros@email.com',
    insurance: 'Amil',
    lastVisit: '10/10/2023',
    status: 'Active',
    nextSurgery: 'Colecistectomia'
  },
  {
    id: 'PAC-003',
    name: 'Ana Clara Rezende',
    age: 28,
    gender: 'Feminino',
    cpf: '345.678.901-22',
    phone: '(11) 99876-5432',
    email: 'ana.rezende@email.com',
    insurance: 'SulAmérica',
    lastVisit: '15/08/2023',
    status: 'Inactive'
  },
  {
    id: 'PAC-004',
    name: 'Roberto Alencar Jr.',
    age: 35,
    gender: 'Masculino',
    cpf: '456.789.012-33',
    phone: '(21) 98888-7777',
    email: 'roberto.jr@email.com',
    insurance: 'Unimed',
    lastVisit: '01/10/2023',
    status: 'Active'
  },
  {
    id: 'PAC-005',
    name: 'Fernanda Lima Costa',
    age: 51,
    gender: 'Feminino',
    cpf: '567.890.123-44',
    phone: '(11) 97777-6666',
    email: 'fernanda.costa@email.com',
    insurance: 'Particular',
    lastVisit: '20/09/2023',
    status: 'Active',
    nextSurgery: 'Hernioplastia'
  }
];

const StatCard: React.FC<{ label: string; value: string; icon: React.ElementType; color: string; bg: string }> = ({ label, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

export const Patients: React.FC = () => {
  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Pacientes</h1>
          <p className="text-slate-500 text-sm">Base unificada de prontuários e históricos.</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-lg shadow-primary-600/20">
            <Plus className="w-4 h-4" /> Novo Paciente
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total de Pacientes" value="2,543" icon={User} color="text-primary-600" bg="bg-primary-50" />
          <StatCard label="Novos este Mês" value="+48" icon={Activity} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Em Tratamento" value="152" icon={Calendar} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Documentação Pendente" value="12" icon={FileText} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Buscar por nome, CPF ou e-mail..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
             <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap">
                 <Filter className="w-4 h-4" /> Filtrar Status
             </button>
             <select className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm font-medium text-slate-600 outline-none cursor-pointer">
                 <option>Todos os Convênios</option>
                 <option>Bradesco Saúde</option>
                 <option>Amil</option>
                 <option>SulAmérica</option>
                 <option>Particular</option>
             </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paciente</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contato</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Convênio</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status / Próx. Cirurgia</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {mockPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                                        {patient.name.charAt(0)}{patient.name.split(' ')[1]?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{patient.name}</p>
                                        <p className="text-xs text-slate-500">CPF: {patient.cpf}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                        <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                        <Mail className="w-3 h-3 text-slate-400" /> {patient.email}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">{patient.insurance}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="space-y-1.5">
                                    {patient.status === 'Active' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inativo
                                        </span>
                                    )}
                                    
                                    {patient.nextSurgery && (
                                        <div className="flex items-center gap-1.5 text-xs text-primary-600 font-medium">
                                            <Activity className="w-3 h-3" />
                                            {patient.nextSurgery}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-slate-400 hover:text-primary-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Mostrando <span className="font-bold">1-5</span> de <span className="font-bold">2,543</span> pacientes</p>
            <div className="flex items-center gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-primary-600 text-white font-bold text-sm">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium">3</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
