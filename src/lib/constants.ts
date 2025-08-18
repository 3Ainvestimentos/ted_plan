
import type { NavItem, UserRole, Initiative, InitiativeStatus, InitiativePriority } from '@/types';
import { LayoutDashboard, ScrollText, ClipboardList, Target, TrendingUp, TrendingDown, Minus, CircleCheck, AlertTriangle, Clock, CheckCircle, ListTodo, User, CalendarDays, FileText, Lightbulb, Bug, Settings, LogOut } from 'lucide-react';

export const NAV_ITEMS_CONFIG: NavItem[] = [
  { title: 'Iniciativas Estratégicas', href: '/initiatives', icon: Target },
  { title: 'Quadro de Projetos', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Sumários Executivos', href: '/executive-summaries', icon: ScrollText },
  { title: 'Automação de Reuniões', href: '/meeting-automation', icon: ClipboardList },
  { title: 'Configurações', href: '/settings', icon: Settings },
];

export const NAV_ITEMS_FOOTER: NavItem[] = [
    { title: 'Sair', href: '/login', icon: LogOut },
]

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

export const KANBAN_COLUMN_NAMES: Record<InitiativeStatus, string> = {
  'A Fazer': 'START NEXT',
  'Em Dia': 'IN PROGRESS',
  'Em Risco': 'IN PROGRESS', // Will be visually distinct in card
  'Atrasado': 'IN PROGRESS', // Will be visually distinct in card
  'Concluído': 'DONE'
};

export const KANBAN_COLUMN_DISPLAY_ORDER: InitiativeStatus[] = ['A Fazer', 'Em Dia', 'Concluído'];
// Note: 'Em Risco' and 'Atrasado' items will appear in 'IN PROGRESS' (Em Dia) column,
// but their cards will be styled differently. This defines the primary columns shown.

export const STATUS_TO_COLUMN_MAP: Record<InitiativeStatus, InitiativeStatus> = {
    'A Fazer': 'A Fazer',
    'Em Dia': 'Em Dia',
    'Em Risco': 'Em Dia', // Em Risco items go to 'Em Dia' column visually
    'Atrasado': 'Em Dia', // Atrasado items go to 'Em Dia' column visually
    'Concluído': 'Concluído',
};
