---
name: Implementar Página Agenda da Semana Vigente
overview: Criar uma nova página "Agenda" na sidebar que exibe itens e sub-itens não concluídos com prazo de vencimento menor que 7 dias, com filtros por projeto, responsável, prioridade e status, seguindo o design da foto anexada.
todos:
  - id: agenda-1
    content: "Criar helpers em agenda-helpers.ts: getWeekItems, calculateDaysRemaining, formatDaysRemaining, getHierarchyPath"
    status: completed
  - id: agenda-2
    content: Criar componente agenda-area-filter.tsx com lógica de área (Head não vê, PMO/Admin veem e podem selecionar)
    status: completed
    dependencies:
      - agenda-1
  - id: agenda-3
    content: Criar componente agenda-filters.tsx com filtros de projeto, responsável, prioridade e status (aplicados após filtro de área)
    status: completed
    dependencies:
      - agenda-1
      - agenda-2
  - id: agenda-4
    content: "Criar componente agenda-table.tsx com colunas: hierarquia, responsável, prioridade, status (editável), prazo, dias restantes, risco"
    status: completed
    dependencies:
      - agenda-1
  - id: agenda-5
    content: Criar página principal agenda/page.tsx integrando filtro de área, filtros secundários e tabela, com lógica de área por userType
    status: completed
    dependencies:
      - agenda-2
      - agenda-3
      - agenda-4
  - id: agenda-6
    content: Adicionar item Agenda na sidebar (constants.ts) e configurar permissões (permissions-config.ts)
    status: completed
    dependencies:
      - agenda-5
  - id: agenda-7
    content: Implementar handlers de atualização de status de itens e subitens na página
    status: completed
    dependencies:
      - agenda-5
---

# Implementar

Página Agenda da Semana Vigente

## Contexto

A funcionalidade "Agenda" será uma nova página na sidebar que exibe itens e sub-itens de iniciativas estratégicas que:

- Não estão concluídos
- Têm prazo de vencimento menor que 7 dias (semana vigente)
- Podem ser filtrados por projeto, responsável, prioridade e status

## Arquitetura

A implementação será modular e organizada em:

1. **Página principal**: `src/app/(app)/agenda/page.tsx`
2. **Componente de tabela**: `src/components/agenda/agenda-table.tsx`
3. **Componente de filtros**: `src/components/agenda/agenda-filters.tsx`
4. **Helpers específicos**: `src/lib/agenda-helpers.ts`
5. **Atualização da sidebar**: `src/lib/constants.ts`

## Estrutura de Dados

### Interface para Item da Agenda

```typescript
interface AgendaItem {
  id: string;
  type: 'item' | 'subitem';
  initiativeId: string;
  initiativeTitle: string;
  itemId?: string; // Apenas para subitens
  itemTitle?: string; // Apenas para subitens
  title: string; // Título do item ou subitem
  responsible: string;
  priority: InitiativePriority;
  status: InitiativeStatus;
  deadline: string; // ISO date string 'YYYY-MM-DD'
  daysRemaining: number; // Dias até o prazo (negativo se atrasado)
  isOverdue: boolean;
  risk?: string; // Campo de risco (opcional, pode ser "-" se não aplicável)
}
```

## Implementação Detalhada

### Fase 1: Helpers e Utilitários

**Arquivo**: `src/lib/agenda-helpers.ts`

1. **Função `getWeekItems`**:

- Recebe array de `Initiative`
- Filtra itens e subitens não concluídos
- Verifica se deadline está dentro de 7 dias
- Retorna array de `AgendaItem`

2. **Função `calculateDaysRemaining`**:

- Calcula dias restantes até o deadline
- Retorna número negativo se atrasado
- Retorna 0 se é hoje

3. **Função `formatDaysRemaining`**:

- Formata a exibição de dias restantes
- "X dias atrasado" se negativo
- "Hoje" se 0
- "X dias" se positivo

4. **Função `getHierarchyPath`**:

- Retorna string hierárquica: "Projeto / Item / Subitem"
- Para itens: "Projeto / Item"
- Para subitens: "Projeto / Item / Subitem"

### Fase 2: Componente de Filtro de Área

**Arquivo**: `src/components/agenda/agenda-area-filter.tsx`

1. **Regras de visualização**:

- **Head**: Não vê filtro de área, apenas visualiza iniciativas da própria área automaticamente
- **PMO e Admin**: Veem filtro de área superior para selecionar qual área querem visualizar

2. **Funcionalidades**:

- Dropdown com todas as áreas de negócio (apenas para PMO e Admin)
- Integração com URL params (`?area=areaId`)
- Usa helpers `getDefaultAreaId` e `getEffectiveAreaId` (reutilizar da página strategic-initiatives)

3. **UI**:

- Select component no topo da página
- Estilo consistente com outras páginas
- Posicionado antes dos outros filtros

### Fase 3: Componente de Filtros

**Arquivo**: `src/components/agenda/agenda-filters.tsx`

1. **Filtros disponíveis**:

- Projeto (dropdown com iniciativas da área selecionada)
- Responsável (dropdown com todos os responsáveis únicos da área selecionada)
- Prioridade (dropdown: Todas, Baixa, Média, Alta)
- Status (dropdown: Todos, Pendente, Em execução, Concluído, Suspenso, etc.)

2. **Estado dos filtros**:

- `projectFilter`: string | 'all'
- `responsibleFilter`: string | 'all'
- `priorityFilter`: InitiativePriority | 'all'
- `statusFilter`: InitiativeStatus | 'all'

3. **UI**:

- 4 Select components em linha horizontal
- Estilo consistente com a foto (bordas cinzas, chevron)
- Filtros são aplicados APÓS o filtro de área

### Fase 4: Componente de Tabela

**Arquivo**: `src/components/agenda/agenda-table.tsx`

1. **Colunas da tabela**:

- **Projeto / Item / Subitem**: Hierarquia completa
- **Responsável**: Nome do responsável
- **Prioridade**: Badge colorido (Alta=vermelho, Média=amarelo, Baixa=azul)
- **Status**: Select editável (dropdown com status disponíveis)
- **Prazo**: Data formatada (DD/MM/YYYY)
- **Dias Restantes**: Texto formatado com ícone de alerta se atrasado
- **Risco**: Campo de risco (por enquanto "-", pode ser expandido no futuro)

2. **Funcionalidades**:

- Edição de status via Select
- Atualização via contexto de iniciativas
- Indicador visual de atraso (texto vermelho + ícone)

3. **Ordenação**:

- Por padrão, ordenar por dias restantes (mais urgentes primeiro)
- Atrasados aparecem primeiro

### Fase 5: Página Principal

**Arquivo**: `src/app/(app)/agenda/page.tsx`

1. **Estrutura**:

- Header com título "Agenda" e subtítulo
- **Filtro de área** (apenas para PMO e Admin, no topo)
- Seção de filtros (projeto, responsável, prioridade, status)
- Seção "Agenda da Semana Vigente" com contador
- Tabela de atividades

2. **Lógica de área**:

- **Head**: 
  - Não exibe filtro de área
  - Usa `getDefaultAreaId` para obter área padrão (própria área)
  - Filtra iniciativas automaticamente pela área do usuário

- **PMO e Admin**:
  - Exibe filtro de área no topo
  - Usa `getEffectiveAreaId` para determinar área efetiva (selecionada ou padrão)
  - Filtra iniciativas pela área selecionada
  - Atualiza URL com `?area=areaId` quando área é alterada

3. **Lógica de filtros**:

- Buscar iniciativas do contexto
- **Aplicar filtro de área primeiro** (baseado em userType e área efetiva)
- Aplicar filtro de semana vigente (7 dias) nos itens/subitens
- Aplicar filtros selecionados (projeto, responsável, prioridade, status)
- Exibir contador de atividades encontradas
- Renderizar tabela

4. **Permissões**:

- Seguir mesmo padrão de outras páginas
- Usar `hasPermission` do contexto de auth
- Adicionar permissão 'agenda' em `permissions-config.ts`

### Fase 6: Atualização da Sidebar

**Arquivo**: `src/lib/constants.ts`

1. **Adicionar item na sidebar**:

- Título: "Agenda"
- Href: "/agenda"
- Ícone: `Calendar` ou `CalendarDays` do lucide-react
- Posição: Após "Iniciativas Estratégicas" ou antes de "Agenda de Reuniões"

2. **Adicionar permissão**:

- Adicionar em `PAGE_PERMISSIONS_MAP`
- Adicionar em `PERMISSIONABLE_PAGES`
- Configurar permissões padrão em `permissions-config.ts`

### Fase 7: Integração com Contexto

**Arquivo**: `src/contexts/initiatives-context.tsx`

1. **Verificar se já existe função de atualização**:

- `updateItem` - para atualizar status de item
- `updateSubItem` - para atualizar status de subitem
- Se não existir, criar

2. **Handlers na página**:

- `handleItemStatusChange`: Atualiza status de item
- `handleSubItemStatusChange`: Atualiza status de subitem

## Validações e Regras de Negócio

1. **Filtro de área**:

- **Head**: Sempre filtra pela própria área (`userArea`), não exibe filtro
- **PMO e Admin**: Podem selecionar área via filtro, padrão segue mesma lógica de strategic-initiatives
- Filtro de área é aplicado ANTES dos outros filtros

2. **Filtro de semana vigente**:

- Deadline deve estar entre hoje e 7 dias no futuro
- Inclui itens atrasados (deadline no passado)
- Exclui itens concluídos
- Aplicado apenas em itens/subitens da área selecionada

3. **Cálculo de dias restantes**:

- Se deadline < hoje: negativo (dias atrasado)
- Se deadline = hoje: 0 (hoje)
- Se deadline > hoje: positivo (dias restantes)

4. **Status editável**:

- Seguir regras de `getAvailableStatuses` do `initiatives-helpers.ts`
- Se atrasado, apenas "Atrasado" ou "Concluído"

5. **Filtros secundários**:

- Projeto: Lista apenas iniciativas da área selecionada
- Responsável: Lista apenas responsáveis de itens/subitens da área selecionada
- Prioridade e Status: Aplicados normalmente após filtro de área

## Testes Sugeridos

1. **Teste de filtro de semana**:

- Item com deadline em 5 dias deve aparecer
- Item com deadline em 10 dias não deve aparecer
- Item concluído não deve aparecer

2. **Teste de filtro de área**:

- Head deve ver apenas iniciativas da própria área (sem filtro visível)
- PMO/Admin devem ver filtro de área e poder selecionar diferentes áreas
- Mudança de área deve atualizar URL e refiltrar dados

3. **Teste de filtros secundários**:

- Filtrar por projeto específico (apenas projetos da área selecionada)
- Filtrar por responsável (apenas responsáveis da área selecionada)
- Filtrar por prioridade
- Filtrar por status

4. **Teste de atualização**:

- Alterar status de item
- Alterar status de subitem
- Verificar se atualização persiste

5. **Teste de exibição**:

- Verificar hierarquia correta
- Verificar formatação de datas
- Verificar cálculo de dias restantes

## Arquivos a Criar/Modificar

### Novos Arquivos:

1. `src/app/(app)/agenda/page.tsx` - Página principal
2. `src/components/agenda/agenda-table.tsx` - Componente de tabela
3. `src/components/agenda/agenda-filters.tsx` - Componente de filtros (projeto, responsável, prioridade, status)
4. `src/components/agenda/agenda-area-filter.tsx` - Componente de filtro de área (apenas PMO/Admin)
5. `src/lib/agenda-helpers.ts` - Helpers específicos

### Arquivos a Modificar:

1. `src/lib/constants.ts` - Adicionar item na sidebar
2. `src/lib/permissions-config.ts` - Adicionar permissão para agenda
3. `src/contexts/auth-context.tsx` - Verificar se precisa atualizar lógica de permissões

## Notas de Design

1. **Consistência visual**:

- Seguir padrão de outras páginas
- Usar componentes do shadcn/ui
- Manter tamanho de fonte `text-xs` conforme padrão global

2. **Responsividade**:

- Filtros em linha em desktop
- Filtros empilhados em mobile
- Tabela com scroll horizontal se necessário

3. **Performance**:

- Usar `useMemo` para cálculos pesados
- Filtrar dados apenas uma vez
- Evitar re-renders desnecessários

## Próximos Passos (Futuro)

1. Campo "Risco" pode ser expandido para cálculo automático
2. Notificações para itens próximos do prazo