
import type { NavItem, UserRole, Initiative, InitiativeStatus, InitiativePriority, RecurringMeeting, Collaborator } from '@/types';
import { LayoutDashboard, Target, CalendarClock, Settings, Shield, User, BarChart3, ListTodo, CircleCheck, AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown, Minus, Lightbulb, FileText, Bug, PlayCircle, PauseCircle, CheckSquare, StickyNote, ClipboardList, Users } from 'lucide-react';

export const NAV_ITEMS_CONFIG: NavItem[] = [
  { title: 'Painel Estratégico', href: '/', icon: LayoutDashboard },
  { title: 'Iniciativas Estratégicas', href: '/strategic-initiatives', icon: Target },
  { title: 'Agenda de Reuniões', href: '/meeting-agenda', icon: CalendarClock },
  { title: 'Tarefas', href: '/tasks', icon: ClipboardList },
  { title: 'Anotações', href: '/notes', icon: StickyNote },
];

// Mapeamento de páginas para chaves de permissão
export const PAGE_PERMISSIONS_MAP: Record<string, string> = {
  'Iniciativas Estratégicas': 'strategic-initiatives',
  'Agenda de Reuniões': 'meeting-agenda',
  'Tarefas': 'tasks',
  'Anotações': 'notes',
};

// Páginas que requerem permissão (excluindo Painel Estratégico que é apenas para Administradores)
export const PERMISSIONABLE_PAGES = [
  { title: 'Iniciativas Estratégicas', key: 'strategic-initiatives' },
  { title: 'Agenda de Reuniões', key: 'meeting-agenda' },
  { title: 'Tarefas', key: 'tasks' },
  { title: 'Anotações', key: 'notes' },
];

export const USER_ROLES: UserRole[] = ['PMO', 'gestor'];

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
export const MOCK_COLLABORATORS: Collaborator[] = [
    {
        id: 'mock-matheus-uid',
        name: 'Matheus',
        email: 'matheus@3ainvestimentos.com.br',
        userType: 'admin',
        remunerationHistory: [
            { date: '2023-01-01', value: 5000 },
            { date: '2024-01-01', value: 6000 },
        ],
        positionHistory: [
            { date: '2023-01-01', position: 'Analista' },
            { date: '2024-01-01', position: 'Analista Sênior' },
        ]
    },
    {
        id: 'mock-thiago-uid',
        name: 'Thiago',
        email: 'thiago@3ainvestimentos.com.br',
        userType: 'admin',
        remunerationHistory: [
            { date: '2023-05-01', value: 4500 },
            { date: '2024-03-01', value: 5500 },
        ],
        positionHistory: [
            { date: '2023-05-01', position: 'Estagiário' },
            { date: '2024-03-01', position: 'Analista' },
        ]
    }
];

export const MOCK_OWNERS = ["Alice W.", "Bob T.", "Charlie B.", "David C.", "Anne K.", "Fred L."];
