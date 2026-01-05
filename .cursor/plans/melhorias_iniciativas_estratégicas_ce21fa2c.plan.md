---
name: Melhorias Iniciativas Estratégicas
overview: "Implementar melhorias na gestão de Iniciativas Estratégicas: diferenciação de visualização por função, campos obrigatórios, Gantt multi-camadas, Kanban hierárquico, regras de conclusão automática e melhorias de UX."
todos:
  - id: required-fields
    content: Tornar campos obrigatórios (responsável, status, prazo) em todas as camadas (Iniciativa, Fase, Subitem) com validação Zod
    status: completed
  - id: default-area-filter
    content: "Implementar lógica de área padrão: Head usa userArea, PMO usa área 'Estratégia e IA' quando não há filtro selecionado"
    status: completed
  - id: view-mode-restrictions
    content: "Restringir visualizações: Head sem filtro usa sua própria área como default e pode ver visualização completa. Head com filtro de sua área pode ver todas as visualizações. Head com filtro de área alheia apenas Dashboard. PMO pode ver todas as visualizações sempre."
    status: completed
    dependencies:
      - default-area-filter
  - id: remove-checklist-card
    content: Remover card 'Com Checklist' do dashboard de iniciativas
    status: pending
  - id: add-priority-visualization
    content: Adicionar coluna de prioridade na visualização Tabela/Gantt e garantir visibilidade no Kanban
    status: pending
  - id: overdue-cards
    content: Implementar detecção de atraso e mudança de cor para vermelho claro nos cards quando deadline passou
    status: pending
  - id: limited-status-selector
    content: Limitar seletor de status para apenas Atrasado/Concluído quando item está em atraso
    status: pending
    dependencies:
      - overdue-cards
  - id: auto-completion-rules
    content: "Implementar regras de conclusão automática: fase conclui quando todos subitens concluídos, iniciativa conclui quando todas fases concluídas"
    status: pending
    dependencies:
      - required-fields
  - id: deadline-edit-permission
    content: "Restringir edição de prazo: Head não pode alterar deadline, apenas PMO pode"
    status: pending
  - id: gantt-multi-layer
    content: "Implementar Gantt multi-camadas: exibir Iniciativas, Fases e Subitens como linhas expandíveis com barras no timeline"
    status: pending
    dependencies:
      - required-fields
  - id: hierarchical-kanban
    content: "Implementar Kanban hierárquico de 3 níveis: Iniciativas → Fases → Subitens com navegação por breadcrumb"
    status: pending
    dependencies:
      - required-fields
---

# Plano de Melhorias - Iniciativas Estratégicas

## Objetivo

Implementar melhorias na gestão de Iniciativas Estratégicas com foco em diferenciação de permissões, visualizações hierárquicas, validações e regras de negócio.

## Arquivos Principais Afetados

### Contextos e Lógica de Negócio

- `src/contexts/initiatives-context.tsx` - Adicionar lógica de conclusão automática e validações
- `src/lib/permissions-config.ts` - Atualizar regras de visualização e edição
- `src/contexts/auth-context.tsx` - Verificar se precisa ajustar área padrão do PMO

### Componentes de Visualização

- `src/app/(app)/strategic-initiatives/page.tsx` - Lógica de filtro padrão e controle de visualizações
- `src/components/initiatives/initiatives-dashboard.tsx` - Remover card "Com Checklist"
- `src/components/initiatives/table-gantt-view.tsx` - Exibir todas as camadas (Iniciativa, Fase, Subitem)
- `src/components/initiatives/initiatives-kanban.tsx` - Implementar Kanban hierárquico (3 níveis)
- `src/components/initiatives/kanban-card.tsx` - Adicionar prioridade e lógica de atraso
- `src/components/initiatives/kanban-column.tsx` - Suporte a múltiplos níveis

### Formulários e Validações

- `src/components/initiatives/initiative-form.tsx` - Tornar campos obrigatórios e adicionar validações
- `src/components/initiatives/edit-initiative-modal.tsx` - Aplicar restrições de edição por função

### Tipos

- `src/types/index.ts` - Verificar se tipos estão completos

## Implementação Detalhada

### 1. Diferenciação de Visualização por Função

**Arquivo:** `src/app/(app)/strategic-initiatives/page.tsx`**Regras de Visualização:**

- **Heads**: 
- Se não há filtro aplicado: usa sua própria área como default e pode ver visualização completa (Dashboard, Tabela/Gantt, Kanban)
- Se há filtro de sua própria área: pode ver visualização completa (Dashboard, Tabela/Gantt, Kanban)
- Se há filtro de outra área: apenas Dashboard (limitado)
- **PMO**: Pode ver todas as visualizações sempre
- Sem filtro: usa área "Estratégia e IA" como default
- Com filtro: exibe visualização completa da área selecionada

**Lógica de área padrão quando não há filtro:**

- Head: Usa `userArea` (área do usuário) como default - visualização completa (é sua própria área)
- PMO: Usa área "Estratégia e IA" como default (buscar por nome ou ID fixo) - todas as visualizações

**Mudanças:**

- Adicionar função `getDefaultAreaId(userType, userArea, businessAreas): string | null` com docstring completa
- Adicionar função `getEffectiveAreaId(selectedAreaId, userType, userArea, businessAreas): string | null` com docstring completa
- Adicionar função `canViewMode(userType, userArea, effectiveAreaId, viewMode): boolean` com docstring completa
- Head pode ver todas as visualizações se `effectiveAreaId === userArea`
- Head limitado ao Dashboard se `effectiveAreaId !== userArea`
- PMO sempre pode ver todas as visualizações
- Aplicar filtro automático quando não há `selectedAreaId` na URL
- Desabilitar botões de visualização para Heads quando `effectiveAreaId !== userArea`

### 2. Campos Obrigatórios em Todas as Camadas

**Arquivo:** `src/components/initiatives/initiative-form.tsx`**Campos obrigatórios:**

- **Iniciativa**: responsável (campo `owner`), status, prazo (deadline), prioridade
- Nota: O campo `owner` existe mas é opcional atualmente. Tornar obrigatório no schema Zod
- **Fase (Item)**: responsável, status, prazo, prioridade
- Nota: Já é obrigatório se não tem subitens. Tornar sempre obrigatório
- **Subitem**: responsável, status, prazo, prioridade
- Nota: Já é obrigatório. Verificar se prazo também precisa ser obrigatório

**Mudanças:**

- Atualizar schemas Zod para tornar campos obrigatórios
- Adicionar validação visual nos formulários
- Garantir que campos não podem ser vazios ao salvar

### 3. Gantt Multi-Camadas

**Arquivo:** `src/components/initiatives/table-gantt-view.tsx`**Funcionalidade:**

- Exibir Iniciativas como linhas principais
- Permitir expandir para ver Fases (Itens)
- Permitir expandir Fases para ver Subitens
- Cada camada deve ter: Responsável, Status, Prazo
- Barras do Gantt para cada camada baseadas em startDate/deadline

**Mudanças:**

- Adicionar estados de expansão para fases e subitens
- Criar funções helper para transformar fases e subitens em GanttTasks
- Renderizar linhas hierárquicas na tabela
- Calcular barras do Gantt para cada nível

### 4. Cards em Atraso

**Arquivos:**

- `src/components/initiatives/kanban-card.tsx`
- `src/components/initiatives/table-gantt-view.tsx`

**Funcionalidade:**

- Detectar atraso comparando deadline com data atual (definida pelo PMO)
- Se atrasado: card muda para cor vermelha clara (`bg-red-50` ou similar)
- Aplicar em Iniciativas, Fases e Subitens

**Mudanças:**

- Adicionar função `isOverdue(deadline: string | null): boolean`
- Aplicar classe condicional baseada em `isOverdue`
- Usar cor vermelha clara para background quando atrasado

### 5. Seletor de Status Limitado quando Atrasado

**Arquivos:**

- `src/components/initiatives/table-gantt-view.tsx`
- `src/components/initiatives/initiatives-kanban.tsx`
- `src/components/initiatives/edit-initiative-modal.tsx`

**Funcionalidade:**

- Se item/fase/subitem está em atraso, seletor de status só mostra:
- "Atrasado" (ou "Em atraso")
- "Concluído"
- Desabilitar outras opções

**Mudanças:**

- Criar função `getAvailableStatuses(isOverdue: boolean): InitiativeStatus[]`
- Aplicar filtro nos Selects de status
- Mostrar mensagem explicativa quando limitado

### 6. Remover "Com Checklist" do Dashboard

**Arquivo:** `src/components/initiatives/initiatives-dashboard.tsx`**Mudanças:**

- Remover card "Com Checklist" (linhas 436-460)
- Remover funções `calculateInitiativesWithSubItems` e `calculateAverageChecklistCompletion`
- Ajustar grid de cards secundários

### 7. Adicionar Prioridade nas Visualizações

**Arquivos:**

- `src/components/initiatives/table-gantt-view.tsx` - Adicionar coluna de prioridade
- `src/components/initiatives/kanban-card.tsx` - Já tem, verificar se está visível
- `src/components/initiatives/initiatives-dashboard.tsx` - Já tem, manter

**Mudanças:**

- Adicionar coluna "Prioridade" na tabela do Gantt
- Garantir que badge de prioridade está visível nos cards do Kanban
- Usar cores consistentes (Alta: vermelho, Média: amarelo, Baixa: azul)

### 8. Kanban Hierárquico (3 Níveis)

**Arquivos:**

- `src/components/initiatives/initiatives-kanban.tsx`
- `src/components/initiatives/kanban-column.tsx`
- Criar novos componentes para fases e subitens

**Funcionalidade:**

- **Nível 1**: Mostrar apenas Iniciativas
- **Nível 2**: Ao clicar em "Expandir" na Iniciativa, mostrar Fases (Itens) dessa iniciativa
- **Nível 3**: Ao clicar em "Expandir" na Fase, mostrar Subitens dessa fase
- Breadcrumb no topo mostrando nível atual com botão "Voltar"
- Botão "Expandir" em cada card que tem filhos

**Mudanças:**

- Adicionar estado para controlar qual iniciativa/fase está expandida
- Criar componente `PhaseKanbanCard` e `SubItemKanbanCard`
- Implementar navegação hierárquica com breadcrumb
- Manter drag-and-drop funcionando em cada nível

### 9. Regras de Conclusão Automática

**Arquivo:** `src/contexts/initiatives-context.tsx`**Regras:**

- Fase só pode ser "Concluído" quando TODOS os subitens estiverem "Concluído"
- Iniciativa só pode ser "Concluído" quando TODAS as fases estiverem "Concluído"
- Atualização automática: quando todos os filhos estão concluídos, atualizar status do pai

**Mudanças:**

- Criar função `checkAndUpdateParentStatus(initiativeId: string, phaseId?: string)`
- Chamar após atualizar status de subitem ou fase
- Validar antes de permitir mudança de status manual
- Atualizar progresso automaticamente

### 10. Permissões de Edição

**Arquivos:**

- `src/lib/permissions-config.ts` - Adicionar função para verificar se pode editar prazo
- `src/components/initiatives/initiative-form.tsx` - Aplicar restrições
- `src/components/initiatives/edit-initiative-modal.tsx` - Aplicar restrições

**Regras:**

- PMO: Pode criar iniciativas e alterar todos os campos
- Head: Não pode alterar prazo (deadline), mas pode alterar outros campos da própria área

**Mudanças:**

- Adicionar função `canEditDeadline(userType, userArea, initiativeAreaId): boolean`
- Desabilitar campo deadline no formulário quando Head
- Manter outros campos editáveis para Head da própria área

### 11. Área Padrão quando Sem Filtro

**Arquivo:** `src/app/(app)/strategic-initiatives/page.tsx`**Lógica:**

- **Head sem filtro**: Usar `getUserArea()` como área padrão e pode ver visualização completa (é sua própria área)
- **Head com filtro de sua área**: Visualização completa (Dashboard, Tabela/Gantt, Kanban)
- **Head com filtro de área alheia**: Apenas Dashboard (limitado)
- **PMO sem filtro**: Buscar área "Estratégia e IA" por nome ou usar ID fixo, todas as visualizações disponíveis
- **PMO com filtro**: Visualização completa da área selecionada

**Mudanças:**

- Criar função `getDefaultAreaId(userType, userArea, businessAreas): string | null` com docstring completa
- Buscar área "Estratégia e IA" por nome para PMO
- Retornar `userArea` para Head
- Criar função `getEffectiveAreaId(selectedAreaId, userType, userArea, businessAreas): string | null` com docstring completa
- Retorna área efetiva considerando padrões quando não há seleção
- Criar função `canViewMode(userType, userArea, effectiveAreaId, viewMode): boolean` com docstring completa
- Head pode ver todas as visualizações se `effectiveAreaId === userArea`
- Head limitado ao Dashboard se `effectiveAreaId !== userArea`
- PMO sempre pode ver todas as visualizações
- Aplicar filtro automático no `useMemo` de `filteredInitiatives`
- Usar `effectiveAreaId` para determinar permissões de visualização

## Diretrizes de Implementação

### Modularidade e Organização

- **Criar funções helper separadas** para cada lógica específica
- **Cada função deve ter uma responsabilidade única** (Single Responsibility Principle)
- **Agrupar funções relacionadas** em seções claramente marcadas com comentários
- **Usar TypeScript** com tipos explícitos para todos os parâmetros e retornos

### Documentação (Docstrings)

- **Todas as funções devem ter docstrings JSDoc completas** incluindo:
- Descrição clara do que a função faz
- `@param` para cada parâmetro com tipo e descrição
- `@returns` descrevendo o tipo e significado do retorno
- `@throws` se a função pode lançar erros
- `@example` quando a função é complexa ou não óbvia
- **Componentes React devem ter comentários de seção** explicando:
- Props e estado
- Hooks utilizados
- Lógica de renderização
- Event handlers principais

### Estrutura de Arquivos

- **Manter funções helper no topo** do arquivo ou em arquivo separado se muito extenso
- **Componentes principais após helpers**
- **Hooks customizados em seção separada** se necessário
- **Constantes e tipos no início** do arquivo

### Exemplo de Estrutura de Arquivo:

```typescript
/**
    * ============================================
    * SEÇÃO 1: IMPORTS
    * ============================================
 */

/**
    * ============================================
    * SEÇÃO 2: TIPOS E INTERFACES
    * ============================================
 */

/**
    * ============================================
    * SEÇÃO 3: CONSTANTES
    * ============================================
 */

/**
    * ============================================
    * SEÇÃO 4: FUNÇÕES HELPER
    * ============================================
 */

/**
    * ============================================
    * SEÇÃO 5: COMPONENTE PRINCIPAL
    * ============================================
 */
```



## Cronograma de Implementação

### Fase 1: Fundação e Validações (Base para tudo)

**Complexidade:** Média | **Tempo estimado:** 2-3 horas | **Prioridade:** Crítica

#### Etapa 1.1: Campos Obrigatórios - Iniciativa

- [ ] Atualizar `initiativeSchema` em `initiative-form.tsx`
- Tornar `owner` obrigatório (remover `optional()`)
- Tornar `deadline` obrigatório (remover `optional().nullable()`)
- Adicionar validação visual no formulário
- [ ] Atualizar tipo `Initiative` em `types/index.ts` se necessário
- [ ] Testar criação de iniciativa com campos obrigatórios
- [ ] Testar validação de formulário (deve bloquear submit se campos vazios)

#### Etapa 1.2: Campos Obrigatórios - Fase

- [ ] Atualizar `phaseSchema` em `initiative-form.tsx`
- Tornar `responsible` sempre obrigatório (remover lógica condicional)
- Tornar `deadline` obrigatório
- Adicionar validação visual
- [ ] Testar criação de fase com campos obrigatórios

#### Etapa 1.3: Campos Obrigatórios - Subitem

- [ ] Verificar `subItemSchema` em `initiative-form.tsx`
- Confirmar que `responsible` já é obrigatório ✓
- Tornar `deadline` obrigatório (atualmente opcional)
- Adicionar validação visual
- [ ] Testar criação de subitem com campos obrigatórios

**Checkpoint 1:** Todos os formulários devem validar campos obrigatórios antes de salvar---

### Fase 2: Permissões e Filtros (Infraestrutura de Acesso)

**Complexidade:** Média | **Tempo estimado:** 2-3 horas | **Prioridade:** Alta

#### Etapa 2.1: Funções Helper de Área

- [ ] Criar função `getDefaultAreaId()` em `strategic-initiatives/page.tsx`
- Docstring completa JSDoc
- Lógica: Head retorna `userArea`, PMO busca "Estratégia e IA"
- Testar com diferentes userTypes
- [ ] Criar função `getEffectiveAreaId()` em `strategic-initiatives/page.tsx`
- Docstring completa JSDoc
- Retorna `selectedAreaId` ou `getDefaultAreaId()` se null
- Testar com e sem filtro selecionado

#### Etapa 2.2: Função de Permissão de Visualização

- [ ] Atualizar `canViewInitiativeViewMode()` em `permissions-config.ts`
- Adicionar docstring completa
- Ajustar para usar `effectiveAreaId` em vez de `initiativeAreaId`
- Lógica: Head pode ver tudo se `effectiveAreaId === userArea`, senão apenas Dashboard
- PMO sempre pode ver tudo
- [ ] Testar permissões com diferentes cenários

#### Etapa 2.3: Aplicar Filtro Automático

- [ ] Atualizar `filteredInitiatives` em `strategic-initiatives/page.tsx`
- Usar `getEffectiveAreaId()` para determinar área efetiva
- Aplicar filtro automaticamente quando não há `selectedAreaId`
- [ ] Atualizar lógica de botões de visualização
- Usar `effectiveAreaId` para verificar permissões
- Desabilitar botões quando Head não pode acessar
- [ ] Testar: Head sem filtro vê sua área por default com visualização completa
- [ ] Testar: Head com filtro de área alheia vê apenas Dashboard

**Checkpoint 2:** Filtros e permissões funcionando corretamente para Head e PMO---

### Fase 3: Melhorias Simples de UI (Quick Wins)

**Complexidade:** Baixa | **Tempo estimado:** 1 hora | **Prioridade:** Média

#### Etapa 3.1: Remover Card "Com Checklist"

- [ ] Remover card "Com Checklist" de `initiatives-dashboard.tsx` (linhas 436-460)
- [ ] Remover funções `calculateInitiativesWithSubItems` e `calculateAverageChecklistCompletion`
- [ ] Ajustar grid de cards secundários (de 3 para 2 colunas se necessário)
- [ ] Testar dashboard sem o card

#### Etapa 3.2: Adicionar Prioridade nas Visualizações

- [ ] Adicionar coluna "Prioridade" em `table-gantt-view.tsx`
- Adicionar TableHead para Prioridade
- Adicionar TableCell com Badge de prioridade
- Usar cores consistentes (Alta: vermelho, Média: amarelo, Baixa: azul)
- [ ] Verificar se badge de prioridade está visível em `kanban-card.tsx`
- Se não estiver, garantir visibilidade
- [ ] Testar visualização de prioridade em todas as views

**Checkpoint 3:** UI limpa e prioridade visível em todas as visualizações---

### Fase 4: Lógica de Atraso e Status (Regras de Negócio)

**Complexidade:** Média | **Tempo estimado:** 2-3 horas | **Prioridade:** Alta

#### Etapa 4.1: Detecção de Atraso

- [ ] Criar função `isOverdue()` em arquivo helper ou utils
- Docstring completa JSDoc
- Compara `deadline` com data atual
- Retorna `boolean`
- Considerar apenas se status não é "Concluído"
- [ ] Aplicar em `kanban-card.tsx`
- Adicionar classe condicional `bg-red-50` ou similar quando atrasado
- Testar visualmente
- [ ] Aplicar em `table-gantt-view.tsx`
- Adicionar classe condicional na linha quando atrasado
- Testar visualmente

#### Etapa 4.2: Seletor de Status Limitado

- [ ] Criar função `getAvailableStatuses()` em arquivo helper
- Docstring completa JSDoc
- Retorna array de status disponíveis baseado em `isOverdue`
- Se atrasado: apenas ["Atrasado", "Concluído"]
- Se não atrasado: todos os status normais
- [ ] Aplicar em `table-gantt-view.tsx`
- Filtrar opções do Select baseado em `getAvailableStatuses()`
- Mostrar mensagem explicativa quando limitado
- [ ] Aplicar em `initiatives-kanban.tsx` (se houver seletor de status)
- [ ] Aplicar em `edit-initiative-modal.tsx`
- [ ] Testar: item atrasado só permite mudar para Atrasado ou Concluído

**Checkpoint 4:** Cards em atraso mudam de cor e seletor de status está limitado---

### Fase 5: Regras de Conclusão Automática (Lógica Complexa)

**Complexidade:** Alta | **Tempo estimado:** 3-4 horas | **Prioridade:** Alta

#### Etapa 5.1: Função de Verificação de Conclusão

- [ ] Criar função `checkAndUpdateParentStatus()` em `initiatives-context.tsx`
- Docstring completa JSDoc
- Verifica se todos os filhos estão concluídos
- Atualiza status do pai automaticamente
- Atualiza progresso do pai
- [ ] Implementar lógica para Fase
- Verificar se todos subitens estão "Concluído"
- Se sim, atualizar fase para "Concluído"
- [ ] Implementar lógica para Iniciativa
- Verificar se todas fases estão "Concluído"
- Se sim, atualizar iniciativa para "Concluído"

#### Etapa 5.2: Integração com Atualizações

- [ ] Chamar `checkAndUpdateParentStatus()` após `updateSubItem()`
- [ ] Chamar `checkAndUpdateParentStatus()` após `updatePhase()`
- [ ] Chamar `checkAndUpdateParentStatus()` após `updateInitiativeStatus()`
- [ ] Testar: concluir todos subitens → fase deve concluir automaticamente
- [ ] Testar: concluir todas fases → iniciativa deve concluir automaticamente

#### Etapa 5.3: Validação de Status Manual

- [ ] Adicionar validação antes de permitir mudança manual de status
- Fase não pode ser "Concluído" se subitens não estão todos concluídos
- Iniciativa não pode ser "Concluído" se fases não estão todas concluídas
- [ ] Mostrar mensagem de erro se tentar concluir sem dependências
- [ ] Testar validações

**Checkpoint 5:** Conclusão automática funcionando e validações impedindo conclusão prematura---

### Fase 6: Permissões de Edição (Restrições por Função)

**Complexidade:** Baixa | **Tempo estimado:** 1-2 horas | **Prioridade:** Média

#### Etapa 6.1: Função de Permissão de Edição de Prazo

- [ ] Criar função `canEditDeadline()` em `permissions-config.ts`
- Docstring completa JSDoc
- PMO sempre pode editar
- Head não pode editar (retorna false)
- [ ] Testar função com diferentes userTypes

#### Etapa 6.2: Aplicar Restrição no Formulário

- [ ] Atualizar `initiative-form.tsx`
- Desabilitar campo deadline quando `!canEditDeadline()`
- Adicionar tooltip explicativo quando desabilitado
- [ ] Atualizar `edit-initiative-modal.tsx`
- Aplicar mesma lógica de desabilitação
- [ ] Testar: Head não consegue editar prazo
- [ ] Testar: PMO consegue editar prazo

**Checkpoint 6:** Head não consegue alterar prazo, PMO pode---

### Fase 7: Gantt Multi-Camadas (Visualização Complexa)

**Complexidade:** Alta | **Tempo estimado:** 4-5 horas | **Prioridade:** Média

#### Etapa 7.1: Estados de Expansão

- [ ] Adicionar estados `expandedInitiatives`, `expandedPhases` em `table-gantt-view.tsx`
- Já existem, verificar se estão completos
- [ ] Criar funções `toggleInitiative()`, `togglePhase()` se não existirem
- Já existem, verificar funcionamento

#### Etapa 7.2: Transformar Fases em GanttTasks

- [ ] Criar função `transformPhaseToGanttTask()` em `table-gantt-view.tsx`
- Docstring completa JSDoc
- Similar a `transformInitiativeToGanttTask()`
- Extrai deadline, startDate, status, responsible da fase
- [ ] Criar função `transformSubItemToGanttTask()` em `table-gantt-view.tsx`
- Docstring completa JSDoc
- Extrai deadline, startDate, status, responsible do subitem

#### Etapa 7.3: Renderizar Linhas Hierárquicas

- [ ] Renderizar linha de Iniciativa (já existe)
- [ ] Renderizar linhas de Fases quando iniciativa expandida
- Usar indentação visual (CornerDownRight icon)
- Mostrar: título, responsável, status, prazo, prioridade
- Calcular e renderizar barra do Gantt
- [ ] Renderizar linhas de Subitens quando fase expandida
- Usar indentação visual adicional
- Mostrar: título, responsável, status, prazo, prioridade
- Calcular e renderizar barra do Gantt
- [ ] Testar expansão/colapso de todas as camadas

#### Etapa 7.4: Barras do Gantt por Camada

- [ ] Calcular posição das barras para Fases
- [ ] Calcular posição das barras para Subitens
- [ ] Aplicar cores baseadas em status e atraso
- [ ] Testar visualização completa do Gantt multi-camadas

**Checkpoint 7:** Gantt exibe todas as camadas com barras corretas---

### Fase 8: Kanban Hierárquico (Mais Complexo)

**Complexidade:** Muito Alta | **Tempo estimado:** 5-6 horas | **Prioridade:** Baixa

#### Etapa 8.1: Estados de Navegação

- [ ] Adicionar estados em `initiatives-kanban.tsx`
- `expandedInitiativeId: string | null` - qual iniciativa está expandida
- `expandedPhaseId: string | null` - qual fase está expandida
- `currentLevel: 'initiatives' | 'phases' | 'subitems'` - nível atual
- [ ] Criar funções de navegação
- `expandInitiative(initiativeId: string)`
- `expandPhase(phaseId: string)`
- `goBack()`

#### Etapa 8.2: Componente Breadcrumb

- [ ] Criar componente `KanbanBreadcrumb` ou adicionar em `initiatives-kanban.tsx`
- Mostrar nível atual
- Botão "Voltar" para nível anterior
- Mostrar nome da iniciativa/fase atual
- [ ] Integrar breadcrumb no topo do Kanban (onde ficam os filtros)

#### Etapa 8.3: Componentes de Card para Fases e Subitens

- [ ] Criar componente `PhaseKanbanCard` em novo arquivo ou reutilizar
- Similar a `KanbanTaskCard` mas para fases
- Mostrar: título, responsável, status, prazo, prioridade
- Botão "Expandir" se tiver subitens
- [ ] Criar componente `SubItemKanbanCard` em novo arquivo ou reutilizar
- Similar a `KanbanTaskCard` mas para subitens
- Mostrar: título, responsável, status, prazo, prioridade
- Sem botão expandir (último nível)

#### Etapa 8.4: Renderização Condicional por Nível

- [ ] Nível 1: Renderizar apenas Iniciativas
- Adicionar botão "Expandir" em cada card que tem fases
- [ ] Nível 2: Renderizar Fases da iniciativa expandida
- Mostrar breadcrumb com nome da iniciativa
- Renderizar fases como cards
- Adicionar botão "Expandir" em cada fase que tem subitens
- [ ] Nível 3: Renderizar Subitens da fase expandida
- Mostrar breadcrumb com nome da iniciativa e fase
- Renderizar subitens como cards

#### Etapa 8.5: Drag and Drop por Nível

- [ ] Manter drag-and-drop funcionando no nível de Iniciativas
- [ ] Implementar drag-and-drop para Fases (dentro da iniciativa)
- [ ] Implementar drag-and-drop para Subitens (dentro da fase)
- [ ] Testar: arrastar card entre colunas em cada nível

**Checkpoint 8:** Kanban hierárquico funcionando em 3 níveis com navegação---

## Resumo do Cronograma

| Fase | Complexidade | Tempo Estimado | Prioridade | Dependências |

|------|--------------|----------------|------------|--------------|

| 1. Fundação e Validações | Média | 2-3h | Crítica | - |

| 2. Permissões e Filtros | Média | 2-3h | Alta | Fase 1 |

| 3. Melhorias Simples UI | Baixa | 1h | Média | - |

| 4. Lógica de Atraso | Média | 2-3h | Alta | Fase 1 |

| 5. Conclusão Automática | Alta | 3-4h | Alta | Fase 1 |

| 6. Permissões de Edição | Baixa | 1-2h | Média | Fase 2 |

| 7. Gantt Multi-Camadas | Alta | 4-5h | Média | Fase 1 |

| 8. Kanban Hierárquico | Muito Alta | 5-6h | Baixa | Fase 1 |**Tempo Total Estimado:** 20-27 horas

## Ordem de Execução Recomendada

1. **Fase 1** (Fundação) - Base para tudo
2. **Fase 2** (Permissões) - Infraestrutura de acesso
3. **Fase 3** (UI Simples) - Quick wins, pode ser paralela
4. **Fase 4** (Atraso) - Regras de negócio importantes
5. **Fase 5** (Conclusão) - Regras de negócio complexas
6. **Fase 6** (Edição) - Depende de Fase 2
7. **Fase 7** (Gantt) - Visualização complexa
8. **Fase 8** (Kanban) - Mais complexo, deixar por último

## Instruções para o Agente

1. **Seguir a ordem das fases** - não pular etapas
2. **Completar cada checkpoint** antes de avançar
3. **Testar cada funcionalidade** isoladamente
4. **Criar commits atômicos** para cada etapa concluída
5. **Adicionar docstrings completas** em todas as funções
6. **Manter código modular** - funções helper separadas
7. **Validar com diferentes userTypes** (Head, PMO, Admin)
8. **Verificar performance** com muitos dados

## Testes Necessários

- [ ] Validação de campos obrigatórios em todas as camadas
- [ ] Filtro padrão de área funciona para Head e PMO
- [ ] Head sem filtro vê sua própria área por default e pode acessar todas as visualizações
- [ ] Head com filtro de sua área pode acessar todas as visualizações
- [ ] Head com filtro de área alheia apenas Dashboard (limitado)
- [ ] PMO sempre pode acessar todas as visualizações
- [ ] Cards mudam de cor quando em atraso
- [ ] Seletor de status limitado quando atrasado
- [ ] Conclusão automática de fases e iniciativas
- [ ] Head não consegue editar prazo
- [ ] Gantt exibe todas as camadas corretamente
- [ ] Kanban hierárquico funciona em 3 níveis
- [ ] Breadcrumb e navegação funcionam no Kanban

## Observações

- Manter compatibilidade com estrutura antiga (migração)
- Garantir performance com muitas iniciativas/fases/subitens
- Usar `useMemo` para cálculos pesados
- Validar dados antes de salvar no Firestore
- **Todas as funções devem ter docstrings JSDoc completas**
- **Código deve ser modular e bem organizado para facilitar manutenção futura**