






export type InitiativeStatus = 'Pendente' | 'Em execução' | 'Concluído' | 'Suspenso' | 'A Fazer' | 'Em Dia' | 'Em Risco' | 'Atrasado';
export type InitiativePriority = 'Baixa' | 'Média' | 'Alta';

export interface SubItem {
  id: string;
  title: string;
  completed: boolean;
  deadline?: string | null; // ISO date string 'YYYY-MM-DD'
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
  archived?: boolean;
  cidade?: string;
  auc?: number;
}

export interface MnaDeal extends Initiative {
  // Campos adicionais para visualização Gantt
  startDate?: string | null; // Data de início 'YYYY-MM-DD'
  responsible?: string; // Responsável pelo deal
}

// Types for Development Projects
export type DevProjectStatus = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Em atraso';

export interface DevProjectSubItem {
    id: string;
    title: string;
    status: DevProjectStatus;
    responsible: string;
    startDate: string; // ISO Date 'YYYY-MM-DD'
    deadline: string; // ISO Date 'YYYY-MM-DD'
}

export interface DevProjectItem {
    id: string;
    title: string;
    status: DevProjectStatus;
    responsible: string;
    startDate: string; // ISO Date 'YYYY-MM-DD'
    deadline: string; // ISO Date 'YYYY-MM-DD'
    subItems: DevProjectSubItem[];
}

export interface DevProject {
    id: string;
    name: string;
    items: DevProjectItem[];
}

// Types for Project Comments
export interface ProjectComment {
    id: string;
    projectId: string;
    itemId?: string;
    subItemId?: string;
    authorId: string;
    authorName: string;
    authorEmail: string;
    content: string;
    timestamp: any; // Firestore Timestamp
    readByAdmin: boolean;
    readAt?: any; // Firestore Timestamp (quando foi lido)
}

export type UserRole = 'PMO' | 'head'; // Cargo (só 2 tipos)
export type UserType = 'admin' | 'head' | 'pmo'; // Tipo de usuário/permissões (3 tipos)

export interface RemunerationHistory {
    date: string; // 'YYYY-MM-DD'
    value: number;
}

export interface PositionHistory {
    date: string; // 'YYYY-MM-DD'
    position: string;
}

export interface Collaborator {
    id: string;
    name: string;
    email: string;
    cargo: string;
    area?: string;
    userType: UserType;
    permissions: Record<string, boolean>;
    remunerationHistory?: RemunerationHistory[];
    positionHistory?: PositionHistory[];
}


export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  isDivider?: boolean;
  isFooter?: boolean;
  onClick?: () => void;
}

export interface Participant {
    id?: string;
    name: string;
    email: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  completed: boolean;
  action?: string;
  owner?: string;
  deadline?: string;
  observations?: string;
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
  participants: Participant[];
  agenda: Omit<AgendaItem, 'completed'>[]; // Template da pauta
  lastOccurrence: string; // ISO date string 'YYYY-MM-DD'
  scheduledDate: string | null; // ISO date string 'YYYY-MM-DD', for the current cycle
  currentOccurrenceAgenda: AgendaItem[];
  occurrenceHistory?: MeetingOccurrence[];
}

export interface KpiSeriesData {
    month: string; 
    Realizado: number | null;
}

// Types for Strategic Panel
export interface Kpi {
    id: string;
    areaId: string;
    name: string;
    unit: string;
    targetValue: number;
    series: KpiSeriesData[];
    startDate?: string;
    endDate?: string;
}

export interface Okr {
    id: string;
    areaId: string;
    name: string;
    progress: number;
    previousProgress: number;
    deadline: string | null;
    status: 'Em Dia' | 'Em Risco' | 'Concluído';
    lastUpdate: string | null;
    previousUpdate: string | null;
    observations?: string;
}

export interface BusinessArea {
    id: string;
    name: string;
    icon: string; // Name of the lucide-react icon
    order: number;
    okrs: Okr[];
    kpis: Kpi[];
}

// Form data types for Strategic Panel Management
export type BusinessAreaFormData = Omit<BusinessArea, 'id' | 'okrs' | 'kpis'>;
export type OkrFormData = Omit<Okr, 'id' | 'areaId' | 'previousProgress' | 'lastUpdate' | 'previousUpdate'>;
export type KpiFormData = Omit<Kpi, 'id' | 'areaId'>;

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

export interface UserAuditSummaryData {
    userEmail: string;
    loginCount: number;
    lastLogin: Date;
}

// Types for Settings
export interface MaintenanceSettings {
    isEnabled: boolean;
    adminEmails: string[];
}

// Type for Notes
export interface Note {
    userId: string;
    content: string;
    lastUpdated: any; // Firestore Timestamp
}

// Type for Tasks
export type TaskStatus = 'Pendente' | 'Prioridade' | 'Concluído';

export interface Task {
    id: string;
    userId: string;
    title: string;
    completed: boolean;
    archived: boolean;
    createdAt: any; // Firestore Timestamp
    priority: boolean;
}
