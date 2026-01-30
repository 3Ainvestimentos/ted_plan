






export type InitiativeStatus = 'Pendente' | 'Em execução' | 'Concluído' | 'Suspenso' | 'A Fazer' | 'Em Dia' | 'Em Risco' | 'Atrasado';
export type InitiativePriority = 'Baixa' | 'Média' | 'Alta';

export interface SubItem {
  id: string;
  title: string;
  completed: boolean;
  startDate: string; // ISO date string 'YYYY-MM-DD' - OBRIGATÓRIO
  endDate: string; // ISO date string 'YYYY-MM-DD' - OBRIGATÓRIO (prazo/deadline)
  linkedToPrevious?: boolean; // Default false - indica se está vinculado ao subitem anterior
  status: InitiativeStatus;
  responsible: string; // Responsável obrigatório
  priority: InitiativePriority;
  description: string; // Observações
}

export interface InitiativeItem {
  id: string;
  title: string;
  startDate: string; // ISO date string 'YYYY-MM-DD' - OBRIGATÓRIO
  endDate: string; // ISO date string 'YYYY-MM-DD' - OBRIGATÓRIO (prazo/deadline)
  linkedToPrevious?: boolean; // Default false - indica se está vinculado ao item anterior
  status: InitiativeStatus;
  areaId: string; // Área obrigatória
  priority: InitiativePriority;
  description: string; // Observações
  responsible?: string | null; // Responsável opcional
  subItems?: SubItem[];
}

export interface Initiative {
  id: string;
  topicNumber: string; // "1", "1.1", "2", etc.
  parentId?: string | null; // ID of the parent initiative
  title: string;
  status: InitiativeStatus;
  owner: string; // Responsável obrigatório
  description: string;
  lastUpdate: string; // Date string
  createdAt?: string; // ISO date string - adicionado para novas iniciativas
  progress: number; // Percentage 0-100
  priority: InitiativePriority;
  startDate: string; // ISO date string 'YYYY-MM-DD' - OBRIGATÓRIO
  endDate: string; // ISO date string 'YYYY-MM-DD' - OBRIGATÓRIO (prazo/deadline)
  keyMetrics: { name: string; value: string; trend: 'up' | 'down' | 'neutral' }[];
  icon?: React.ElementType; // Optional: for specific task icons
  areaId: string; // Área obrigatória (seletor com áreas de negócio)
  items: InitiativeItem[]; // Itens obrigatórios (mínimo 1)
  archived?: boolean;
  deletedAt?: string; // Soft delete field (ISO date)
  initiativeType?: 'strategic' | 'other'; // Tipo de iniciativa: 'strategic' (padrão) ou 'other'
  cidade?: string;
  auc?: number;
  // Campo legado para migração - será removido após migração completa
  subItems?: SubItem[];
}

export interface MnaDeal extends Initiative {
  // Campos adicionais para visualização Gantt
  // startDate já é obrigatório em Initiative, não precisa redefinir
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
    deletedAt?: string; // Soft delete field (ISO date)
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
    area?: string;
    userType: UserType;
    remunerationHistory?: RemunerationHistory[];
    positionHistory?: PositionHistory[];
    deletedAt?: string; // Soft delete field (ISO date)
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
    deletedAt?: string; // Soft delete field (ISO date)
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
    deletedAt?: string; // Soft delete field (ISO date)
}

export interface BusinessArea {
    id: string;
    name: string;
    icon: string; // Name of the lucide-react icon
    order: number;
    okrs: Okr[];
    kpis: Kpi[];
    generalContext?: string; // Contextualização geral da área (formato texto com bullets)
    deletedAt?: string; // Soft delete field (ISO date)
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

