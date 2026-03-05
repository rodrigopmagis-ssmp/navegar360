import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, Plus, Trash2, Search, FileText,
  Package, Microscope, Save, ChevronRight, Activity, AlertTriangle, File, Upload, Check, ClipboardCheck, Phone, Mail, CheckCircle, Eye, UserCog
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PatientV2, Doctor, OrderDocument, DocumentType, OrderOpme, OrderEquipment, OrderParticipant } from '../types';
import { useDoctors } from '../hooks/useDoctors';
import { DoctorSearchModal } from '../components/modals/DoctorSearchModal';
import { HospitalSearchModal } from '../components/modals/HospitalSearchModal';
import { CidSearchInput } from '../components/inputs/CidSearchInput';
import { ProcedureRow, ProcedureType } from '../components/inputs/ProcedureRow';
import { ExamRow } from '../components/inputs/ExamRow';
import { OpmeRow } from '../components/inputs/OpmeRow';
import { EquipmentRow } from '../components/inputs/EquipmentRow';
import { ParticipantRow } from '../components/inputs/ParticipantRow';

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

type TabType = 'pedido' | 'procedimentos' | 'exames' | 'documentos' | 'opme' | 'equipamentos' | 'participantes';

export const NewOrder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passedPatientId = location.state?.patientId as string | undefined;
  const passedOrderId = location.state?.orderId as string | undefined;

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

  // Form states: Documents
  const [orderDocuments, setOrderDocuments] = useState<OrderDocument[]>([]);

  // Form states: OPME
  const [opmeItems, setOpmeItems] = useState<OrderOpme[]>([]);

  // Form states: Equipments
  const [availableEquipments, setAvailableEquipments] = useState<string[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<OrderEquipment[]>([]);

  // Form states: Participants
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [participantItems, setParticipantItems] = useState<OrderParticipant[]>([]);

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
  const [showContactPopover, setShowContactPopover] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Others (From old layout)
  const [anesthesia, setAnesthesia] = useState(true);


  // Load Existing Order if Edit Mode
  useEffect(() => {
    if (!passedOrderId) return;
    const fetchOrder = async () => {
      const { data: order } = await supabase.from('surgery_cases').select('*').eq('id', passedOrderId).single();
      if (order) {
        setSelectedPatientId(order.patient_id || '');
        setSelectedDoctorId(order.doctor_id || '');
        setLocalType(order.hospital_id ? 'parceiro' : 'clinica');
        setSelectedHospitalId(order.hospital_id || '');
        if (order.date && order.time) setSurgeryDate(order.date + 'T' + order.time.substring(0, 5));
        setAttendanceType(order.attendance_type || 'ambulatorial');
        if (order.internment_type) setInternmentType(order.internment_type);
        if (order.internment_days) setInternmentDays(order.internment_days.toString());
        if (order.character) setCharacter(order.character);
        if (order.cids) setCids(order.cids);
        if (order.diagnosis) setDiagnosis(order.diagnosis);
        setAnesthesia(order.anesthesia === false ? false : true);
      }

      const { data: procs } = await supabase.from('order_procedures').select('*').eq('order_id', passedOrderId);
      if (procs) {
        setProcedures(procs as any);
        const main = procs.find(p => p.is_main);
        if (main) setMainProcedureId(main.id);
      }

      const { data: ex } = await supabase.from('order_exams').select('*').eq('order_id', passedOrderId);
      if (ex) setExams(ex as any);

      const { data: opme } = await supabase.from('order_opme').select('*').eq('order_id', passedOrderId);
      if (opme) setOpmeItems(opme as any);

      const { data: eq } = await supabase.from('order_equipments').select('*').eq('order_id', passedOrderId);
      if (eq) setEquipmentItems(eq as any);

      const { data: docs } = await supabase.from('medical_order_documents').select('*').eq('order_id', passedOrderId);
      if (docs) setOrderDocuments(docs as any);

      const { data: parts } = await supabase.from('order_participants').select('*').eq('case_id', passedOrderId);
      if (parts) setParticipantItems(parts as any);
    };
    fetchOrder();
  }, [passedOrderId]);

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

  // Load available equipments
  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
          if (profile?.clinic_id) {
            const { data } = await supabase
              .from('protocols')
              .select('name')
              .eq('type', 'equipment')
              .eq('clinic_id', profile.clinic_id)
              .eq('active', true)
              .order('name');
            if (data && data.length > 0) {
              setAvailableEquipments(data.map(e => e.name));
              return;
            }
          }
        }
      } catch (e) {
        console.error('Error fetching equipments:', e);
      }
      // Fallback defaults if table is empty or error occurs
      setAvailableEquipments(['Arco Cirúrgico', 'Torre de Vídeo', 'Microscópio', 'Bisturi Elétrico', 'Motor de Ortopedia', 'Monitor Multiparamétrico']);
    };
    fetchEquipments();
  }, []);

  // Load available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
          if (profile?.clinic_id) {
            const { data } = await supabase
              .from('protocols')
              .select('id, name')
              .eq('type', 'team')
              .eq('clinic_id', profile.clinic_id)
              .eq('active', true)
              .order('name');
            if (data && data.length > 0) {
              setAvailableRoles(data);
              return;
            }
          }
        }
      } catch (e) {
        console.error('Error fetching team roles:', e);
      }
      setAvailableRoles([]);
    };
    fetchRoles();
  }, []);

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
        .select('id, time, patientName, procedure, doctor, patient_id')
        .eq('date', dateOnly);

      if (data && data.length > 0) {
        // Check if it belongs to selected doctor (Name or ID matching)
        const doctorName = doctors.find(d => d.id === selectedDoctorId)?.full_name || '';

        const conflict = data.find(c => {
          // Check exact time match
          const isSameTime = c.time === timeOnly || c.time === timeOnly + ':00';
          if (!isSameTime) return false;

          if (passedOrderId && c.id === passedOrderId) return false;
          const isSameDoctor = c.doctor === selectedDoctorId || c.doctor === doctorName;
          const isSamePatient = c.patient_id === selectedPatientId;

          if (isSamePatient) {
            (c as any).conflictReason = 'patient';
            return true;
          }
          if (isSameDoctor) {
            (c as any).conflictReason = 'doctor';
            return true;
          }
          return false;
        });

        if (conflict) {
          if ((conflict as any).conflictReason === 'patient') {
            setDateConflict('Atenção: Este paciente já possui um agendamento neste horário!');
          } else {
            setDateConflict(`Atenção: O profissional já possui outro agendamento neste horário! (${conflict.procedure} - ${conflict.patientName || 'Paciente não listado'})`);
          }
        } else {
          setDateConflict(null);
        }
      } else {
        setDateConflict(null);
      }
    };
    checkConflict();
  }, [surgeryDate, selectedDoctorId, doctors]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedPatientId || !selectedDoctorId || !surgeryDate) {
      alert('Por favor, preencha os dados obrigatórios: Paciente, Médico e Data/Hora.');
      return;
    }

    if (dateConflict) {
      alert(dateConflict);
      return;
    }

    if (dateConflict) {
      alert(dateConflict);
      return;
    }

    try {
      setSaving(true);

      // 1. Get current clinic_id
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single();
      if (!profile?.clinic_id) throw new Error('Clínica não encontrada');

      // 2. Insert or Update surgical case (Order)
      const orderPayload = {
        clinic_id: profile.clinic_id,
        patient_id: selectedPatientId,
        doctor_id: selectedDoctorId,
        hospital_id: localType === 'parceiro' ? selectedHospitalId : null,
        date: surgeryDate.split('T')[0],
        time: surgeryDate.split('T')[1],
        character,
        attendance_type: attendanceType,
        internment_type: attendanceType === 'internamento' ? internmentType : null,
        internment_days: internmentType === 'diaria' ? parseInt(internmentDays) || 0 : 0,
        anesthesia,
        diagnosis,
        cids,
        status: 'agendado',
        doctor: doctors.find(d => d.id === selectedDoctorId)?.full_name || '', // For legacy compatibility
        patientName: patients.find(p => p.id === selectedPatientId)?.full_name || '' // For legacy compatibility
      };

      let order;
      let orderError;

      if (passedOrderId) {
        const res = await supabase.from('surgery_cases').update(orderPayload).eq('id', passedOrderId).select().single();
        order = res.data || { id: passedOrderId };
        orderError = res.error;
      } else {
        const res = await supabase.from('surgery_cases').insert([orderPayload]).select().single();
        order = res.data;
        orderError = res.error;
      }

      if (orderError) throw orderError;


      if (passedOrderId) {
        await supabase.from('order_procedures').delete().eq('order_id', passedOrderId);
        await supabase.from('order_exams').delete().eq('order_id', passedOrderId);
        await supabase.from('order_opme').delete().eq('order_id', passedOrderId);
        await supabase.from('order_equipments').delete().eq('order_id', passedOrderId);
        await supabase.from('order_participants').delete().eq('case_id', passedOrderId);
        // We will NOT delete medical_order_documents to avoid orphaned files in storage. 
        // We just append new ones. Existing ones remain.
      }

      // 3. Save Procedures
      if (procedures.length > 0) {
        const procData = procedures.map(p => ({
          order_id: order.id,
          code: p.code,
          description: p.description,
          quantity: p.quantity,
          is_main: p.id === mainProcedureId
        }));
        const { error: pError } = await supabase.from('order_procedures').insert(procData);
        if (pError) throw pError;
      }

      // 4. Save Exams
      if (exams.length > 0) {
        const examData = exams.map(e => ({
          order_id: order.id,
          code: e.code,
          description: e.description,
          quantity: e.quantity
        }));
        const { error: eError } = await supabase.from('order_exams').insert(examData);
        if (eError) throw eError;
      }

      // 5. Build and Save Documents
      const newOrderDocuments = orderDocuments.filter(d => !d.id);
      if (newOrderDocuments.length > 0) {
        const docPromises = newOrderDocuments.map(async (doc) => {
          let filePath = null;

          // Upload file if present
          if (doc.file) {
            const fileExt = doc.file.name.split('.').pop();
            const fileName = `${order.id}-${doc.type}-${crypto.randomUUID()}.${fileExt}`;
            const path = `orders/${order.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('medical_documents')
              .upload(path, doc.file);

            if (uploadError) throw uploadError;
            filePath = path;
          }

          return {
            order_id: order.id,
            type: doc.type,
            custom_name: doc.custom_name || null,
            file_path: filePath,
            is_annexed_locally: doc.is_annexed_locally,
            valid_until: doc.valid_until || null,
            has_no_expiry: doc.has_no_expiry
          };
        });

        const docData = await Promise.all(docPromises);
        const { error: dError } = await supabase.from('medical_order_documents').insert(docData);
        if (dError) throw dError;
      }

      // 6. Save OPME Items
      if (opmeItems.length > 0) {
        const opmeData = opmeItems.map(item => ({
          order_id: order.id,
          description: item.description,
          quantity: item.quantity,
          suggested_vendor: item.suggested_vendor || null,
          manufacturer: item.manufacturer || null
        }));
        const { error: opmeError } = await supabase.from('order_opme').insert(opmeData);
        if (opmeError) throw opmeError;
      }

      // 7. Save Equipment Items
      if (equipmentItems.length > 0) {
        const eqData = equipmentItems.map(item => ({
          order_id: order.id,
          name: item.name,
          notes: item.notes || null,
          status: 'pending'
        }));
        const { error: eqError } = await supabase.from('order_equipments').insert(eqData);
        if (eqError) throw eqError;
      }

      // 8. Save Participants
      const validParticipants = participantItems.filter(p => p.team_role_id.trim() !== '');
      let finalParticipants = [...validParticipants];

      const surgeonRole = availableRoles?.find(r =>
        r.name.toLowerCase().includes('cirurgião principal') ||
        r.name.toLowerCase() === 'cirurgião' ||
        r.name.toLowerCase() === 'médico cirurgião'
      );

      if (surgeonRole && selectedDoctorId) {
        const surgeonExists = finalParticipants.some(p => p.team_role_id === surgeonRole.id && p.professional_id === selectedDoctorId);
        if (!surgeonExists) {
          finalParticipants.push({
            id: crypto.randomUUID(),
            case_id: order.id,
            team_role_id: surgeonRole.id,
            professional_id: selectedDoctorId,
            status: 'pending'
          });
        }
      } else if (selectedDoctorId) {
        console.warn('Protocolo para Cirurgião Principal não encontrado nas configurações. O cirurgião não será incluído no fluxo de protocolos da equipe.');
      }

      if (finalParticipants.length > 0) {
        const participantData = finalParticipants.map(item => ({
          case_id: order.id,
          team_role_id: item.team_role_id,
          professional_id: item.professional_id || null,
          status: 'pending'
        }));
        const { error: partError } = await supabase.from('order_participants').insert(participantData);
        if (partError) throw partError;
      }

      setSavedOrderId(order?.id || passedOrderId);
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('Error saving order:', error);
      alert(`Erro ao salvar pedido: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

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
      <div className="max-w-5xl mx-auto pb-8 animate-fade-in relative">

        {/* Header - Manual Margin */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Cadastro de Pedido Médico Detalhado</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Preencha as informações necessárias para formalizar o pedido cirúrgico.
          </p>
        </div>

        {/* Top Navigation Tabs - REFORÇO MÁXIMO */}
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 -mx-4 sm:-mx-8 px-4 sm:px-8 border-b border-slate-200 shadow-sm transition-shadow">
          <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth pt-2">
            {renderTabHeader('pedido', 'Pedido Médico')}
            {renderTabHeader('procedimentos', 'Procedimentos')}
            {renderTabHeader('exames', 'Exames')}
            {renderTabHeader('documentos', 'Documentos')}
            {renderTabHeader('opme', 'OPME')}
            {renderTabHeader('equipamentos', 'Equipamentos')}
            {renderTabHeader('participantes', 'Participantes')}
          </div>
        </div>

        <div className="mt-8"> {/* TAB CONTENT SPACING */}

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
                        disabled={!!passedPatientId}
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className={`w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none ${passedPatientId ? 'opacity-70 bg-slate-50 cursor-not-allowed' : ''}`}
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
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Contato do Paciente</label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setShowContactPopover(!showContactPopover)}
                              className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-100 rounded-xl hover:bg-primary-100 transition-all group shadow-sm"
                            >
                              <Phone className="w-4 h-4" />
                              <span className="text-xs font-black uppercase tracking-tighter">Ver Informações de Contato</span>
                            </button>

                            {/* Simple inline "pop-up" for contact info */}
                            {showContactPopover && (
                              <div className="animate-in fade-in zoom-in-95 duration-200 bg-white border border-slate-200 shadow-xl rounded-xl p-4 min-w-[300px] z-30">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                      <Phone className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp / Telefone</p>
                                      <p className="text-sm font-bold text-slate-700">{selectedPatient.whatsapp || selectedPatient.phone || 'Nenhum informado'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Mail className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">E-mail</p>
                                      <p className="text-sm font-bold text-slate-700">{selectedPatient.email || 'Nenhum informado'}</p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setShowContactPopover(false)}
                                  className="w-full mt-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                  Fechar
                                </button>
                              </div>
                            )}
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
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <SectionHeader
                  icon={FileText}
                  title="DOCUMENTOS DO PROCESSO"
                  actionLabel="Novo Documento"
                  onAction={() => {
                    const newDoc: OrderDocument = {
                      id: crypto.randomUUID(),
                      type: 'exames',
                      is_annexed_locally: false,
                      has_no_expiry: false
                    };
                    setOrderDocuments([...orderDocuments, newDoc]);
                  }}
                />

                <div className="space-y-4">
                  {orderDocuments.length > 0 ? (
                    <div className="grid grid-cols-12 gap-4 px-2 mb-2">
                      <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">Tipo de Documento</div>
                      <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">Data de Validade</div>
                      <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase text-center">Arquivo / Anexo</div>
                      <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase text-center">Já Anexado?</div>
                      <div className="col-span-1"></div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {orderDocuments.map((doc) => (
                      <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl items-center animate-in fade-in slide-in-from-top-2">
                        <div className="col-span-3 space-y-2">
                          <select
                            value={doc.type}
                            onChange={(e) => {
                              const type = e.target.value as DocumentType;
                              setOrderDocuments(docs => docs.map(d => d.id === doc.id ? { ...d, type } : d));
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="exames">Exames</option>
                            <option value="pedido_medico">Pedido Médico</option>
                            <option value="laudo">Laudos de Exames</option>
                            <option value="risco_cirurgico">Risco Cirúrgico</option>
                            <option value="termo_consentimento">Termo de Consentimento</option>
                            <option value="documento_acompanhante">Documentos do Acompanhante</option>
                            <option value="lista_medicamentos">Lista de Medicamentos</option>
                            <option value="personalizado">Personalizado...</option>
                          </select>
                          {doc.type === 'personalizado' && (
                            <input
                              type="text"
                              value={doc.custom_name || ''}
                              onChange={(e) => setOrderDocuments(docs => docs.map(d => d.id === doc.id ? { ...d, custom_name: e.target.value } : d))}
                              placeholder="Nome do documento..."
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          )}
                        </div>

                        <div className="col-span-3 flex items-center gap-2">
                          <input
                            type="date"
                            disabled={doc.has_no_expiry}
                            value={doc.valid_until || ''}
                            onChange={(e) => setOrderDocuments(docs => docs.map(d => d.id === doc.id ? { ...d, valid_until: e.target.value } : d))}
                            className={`flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-slate-100`}
                          />
                          <button
                            onClick={() => setOrderDocuments(docs => docs.map(d => d.id === doc.id ? { ...d, has_no_expiry: !d.has_no_expiry, valid_until: !d.has_no_expiry ? '' : d.valid_until } : d))}
                            className={`shrink-0 p-2 rounded-lg border transition-all ${doc.has_no_expiry ? 'bg-amber-100 border-amber-200 text-amber-700 font-bold text-[10px]' : 'bg-white border-slate-200 text-slate-400 text-[10px]'}`}
                            title="Marcar como sem validade"
                          >
                            {doc.has_no_expiry ? 'SEM VALIDADE' : 'S/ VAL'}
                          </button>
                        </div>

                        <div className="col-span-3 flex justify-center">
                          {doc.file || doc.file_path ? (
                            <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                              <Check className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[100px]">{doc.file?.name || 'Arquivo anexado'}</span>
                              <button
                                onClick={() => setOrderDocuments(docs => docs.map(d => d.id === doc.id ? { ...d, file: undefined, file_path: undefined } : d))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) {
                                    setOrderDocuments(docs => docs.map(d => d.id === doc.id ? { ...d, file, is_annexed_locally: false } : d));
                                  }
                                };
                                input.click();
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5" /> Anexar Arquivo
                            </button>
                          )}
                        </div>

                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() => setOrderDocuments(docs => docs.map(d => d.id === doc.id ? { ...d, is_annexed_locally: !d.is_annexed_locally, file: !d.is_annexed_locally ? undefined : d.file } : d))}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black transition-all border ${doc.is_annexed_locally ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-400'}`}
                          >
                            {doc.is_annexed_locally ? (
                              <><ClipboardCheck className="w-3.5 h-3.5" /> JÁ ANEXADO</>
                            ) : (
                              'NÃO ANEXADO'
                            )}
                          </button>
                        </div>

                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => setOrderDocuments(docs => docs.filter(d => d.id !== doc.id))}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {orderDocuments.length === 0 && (
                      <div className="py-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                          <FileText className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Nenhum documento listado.</p>
                        <p className="text-slate-400 text-xs mt-1">Clique em "Novo Documento" para começar.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. OPME */}
            {activeTab === 'opme' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <SectionHeader
                  icon={Package}
                  title="MATERIAIS ESPECIAIS (OPME)"
                  actionLabel="Adicionar Material"
                  onAction={() => {
                    setOpmeItems([...opmeItems, { id: crypto.randomUUID(), description: '', quantity: 1 }]);
                  }}
                />

                <div className="space-y-4">
                  {opmeItems.length > 0 ? (
                    <div className="grid grid-cols-12 gap-3 px-2 mb-2">
                      <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase">Descrição do Material</div>
                      <div className="col-span-1 text-[10px] font-bold text-slate-400 uppercase text-center">Qtd.</div>
                      <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">Fornecedor Sugerido</div>
                      <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase">Fabricante</div>
                      <div className="col-span-1"></div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {opmeItems.map((item) => (
                      <OpmeRow
                        key={item.id}
                        item={item}
                        onChange={(id, updates) => {
                          setOpmeItems(items => items.map(i => i.id === id ? { ...i, ...updates } : i));
                        }}
                        onRemove={(id) => {
                          setOpmeItems(items => items.filter(i => i.id !== id));
                        }}
                      />
                    ))}

                    {opmeItems.length === 0 && (
                      <div className="py-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                          <Package className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Nenhum material OPME solicitado.</p>
                        <button
                          onClick={() => setOpmeItems([{ id: crypto.randomUUID(), description: '', quantity: 1 }])}
                          className="mt-3 text-primary-600 text-xs font-bold hover:underline"
                        >
                          + Clique para adicionar o primeiro material
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. EQUIPAMENTOS */}
            {activeTab === 'equipamentos' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                <SectionHeader
                  icon={Microscope}
                  title="EQUIPAMENTOS DE SALA"
                  actionLabel="Adicionar Equipamento"
                  onAction={() => setEquipmentItems(prev => [...prev, { id: crypto.randomUUID(), name: '' }])}
                />

                <div className="space-y-4">
                  {equipmentItems.map((item) => (
                    <EquipmentRow
                      key={item.id}
                      item={item}
                      availableEquipments={availableEquipments}
                      onChange={(id, updates) => {
                        setEquipmentItems(items => items.map(i => i.id === id ? { ...i, ...updates } : i));
                      }}
                      onRemove={(id) => {
                        setEquipmentItems(items => items.filter(i => i.id !== id));
                      }}
                    />
                  ))}

                  {equipmentItems.length === 0 && (
                    <div className="py-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                      <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Microscope className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Nenhum equipamento solicitado para sala.</p>
                      <button
                        onClick={() => setEquipmentItems([{ id: crypto.randomUUID(), name: '' }])}
                        className="mt-3 text-primary-600 text-xs font-bold hover:underline"
                      >
                        + Clique para selecionar um equipamento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. PARTICIPANTES */}
            {activeTab === 'participantes' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                <SectionHeader
                  icon={UserCog}
                  title="EQUIPE CIRÚRGICA"
                  actionLabel="Adicionar Participante"
                  onAction={() => setParticipantItems(prev => [...prev, { id: crypto.randomUUID(), team_role_id: '', professional_id: undefined }])}
                />

                <div className="space-y-4">
                  {/* O Cirurgião Principal fixo */}
                  <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                          <UserCog className="w-4 h-4" />
                        </div>
                        <select disabled className="flex-1 bg-transparent border-none font-bold text-slate-700 h-10">
                          <option>Cirurgião Principal</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 text-slate-300">
                          <UserCog className="w-4 h-4" />
                        </div>
                        <select disabled className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 h-10 px-3">
                          <option>{selectedDoctor?.full_name || 'Selecione um médico'}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-end md:border-l md:border-slate-50 md:pl-4 mt-2 md:mt-0">
                      <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">VINCULADO AO PEDIDO</span>
                    </div>
                  </div>

                  {participantItems.map((item) => (
                    <ParticipantRow
                      key={item.id}
                      item={item}
                      availableRoles={availableRoles}
                      doctors={doctors}
                      onChange={(id, updates) => {
                        setParticipantItems(items => items.map(i => i.id === id ? { ...i, ...updates } : i));
                      }}
                      onRemove={(id) => {
                        setParticipantItems(items => items.filter(i => i.id !== id));
                      }}
                    />
                  ))}

                  {participantItems.length === 0 && (
                    <div className="py-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                      <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <UserCog className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Nenhum participante adicional vinculado ainda.</p>
                      <button
                        onClick={() => setParticipantItems([{ id: crypto.randomUUID(), team_role_id: '', professional_id: undefined }])}
                        className="mt-3 text-primary-600 text-xs font-bold hover:underline"
                      >
                        + Clique para escalar um membro
                      </button>
                    </div>
                  )}
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
                  else if (activeTab === 'equipamentos') setActiveTab('participantes');
                  else handleSave();
                }}
                disabled={saving}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : activeTab === 'participantes' ? 'Finalizar Pedido' : 'Próxima Etapa'}
                {!saving && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>


      </div> {/* End of Main Container */}

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

      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center bg-gradient-to-b from-primary-50/50 to-white">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Pedido Criado com Sucesso!</h3>
              <p className="text-slate-500 mb-8 text-sm">O requerimento cirúrgico foi processado e já está disponível para gestão.</p>

              <div className="bg-slate-50 rounded-xl p-6 text-left mb-8 space-y-4 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <ClipboardCheck className="w-12 h-12 text-primary-600" />
                </div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">Resumo do Requerimento</h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Paciente:</span>
                    <span className="text-slate-700 font-bold">{selectedPatient?.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Médico:</span>
                    <span className="text-slate-700 font-bold">{selectedDoctor?.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Procedimento:</span>
                    <span className="text-slate-700 font-bold max-w-[200px] truncate text-right">
                      {procedures.find(p => p.id === mainProcedureId)?.description || procedures[0]?.description || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Data Prevista:</span>
                    <span className="text-slate-700 font-bold">{surgeryDate ? new Date(surgeryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'A definir'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-primary-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Status: Agendado p/ Navegação</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(`/case/${savedOrderId}`)}
                  className="w-full px-6 py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-2 active:scale-95 text-base"
                >
                  <Eye className="w-5 h-5" /> Abrir Navegação Cirúrgica (OK)
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate(`/patients/${selectedPatientId}`)}
                    className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 text-sm"
                  >
                    Perfil do Paciente
                  </button>
                  <button
                    onClick={() => navigate('/patients')}
                    className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 text-sm"
                  >
                    Lista de Pacientes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

