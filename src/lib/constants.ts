
import type { NavItem, UserRole, Initiative, InitiativeStatus, InitiativePriority, RecurringMeeting } from '@/types';
import { LayoutDashboard, Target, CalendarClock, Settings, Shield, User, BarChart3, ListTodo, CircleCheck, AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown, Minus, Lightbulb, FileText, Bug, PlayCircle, PauseCircle, CheckSquare } from 'lucide-react';

export const NAV_ITEMS_CONFIG: NavItem[] = [
  { title: 'Painel Estratégico', href: '/strategic-panel', icon: LayoutDashboard },
  { title: 'Iniciativas Estratégicas', href: '/strategic-initiatives', icon: Target },
  { title: 'Agenda de Reuniões', href: '/meeting-agenda', icon: CalendarClock },
];


export const USER_ROLES: UserRole[] = ['PMO', 'Líder', 'Colaborador'];

export const STATUS_ICONS: Record<InitiativeStatus, React.ElementType> = {
  'A Fazer': ListTodo,
  'Em Dia': CircleCheck,
  'Em Risco': AlertTriangle,
  'Atrasado': Clock,
  'Concluído': CheckCircle,
  'Pendente': ListTodo,
  'Em execução': PlayCircle,
  'Suspenso': PauseCircle
};

export const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export const KANBAN_COLUMNS_ORDER: InitiativeStatus[] = ['Pendente', 'Em execução', 'Concluído', 'Suspenso'];


export const MOCK_INITIATIVES: Initiative[] = [];

export const MOCK_RECURRING_MEETINGS: RecurringMeeting[] = [];

// Mock data for collaborators
export const MOCK_OWNERS = ["Alice W.", "Bob T.", "Charlie B.", "David C.", "Anne K.", "Fred L."];
