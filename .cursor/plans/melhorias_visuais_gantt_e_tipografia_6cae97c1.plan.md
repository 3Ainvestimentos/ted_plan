---
name: Melhorias visuais Gantt e tipografia
overview: "Implementar melhorias visuais no Gantt/Tabela: barras sem borda arredondada, tons de verde por hierarquia, cores de status na barra de progresso, redução de fonte para text-xs, remoção de linhas de dias (manter finais de semana), e afinar linha do dia atual."
todos:
  - id: gantt-1
    content: "Fase 1: Remover bordas arredondadas e implementar tons de verde por hierarquia nas barras do Gantt"
    status: completed
  - id: gantt-2
    content: "Fase 2: Implementar cores de status na barra de progresso"
    status: completed
  - id: gantt-3
    content: "Fase 3: Remover linhas de marcação dos dias, manter apenas finais de semana"
    status: completed
  - id: gantt-4
    content: "Fase 4: Afinar linha vermelha do dia atual"
    status: completed
  - id: gantt-5
    content: "Fase 5: Reduzir e padronizar fonte geral da aplicação para text-xs"
    status: completed
---

# Melhorias Visuais no Gantt e Tipografia

## Objetivo

Aplicar melhorias visuais na visualização Gantt/Tabela e padronizar tipografia da aplicação conforme especificações.

## Arquivos Principais Afetados

- [src/components/initiatives/table-gantt-view.tsx](src/components/initiatives/table-gantt-view.tsx) - Componente principal do Gantt/Tabela
- [src/app/(app)/layout.tsx](src/app/\\(app)/layout.tsx) - Layout principal (tipografia global)
- [src/app/globals.css](src/app/globals.css) - Estilos globais (se existir)

## Alterações Detalhadas

### 1. Barras do Gantt sem borda arredondada

**Arquivo:** `src/components/initiatives/table-gantt-view.tsx`**Localizações:**

- Linha ~945: Barra de iniciativa (`rounded-md` → remover)
- Linha ~1206: Barra de fase (`rounded-md` → remover)
- Linha ~1432: Barra de subitem (`rounded-md` → remover)

**Ação:** Remover a classe `rounded-md` de todas as barras do Gantt, mantendo apenas `h-6`, `h-5`, `h-4` respectivamente.

### 2. Tons de verde por hierarquia (independente do status)

**Arquivo:** `src/components/initiatives/table-gantt-view.tsx`**Nova constante a criar:**

```typescript
const HIERARCHY_COLORS = {
  initiative: 'bg-green-700',      // Verde escuro
  phase: 'bg-green-500',           // Verde médio
  subitem: 'bg-green-300'          // Verde claro
};
```

**Alterações:**

- Linha ~904-906: Substituir lógica de `barColor` para iniciativas
- Remover: `ganttTask.isOverdue ? 'bg-red-500' : STATUS_COLORS[ganttTask.status]`
- Adicionar: `HIERARCHY_COLORS.initiative`
- Linha ~1169-1171: Substituir lógica de `barColor` para fases
- Remover: `phaseGanttTask.isOverdue ? 'bg-red-500' : STATUS_COLORS[phaseGanttTask.status]`
- Adicionar: `HIERARCHY_COLORS.phase`
- Linha ~1390-1392: Substituir lógica de `barColor` para subitens
- Remover: `subItemGanttTask.isOverdue ? 'bg-red-500' : STATUS_COLORS[subItemGanttTask.status]`
- Adicionar: `HIERARCHY_COLORS.subitem`

**Nota:** O campo `type` já existe em `GanttTask` (linha ~89), usar para identificar hierarquia.

### 3. Cores de status na barra de progresso

**Arquivo:** `src/components/initiatives/table-gantt-view.tsx`**Nova constante:**

```typescript
const PROGRESS_COLORS: Record<InitiativeStatus, string> = {
  'Concluído': 'bg-green-500',
  'Em execução': 'bg-blue-500',
  'Pendente': 'bg-yellow-500',
  'Suspenso': 'bg-gray-400',
  'A Fazer': 'bg-slate-400',
  'Em Dia': 'bg-emerald-500',
  'Em Risco': 'bg-orange-500',
  'Atrasado': 'bg-red-500',
};
```

**Alterações:**

- Linha ~857: Componente `Progress` da iniciativa
- Adicionar prop `className` com cor baseada em `initiative.status`
- Usar: `className={cn("h-2 w-12", PROGRESS_COLORS[initiative.status])}`
- Linha ~1115: Componente `Progress` da fase
- Adicionar cor baseada em `phase.status`
- Linha ~1270: Componente `Progress` do subitem
- Adicionar cor baseada em `subItem.status`

**Nota:** O componente `Progress` do shadcn/ui aceita className para customizar a cor da barra interna.

### 4. Reduzir fonte geral da aplicação

**Arquivo:** `src/app/(app)/layout.tsx` ou `src/app/globals.css`**Ação:**

- Verificar se existe `globals.css` ou configuração de fonte no layout
- Adicionar classe `text-xs` ao elemento raiz ou aplicar via CSS global
- Verificar tamanhos de fonte em componentes principais e ajustar para `text-xs` quando maior

**Componentes a verificar:**

- Tabelas, cards, inputs, botões, badges
- Manter `text-xs` como padrão (já usado na sidebar)

### 5. Remover linhas de marcação dos dias (manter apenas finais de semana)

**Arquivo:** `src/components/initiatives/table-gantt-view.tsx`**Alterações:**

- Linha ~920: Remover `border-r border-border/50` das células do Gantt de iniciativas
- Manter apenas quando `isWeekend` (linha ~921)
- Linha ~1129: Remover `border-r border-border/50` das células do Gantt de fases
- Linha ~1183: Remover `border-r border-border/50` das células do Gantt de fases (com barra)
- Linha ~1355: Remover `border-r border-border/50` das células do Gantt de subitens
- Linha ~1409: Remover `border-r border-border/50` das células do Gantt de subitens (com barra)

**Lógica:**

- Aplicar `border-r` apenas quando `isWeekend === true`
- Usar: `className={cn(..., isWeekend && "border-r border-border/50", ...)}`

### 6. Afinar linha vermelha do dia atual

**Arquivo:** `src/components/initiatives/table-gantt-view.tsx`**Alterações:**

- Linha ~934: Mudar `w-0.5` para `w-px` (1px) no marcador de hoje das iniciativas
- Linha ~1196: Mudar `w-0.5` para `w-px` no marcador de hoje das fases
- Linha ~1423: Mudar `w-0.5` para `w-px` no marcador de hoje dos subitens

**Nota:** `w-px` = 1px, `w-0.5` = 2px no Tailwind.

## Cronograma de Implementação

### Fase 1: Alterações nas Barras do Gantt (1-2 horas)

- [ ] Remover `rounded-md` de todas as barras
- [ ] Criar constante `HIERARCHY_COLORS`
- [ ] Substituir lógica de cores por hierarquia (3 locais)
- [ ] Testar visualização das barras

### Fase 2: Cores na Barra de Progresso (1 hora)

- [ ] Criar constante `PROGRESS_COLORS`
- [ ] Aplicar cores nos componentes `Progress` (3 locais)
- [ ] Testar cores por status

### Fase 3: Remover Linhas de Dias (30 minutos)

- [ ] Remover `border-r` das células do Gantt (5 locais)
- [ ] Aplicar `border-r` apenas em finais de semana
- [ ] Testar visualização

### Fase 4: Afinar Linha do Dia Atual (15 minutos)

- [ ] Alterar `w-0.5` para `w-px` (3 locais)
- [ ] Testar visualização

### Fase 5: Redução de Fonte Global (1-2 horas)

- [ ] Identificar arquivo de configuração global
- [ ] Aplicar `text-xs` como padrão
- [ ] Verificar e ajustar componentes que usam fontes maiores
- [ ] Testar legibilidade

## Testes Necessários

- [ ] Barras do Gantt sem borda arredondada
- [ ] Barras com tons de verde corretos por hierarquia
- [ ] Barras de progresso com cores corretas por status
- [ ] Linhas verticais apenas em finais de semana
- [ ] Linha vermelha do dia atual mais fina
- [ ] Fonte reduzida e padronizada em toda aplicação
- [ ] Responsividade mantida
- [ ] Dark mode funcionando corretamente

## Observações

- Manter compatibilidade com dark mode
- Verificar se há outros componentes usando `STATUS_COLORS` que não devem ser alterados