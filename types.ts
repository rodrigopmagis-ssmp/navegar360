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

export interface SurgeryCase {
  id: string;
  patientName: string;
  procedure: string;
  hospital: string;
  doctor: string;
  date: string; // ISO date string
  time: string;
  status: CaseStatus;
  progress: {
    docs: number;
    anesthesia: number;
    opme: number;
    equipment: number;
    team: number;
  };
  countdown?: string;
}

export interface TeamMember {
  id: string;
  role: string;
  name: string;
  phone?: string;
  confirmed: boolean;
  type: 'Technical' | 'Medical' | 'Support';
  status?: 'Pending' | 'OK' | 'Warning';
  issues?: string[];
}

export interface Equipment {
  id: string;
  name: string;
  location: string;
  status: EquipmentStatus;
  statusLabel: string; // e.g., "Prontos", "Pendentes"
  count: number;
  confirmed: boolean;
  checklist: {
    tested: boolean;
    sanitized: boolean;
  };
  notes?: string;
}
