import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, Plus, Trash2, Search, FileText,
  Package, Microscope, Save, ChevronRight, Activity, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PatientV2, Doctor } from '../types';
import { useDoctors } from '../hooks/useDoctors';
import { DoctorSearchModal } from '../components/modals/DoctorSearchModal';
import { HospitalSearchModal } from '../components/modals/HospitalSearchModal';
import { CidSearchInput } from '../components/inputs/CidSearchInput';
import { ProcedureRow, ProcedureType } from '../components/inputs/ProcedureRow';
import { ExamRow } from '../components/inputs/ExamRow';

const EXAM_PREFIXES = ['2', '4'];

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

type TabType = 'pedido' | 'procedimentos' | 'exames' | 'documentos' | 'opme' | 'equipamentos';

export const NewOrder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passedPatientId = location.state?.patientId as string | undefined;

  const [activeTab, setActiveTab] = useState<TabType>('pedido');

  // Global Data
  const [patients, setPatients] = useState<PatientV2[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const { doctors } = useDoctors();

  // Form states: Beneficiario
  const [selectedPatientId, setSelectedPatientId] = useState<string>(passedPatientId || '');
  const [patientInsurances, setPatientInsurances] = useState<any[]>([]);
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Form states: Medico
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  // Form states: Local
  const [localType, setLocalType] = useState<'clinica' | 'parceiro'>('clinica');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');

  // Form states: Agenda
  const [surgeryDate, setSurgeryDate] = useState('');
  const [dateConflict, setDateConflict] = useState<string | null>(null);

  // Form states: Classificação e Atendimento
  const [attendanceType, setAttendanceType] = useState<'ambulatorial' | 'internamento'>('ambulatorial');
  const [internmentType, setInternmentType] = useState<'diaria' | 'hospital_dia'>('diaria');
  const [internmentDays, setInternmentDays] = useState<string>('');
  const [character, setCharacter] = useState<'eletiva' | 'urgencia'>('eletiva');
  const [cids, setCids] = useState<string[]>(['']);
  const [diagnosis, setDiagnosis] = useState('');

  // Form states: Procedures
  const [procedures, setProcedures] = useState<ProcedureType[]>([]);
  const [mainProcedureId, setMainProcedureId] = useState<string | null>(null);

  // Form states: Exams
  const [exams, setExams] = useState<ProcedureType[]>([]);

  // Auto-set main procedure when array changes
  useEffect(() => {
    if (procedures.length === 1 && mainProcedureId !== procedures[0].id) {
      setMainProcedureId(procedures[0].id);
    } else if (procedures.length === 0 && mainProcedureId !== null) {
      setMainProcedureId(null);
    } else if (procedures.length > 1 && !procedures.some(p => p.id === mainProcedureId)) {
      setMainProcedureId(procedures[0].id);
    }
  }, [procedures, mainProcedureId]);

  // Modals
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);

  // Others (From old layout)
  const [anesthesia, setAnesthesia] = useState(true);

  // Load Initial Data
  useEffect(() => {
    const fetchBaseData = async () => {
      const { data: pData } = await supabase.from('patients_v2').select('*').order('full_name');
      if (pData) setPatients(pData);

      const { data: hData } = await supabase.from('hospitals').select('*').order('name');
      if (hData) setHospitals(hData);
    };
    fetchBaseData();
  }, []);

  // When patient changes, fetch their insurances
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientInsurances([]);
      return;
    }
    const fetchInsurances = async () => {
      const { data } = await supabase
        .from('patient_insurances')
        .select(`
          id, card_number, valid_until, 
          insurance_plans ( plan_name, health_insurers ( name ) )
        `)
        .eq('patient_id', selectedPatientId);
      setPatientInsurances(data || []);
    };
    fetchInsurances();
  }, [selectedPatientId]);

  // Validate Agenda (Conflict checking)
  useEffect(() => {
    const checkConflict = async () => {
      if (!surgeryDate || !selectedDoctorId) {
        setDateConflict(null);
        return;
      }
      const dateOnly = surgeryDate.split('T')[0];
      const timeOnly = surgeryDate.split('T')[1];

      const { data, error } = await supabase
        .from('surgery_cases')
        // Using ilike on doctor column because it might store the doctor's name on legacy DB, or exact ID on new DB.
        .select('id, time, patientName, procedure, doctor')
        .eq('date', dateOnly);

      if (data && data.length > 0) {
        // Check if it belongs to selected doctor (Name or ID matching)
        const doctorName = doctors.find(d => d.id === selectedDoctorId)?.full_name || '';

        const conflict = data.find(c => {
          const isSameDoctor = c.doctor === selectedDoctorId || c.doctor === doctorName;
          if (!isSameDoctor) return false;
          // Check exact time match
          return c.time === timeOnly || c.time === timeOnly + ':00';
        });

        if (conflict) {
          setDateConflict(`Atenção: O profissional já possui outro agendamento neste horário! (${conflict.procedure} - ${conflict.patientName || 'Paciente não listado'})`);
        } else {
          setDateConflict(null);
        }
      } else {
        setDateConflict(null);
      }
    };
    checkConflict();
  }, [surgeryDate, selectedDoctorId, doctors]);

  const calcAge = (birthDate?: string): string => {
    if (!birthDate) return '---';
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    return `${years} anos`;
  };

  const renderTabHeader = (id: TabType, label: string) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`py-4 border-b-2 font-medium text-sm transition-colors ${isActive ? 'border-primary-600 text-primary-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="max-w-5xl mx-auto pb-8 space-y-8 animate-fade-in relative">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cadastro de Pedido Médico Detalhado</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Preencha as informações necessárias para formalizar o pedido cirúrgico.
          </p>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-8 border-b border-slate-200 sticky top-0 bg-white dark:bg-slate-900 z-40 pt-4 px-1 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
          {renderTabHeader('pedido', 'Pedido Médico')}
          {renderTabHeader('procedimentos', 'Procedimentos')}
          {renderTabHeader('exames', 'Exames')}
          {renderTabHeader('documentos', 'Documentos')}
          {renderTabHeader('opme', 'OPME')}
          {renderTabHeader('equipamentos', 'Equipamentos')}
        </div>

        {/* ─── TAB CONTENT ─── */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* 1. PEDIDO MÉDICO */}
          {activeTab === 'pedido' && (
            <div className="space-y-6">

              {/* A. Dados do Beneficiário */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader icon={Calendar} title="Dados do Beneficiário" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Selecionar Paciente</label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="">-- Selecione ou busque na lista --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name} {p.cpf ? `(CPF: ${p.cpf})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  {selectedPatient && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Idade</label>
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">
                          {calcAge(selectedPatient.birth_date)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Sexo Biológico</label>
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 capitalize">
                          {selectedPatient.gender || 'Não Informado'}
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Contato</label>
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">
                          {selectedPatient.whatsapp || selectedPatient.phone || 'Sem telefone'} • {selectedPatient.email || 'Sem email'}
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Convênio Ativo (Operadora)</label>
                        {patientInsurances.length > 0 ? (
                          <select className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">
                            {patientInsurances.map((ins: any) => (
                              <option key={ins.id} value={ins.id}>
                                {ins.insurance_plans?.health_insurers?.name} - {ins.insurance_plans?.plan_name}
                                {ins.card_number ? ` (Cartão: ${ins.card_number})` : ''}
                                {ins.valid_until ? ` - Validade: ${ins.valid_until}` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
                            Nenhum convênio cadastrado para este paciente. (Atendimento Particular)
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* B. Profissional Solicitante e Local */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <SectionHeader icon={Calendar} title="Profissional Solicitante" />
                  <div className="space-y-4">
                    {selectedDoctor ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Médico Solicitante</label>
                        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg items-start sm:items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Profissional Selecionado</p>
                              <p className="text-sm font-bold text-slate-800">{selectedDoctor.full_name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Conselho</p>
                              <p className="text-sm font-medium text-slate-700">{selectedDoctor.council} {selectedDoctor.council_number}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Especialidade</p>
                              <p className="text-sm font-medium text-slate-700">{selectedDoctor.specialty || '--'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsDoctorModalOpen(true)}
                            className="shrink-0 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                          >
                            <Search className="w-4 h-4" /> Trocar Médico
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Médico Solicitante</label>
                        <button
                          onClick={() => setIsDoctorModalOpen(true)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-colors flex items-center justify-center sm:justify-start gap-2 mb-3"
                        >
                          <Search className="w-4 h-4" /> Localizar Profissional
                        </button>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                          <p className="text-sm text-amber-700">Nenhum profissional selecionado.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <SectionHeader icon={Calendar} title="Local de Execução" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Local</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="radio" value="clinica" checked={localType === 'clinica'} onChange={() => setLocalType('clinica')} className="text-primary-600 focus:ring-primary-500" />
                          Na própria clínica
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="radio" value="parceiro" checked={localType === 'parceiro'} onChange={() => setLocalType('parceiro')} className="text-primary-600 focus:ring-primary-500" />
                          Em parceiro externo
                        </label>
                      </div>
                    </div>

                    {localType === 'parceiro' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Hospital / Parceiro</label>
                        {selectedHospitalId && hospitals.find(h => h.id === selectedHospitalId) ? (
                          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg items-start sm:items-center justify-between">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Local Selecionado</p>
                                <p className="text-sm font-bold text-slate-800">{hospitals.find(h => h.id === selectedHospitalId)?.name}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">CNPJ</p>
                                <p className="text-sm font-medium text-slate-700">{hospitals.find(h => h.id === selectedHospitalId)?.cnpj || 'Não cadastrado'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setIsHospitalModalOpen(true)}
                              className="shrink-0 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                              <Search className="w-4 h-4" /> Trocar Local
                            </button>
                          </div>
                        ) : (
                          <div>
                            <button
                              onClick={() => setIsHospitalModalOpen(true)}
                              className="w-full sm:w-auto px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-colors flex items-center justify-center sm:justify-start gap-2 mb-3"
                            >
                              <Search className="w-4 h-4" /> Localizar Centro Cirúrgico
                            </button>
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                              <p className="text-sm text-amber-700">Nenhum local selecionado.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* C. Agendamento */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader icon={Calendar} title="Agendamento" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Data e Hora Prevista</label>
                    <input
                      type="datetime-local"
                      value={surgeryDate}
                      onChange={(e) => setSurgeryDate(e.target.value)}
                      className={`w-full p-2.5 bg-white border ${dateConflict ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-primary-500'} rounded-lg text-sm text-slate-700 focus:ring-2 outline-none`}
                    />
                    {dateConflict && (
                      <p className="mt-2 text-xs font-medium text-red-600 flex items-start gap-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {dateConflict}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Necessita de Anestesista?</label>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => setAnesthesia(!anesthesia)}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${anesthesia ? 'bg-primary-600' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${anesthesia ? 'translate-x-6' : 'translate-x-0'}`}></span>
                      </button>
                      <span className="text-sm font-medium text-slate-700">{anesthesia ? 'Sim' : 'Não'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* D. Classificação Clínica */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader icon={Calendar} title="Classificação Clínica e Atendimento" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Tipo de Atendimento</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="radio" value="ambulatorial" checked={attendanceType === 'ambulatorial'} onChange={() => setAttendanceType('ambulatorial')} className="text-primary-600 focus:ring-primary-500" />
                        Ambulatorial
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="radio" value="internamento" checked={attendanceType === 'internamento'} onChange={() => setAttendanceType('internamento')} className="text-primary-600 focus:ring-primary-500" />
                        Internamento
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Caráter</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="radio" value="eletiva" checked={character === 'eletiva'} onChange={() => setCharacter('eletiva')} className="text-primary-600 focus:ring-primary-500" />
                        Eletiva
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="radio" value="urgencia" checked={character === 'urgencia'} onChange={() => setCharacter('urgencia')} className="text-primary-600 focus:ring-primary-500" />
                        Urgência
                      </label>
                    </div>
                  </div>
                </div>

                {attendanceType === 'internamento' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-in fade-in slide-in-from-top-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Modalidade de Internação</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="radio" value="diaria" checked={internmentType === 'diaria'} onChange={() => setInternmentType('diaria')} className="text-primary-600 focus:ring-primary-500" />
                          Diária de Internação
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="radio" value="hospital_dia" checked={internmentType === 'hospital_dia'} onChange={() => setInternmentType('hospital_dia')} className="text-primary-600 focus:ring-primary-500" />
                          Hospital Dia
                        </label>
                      </div>
                    </div>
                    {internmentType === 'diaria' && (
                      <div className="animate-in fade-in zoom-in-95">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Número de Diárias</label>
                        <input
                          type="number"
                          min="1"
                          value={internmentDays}
                          onChange={(e) => setInternmentDays(e.target.value)}
                          placeholder="Ex: 2"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-500">CID-10 (Classificação Internacional de Doenças)</label>
                      {cids.length < 3 && (
                        <button
                          onClick={() => setCids([...cids, ''])}
                          className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar CID Secundário
                        </button>
                      )}
                    </div>
                    {cids.map((c, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-1">
                          <CidSearchInput
                            value={c}
                            onChange={(newValue) => {
                              const newCids = [...cids];
                              newCids[index] = newValue;
                              setCids(newCids);
                            }}
                            placeholder={index === 0 ? "Buscar por código ou descrição... (Ex: M54.5 - Dor lombar baixa)" : "CID Secundário (Buscar por código ou descrição...)"}
                          />
                        </div>
                        {index > 0 && (
                          <button
                            onClick={() => {
                              const newCids = cids.filter((_, i) => i !== index);
                              setCids(newCids);
                            }}
                            className="shrink-0 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Remover CID"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Diagnóstico Descritivo</label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Descreva o quadro clínico detalhadamente..."
                      className="w-full min-h-[120px] p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. PROCEDIMENTOS (Placeholder for future rebuild if needed, keeping mockup inside abas) */}
          {activeTab === 'procedimentos' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <SectionHeader
                icon={Plus}
                title="PROCEDIMENTOS"
                actionLabel="Adicionar Procedimento"
                onAction={() => {
                  setProcedures([...procedures, { id: crypto.randomUUID(), code: '', description: '', quantity: 1 }]);
                }}
              />
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-2">
                  <div className="col-span-1 text-[10px] font-bold text-amber-500 uppercase text-center" title="Selecione qual o procedimento principal">Princip.</div>
                  <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase">Código TUSS</div>
                  <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase">Descrição</div>
                  <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase text-center">Porte</div>
                  <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase text-center">Anest.</div>
                  <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase text-center">Qtd.</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-3">
                  {procedures.map((proc) => (
                    <ProcedureRow
                      key={proc.id}
                      procedure={proc}
                      isMain={proc.id === mainProcedureId}
                      onSetMain={setMainProcedureId}
                      onChange={(id, updates) => {
                        setProcedures(procs => procs.map(p => p.id === id ? { ...p, ...updates } : p));
                      }}
                      onRemove={(id) => {
                        setProcedures(procs => procs.filter(p => p.id !== id));
                      }}
                    />
                  ))}
                  {procedures.length === 0 && (
                    <div className="py-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-lg">
                      <p className="text-slate-500 text-sm">Nenhum procedimento adicionado.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. EXAMES */}
          {activeTab === 'exames' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <SectionHeader
                icon={Microscope}
                title="EXAMES"
                actionLabel="Adicionar Exame"
                onAction={() => {
                  setExams([...exams, { id: crypto.randomUUID(), code: '', description: '', quantity: 1 }]);
                }}
              />

              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-2">
                  <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">Código / Busca</div>
                  <div className="col-span-7 text-[10px] font-bold text-slate-400 uppercase">Descrição do Exame</div>
                  <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase text-center">Qtd.</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-3">
                  {exams.map((exam) => (
                    <ExamRow
                      key={exam.id}
                      exam={exam}
                      categoryPrefixes={EXAM_PREFIXES}
                      onChange={(id, updates) => {
                        setExams(items => items.map(p => p.id === id ? { ...p, ...updates } : p));
                      }}
                      onRemove={(id) => {
                        setExams(items => items.filter(p => p.id !== id));
                      }}
                    />
                  ))}
                  {exams.length === 0 && (
                    <div className="py-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                      <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Microscope className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Nenhum exame solicitado.</p>
                      <button
                        onClick={() => setExams([{ id: crypto.randomUUID(), code: '', description: '', quantity: 1 }])}
                        className="mt-3 text-primary-600 text-xs font-bold hover:underline"
                      >
                        + Clique para adicionar o primeiro
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <SectionHeader icon={FileText} title="DOCUMENTOS" actionLabel="Adicionar Documento" />
              <div className="py-16 text-center">
                <p className="text-slate-400">Seleção de anexos e TCLS movida para esta aba.</p>
              </div>
            </div>
          )}

          {/* 5. OPME */}
          {activeTab === 'opme' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <SectionHeader icon={Package} title="OPME" actionLabel="Adicionar Material" />
              <div className="py-16 text-center">
                <p className="text-slate-400">Listagem de materiais OPME alocada aqui.</p>
              </div>
            </div>
          )}

          {/* 6. EQUIPAMENTOS */}
          {activeTab === 'equipamentos' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <SectionHeader icon={Microscope} title="EQUIPAMENTOS DE SALA" actionLabel="Adicionar Equipamento" />
              <div className="py-16 text-center">
                <p className="text-slate-400">Seleção de equipamentos (Arco, Torre, etc) alocada aqui.</p>
              </div>
            </div>
          )}

        </div> {/* Encerrando o wrapper de animação das abas */}
      </div> {/* END OF MAX W 5XL CONTENT WRAPPER */}

      {/* Footer Actions */}
      <div className="sticky bottom-0 -mx-6 -mb-6 mt-12 bg-white border-t border-slate-200 p-4 z-40 transition-all shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-2">
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Última alteração: Hoje, 14:25</span>
            <span className="flex items-center gap-1">Rascunho Privado</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              Salvar Rascunho
            </button>
            <button
              onClick={() => {
                if (activeTab === 'pedido') setActiveTab('procedimentos');
                else if (activeTab === 'procedimentos') setActiveTab('exames');
                else if (activeTab === 'exames') setActiveTab('documentos');
                else if (activeTab === 'documentos') setActiveTab('opme');
                else if (activeTab === 'opme') setActiveTab('equipamentos');
                else alert('Salvar no banco e redirecionar para sucesso!');
              }}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2"
            >
              {activeTab === 'equipamentos' ? 'Finalizar Pedido' : 'Próxima Etapa'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <DoctorSearchModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        doctors={doctors}
        onSelect={(doctor) => setSelectedDoctorId(doctor.id)}
      />

      <HospitalSearchModal
        isOpen={isHospitalModalOpen}
        onClose={() => setIsHospitalModalOpen(false)}
        hospitals={hospitals}
        onSelect={(hospital) => setSelectedHospitalId(hospital.id)}
      />

    </>
  );
};
