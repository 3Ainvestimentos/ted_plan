---
name: Melhorias na Visualização Gantt/Tabela
overview: "Implementar melhorias na visualização Gantt: tooltip com datas no hover, botão expandir/recolher todas, modal de informações por nível, filtro por prioridade e correção do posicionamento de barras para itens vinculados."
todos:
  - id: "1"
    content: Adicionar tooltip com datas de início e fim no hover das barras do Gantt
    status: completed
  - id: "2"
    content: "Adicionar botão expandir/recolher todas ao lado da coluna #"
    status: completed
  - id: "3"
    content: Criar componente HierarchyItemInfoModal (genérico) para exibir informações por nível
    status: completed
  - id: "4"
    content: Adicionar coluna de ações com ícone ... que abre modal de informações
    status: completed
    dependencies:
      - "3"
  - id: "5"
    content: Trocar filtro 'Ativas/Arquivadas' por filtro de Prioridade
    status: completed
  - id: "6"
    content: Corrigir cálculo de startDate para itens vinculados (linkedToPrevious)
    status: completed
  - id: "7"
    content: Corrigir cálculo de startDate para subitens vinculados (linkedToPrevious)
    status: completed
  - id: "8"
    content: Testar visualização de barras em escadinha para itens vinculados
    status: pending
    dependencies:
      - "6"
      - "7"
---

# Melhorias na

Visualização Gantt/Tabela

## Objetivo

Melhorar a experiência do usuário na visualização Gantt/Tabela com tooltips, controles de expansão, modais informativos, filtros e correção do posicionamento de barras para itens vinculados.

## Alterações Necessárias

### 1. Tooltip com Datas no Hover das Barras

**Arquivo**: `src/components/initiatives/table-gantt-view.tsx`**Localização**: Linhas ~1015-1035 (renderização da barra da iniciativa), ~1282-1299 (renderização da barra do item), e similar para subitens**Mudança**:

- Adicionar tooltip que exibe data de início e fim ao passar o mouse sobre a barra
- Usar componente Tooltip do shadcn/ui ou criar tooltip customizado
- Exibir formato: "Início: DD/MM/YYYY - Fim: DD/MM/YYYY"

**Implementação**:

- Substituir `title` attribute por componente Tooltip mais elaborado
- Adicionar estado de hover para controlar exibição do tooltip

### 2. Botão Expandir/Recolher Todas

**Arquivo**: `src/components/initiatives/table-gantt-view.tsx`**Localização**: Linha ~727 (coluna "#" no cabeçalho)**Mudança**:

- Adicionar botão ao lado da coluna "#" para expandir/recolher todas as iniciativas, itens e subitens
- Botão deve alternar entre estado "expandir todas" e "recolher todas"
- Usar ícones ChevronDown/ChevronUp ou similar

**Implementação**:

- Adicionar estado `areAllExpanded` (similar ao que já existe em initiatives-table.tsx)
- Função para expandir/recolher todos os níveis
- Botão no cabeçalho da tabela

### 3. Coluna de Ações com Modal de Informações

**Arquivo**: `src/components/initiatives/table-gantt-view.tsx`**Localização**: Após a coluna "#", criar nova coluna fixa**Mudança**:

- Adicionar nova coluna fixa após "#" com ícone "..." (MoreHorizontal) em cada linha
- Ao clicar, abrir modal exibindo informações do nível específico:
- **Iniciativa**: título, responsável, datas, status, prioridade, observações, lista de itens (se houver)
- **Item**: título, responsável, datas, status, prioridade, observações, lista de subitens (se houver)
- **Subitem**: título, responsável, datas, status, prioridade, observações

**Implementação**:

- Criar componente `HierarchyItemInfoModal` reutilizável (nome genérico para uso em outras abas)
- Adicionar coluna no cabeçalho e em cada linha
- Modal deve receber dados do nível específico e renderizar informações organizadas

### 4. Trocar Filtro "Ativas/Arquivadas" por Prioridade

**Arquivo**: `src/components/initiatives/table-gantt-view.tsx`**Localização**: Linhas ~706-716 (filtro de arquivadas)**Mudança**:

- Substituir Select de "Ativas/Arquivadas/Todas" por filtro de Prioridade
- Opções: "Todas", "Alta", "Média", "Baixa"
- Aplicar filtro nas iniciativas (não em itens/subitens)

**Implementação**:

- Substituir `archiveFilter` por `priorityFilter`
- Atualizar lógica de filtro em `filteredInitiatives`
- Manter filtro de arquivadas separado ou removê-lo conforme necessidade

### 5. Correção do Posicionamento de Barras para Itens Vinculados

**Arquivo**: `src/components/initiatives/table-gantt-view.tsx`**Localização**:

- Função `transformItemToGanttTask` (linhas ~474-506)
- Função `transformSubItemToGanttTask` (linhas ~519-547)
- Renderização das barras (linhas ~1204-1299 para itens, similar para subitens)

**Problema Atual**:

- Itens vinculados (`linkedToPrevious: true`) devem ter `startDate` = `endDate` do item anterior
- Atualmente, a função usa fallbacks que não respeitam o vínculo
- As barras não aparecem como "escadinha" quando itens estão vinculados

**Mudança**:

- Modificar `transformItemToGanttTask` para verificar `linkedToPrevious`
- Se vinculado, buscar item anterior e usar seu `endDate` como `startDate`
- Aplicar mesma lógica em `transformSubItemToGanttTask`
- Garantir que as barras sejam renderizadas nas posições corretas

**Implementação**:

```typescript
// Em transformItemToGanttTask:
// Se item.linkedToPrevious === true, buscar item anterior na lista
// e usar itemAnterior.endDate como startDate
// Caso contrário, usar item.startDate ou fallback

// Em transformSubItemToGanttTask:
// Se subItem.linkedToPrevious === true, buscar subitem anterior
// e usar subItemAnterior.endDate como startDate
```

**Nota**: Será necessário passar contexto adicional (lista de itens/subitens) para as funções de transformação.

## Arquivos a Criar/Modificar

1. **`src/components/initiatives/table-gantt-view.tsx`**

- Adicionar tooltip nas barras
- Adicionar botão expandir/recolher todas
- Adicionar coluna de ações com modal (usando HierarchyItemInfoModal)
- Trocar filtro de arquivadas por prioridade
- Corrigir cálculo de datas para itens vinculados

2. **`src/components/initiatives/hierarchy-item-info-modal.tsx`** (NOVO)

- Modal reutilizável para exibir informações de iniciativa/item/subitem
- Recebe dados do nível específico
- Renderiza informações organizadas
- Nome genérico para permitir reutilização em outras abas

## Considerações Técnicas

1. **Tooltip**: Usar componente Tooltip do shadcn/ui para melhor UX
2. **Modal**: Criar modal reutilizável que aceita diferentes tipos de dados
3. **Performance**: Tooltip não deve impactar performance (usar lazy loading se necessário)
4. **Responsividade**: Modal e tooltip devem funcionar bem em mobile
5. **Acessibilidade**: Tooltip e modal devem ser acessíveis (ARIA labels)

## Impacto

- **Positivo**: 
- Melhor visualização de informações
- Controle mais fácil de expansão