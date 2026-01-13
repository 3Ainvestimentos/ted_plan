---
name: Integrar HierarchyItemInfoModal no Kanban
overview: "Integrar o componente HierarchyItemInfoModal na visualização Kanban, seguindo o mesmo padrão hierárquico implementado no Gantt. Adicionar botão de ação (ícone \"...\") em cada card para abrir o modal com informações detalhadas do nível correspondente. IMPORTANTE: Cada nível deve exibir APENAS seu próprio nível hierárquico no modal."
todos:
  - id: "1"
    content: Adicionar estado e importações do modal no InitiativesKanban
    status: pending
  - id: "2"
    content: Adicionar botão de ação (ícone '...') no KanbanTaskCard
    status: pending
  - id: "3"
    content: Adicionar botão de ação (ícone '...') no KanbanItemCard
    status: pending
  - id: "4"
    content: Adicionar botão de ação (ícone '...') no KanbanSubItemCard
    status: pending
  - id: "5"
    content: Criar handlers de info click no InitiativesKanban - garantir que cada nível passe apenas seus próprios dados
    status: pending
    dependencies:
      - "1"
  - id: "6"
    content: Atualizar KanbanColumn para passar handler de info click
    status: pending
    dependencies:
      - "2"
      - "5"
  - id: "7"
    content: Atualizar KanbanItemColumn para passar handler de info click
    status: pending
    dependencies:
      - "3"
      - "5"
  - id: "8"
    content: Atualizar KanbanSubItemColumn para passar handler de info click
    status: pending
    dependencies:
      - "4"
      - "5"
  - id: "9"
    content: Renderizar HierarchyItemInfoModal no final do InitiativesKanban
    status: pending
    dependencies:
      - "1"
      - "5"
---

# Integrar HierarchyItemInfoModal no Kanban

## Objetivo

Adicionar o modal de informações hierárquicas (`HierarchyItemInfoModal`) na visualização Kanban, permitindo que usuários visualizem detalhes completos de iniciativas, itens e subitens através de um botão de ação em cada card.

## Requisitos Críticos

### 1. Reutilização do Componente Existente

**CRÍTICO**: O modal exibido deve ser o **mesmo componente** usado na visualização Gantt/Tabela:

- **Componente**: `HierarchyItemInfoModal` localizado em `src/components/initiatives/hierarchy-item-info-modal.tsx`
- **Reutilização**: Importar e usar diretamente, **sem criar novo componente ou modificar o existente**
- **Integração**: O componente já está implementado e testado no Gantt/Tabela - apenas precisa ser importado e integrado ao Kanban
- **Consistência**: Garantir que o comportamento e visualização sejam idênticos em ambas as visualizações (Gantt e Kanban)

### 2. Isolamento de Níveis Hierárquicos

**CRÍTICO**: Cada nível deve exibir APENAS seu próprio nível hierárquico no modal:

- **Iniciativa**: Modal exibe informações da iniciativa + lista de seus itens (children)
- **Item**: Modal exibe informações do item + lista de seus subitens (children)
- **Subitem**: Modal exibe informações do subitem (sem children, pois é o último nível)

### 3. Modal Apenas para Visualização

O modal `HierarchyItemInfoModal` é **apenas para exibição**:

- Não deve ter checkboxes para concluir subitens
- Não deve ter ações de edição
- Apenas exibe informações e lista de filhos (quando aplicável)

## Arquitetura

O Kanban possui três níveis hierárquicos:

- **Nível 1**: Iniciativas (renderizadas por `KanbanTaskCard`)
- **Nível 2**: Itens (renderizadas por `KanbanItemCard`)
- **Nível 3**: Subitens (renderizadas por `KanbanSubItemCard`)

Cada nível será integrado com o modal seguindo o mesmo padrão do Gantt.

## Estrutura de Dados do Modal

O modal receberá dados conforme o nível, **garantindo isolamento**:

- **Iniciativa**: 
  ```typescript
  {
    type: 'initiative',
    data: Initiative, // Dados da iniciativa
    children: InitiativeItem[] // Apenas os itens desta iniciativa
  }
  ```

- **Item**: 
  ```typescript
  {
    type: 'item',
    data: InitiativeItem, // Dados do item
    children: SubItem[] // Apenas os subitens deste item
  }
  ```

- **Subitem**: 
  ```typescript
  {
    type: 'subitem',
    data: SubItem, // Dados do subitem
    children: [] // Sempre vazio, pois subitem não tem filhos
  }
  ```


## Implementação

### Etapa 1: Adicionar estado e importações no componente principal

**Arquivo**: `src/components/initiatives/initiatives-kanban.tsx`

- **Importar o componente existente**: 
  ```typescript
  import { HierarchyItemInfoModal } from './hierarchy-item-info-modal';
  ```


**IMPORTANTE**: Usar o mesmo componente do Gantt/Tabela, localizado em `src/components/initiatives/hierarchy-item-info-modal.tsx`

- Adicionar estados para controlar o modal:
  ```typescript
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalData, setInfoModalData] = useState<{
    type: 'initiative' | 'item' | 'subitem';
    data: Initiative | InitiativeItem | SubItem;
    children?: Array<InitiativeItem | SubItem>;
  } | null>(null);
  ```


### Etapa 2: Adicionar botão de ação no card de Iniciativa

**Arquivo**: `src/components/initiatives/kanban-card.tsx`

- Importar `Button` (shadcn/ui) e `MoreHorizontal` (lucide-react)
- Adicionar prop opcional `onInfoClick?: () => void` na interface `KanbanTaskCardProps`
- Adicionar botão de ação no card:
  - Posicionar no canto superior direito do card (ao lado do statusIndicator)
  - Usar ícone `MoreHorizontal`
  - Chamar `onInfoClick` ao clicar (com `e.stopPropagation()` para não interferir no drag)
  - Usar `variant="ghost"` e `size="icon"` com `className="h-6 w-6"`

### Etapa 3: Adicionar botão de ação no card de Item

**Arquivo**: `src/components/initiatives/kanban-item-card.tsx`

- Importar `Button` (shadcn/ui) e `MoreHorizontal` (lucide-react)
- Adicionar prop opcional `onInfoClick?: () => void` na interface `KanbanItemCardProps`
- Adicionar botão de ação no card (mesmo padrão do card de iniciativa)
  - Posicionar ao lado do statusIndicator
  - Usar `e.stopPropagation()` para não interferir no drag

### Etapa 4: Adicionar botão de ação no card de Subitem

**Arquivo**: `src/components/initiatives/kanban-subitem-card.tsx`

- Importar `Button` (shadcn/ui) e `MoreHorizontal` (lucide-react)
- Adicionar prop opcional `onInfoClick?: () => void` na interface `KanbanSubItemCardProps`
- Adicionar botão de ação no card (mesmo padrão dos outros cards)
  - Posicionar ao lado do statusIndicator
  - Usar `e.stopPropagation()` para não interferir no drag

### Etapa 5: Criar handlers no componente principal (CRÍTICO)

**Arquivo**: `src/components/initiatives/initiatives-kanban.tsx`

**IMPORTANTE**: Cada handler deve passar APENAS os dados do seu próprio nível:

- `handleInitiativeInfoClick(initiative: Initiative)`:
  ```typescript
  setInfoModalData({
    type: 'initiative',
    data: initiative, // Dados da iniciativa
    children: initiative.items || [] // Apenas os itens desta iniciativa
  });
  ```

- `handleItemInfoClick(item: InitiativeItem)`:
  ```typescript
  // IMPORTANTE: Passar apenas o item e seus subitens
  setInfoModalData({
    type: 'item',
    data: item, // Dados do item
    children: item.subItems || [] // Apenas os subitens deste item
  });
  ```


**Nota**: Não passar dados da iniciativa pai, apenas do item.

- `handleSubItemInfoClick(subItem: SubItem)`:
  ```typescript
  // IMPORTANTE: Passar apenas o subitem, sem filhos
  setInfoModalData({
    type: 'subitem',
    data: subItem, // Dados do subitem
    children: [] // Sempre vazio, pois subitem não tem filhos
  });
  ```


**Nota**: Não passar dados do item pai ou iniciativa, apenas do subitem.

### Etapa 6: Atualizar componentes de coluna

**Arquivos**:

- `src/components/initiatives/kanban-column.tsx`
- `src/components/initiatives/kanban-item-column.tsx`
- `src/components/initiatives/kanban-subitem-column.tsx`

- Adicionar props para handlers de info click em cada componente de coluna:
  - `KanbanColumn`: `onInitiativeInfoClick?: (initiative: Initiative) => void`
  - `KanbanItemColumn`: `onItemInfoClick?: (item: InitiativeItem) => void`
  - `KanbanSubItemColumn`: `onSubItemInfoClick?: (subItem: SubItem) => void`
- Passar handlers para os respectivos cards:
  - `KanbanTaskCard` recebe `onInfoClick={onInitiativeInfoClick ? () => onInitiativeInfoClick(task) : undefined}`
  - `KanbanItemCard` recebe `onInfoClick={onItemInfoClick ? () => onItemInfoClick(item) : undefined}`
  - `KanbanSubItemCard` recebe `onInfoClick={onSubItemInfoClick ? () => onSubItemInfoClick(subItem) : undefined}`

### Etapa 7: Conectar handlers no componente principal

**Arquivo**: `src/components/initiatives/initiatives-kanban.tsx`

- Passar handlers para os componentes de coluna:
  - `KanbanColumn` recebe `onInitiativeInfoClick={handleInitiativeInfoClick}`
  - `KanbanItemColumn` recebe `onItemInfoClick={handleItemInfoClick}` (dentro de `renderItemColumns`)
  - `KanbanSubItemColumn` recebe `onSubItemInfoClick={handleSubItemInfoClick}` (dentro de `renderSubItemColumns`)

### Etapa 8: Renderizar o modal

**Arquivo**: `src/components/initiatives/initiatives-kanban.tsx`

- Adicionar renderização condicional do `HierarchyItemInfoModal` no final do componente (antes do fechamento do `</div>` principal)
- Passar props baseadas no estado `infoModalData`:
  ```typescript
  {infoModalData && (
    <HierarchyItemInfoModal
      isOpen={infoModalOpen}
      onOpenChange={setInfoModalOpen}
      type={infoModalData.type}
      data={infoModalData.data}
      children={infoModalData.children}
    />
  )}
  ```


## Validação

Após implementação, validar:

1. ✅ **Componente reutilizado**: O mesmo `HierarchyItemInfoModal` usado no Gantt está sendo usado no Kanban
2. ✅ Modal de iniciativa exibe apenas dados da iniciativa + lista de seus itens
3. ✅ Modal de item exibe apenas dados do item + lista de seus subitens
4. ✅ Modal de subitem exibe apenas dados do subitem (sem filhos)
5. ✅ Modal não possui checkboxes ou ações de edição
6. ✅ Botão de ação não interfere no drag and drop
7. ✅ Consistência visual com o Gantt (mesmo ícone, mesmo posicionamento)
8. ✅ Comportamento idêntico do modal em ambas as visualizações (Gantt e Kanban)

## Considerações Técnicas

- **Reutilização do componente**: O `HierarchyItemInfoModal` já existe e é usado no Gantt/Tabela (`src/components/initiatives/table-gantt-view.tsx`). Deve ser importado diretamente, sem criar novo componente ou modificar o existente
- O botão de ação deve usar `e.stopPropagation()` para não interferir no drag and drop
- Manter consistência visual com o Gantt (mesmo ícone `MoreHorizontal`, mesmo posicionamento)
- O modal `HierarchyItemInfoModal` já está implementado e testado - apenas precisa ser importado e integrado ao Kanban
- **Não modificar o modal** - ele já está correto (apenas exibição, sem checkboxes) e deve funcionar da mesma forma no Kanban e no Gantt
- Garantir que o comportamento do modal seja idêntico em ambas as visualizações (Gantt e Kanban)

## Arquivos a Modificar

1. `src/components/initiatives/initiatives-kanban.tsx` - Estado, handlers e renderização do modal
2. `src/components/initiatives/kanban-card.tsx` - Botão de ação para iniciativas
3. `src/components/initiatives/kanban-item-card.tsx` - Botão de ação para itens
4. `src/components/initiatives/kanban-subitem-card.tsx` - Botão de ação para subitens
5. `src/components/initiatives/kanban-column.tsx` - Passar handler para card de iniciativa
6. `src/components/initiatives/kanban-item-column.tsx` - Passar handler para card de item
7. `src/components/initiatives/kanban-subitem-column.tsx` - Passar handler para card de subitem