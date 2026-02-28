export type UserRole = 'admin' | 'medic' | 'technician';

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  clinic_id: string;
  full_name: string;
  role: UserRole;
  updated_at: string;
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
  ans_code?: string;
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
