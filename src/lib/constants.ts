
import type { NavItem, UserRole, Initiative, InitiativeStatus, InitiativePriority, RecurringMeeting } from '@/types';
import { LayoutDashboard, Target, CalendarClock, Settings, Shield, User, BarChart3, ListTodo, CircleCheck, AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown, Minus, Lightbulb, FileText, Bug } from 'lucide-react';

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
};

export const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export const KANBAN_COLUMNS_ORDER: InitiativeStatus[] = ['A Fazer', 'Em Dia', 'Atrasado', 'Em Risco', 'Concluído'];


export const MOCK_INITIATIVES: Initiative[] = [
  {
    id: 'task-1',
    topicNumber: '1',
    title: 'Dev Contributor infrastructure',
    status: 'A Fazer',
    owner: 'Alice W.',
    description: 'Setup core infrastructure for developer contributions.',
    lastUpdate: '2023-12-01',
    progress: 10,
    priority: 'P2',
    keyMetrics: [],
    icon: Lightbulb,
  },
  {
    id: 'task-2',
    topicNumber: '1.1',
    title: 'Create install package',
    status: 'A Fazer',
    owner: 'Bob T.',
    description: 'Package the application for easy installation.',
    lastUpdate: '2024-02-01',
    progress: 0,
    priority: 'P3',
    keyMetrics: [],
    icon: FileText,
  },
  {
    id: 'task-3',
    topicNumber: '1.2',
    title: 'UI Review',
    status: 'A Fazer',
    owner: 'Charlie B.',
    description: 'Conduct a thorough UI review and gather feedback.',
    lastUpdate: '2024-02-01',
    progress: 5,
    priority: 'P3',
    keyMetrics: [],
  },
  {
    id: 'task-4',
    topicNumber: '2',
    title: 'API client libraries',
    status: 'A Fazer',
    owner: 'David C.',
    description: 'Develop client libraries for the public API.',
    lastUpdate: '2024-01-26',
    progress: 0,
    priority: 'P2',
    keyMetrics: [],
  },
  {
    id: 'task-5',
    topicNumber: '3',
    title: 'Bugbash',
    status: 'Em Dia',
    owner: 'Anne K.',
    description: 'Organize and run a company-wide bug bash.',
    lastUpdate: '2024-02-01',
    progress: 40,
    priority: 'P1',
    keyMetrics: [],
    icon: Bug,
  },
  {
    id: 'task-6',
    topicNumber: '3.1',
    title: 'Code-sign client binaries',
    status: 'Em Dia',
    owner: 'Bob T.',
    description: 'Implement code signing for all client binaries.',
    lastUpdate: '2024-01-18',
    progress: 60,
    priority: 'P2',
    keyMetrics: [],
  },
  {
    id: 'task-7',
    topicNumber: '3.2',
    title: 'Create initial help-wanted tickets',
    status: 'Em Dia',
    owner: 'Bob T.',
    description: 'Identify and create good first issues for new contributors.',
    lastUpdate: '2024-02-01',
    progress: 75,
    priority: 'P3',
    keyMetrics: [],
  },
  {
    id: 'task-8',
    topicNumber: '4',
    title: 'Handle forgotten passwords',
    status: 'Em Risco',
    owner: 'Alice W.',
    description: 'Design and implement the forgotten password flow.',
    lastUpdate: '2024-02-01',
    progress: 30,
    priority: 'P1',
    keyMetrics: [],
  },
  {
    id: 'task-9',
    topicNumber: '5',
    title: 'Innovation Program',
    status: 'Atrasado',
    owner: 'Fred L.',
    description: 'Launch the new internal innovation program.',
    lastUpdate: '2024-02-01',
    progress: 20,
    priority: 'P2',
    keyMetrics: [],
    icon: Lightbulb,
  },
  {
    id: 'task-10',
    topicNumber: '5.1',
    title: 'Update license file',
    status: 'Em Dia',
    owner: 'Bob T.',
    description: 'Review and update the project\'s license file.',
    lastUpdate: '2024-02-01',
    progress: 90,
    priority: 'P4',
    keyMetrics: [],
    icon: FileText,
  },
  {
    id: 'task-11',
    topicNumber: '6',
    title: 'Add help link to docs website',
    status: 'Concluído',
    owner: 'Bob T.',
    description: 'Integrate a dynamic help link into the documentation.',
    lastUpdate: '2024-01-26',
    progress: 100,
    priority: 'P3',
    keyMetrics: [],
  },
  {
    id: 'task-12',
    topicNumber: '7',
    title: 'Settings flags',
    status: 'Concluído',
    owner: 'Fred L.',
    description: 'Implement feature flags for new settings options.',
    lastUpdate: '2024-02-01',
    progress: 100,
    priority: 'P1',
    keyMetrics: [],
  },
  {
    id: 'task-13',
    topicNumber: '7.1',
    title: 'Show comment user name',
    status: 'Concluído',
    owner: 'Bob T.',
    description: 'Display the full user name next to comments.',
    lastUpdate: '2024-01-19',
    progress: 100,
    priority: 'P2',
    keyMetrics: [],
  },
  {
    id: 'task-14',
    topicNumber: '8',
    title: 'Update Repo',
    status: 'Concluído',
    owner: 'Alice W.',
    description: 'Update repository with latest security patches.',
    lastUpdate: '2024-02-01',
    progress: 100,
    priority: 'P1',
    keyMetrics: [],
  },
];

export const MOCK_RECURRING_MEETINGS: RecurringMeeting[] = [
  {
    id: 'rec-1',
    name: 'Comitê de Arquitetura',
    recurrence: { unit: 'meses', value: 1 },
    lastOccurrence: '2024-05-15',
    isDone: false,
  },
  {
    id: 'rec-2',
    name: 'Reunião de Sincronia Semanal',
    recurrence: { unit: 'semanas', value: 1 },
    lastOccurrence: '2024-05-27',
    isDone: false,
  },
  {
    id: 'rec-3',
    name: '1:1 com Liderança Técnica',
    recurrence: { unit: 'semanas', value: 2 },
    lastOccurrence: '2024-05-20',
    isDone: false,
  },
];

// Mock data for collaborators
export const initialCollaborators = [
  { id: 1, name: 'Patricia M. Oliveira', email: 'pmo@tedapp.com', area: 'PMO', cargo: 'Gerente de Projetos' },
  { id: 2, name: 'Leo Dirigente', email: 'lider@tedapp.com', area: 'Liderança', cargo: 'Diretor de Estratégia' },
  { id: 3, name: 'Carlos Contribuidor', email: 'colaborador@tedapp.com', area: 'Desenvolvimento', cargo: 'Desenvolvedor Sênior' },
  { id: 4, name: 'Ana Silva', email: 'ana.silva@tedapp.com', area: 'Marketing', cargo: 'Analista de Marketing' },
];

// Mock data for permissions
export const initialPermissions = initialCollaborators.reduce((acc, user) => {
  const navItemsForPermissions = NAV_ITEMS_CONFIG.filter(item => !item.isDivider);
  acc[user.id] = navItemsForPermissions.reduce((userPermissions, navItem) => {
    userPermissions[navItem.href] = true; // All enabled by default
    return userPermissions;
  }, {} as Record<string, boolean>);
  return acc;
}, {} as Record<number, Record<string, boolean>>);
