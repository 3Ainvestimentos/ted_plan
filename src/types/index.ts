

export type InitiativeStatus = 'Pendente' | 'Em execução' | 'Etapa concluída' | 'Concluído' | 'Suspenso' | 'A Fazer' | 'Em Dia' | 'Em Risco' | 'Atrasado';
export type InitiativePriority = 'Baixa' | 'Média' | 'Alta';

export interface SubItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Initiative {
  id: string;
  topicNumber: string; // "1", "1.1", "2", etc.
  parentId?: string | null; // ID of the parent initiative
  title: string;
  status: InitiativeStatus;
  owner: string; // Assignee
  description: string;
  lastUpdate: string; // Date string
  progress: number; // Percentage 0-100
  priority: InitiativePriority;
  deadline?: string | null; // ISO date string 'YYYY-MM-DD'
  keyMetrics: { name: string; value: string; trend: 'up' | 'down' | 'neutral' }[];
  icon?: React.ElementType; // Optional: for specific task icons
  subItems?: SubItem[];
}

export type UserRole = 'PMO' | 'Líder' | 'Colaborador';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  isDivider?: boolean;
  isFooter?: boolean;
  onClick?: () => void;
}

export interface AgendaItem {
  id: string;
  title: string;
  completed: boolean;
  action?: string;
  owner?: string;
  deadline?: string;
}

export interface MeetingOccurrence {
    executedDate: string; // 'YYYY-MM-DD'
    agenda: AgendaItem[];
}

export interface RecurringMeeting {
  id: string;
  name: string;
  recurrence: {
    unit: 'dias' | 'semanas' | 'meses';
    value: number;
  };
  agenda: Omit<AgendaItem, 'completed'>[]; // Template da pauta
  lastOccurrence: string; // ISO date string 'YYYY-MM-DD'
  scheduledDate: string | null; // ISO date string 'YYYY-MM-DD', for the current cycle
  currentOccurrenceAgenda: AgendaItem[];
  occurrenceHistory?: MeetingOccurrence[];
}


// Types for Strategic Panel
export interface Kpi {
    id: string;
    areaId: string;
    name: string;
    unit: string;
    series: { month: string; Previsto: number; Realizado: number; Projetado: number; }[];
}

export interface Okr {
    id: string;
    areaId: string;
    name: string;
    progress: number;
    status: 'Em Dia' | 'Em Risco' | 'Concluído';
}

export interface BusinessArea {
    id: string;
    name: string;
    icon: string; // Name of the lucide-react icon
    okrs: Okr[];
    kpis: Kpi[];
}

// Type for Collaborators
export interface Collaborator {
    id: string;
    name: string;
    email: string;
    cargo: string; // Role/Position
}

// Form data types for Strategic Panel Management
export type BusinessAreaFormData = Omit<BusinessArea, 'id' | 'okrs' | 'kpis'>;
export type OkrFormData = Omit<Okr, 'id' | 'areaId'>;
export type KpiFormData = Omit<Kpi, 'id' | 'areaId' | 'series'>;

// Types for Audit Log
export type AuditLogEvent = 'login' | 'logout' | 'view_page' | 'create_initiative' | 'update_initiative';

export interface AuditLog {
    id: string;
    userId: string;
    userEmail: string;
    event: AuditLogEvent;
    timestamp: any; // Firestore Timestamp
    details: string;
}

// Types for Settings
export interface MaintenanceSettings {
    isEnabled: boolean;
    adminEmails: string[];
}
