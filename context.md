# Context.md - Documentação Técnica e Regras de Negócio

Este documento descreve detalhadamente todas as funcionalidades em uso, funcionalidades descontinuadas, regras de negócio e responsabilidades de cada função do sistema Ted Plan.

---

## 📋 Índice

1. [Funcionalidades em Uso](#funcionalidades-em-uso)
2. [Funcionalidades Descontinuadas](#funcionalidades-descontinuadas)
3. [Regras de Negócio Detalhadas](#regras-de-negócio-detalhadas)
4. [Arquitetura e Contextos](#arquitetura-e-contextos)
5. [Funções e Responsabilidades](#funções-e-responsabilidades)

---

## 🟢 Funcionalidades em Uso

### 1. Autenticação e Autorização

#### 1.1 Sistema de Login
**Localização**: `src/app/login/page.tsx`, `src/contexts/auth-context.tsx`

**Funcionalidade**:
- Login via Google OAuth (Firebase Auth)
- Restrição de acesso por domínio de email:
  - Permitidos: `@3ainvestimentos.com.br`, `@3ariva.com.br`
  - Lista específica de emails permitidos (fallback)
- Verificação de autenticação em todas as rotas protegidas
- Redirecionamento automático para `/login` se não autenticado

**Regras de Negócio**:
- Apenas usuários com emails dos domínios permitidos podem fazer login
- Autenticação é persistida via Firebase Auth (browserLocalPersistence)
- Estado de autenticação é monitorado em tempo real via `onAuthStateChanged`

**Funções Principais**:
- `login()`: Inicia processo de login via Google OAuth
- `logout()`: Faz logout e limpa estado
- `isAllowedEmail()`: Verifica se email é permitido

#### 1.2 Sistema de Permissões
**Localização**: `src/lib/permissions-config.ts`

**Tipos de Usuário**:
1. **admin**: Acesso total
2. **pmo**: Acesso a todas as páginas (exceto Settings)
3. **head**: Acesso limitado (apenas Dashboard, Iniciativas Estratégicas e Agenda)

**Regras de Permissão por Tipo**:

**Admin**:
- ✅ Acesso total a todas as páginas
- ✅ Pode criar, editar e deletar iniciativas
- ✅ Pode editar qualquer campo (prazo, responsável, status, etc.)
- ✅ Acesso à página de Configurações
- ✅ Pode importar iniciativas via CSV
- ✅ Pode visualizar todas as áreas

**PMO**:
- ✅ Acesso a todas as páginas (exceto Settings)
- ✅ Pode criar, editar e deletar iniciativas
- ✅ Pode editar qualquer campo (prazo, responsável, status, etc.)
- ✅ Pode importar iniciativas via CSV
- ✅ Pode visualizar todas as áreas

**Head**:
- ✅ Acesso limitado: Dashboard, Iniciativas Estratégicas e Agenda
- ❌ Não pode criar ou deletar iniciativas
- ✅ Pode editar status, observações e prioridade **apenas da própria área**
- ❌ **Nunca** pode editar prazos (endDate)
- ❌ Não pode importar iniciativas
- ✅ Pode visualizar apenas iniciativas da própria área

**Funções de Permissão**:
- `canAccessPage(userType, pageKey)`: Verifica acesso a páginas
- `canViewInitiativeArea(userType, userArea, initiativeAreaId)`: Verifica visualização por área
- `canCreateInitiative(userType)`: Verifica criação de iniciativas
- `canEditDeadline(userType)`: Verifica edição de prazos (sempre false para head)
- `canEditDescription(userType, userArea, initiativeAreaId)`: Verifica edição de observações
- `canEditPriority(userType, userArea, initiativeAreaId)`: Verifica edição de prioridade
- `canEditInitiativeStatus(userType, userArea, initiativeAreaId)`: Verifica edição de status
- `canImportInitiatives(userType)`: Verifica importação CSV
- `canViewMode(userType, userArea, effectiveAreaId, viewMode)`: Verifica visualização por modo

**Regras Especiais**:
- Head só pode ver visualizações completas (Tabela/Gantt, Kanban) da própria área
- Head vendo área alheia: apenas Dashboard (limitado)
- Settings é exclusivo de admin (mesmo com permissão customizada)

### 2. Painel Estratégico (Dashboard)

#### 2.1 Dashboard Principal
**Localização**: `src/app/(app)/page.tsx`

**Funcionalidade**:
- Exibe cards por área de negócio
- Cada card permite navegação para iniciativas da área
- Botão de importação CSV (apenas para PMO e Admin)
- Filtro automático baseado em permissões

**Regras de Negócio**:
- Head vê apenas cards de sua própria área
- PMO e Admin veem todos os cards
- Cards são gerados dinamicamente a partir das áreas de negócio cadastradas

**Funções**:
- `handleAreaClick(areaId)`: Navega para página de iniciativas com filtro de área

### 3. Iniciativas Estratégicas

#### 3.1 Estrutura Hierárquica
**Localização**: `src/types/index.ts`, `src/contexts/initiatives-context.tsx`

**Estrutura**:
```
Iniciativa
  ├── Item (obrigatório, mínimo 1)
  │   ├── SubItem (opcional)
  │   └── SubItem (opcional)
  └── Item
      └── SubItem
```

**Campos Obrigatórios**:

**Iniciativa**:
- `title`: Título
- `owner`: Responsável (obrigatório)
- `startDate`: Data de início (ISO 'YYYY-MM-DD')
- `endDate`: Data de fim/prazo (ISO 'YYYY-MM-DD')
- `areaId`: Área de negócio (obrigatório)
- `items`: Array de itens (mínimo 1)

**Item**:
- `title`: Título
- `startDate`: Data de início (obrigatório)
- `endDate`: Data de fim/prazo (obrigatório)
- `status`: Status atual
- `areaId`: Área de negócio (obrigatório)
- `priority`: Prioridade (Baixa, Média, Alta)
- `description`: Observações
- `responsible`: Responsável (opcional)
- `subItems`: Array de subitens (opcional)

**SubItem**:
- `title`: Título
- `startDate`: Data de início (obrigatório)
- `endDate`: Data de fim/prazo (obrigatório)
- `status`: Status atual
- `responsible`: Responsável (obrigatório)
- `priority`: Prioridade
- `description`: Observações
- `completed`: Boolean (sincronizado com status)

#### 3.2 Status e Conclusão
**Localização**: `src/contexts/initiatives-context.tsx`, `src/lib/initiatives-helpers.ts`

**Status Disponíveis**:
- `'Pendente'`
- `'Em execução'`
- `'Concluído'`
- `'Suspenso'`
- `'A Fazer'`
- `'Em Dia'`
- `'Em Risco'`
- `'Atrasado'`

**Regras de Conclusão** (CRÍTICO):

1. **SubItem → Item**:
   - Item só pode ser "Concluído" quando **TODOS** os subitens estiverem "Concluído"
   - Se item tem subitens e nem todos estão concluídos, item **NÃO pode** ser concluído
   - Se item não tem subitens, pode ser concluído diretamente

2. **Item → Iniciativa**:
   - Iniciativa só pode ser "Concluído" quando **TODOS** os itens estiverem "Concluído"
   - Itens sem status ou com status vazio são considerados **não concluídos**
   - Se iniciativa tem itens e nem todos estão concluídos, iniciativa **NÃO pode** ser concluída
   - Se iniciativa não tem itens, pode ser concluída diretamente

3. **Reversão Automática**:
   - Se iniciativa está "Concluído" mas um item muda de status, iniciativa é revertida para "Em execução"
   - Se item está "Concluído" mas um subitem muda de status, item é revertido para "Em execução"

**Funções de Validação**:
- `checkAndUpdateParentStatus(initiativeId, itemId, allInitiatives)`: Verifica e atualiza status do pai automaticamente
- Validação é aplicada em:
  - `updateSubItem()`: Ao atualizar subitem
  - `updateItem()`: Ao atualizar item
  - `updateInitiativeStatus()`: Ao tentar atualizar status da iniciativa

#### 3.3 Cálculo de Progresso
**Localização**: `src/contexts/initiatives-context.tsx`

**Regras**:
- Progresso é calculado automaticamente baseado em conclusão
- **SubItem**: Progresso = (subitens concluídos / total de subitens) * 100
- **Item**: 
  - Se tem subitens: Progresso = média dos progressos dos subitens
  - Se não tem subitens: Progresso = 100 se status é "Concluído", senão 0
- **Iniciativa**: Progresso = média dos progressos dos itens
- **Iniciativa Pai**: Progresso = média dos progressos das iniciativas filhas

**Funções**:
- `calculateProgressFromSubItems(subItems)`: Calcula progresso de subitens
- `calculateProgressFromItems(items)`: Calcula progresso de itens
- `calculateParentProgress(parentId, allInitiatives)`: Calcula progresso de iniciativa pai

#### 3.4 Detecção de Atraso
**Localização**: `src/lib/initiatives-helpers.ts`

**Regras**:
- Item/subitem está atrasado se:
  1. Tem `endDate` definido
  2. `endDate` já passou (é anterior a hoje)
  3. Status não é 'Concluído'

**Status Disponíveis para Itens Atrasados**:
- Apenas "Atrasado" e "Concluído" disponíveis
- Outros status são bloqueados até resolver o atraso

**Funções**:
- `isOverdue(endDate, status)`: Verifica se está atrasado
- `getAvailableStatuses(isOverdue)`: Retorna status disponíveis baseado em atraso
- `isItemOverdue(item)`: Verifica se item está atrasado
- `isSubItemOverdue(subItem)`: Verifica se subitem está atrasado

#### 3.5 Visualizações

**3.5.1 Dashboard**
**Localização**: `src/components/initiatives/initiatives-dashboard.tsx`

**Funcionalidade**:
- Métricas principais: Total, Concluídas, Atrasadas, Em Dia
- Métricas secundárias: Progresso médio, Checklists, Responsáveis
- Distribuições: Status, Prioridade, Responsáveis
- Contextualização geral da área (editável)

**Regras**:
- Head só pode editar contextualização da própria área
- PMO e Admin podem editar qualquer área

**3.5.2 Tabela/Gantt**
**Localização**: `src/components/initiatives/table-gantt-view.tsx`

**Funcionalidade**:
- Tabela à esquerda com filtros e busca
- Gantt à direita com timeline de 6 meses
- Layout responsivo sem scroll horizontal
- Edição inline de status, datas, responsáveis

**Regras**:
- Filtros: Status, Prioridade, Responsável, Busca por texto
- Gantt mostra barras de timeline para cada item/subitem
- Cores indicam status e atraso
- Drag and drop para reorganizar (futuro)

**3.5.3 Kanban**
**Localização**: `src/components/initiatives/initiatives-kanban.tsx`

**Funcionalidade**:
- Colunas por status
- Cards arrastáveis entre colunas
- Visualização visual do fluxo

**Regras**:
- Drag and drop via React DnD
- Atualização de status ao mover card
- Validação de conclusão ao mover para "Concluído"

#### 3.6 Importação CSV
**Localização**: `src/components/initiatives/import-initiatives-modal.tsx`

**Funcionalidade**:
- Importação em massa de iniciativas via CSV
- Suporta estrutura hierárquica (Iniciativa → Item → SubItem)
- Validação de campos obrigatórios
- Download de template

**Campos do CSV**:

**Iniciativa**:
- `title`, `owner`, `description`, `status`, `priority`, `startDate`, `endDate`, `areaId`

**Item**:
- `item_title`, `item_startDate`, `item_endDate`, `item_status`, `item_areaId`, `item_priority`, `item_description`, `item_responsible`

**SubItem**:
- `subitem_title`, `subitem_startDate`, `subitem_endDate`, `subitem_status`, `subitem_responsible`, `subitem_priority`, `subitem_description`

**Regras**:
- Campos de subitem: se presentes, todos são obrigatórios
- Agrupamento automático por iniciativa e item
- Validação de datas e status
- Processamento em lote (batch write)

**Funções**:
- `groupCSVRowsByHierarchy(rows)`: Agrupa linhas do CSV por hierarquia
- `bulkAddInitiatives(newInitiativesData)`: Adiciona múltiplas iniciativas em lote

#### 3.7 Migração de Dados
**Localização**: `src/contexts/initiatives-context.tsx`

**Funcionalidade**:
- Migração automática de estrutura antiga para nova
- Suporta migração de:
  - `phases` → `items`
  - `subItems` (antigo) → `items` com `subItems`

**Regras**:
- Migração é executada automaticamente ao carregar iniciativas
- Dados antigos são preservados durante migração
- Campos antigos são removidos do Firestore após migração

**Função**:
- `migrateInitiativeToThreeLayer(initiative)`: Migra iniciativa para estrutura de 3 camadas

### 4. Agenda

#### 4.1 Funcionalidade
**Localização**: `src/app/(app)/agenda/page.tsx`, `src/lib/agenda-helpers.ts`

**Funcionalidade**:
- Exibe itens e subitens que devem ser concluídos na semana vigente (7 dias)
- Filtros por projeto, responsável, prioridade, status
- Cálculo automático de dias restantes
- Indicação de atraso

**Regras**:
- Semana vigente = 7 dias a partir de hoje (inclui atrasados)
- Apenas itens/subitens não concluídos são exibidos
- Ordenação por dias restantes (mais urgentes primeiro)
- Head vê apenas itens da própria área (filtro automático)

**Funções**:
- `getWeekItems(initiatives)`: Extrai itens da semana vigente
- `calculateDaysRemaining(endDate)`: Calcula dias restantes
- `formatDaysRemaining(daysRemaining)`: Formata exibição de dias
- `isWithinWeek(endDate)`: Verifica se está na semana vigente

### 5. Configurações (Admin)

#### 5.1 Áreas de Negócio
**Localização**: `src/components/settings/business-areas-manager.tsx`

**Funcionalidade**:
- CRUD completo de áreas de negócio
- Campos: nome, ícone (lucide-react), ordem, contextualização geral
- Gestão de OKRs e KPIs por área

**Regras**:
- Apenas admin pode acessar
- Ordem determina exibição no dashboard
- Ícone deve ser nome válido do lucide-react

#### 5.2 Colaboradores
**Localização**: `src/components/settings/collaborators-manager.tsx`

**Funcionalidade**:
- CRUD completo de colaboradores
- Campos: nome, email, área, userType, histórico de remuneração e posição
- Gestão de permissões

**Regras**:
- Apenas admin pode acessar
- Email deve ser único
- userType determina permissões

#### 5.3 Modo de Manutenção
**Localização**: `src/components/settings/maintenance-mode-manager.tsx`

**Funcionalidade**:
- Ativação/desativação de modo de manutenção
- Lista de emails de administradores permitidos durante manutenção
- Bloqueio de acesso para usuários não-admin durante manutenção

**Regras**:
- Apenas admin pode ativar/desativar
- Durante manutenção, apenas admins listados podem acessar
- Configuração é lida publicamente (para verificação antes do login)

### 6. Funcionalidades de IA

#### 6.1 Sumários Executivos
**Localização**: `src/ai/flows/executive-summary.ts`, `src/components/forms/executive-summary-form.tsx`

**Funcionalidade**:
- Geração automática de sumários executivos usando Google Gemini 2.0 Flash
- Input: descrição do projeto, métricas chave, detalhes de progresso
- Output: sumário executivo conciso

**Regras**:
- Validação de tamanho mínimo/máximo de campos
- Execução no servidor (Server Action)
- Tratamento de erros com toast notifications

**Função**:
- `generateExecutiveSummary(input)`: Gera sumário executivo

#### 6.2 Atas de Reunião
**Localização**: `src/ai/flows/meeting-minutes.ts`, `src/components/forms/meeting-minutes-form.tsx`

**Funcionalidade**:
- Geração automática de atas de reunião estruturadas
- Input: atualizações de cards, resumo de discussões
- Output: atas de reunião formatadas

**Regras**:
- Validação de tamanho mínimo/máximo de campos
- Execução no servidor (Server Action)
- Tratamento de erros com toast notifications

**Função**:
- `generateMeetingMinutes(input)`: Gera atas de reunião

---

## 🔴 Funcionalidades Descontinuadas

### 1. Projetos de Desenvolvimento
**Localização**: `src/app/(app)/development-projects/`, `src/contexts/dev-projects-context.tsx`

**Status**: ⚠️ **PARCIALMENTE IMPLEMENTADO - NÃO EM USO**

**Evidências**:
- Pasta `development-projects/` existe mas está vazia (sem `page.tsx`)
- Contexto `DevProjectsProvider` existe e está sendo usado no layout
- Contexto usa dados mock (não conectado ao Firestore)
- Código do Firestore está comentado

**Código Descontinuado**:
```typescript
// NOTE: Firebase logic is commented out to use mock data. Uncomment to use Firestore.
/*
const fetchProjects = useCallback(async () => {
  // ... código comentado
}, []);
*/
```

**Componentes Relacionados**:
- `src/components/dev-projects/projects-table.tsx`
- `src/components/dev-projects/upsert-project-modal.tsx`
- `src/components/dev-projects/project-comments-modal.tsx`

**Regras de Negócio** (se fosse usado):
- Estrutura similar a iniciativas: Projeto → Item → SubItem
- Status: 'Pendente', 'Em Andamento', 'Concluído', 'Em atraso'
- Sistema de comentários por projeto/item/subitem

### 2. M&A (Mergers & Acquisitions)
**Localização**: `src/app/(app)/m-and-as/`, `src/contexts/m-and-as-context.tsx`

**Status**: ⚠️ **IMPLEMENTADO MAS NÃO ACESSÍVEL VIA NAVEGAÇÃO**

**Evidências**:
- Pasta `m-and-as/` existe mas está vazia (sem `page.tsx`)
- Contexto `MnaDealsProvider` existe e está sendo usado no layout
- Componentes existem e funcionam
- **NÃO está na navegação principal** (`NAV_ITEMS_CONFIG`)

**Componentes Funcionais**:
- `src/components/m-and-as/mna-kanban.tsx`
- `src/components/m-and-as/mna-kanban-column.tsx`
- `src/components/m-and-as/mna-kanban-card.tsx`
- `src/components/m-and-as/upsert-deal-modal.tsx`
- `src/components/m-and-as/deal-form.tsx`

**Regras de Negócio** (se fosse usado):
- Estrutura similar a iniciativas mas com campos específicos de M&A
- Usa estrutura antiga (subItems diretos, não items)
- Status: mesmos status de iniciativas
- Progresso calculado por subitens

**Observação**: O código está funcional, mas não há rota/página para acessar. Seria necessário criar `src/app/(app)/m-and-as/page.tsx` para ativar.

### 3. Notes (Notas)
**Localização**: `src/app/(app)/notes/`

**Status**: ❌ **NÃO IMPLEMENTADO**

**Evidências**:
- Pasta existe mas está completamente vazia
- Nenhum componente relacionado
- Nenhum contexto relacionado
- Não mencionado em nenhum lugar do código

### 4. Tasks (Tarefas)
**Localização**: `src/app/(app)/tasks/`

**Status**: ❌ **NÃO IMPLEMENTADO**

**Evidências**:
- Pasta existe mas está completamente vazia
- Nenhum componente relacionado
- Nenhum contexto relacionado
- Não mencionado em nenhum lugar do código

### 5. Meeting Agenda (Agenda de Reuniões)
**Localização**: `src/app/(app)/meeting-agenda/`

**Status**: ❌ **NÃO IMPLEMENTADO**

**Evidências**:
- Pasta existe mas está completamente vazia
- Diferente de "Agenda" (que é funcional)
- Não mencionado em nenhum lugar do código

**Observação**: Existe "Agenda" (`/agenda`) que é funcional e diferente de "Meeting Agenda".

### 6. Iniciativas - Página Antiga
**Localização**: `src/app/(app)/initiatives/page.tsx`

**Status**: ⚠️ **EXISTE MAS NÃO É USADA**

**Evidências**:
- Página existe com tabela de iniciativas
- **NÃO está na navegação principal**
- Navegação principal usa `/strategic-initiatives` (que é diferente)
- Página antiga usa estrutura de tópicos hierárquicos (topicNumber com pontos)

**Diferenças**:
- `/initiatives`: Página antiga com tabela simples
- `/strategic-initiatives`: Página nova com Dashboard/Tabela-Gantt/Kanban

**Observação**: A página antiga pode ser acessada diretamente via URL, mas não está no menu de navegação.

### 7. Estrutura Antiga de Iniciativas
**Localização**: `src/types/index.ts`, `src/contexts/initiatives-context.tsx`

**Status**: ⚠️ **LEGADO - MIGRAÇÃO AUTOMÁTICA**

**Campos Legados**:
- `subItems` (direto na iniciativa): Migrado para `items` com `subItems` dentro
- `phases`: Migrado para `items`

**Regras**:
- Migração é automática ao carregar iniciativas
- Campos antigos são removidos do Firestore após migração
- Código de migração está em `migrateInitiativeToThreeLayer()`

**Observação**: O campo `subItems` ainda existe no tipo `Initiative` com comentário:
```typescript
// Campo legado para migração - será removido após migração completa
subItems?: SubItem[];
```

### 8. Função Deprecada
**Localização**: `src/lib/permissions-config.ts`

**Status**: ⚠️ **DEPRECATED**

**Função**:
- `canViewInitiativeViewMode()`: Marcada como `@deprecated`
- Substituída por `canViewMode()` que usa `effectiveAreaId` em vez de `initiativeAreaId`

**Motivo**: Nova função considera área padrão do usuário, não apenas área da iniciativa.

---

## 📐 Regras de Negócio Detalhadas

### 1. Hierarquia e Dependências

#### 1.1 Estrutura Hierárquica
```
Iniciativa (nível 1)
  └── Item (nível 2, obrigatório, mínimo 1)
      └── SubItem (nível 3, opcional)
```

**Regras**:
- Iniciativa **DEVE** ter pelo menos 1 item
- Item pode ter 0 ou mais subitens
- Não há limite máximo de itens ou subitens

#### 1.2 Dependências de Conclusão
**Regra Principal**: Um elemento pai só pode ser concluído quando **TODOS** os filhos estiverem concluídos.

**Aplicação**:
1. **SubItem → Item**:
   - Item com subitens: só pode ser "Concluído" se todos os subitens estiverem "Concluído"
   - Item sem subitens: pode ser concluído diretamente

2. **Item → Iniciativa**:
   - Iniciativa com itens: só pode ser "Concluído" se todos os itens estiverem "Concluído"
   - Iniciativa sem itens: pode ser concluída diretamente

**Validação**:
- Validação é aplicada em tempo real ao tentar alterar status
- Mensagem de erro é exibida se tentar concluir sem concluir filhos
- Reversão automática se filho muda de status após conclusão do pai

### 2. Datas e Prazos

#### 2.1 Campos de Data
**Campos**:
- `startDate`: Data de início (opcional para iniciativa, obrigatório para item/subitem)
- `endDate`: Data de fim/prazo (obrigatório para todos)

**Formato**: ISO date string `'YYYY-MM-DD'`

#### 2.2 Validação de Datas
**Regras**:
- `endDate` de subitem deve ser <= `endDate` do item pai
- `endDate` de item deve ser <= `endDate` da iniciativa pai
- `startDate` deve ser <= `endDate` (mesmo nível)

**Validação**:
- Validação é aplicada no formulário antes de salvar
- Mensagem de erro é exibida se datas são inválidas

#### 2.3 Detecção de Atraso
**Regras**:
- Item/subitem está atrasado se:
  1. Tem `endDate` definido
  2. `endDate` já passou (é anterior a hoje)
  3. Status não é 'Concluído'

**Consequências**:
- Status disponíveis são limitados: apenas "Atrasado" e "Concluído"
- Outros status são bloqueados até resolver o atraso

### 3. Áreas e Filtros

#### 3.1 Área Padrão
**Regras por Tipo de Usuário**:

**Head**:
- Área padrão = área do próprio usuário (`userArea`)
- Sempre filtra por área própria (mesmo sem filtro explícito)

**PMO e Admin**:
- Área padrão = área "Estratégia e IA" (ID: `'Sg1SSSWI0WMy4U3Dgc3e'`)
- Busca primeiro por ID, depois por nome (fallback)
- Se não encontrar, retorna `null` (pode ver todas)

**Função**: `getDefaultAreaId(userType, userArea, businessAreas)`

#### 3.2 Área Efetiva
**Conceito**: Área que está sendo visualizada (selecionada ou padrão)

**Cálculo**:
1. Se há `selectedAreaId` na URL: usa essa área
2. Se não há: usa área padrão baseada no userType
3. Se não há área padrão: retorna `null` (admin vendo todas)

**Função**: `getEffectiveAreaId(selectedAreaId, userType, userArea, businessAreas)`

#### 3.3 Filtros Automáticos
**Regras**:
- Head: sempre filtra por área própria (não pode ver outras áreas)
- PMO/Admin: pode ver todas as áreas, mas área padrão é aplicada se não há filtro
- Filtro pode ser removido explicitamente (botão "Remover filtro")

### 4. Progresso e Métricas

#### 4.1 Cálculo de Progresso
**Fórmulas**:

1. **SubItem**:
   ```
   progress = (subitens concluídos / total de subitens) * 100
   ```

2. **Item**:
   - Com subitens: `progress = média dos progressos dos subitens`
   - Sem subitens: `progress = 100 se status é "Concluído", senão 0`

3. **Iniciativa**:
   ```
   progress = média dos progressos dos itens
   ```

4. **Iniciativa Pai** (com filhos):
   ```
   progress = média dos progressos das iniciativas filhas
   ```

**Atualização**:
- Progresso é calculado automaticamente ao:
  - Atualizar status de subitem
  - Atualizar status de item
  - Adicionar/remover itens ou subitens

### 5. Permissões e Acesso

#### 5.1 Regras de Edição por Campo

**Prazo (endDate)**:
- Admin: ✅ Pode editar
- PMO: ✅ Pode editar
- Head: ❌ **NUNCA** pode editar (mesmo da própria área)

**Status**:
- Admin: ✅ Pode editar qualquer iniciativa
- PMO: ✅ Pode editar qualquer iniciativa
- Head: ✅ Pode editar apenas da própria área

**Observações (description)**:
- Admin: ✅ Pode editar qualquer iniciativa
- PMO: ✅ Pode editar qualquer iniciativa
- Head: ✅ Pode editar apenas da própria área

**Prioridade**:
- Admin: ✅ Pode editar qualquer iniciativa
- PMO: ✅ Pode editar qualquer iniciativa
- Head: ✅ Pode editar apenas da própria área

**Responsável (responsible)**:
- Admin: ✅ Pode editar qualquer iniciativa
- PMO: ✅ Pode editar qualquer iniciativa
- Head: ✅ Pode editar apenas da própria área

#### 5.2 Regras de Visualização

**Modos de Visualização**:
- `dashboard`: Visão geral com métricas
- `table-gantt`: Tabela + Gantt
- `kanban`: Kanban board

**Permissões**:
- Admin: ✅ Pode ver todos os modos de qualquer área
- PMO: ✅ Pode ver todos os modos de qualquer área
- Head:
  - ✅ Pode ver todos os modos da própria área
  - ❌ Pode ver apenas `dashboard` de áreas alheias (limitado)

### 6. Agenda

#### 6.1 Semana Vigente
**Definição**: 7 dias a partir de hoje (inclui atrasados)

**Regras**:
- Apenas itens/subitens **não concluídos** são exibidos
- EndDate deve estar dentro de 7 dias (inclui atrasados)
- Ordenação por dias restantes (mais urgentes primeiro)

**Cálculo**:
- `daysRemaining = endDate - hoje`
- Negativo = atrasado
- 0 = hoje
- Positivo = futuro

#### 6.2 Filtros
**Filtros Disponíveis**:
- Projeto (iniciativa)
- Responsável
- Prioridade
- Status

**Aplicação**:
- Filtros são aplicados após cálculo da semana vigente
- Filtros são independentes (AND lógico)

---

## 🏗 Arquitetura e Contextos

### 1. Contextos React

#### 1.1 AuthContext
**Localização**: `src/contexts/auth-context.tsx`

**Responsabilidades**:
- Gerenciar autenticação do usuário
- Buscar dados do colaborador no Firestore
- Verificar permissões
- Controlar modo de manutenção

**Estado**:
- `user`: Usuário autenticado
- `isAuthenticated`: Se está autenticado
- `isLoading`: Estado de carregamento
- `isUnderMaintenance`: Se está em manutenção

**Funções**:
- `login()`: Login via Google OAuth
- `logout()`: Logout
- `hasPermission(page)`: Verifica permissão de página
- `getUserArea()`: Retorna área do usuário

#### 1.2 InitiativesContext
**Localização**: `src/contexts/initiatives-context.tsx`

**Responsabilidades**:
- Gerenciar estado de todas as iniciativas
- CRUD de iniciativas, itens e subitens
- Cálculo de progresso
- Migração de dados antigos
- Validação de conclusão

**Estado**:
- `initiatives`: Array de iniciativas
- `isLoading`: Estado de carregamento

**Funções Principais**:
- `addInitiative()`: Adiciona iniciativa
- `updateInitiative()`: Atualiza iniciativa
- `deleteInitiative()`: Deleta iniciativa
- `archiveInitiative()`: Arquivar iniciativa
- `updateInitiativeStatus()`: Atualiza status com validação
- `updateItem()`: Atualiza item
- `updateSubItem()`: Atualiza subitem
- `bulkAddInitiatives()`: Importação em lote

#### 1.3 StrategicPanelContext
**Localização**: `src/contexts/strategic-panel-context.tsx`

**Responsabilidades**:
- Gerenciar áreas de negócio
- Gerenciar OKRs e KPIs
- Buscar dados do painel estratégico

**Estado**:
- `businessAreas`: Array de áreas de negócio
- `isLoading`: Estado de carregamento

**Funções**:
- `addBusinessArea()`: Adiciona área
- `updateBusinessArea()`: Atualiza área
- `deleteBusinessArea()`: Deleta área
- `addOkr()`, `updateOkr()`, `deleteOkr()`: CRUD de OKRs
- `addKpi()`, `updateKpi()`, `deleteKpi()`: CRUD de KPIs

#### 1.4 SettingsContext
**Localização**: `src/contexts/settings-context.tsx`

**Responsabilidades**:
- Gerenciar configurações gerais
- Controlar modo de manutenção
- Buscar configurações do Firestore

**Estado**:
- `maintenanceSettings`: Configurações de manutenção
- `isLoading`: Estado de carregamento

#### 1.5 DevProjectsContext
**Localização**: `src/contexts/dev-projects-context.tsx`

**Status**: ⚠️ **NÃO EM USO** (usa dados mock)

**Responsabilidades** (se fosse usado):
- Gerenciar projetos de desenvolvimento
- CRUD de projetos, itens e subitens

#### 1.6 MnaDealsContext
**Localização**: `src/contexts/m-and-as-context.tsx`

**Status**: ⚠️ **IMPLEMENTADO MAS NÃO ACESSÍVEL**

**Responsabilidades**:
- Gerenciar deals de M&A
- CRUD de deals
- Cálculo de progresso

---

## 🔧 Funções e Responsabilidades

### 1. Helpers de Iniciativas
**Localização**: `src/lib/initiatives-helpers.ts`

**Funções**:
- `isOverdue(endDate, status)`: Verifica se está atrasado
- `getAvailableStatuses(isOverdue)`: Retorna status disponíveis
- `isItemOverdue(item)`: Verifica se item está atrasado
- `isSubItemOverdue(subItem)`: Verifica se subitem está atrasado

### 2. Helpers de Agenda
**Localização**: `src/lib/agenda-helpers.ts`

**Funções**:
- `calculateDaysRemaining(endDate)`: Calcula dias restantes
- `formatDaysRemaining(daysRemaining)`: Formata exibição
- `isWithinWeek(endDate)`: Verifica se está na semana vigente
- `getWeekItems(initiatives)`: Extrai itens da semana vigente
- `getHierarchyPath(...)`: Retorna caminho hierárquico

### 3. Helpers de Iniciativas (Context)
**Localização**: `src/contexts/initiatives-context.tsx`

**Funções Internas**:
- `calculateProgressFromSubItems(subItems)`: Calcula progresso de subitens
- `calculateProgressFromItems(items)`: Calcula progresso de itens
- `calculateParentProgress(parentId, allInitiatives)`: Calcula progresso de pai
- `checkAndUpdateParentStatus(...)`: Verifica e atualiza status do pai
- `removeUndefinedFields(obj)`: Remove campos undefined para Firestore
- `migrateInitiativeToThreeLayer(initiative)`: Migra iniciativa para estrutura nova

### 4. Configuração de Permissões
**Localização**: `src/lib/permissions-config.ts`

**Funções**:
- `hasDefaultPermission(userType, pageKey)`: Verifica permissão padrão
- `canAccessPage(userType, pageKey)`: Verifica acesso a página
- `isAdminOnlyPage(pageKey)`: Verifica se página é exclusiva de admin
- `canViewInitiativeArea(...)`: Verifica visualização por área
- `canCreateInitiative(userType)`: Verifica criação
- `canEditInitiativeResponsible(...)`: Verifica edição de responsável
- `canEditInitiativeStatus(...)`: Verifica edição de status
- `canDeleteInitiative(userType)`: Verifica deleção
- `canImportInitiatives(userType)`: Verifica importação
- `canEditDeadline(userType)`: Verifica edição de prazo
- `canEditDescription(...)`: Verifica edição de observações
- `canEditPriority(...)`: Verifica edição de prioridade
- `canViewMode(...)`: Verifica visualização por modo
- `canViewInitiativeViewMode(...)`: ⚠️ **DEPRECATED**

---

## 📝 Observações Finais

### Código Legado
- Campo `subItems` em `Initiative` ainda existe para compatibilidade com migração
- Função `canViewInitiativeViewMode()` está deprecated mas mantida para compatibilidade
- Página `/initiatives` existe mas não está na navegação (substituída por `/strategic-initiatives`)

### Features Não Implementadas
- Notes (Notas)
- Tasks (Tarefas)
- Meeting Agenda (Agenda de Reuniões - diferente de Agenda)

### Features Parcialmente Implementadas
- Development Projects: Código existe mas usa dados mock, não conectado ao Firestore
- M&A: Código funcional mas sem rota/página para acessar

### Melhorias Futuras Sugeridas
1. Remover código legado após migração completa
2. Implementar ou remover features parcialmente implementadas
3. Adicionar testes automatizados para regras de negócio críticas
4. Documentar APIs de IA (Genkit flows)
5. Implementar sistema de notificações para atrasos

---

**Última atualização**: Dezembro 2024
**Versão do documento**: 1.0
