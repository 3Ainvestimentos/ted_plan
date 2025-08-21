
export type InitiativeStatus = 'A Fazer' | 'Em Dia' | 'Em Risco' | 'Atrasado' | 'Concluído';
export type InitiativePriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface Initiative {
  id: string;
  topicNumber: string; // "1", "1.1", "2", etc.
  title: string;
  status: InitiativeStatus;
  owner: string; // Assignee
  description: string;
  lastUpdate: string; // Date string
  progress: number; // Percentage 0-100
  priority: InitiativePriority;
  deadline: string; // ISO date string 'YYYY-MM-DD'
  keyMetrics: { name: string; value: string; trend: 'up' | 'down' | 'neutral' }[];
  icon?: React.ElementType; // Optional: for specific task icons
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

export interface RecurringMeeting {
  id: string;
  name: string;
  recurrence: {
    unit: 'dias' | 'semanas' | 'meses';
    value: number;
  };
  lastOccurrence: string; // ISO date string 'YYYY-MM-DD'
  executedDate?: string; // ISO date string 'YYYY-MM-DD', for the current cycle
  isDone: boolean;
}
