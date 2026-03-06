export type UserRole = 'admin' | 'medic' | 'technician';

export interface UserPermissions {
  can_view_financial: boolean;
  can_manage_users: boolean;
  can_access_reports: boolean;
  can_delete_schedule: boolean;
  can_create_case: boolean;
  can_edit_settings: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  updated_at: string;
}

export type UserClinicStatus = 'pending' | 'active' | 'inactive';

export interface UserClinic {
  id: string;
  user_id: string;
  clinic_id: string;
  role: UserRole;
  status: UserClinicStatus;
  permissions: Record<string, boolean>;
  approved_by?: string;
  approved_at?: string;
  inactivated_by?: string;
  inactivated_at?: string;
  created_at: string;
  updated_at: string;
  // join
  clinics?: Clinic;
  profiles?: Profile;
}

export enum CaseStatus {
  Scheduled = 'Scheduled',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export enum EquipmentStatus {
  Ready = 'Ready',
  Pending = 'Pending',
  Critical = 'Critical',
  Warning = 'Warning'
}

export interface PatientV2 {
  id: string;
  clinic_id: string;
  full_name: string;
  cpf?: string;
  rg?: string;
  cnpj?: string;
  birth_date?: string;
  gender?: string;
  marital_status?: string;
  profession?: string;
  ethnicity?: string;
  origin?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address_zipcode?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  // Nationality & Documents
  nationality?: 'brasileiro' | 'estrangeiro';
  country_of_origin?: string;
  document_type?: 'passaporte' | 'crnm' | 'protocolo_refugio';
  document_number?: string;
  document_validity?: string;
  has_brazilian_cpf?: boolean;
  // Family
  father_name?: string;
  mother_name?: string;
  rg_issuer?: string;
  medical_record_number?: string;
  status: 'ativo' | 'inativo';
  lgpd_consent: boolean;
  lgpd_consent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientEmergencyContact {
  id: string;
  clinic_id: string;
  patient_id: string;
  full_name: string;
  relationship?: string;
  cpf?: string;
  phone: string;
  phone_secondary?: string;
  email?: string;
  is_whatsapp: boolean;
  is_emergency_contact: boolean;
  can_receive_medical_info: boolean;
  can_authorize: boolean;
  is_financial_responsible: boolean;
  priority: number;
  created_at: string;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  profile_id?: string;
  full_name: string;
  council: string;
  council_number?: string;
  council_state?: string;
  rqe?: string;
  specialty?: string;
  subspecialty?: string;
  role_type: 'cirurgiao' | 'assistente' | 'anestesista' | 'residente';
  phone?: string;
  whatsapp?: string;
  email?: string;
  status: 'ativo' | 'inativo';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthInsurer {
  id: string;
  clinic_id: string;
  name: string;
  legal_name?: string;
  cnpj?: string;
  ans_code?: string;
  status: 'ativo' | 'inativo';
  notes?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  created_at: string;
  updated_at?: string;
  insurer_contacts?: HealthInsurerContact[];
}

export interface HealthInsurerContact {
  id: string;
  clinic_id: string;
  insurer_id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

export interface InsurancePlan {
  id: string;
  clinic_id: string;
  insurer_id: string;
  plan_name: string;
  accommodation_type?: 'enfermaria' | 'apartamento';
  coverage_type?: 'nacional' | 'regional';
  has_copayment: boolean;
  created_at: string;
  // join
  health_insurers?: HealthInsurer;
}

export interface PatientInsurance {
  id: string;
  clinic_id: string;
  patient_id: string;
  plan_id?: string;
  card_number?: string;
  holder_name?: string;
  holder_cpf?: string;
  valid_from?: string;
  valid_until?: string;
  is_primary: boolean;
  created_at: string;
  // join
  insurance_plans?: InsurancePlan;
}

export type DocumentType =
  | 'exames'
  | 'pedido_medico'
  | 'laudo'
  | 'risco_cirurgico'
  | 'termo_consentimento'
  | 'termo_anestesico'
  | 'documento_identificacao'
  | 'carteira_convenio'
  | 'guia_autorizacao'
  | 'lista_medicamentos'
  | 'exame_laboratorial'
  | 'exame_imagem'
  | 'documento_acompanhante'
  | 'personalizado';

export interface OrderDocument {
  id: string;
  type: DocumentType;
  custom_name?: string;
  file_path?: string;
  is_annexed_locally: boolean;
  valid_until?: string;
  has_no_expiry: boolean;
  file?: File; // For local preview/upload
}

export interface MedicalRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  comorbidities: string[];
  allergies: string[];
  medications: string[];
  surgical_indication?: string;
  risk_classification?: string;
  notes?: string;
  created_at: string;
}

export interface SurgeryCase {
  id: string;
  clinic_id: string;
  patient_id: string;
  patientName?: string; // Legacy/Join helper
  procedure: string;
  hospital: string;
  doctor: string;
  date: string;
  time: string;
  status: CaseStatus;
  docs_progress: number;
  anesthesia_progress: number;
  opme_progress: number;
  equipment_progress: number;
  team_progress: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  clinic_id: string;
  case_id: string;
  role: string;
  name: string;
  phone?: string;
  confirmed: boolean;
  type: 'Technical' | 'Medical' | 'Support';
  status: 'Pending' | 'OK' | 'Warning';
}

export interface Equipment {
  id: string;
  clinic_id: string;
  name: string;
  location: string;
  status: EquipmentStatus;
  count: number;
  confirmed: boolean;
  tested: boolean;
  sanitized: boolean;
  notes?: string;
}

export interface OrderOpme {
  id: string;
  order_id?: string;
  description: string;
  quantity: number;
  suggested_vendor?: string;
  manufacturer?: string;
  supplier?: string;
  is_authorized?: boolean;
  authorized_value?: number;
  authorized_supplier_id?: string;
  created_at?: string;
}

export interface OrderEquipment {
  id: string;
  name: string;
  notes?: string;
}

export interface OrderParticipant {
  id: string;
  order_id?: string;
  team_role_id: string;
  professional_id?: string;
  status?: 'pending' | 'ready' | 'waived' | 'not_available';
  created_at?: string;

  // Joins
  protocols?: { name: string };
  doctors?: { full_name: string; council?: string; council_number?: string };
}
