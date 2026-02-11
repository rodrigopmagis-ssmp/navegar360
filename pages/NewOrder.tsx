import React, { useState } from 'react';
import {
  Calendar, Plus, Trash2, Search, FileText,
  Package, Microscope, Save, ChevronRight, Activity
} from 'lucide-react';

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

export const NewOrder: React.FC = () => {
  const [anesthesia, setAnesthesia] = useState(true);

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-fade-in">

      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200 mb-8 sticky top-0 bg-[#f6f6f8] z-10 pt-4">
        <button onClick={() => document.getElementById('surgery-data')?.scrollIntoView({ behavior: 'smooth' })} className="py-4 border-b-2 border-primary-600 text-primary-600 font-bold text-sm">Pedido Médico</button>
        <button onClick={() => document.getElementById('procedures')?.scrollIntoView({ behavior: 'smooth' })} className="py-4 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-slate-700 hover:border-slate-300 transition-colors">Procedimentos</button>
        <button onClick={() => document.getElementById('exams')?.scrollIntoView({ behavior: 'smooth' })} className="py-4 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-slate-700 hover:border-slate-300 transition-colors">Exames</button>
        <button onClick={() => document.getElementById('documents')?.scrollIntoView({ behavior: 'smooth' })} className="py-4 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-slate-700 hover:border-slate-300 transition-colors">Documentos</button>
        <button onClick={() => document.getElementById('opme')?.scrollIntoView({ behavior: 'smooth' })} className="py-4 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-slate-700 hover:border-slate-300 transition-colors">OPME</button>
        <button onClick={() => document.getElementById('equipment')?.scrollIntoView({ behavior: 'smooth' })} className="py-4 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-slate-700 hover:border-slate-300 transition-colors">Equipamentos</button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cadastro de Pedido Médico Detalhado</h1>
        <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Preencha as informações necessárias para formalizar o pedido cirúrgico.
        </p>
      </div>

      {/* 1. DADOS DA CIRURGIA */}
      <div id="surgery-data" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm scroll-mt-24">
        <SectionHeader icon={Calendar} title="1. DADOS DA CIRURGIA" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="hospital-select" className="block text-xs font-bold text-slate-500 mb-1.5">Hospital</label>
            <select id="hospital-select" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
              <option>Selecione o Hospital</option>
              <option>Hospital Albert Einstein</option>
              <option>Hospital Sírio-Libanês</option>
            </select>
          </div>

          <div>
            <label htmlFor="surgery-date" className="block text-xs font-bold text-slate-500 mb-1.5">Data e Hora Prevista</label>
            <div className="relative">
              <input
                id="surgery-date"
                type="datetime-local"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Necessita de Anestesista?</label>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setAnesthesia(!anesthesia)}
                aria-label={anesthesia ? 'Desativar anestesia' : 'Ativar anestesia'}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${anesthesia ? 'bg-primary-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${anesthesia ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </button>
              <span className="text-sm font-medium text-slate-700">{anesthesia ? 'Sim' : 'Não'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROCEDIMENTOS */}
      <div id="procedures" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm scroll-mt-24">
        <SectionHeader icon={Plus} title="2. PROCEDIMENTOS" actionLabel="Adicionar Procedimento" />

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-2">
            <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase">Código TUSS</div>
            <div className="col-span-8 text-[10px] font-bold text-slate-400 uppercase">Descrição</div>
            <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase">Qtd.</div>
            <div className="col-span-1"></div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-2">
              <input type="text" defaultValue="30715123" aria-label="Código TUSS" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div className="col-span-8">
              <input type="text" defaultValue="Artroplastia total de joelho com implante" aria-label="Descrição do procedimento" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div className="col-span-1">
              <input type="text" defaultValue="1" aria-label="Quantidade" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-center" />
            </div>
            <div className="col-span-1 flex justify-center">
              <button className="text-slate-400 hover:text-red-500 transition-colors" aria-label="Remover procedimento">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXAMES */}
      <div id="exams" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm scroll-mt-24">
        <SectionHeader icon={Microscope} title="3. EXAMES" actionLabel="Adicionar Exame" />

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            aria-label="Buscar exame"
            placeholder="Buscar exame em lista pré-definida..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="space-y-0 divide-y divide-slate-100">
          <div className="grid grid-cols-12 gap-4 py-2 px-2">
            <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase">Código TUSS</div>
            <div className="col-span-9 text-[10px] font-bold text-slate-400 uppercase">Descrição do Exame</div>
          </div>

          <div className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-slate-50 rounded-lg px-2 transition-colors group">
            <div className="col-span-2 text-sm font-medium text-slate-700">40304361</div>
            <div className="col-span-9 text-sm text-slate-600">Hemograma completo</div>
            <div className="col-span-1 flex justify-center">
              <button className="text-slate-300 group-hover:text-red-500 transition-colors" aria-label="Remover exame">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-slate-50 rounded-lg px-2 transition-colors group">
            <div className="col-span-2 text-sm font-medium text-slate-700">40301630</div>
            <div className="col-span-9 text-sm text-slate-600">Coagulograma</div>
            <div className="col-span-1 flex justify-center">
              <button className="text-slate-300 group-hover:text-red-500 transition-colors" aria-label="Remover exame">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DOCUMENTOS */}
      <div id="documents" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm scroll-mt-24">
        <SectionHeader icon={FileText} title="4. DOCUMENTOS" actionLabel="Adicionar Documento" />

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            aria-label="Buscar documento"
            placeholder="Buscar documento em lista pré-definida..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="space-y-0 divide-y divide-slate-100">
          <div className="flex justify-between py-2 px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Nome do Documento</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase pr-4">Ações</span>
          </div>

          <div className="flex justify-between items-center py-4 px-2 hover:bg-slate-50 rounded-lg group">
            <span className="text-sm font-medium text-slate-700">TCLE (Termo de Consentimento Livre e Esclarecido)</span>
            <button className="text-slate-300 group-hover:text-red-500 transition-colors mr-2" aria-label="Remover documento">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-between items-center py-4 px-2 hover:bg-slate-50 rounded-lg group">
            <span className="text-sm font-medium text-slate-700">Risco Cirúrgico</span>
            <button className="text-slate-300 group-hover:text-red-500 transition-colors mr-2" aria-label="Remover documento">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MATERIAIS ESPECIAIS (OPME) */}
      <div id="opme" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm scroll-mt-24">
        <SectionHeader icon={Package} title="5. MATERIAIS ESPECIAIS (OPME)" actionLabel="Adicionar Material" />

        <div className="grid grid-cols-12 gap-4 px-2 mb-2">
          <div className="col-span-10 text-[10px] font-bold text-slate-400 uppercase">Descrição do Material</div>
          <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase">Qtd.</div>
        </div>

        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-10">
            <input type="text" defaultValue="Prótese de Quadril Híbrida Mod." aria-label="Descrição do material" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div className="col-span-1">
            <input type="text" defaultValue="1" aria-label="Quantidade" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-center" />
          </div>
          <div className="col-span-1 flex justify-center">
            <button className="text-slate-400 hover:text-red-500 transition-colors" aria-label="Remover material">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. EQUIPAMENTOS DE SALA */}
      <div id="equipment" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm scroll-mt-24">
        <SectionHeader icon={Microscope} title="6. EQUIPAMENTOS DE SALA" actionLabel="Adicionar Equipamento" />

        <div className="mb-6">
          <select className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" aria-label="Selecionar equipamento">
            <option>Buscar equipamento pré-definido...</option>
            <option>Arco Cirúrgico</option>
            <option>Torre de Vídeo</option>
          </select>
        </div>

        <div className="space-y-0 divide-y divide-slate-100">
          <div className="flex justify-between py-2 px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Equipamento Selecionado</span>
          </div>

          <div className="flex justify-between items-center py-4 px-2 hover:bg-slate-50 rounded-lg group">
            <span className="text-sm font-medium text-slate-700">Arco Cirúrgico</span>
            <button className="text-slate-300 group-hover:text-red-500 transition-colors mr-2" aria-label="Remover equipamento">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 ml-20"> {/* ml-20 matches collapsed sidebar */}
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Última alteração: Hoje, 14:25</span>
            <span className="flex items-center gap-1">Rascunho Privado</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              Salvar Rascunho
            </button>
            <button className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2">
              Finalizar Pedido <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
