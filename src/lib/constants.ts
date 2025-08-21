
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


export const MOCK_INITIATIVES: Initiative[] = [];

export const MOCK_RECURRING_MEETINGS: RecurringMeeting[] = [];

// Mock data for collaborators
export const initialCollaborators: { id: number; name: string; email: string; area: string; cargo: string; }[] = [
    { id: 1, name: 'Alice W.', email: 'alice@example.com', area: 'Marketing', cargo: 'Gerente de Marketing' },
    { id: 2, name: 'Bob T.', email: 'bob@example.com', area: 'Financeiro', cargo: 'Analista Financeiro' },
    { id: 3, name: 'Charlie B.', email: 'charlie@example.com', area: 'Operações', cargo: 'Coordenador de Operações' },
    { id: 4, name: 'David C.', email: 'david@example.com', area: 'Vendas', cargo: 'Executivo de Contas' },
    { id: 5, name: 'Anne K.', email: 'anne@example.com', area: 'RH', cargo: 'Analista de RH' },
    { id: 6, name: 'Fred L.', email: 'fred@example.com', area: 'Tecnologia', cargo: 'Desenvolvedor' },
];

export const MOCK_OWNERS = initialCollaborators.map(c => c.name);


// Mock data for permissions
export const initialPermissions = initialCollaborators.reduce((acc, user) => {
  const navItemsForPermissions = NAV_ITEMS_CONFIG.filter(item => !item.isDivider);
  acc[user.id] = navItemsForPermissions.reduce((userPermissions, navItem) => {
    userPermissions[navItem.href] = true; // All enabled by default
    return userPermissions;
  }, {} as Record<string, boolean>);
  return acc;
}, {} as Record<number, Record<string, boolean>>);
