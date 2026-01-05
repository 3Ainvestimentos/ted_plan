"use client";

/**
 * ============================================
 * COMPONENTE: InitiativesDashboard
 * ============================================
 * 
 * Este componente renderiza um dashboard com métricas e resumos das Iniciativas Estratégicas.
 * 
 * ARQUITETURA MODULAR:
 * - Funções helper separadas para cada cálculo de métrica
 * - Cards reutilizáveis para exibir métricas
 * - Código bem documentado e organizado
 * - Cálculos otimizados com useMemo
 * 
 * MÉTRICAS EXIBIDAS:
 * 1. Quantidade total de iniciativas
 * 2. Percentual de iniciativas concluídas, atrasadas e em dia
 * 3. Progresso médio das iniciativas
 * 4. Quantidade de iniciativas por responsável
 * 5. Distribuição por status
 * 6. Distribuição por prioridade
 */

// ============================================
// SEÇÃO 1: IMPORTS
// ============================================

import React, { useMemo } from 'react';
import type { Initiative, InitiativeStatus, InitiativePriority } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Users,
  BarChart3,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_ICONS } from '@/lib/constants';

// ============================================
// SEÇÃO 2: INTERFACES E TIPOS
// ============================================

interface InitiativesDashboardProps {
  initiatives: Initiative[];
}

interface MetricCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

interface StatusDistribution {
  status: InitiativeStatus;
  count: number;
  percentage: number;
}

interface OwnerDistribution {
  owner: string;
  count: number;
  percentage: number;
}

interface PriorityDistribution {
  priority: InitiativePriority;
  count: number;
  percentage: number;
}

// ============================================
// SEÇÃO 3: FUNÇÕES HELPER (MODULARES)
// ============================================

/**
 * Calcula o total de iniciativas ativas (não arquivadas)
 * 
 * @param initiatives - Array de iniciativas
 * @returns Número total de iniciativas ativas
 */
function calculateTotalInitiatives(initiatives: Initiative[]): number {
  return initiatives.filter(i => !i.archived).length;
}

/**
 * Calcula percentual de iniciativas concluídas
 * 
 * @param initiatives - Array de iniciativas
 * @returns Percentual de iniciativas com status 'Concluído'
 */
function calculateCompletedPercentage(initiatives: Initiative[]): number {
  const active = initiatives.filter(i => !i.archived);
  if (active.length === 0) return 0;
  
  const completed = active.filter(i => i.status === 'Concluído').length;
  return Math.round((completed / active.length) * 100);
}

/**
 * Calcula percentual de iniciativas atrasadas
 * 
 * LÓGICA:
 * - Iniciativa está atrasada se:
 *   1. Tem deadline definido
 *   2. Deadline já passou (é anterior a hoje)
 *   3. Status não é 'Concluído'
 * 
 * @param initiatives - Array de iniciativas
 * @returns Percentual de iniciativas atrasadas
 */
function calculateOverduePercentage(initiatives: Initiative[]): number {
  const active = initiatives.filter(i => !i.archived);
  if (active.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdue = active.filter(i => {
    if (i.status === 'Concluído') return false;
    if (!i.deadline) return false;
    
    const deadline = new Date(i.deadline);
    deadline.setHours(0, 0, 0, 0);
    
    return deadline < today;
  }).length;
  
  return Math.round((overdue / active.length) * 100);
}

/**
 * Calcula percentual de iniciativas em dia
 * 
 * LÓGICA:
 * - Iniciativa está em dia se:
 *   1. Status é 'Em Dia' OU
 *   2. Tem deadline e ainda não passou OU
 *   3. Não tem deadline mas não está concluída nem atrasada
 * 
 * @param initiatives - Array de iniciativas
 * @returns Percentual de iniciativas em dia
 */
function calculateOnTimePercentage(initiatives: Initiative[]): number {
  const active = initiatives.filter(i => !i.archived);
  if (active.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const onTime = active.filter(i => {
    if (i.status === 'Concluído') return false;
    if (i.status === 'Em Dia') return true;
    
    if (i.deadline) {
      const deadline = new Date(i.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline >= today;
    }
    
    // Sem deadline, considera em dia se não está atrasada
    return true;
  }).length;
  
  return Math.round((onTime / active.length) * 100);
}

/**
 * Calcula o progresso médio de todas as iniciativas
 * 
 * @param initiatives - Array de iniciativas
 * @returns Progresso médio (0-100)
 */
function calculateAverageProgress(initiatives: Initiative[]): number {
  const active = initiatives.filter(i => !i.archived);
  if (active.length === 0) return 0;
  
  const totalProgress = active.reduce((sum, i) => sum + (i.progress || 0), 0);
  return Math.round(totalProgress / active.length);
}

/**
 * Calcula distribuição de iniciativas por status
 * 
 * @param initiatives - Array de iniciativas
 * @returns Array com contagem e percentual por status
 */
function calculateStatusDistribution(initiatives: Initiative[]): StatusDistribution[] {
  const active = initiatives.filter(i => !i.archived);
  const total = active.length;
  
  if (total === 0) return [];
  
  // Agrupa por status
  const grouped = active.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {} as Record<InitiativeStatus, number>);
  
  // Converte para array e calcula percentuais
  return Object.entries(grouped)
    .map(([status, count]) => ({
      status: status as InitiativeStatus,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count); // Ordena por quantidade (maior primeiro)
}

/**
 * Calcula distribuição de iniciativas por responsável (owner)
 * 
 * @param initiatives - Array de iniciativas
 * @returns Array com contagem e percentual por responsável
 */
function calculateOwnerDistribution(initiatives: Initiative[]): OwnerDistribution[] {
  const active = initiatives.filter(i => !i.archived);
  const total = active.length;
  
  if (total === 0) return [];
  
  // Agrupa por owner
  const grouped = active.reduce((acc, i) => {
    const owner = i.owner || 'Sem responsável';
    acc[owner] = (acc[owner] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Converte para array e calcula percentuais
  return Object.entries(grouped)
    .map(([owner, count]) => ({
      owner,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count) // Ordena por quantidade
    .slice(0, 10); // Top 10 responsáveis
}

/**
 * Calcula distribuição de iniciativas por prioridade
 * 
 * @param initiatives - Array de iniciativas
 * @returns Array com contagem e percentual por prioridade
 */
function calculatePriorityDistribution(initiatives: Initiative[]): PriorityDistribution[] {
  const active = initiatives.filter(i => !i.archived);
  const total = active.length;
  
  if (total === 0) return [];
  
  // Agrupa por prioridade
  const grouped = active.reduce((acc, i) => {
    acc[i.priority] = (acc[i.priority] || 0) + 1;
    return acc;
  }, {} as Record<InitiativePriority, number>);
  
  // Converte para array e calcula percentuais
  // Ordem: Alta, Média, Baixa
  const priorityOrder: InitiativePriority[] = ['Alta', 'Média', 'Baixa'];
  return priorityOrder
    .filter(priority => grouped[priority])
    .map(priority => ({
      priority,
      count: grouped[priority],
      percentage: Math.round((grouped[priority] / total) * 100)
    }));
}


// ============================================
// SEÇÃO 4: COMPONENTE PRINCIPAL
// ============================================

export function InitiativesDashboard({ initiatives }: InitiativesDashboardProps) {
  
  /**
   * useMemo - Otimiza cálculos pesados
   * 
   * Todas as métricas são calculadas apenas quando 'initiatives' muda
   * Isso evita recálculos desnecessários em cada render
   */
  const metrics = useMemo(() => {
    const total = calculateTotalInitiatives(initiatives);
    const completed = calculateCompletedPercentage(initiatives);
    const overdue = calculateOverduePercentage(initiatives);
    const onTime = calculateOnTimePercentage(initiatives);
    const avgProgress = calculateAverageProgress(initiatives);
    const statusDist = calculateStatusDistribution(initiatives);
    const ownerDist = calculateOwnerDistribution(initiatives);
    const priorityDist = calculatePriorityDistribution(initiatives);
    
    return {
      total,
      completed,
      overdue,
      onTime,
      avgProgress,
      statusDist,
      ownerDist,
      priorityDist
    };
  }, [initiatives]);

  // ============================================
  // RENDERIZAÇÃO: Cards de Métricas Principais
  // ============================================
  
  return (
    <div className="space-y-6">
      {/* ========== CARDS DE MÉTRICAS PRINCIPAIS ========== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card: Total de Iniciativas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Iniciativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Iniciativas ativas
            </p>
          </CardContent>
        </Card>

        {/* Card: Concluídas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.completed}%</div>
            <Progress value={metrics.completed} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.statusDist.find(s => s.status === 'Concluído')?.count || 0} iniciativas
            </p>
          </CardContent>
        </Card>

        {/* Card: Atrasadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.overdue}%</div>
            <Progress value={metrics.overdue} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        {/* Card: Em Dia */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Dia</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.onTime}%</div>
            <Progress value={metrics.onTime} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              No prazo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========== CARDS DE MÉTRICAS SECUNDÁRIAS ========== */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card: Progresso Médio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgProgress}%</div>
            <Progress value={metrics.avgProgress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Média geral de todas as iniciativas
            </p>
          </CardContent>
        </Card>

        {/* Card: Total de Responsáveis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responsáveis</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ownerDist.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pessoas envolvidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========== DISTRIBUIÇÕES DETALHADAS ========== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card: Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.statusDist.length > 0 ? (
                metrics.statusDist.map((item) => {
                  const StatusIcon = STATUS_ICONS[item.status];
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {StatusIcon && <StatusIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className="font-medium">{item.status}</span>
                        </div>
                        <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-1.5" />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma iniciativa encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card: Distribuição por Prioridade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Distribuição por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.priorityDist.length > 0 ? (
                metrics.priorityDist.map((item) => {
                  const priorityColors = {
                    'Alta': 'bg-red-500',
                    'Média': 'bg-yellow-500',
                    'Baixa': 'bg-blue-500'
                  };
                  
                  return (
                    <div key={item.priority} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", priorityColors[item.priority])} />
                          <span className="font-medium">{item.priority}</span>
                        </div>
                        <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-1.5" />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma iniciativa encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card: Top Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Iniciativas por Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.ownerDist.length > 0 ? (
                metrics.ownerDist.slice(0, 5).map((item) => (
                  <div key={item.owner} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{item.owner}</span>
                      <span className="text-muted-foreground ml-2">{item.count} ({item.percentage}%)</span>
                    </div>
                    <Progress value={item.percentage} className="h-1.5" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma iniciativa encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

