---
name: Adaptar Importação CSV de Iniciativas
overview: Adaptar a funcionalidade de importação CSV para ser compatível com a estrutura atual de iniciativas (itens obrigatórios, campos atualizados), mover o botão para o Painel Estratégico e restringir acesso apenas para PMO e admin.
todos:
  - id: csv-1
    content: "Atualizar modal de importação: validação de campos e parsing de estrutura hierárquica (itens e subitens)"
    status: completed
  - id: csv-2
    content: Atualizar função bulkAddInitiatives no contexto para suportar criação de itens e subitens
    status: completed
    dependencies:
      - csv-1
  - id: csv-3
    content: Atualizar instruções/tutorial no modal para refletir estrutura atual com exemplos
    status: completed
    dependencies:
      - csv-1
  - id: csv-4
    content: Remover botão e modal de importação da página strategic-initiatives
    status: completed
  - id: csv-5
    content: Adicionar botão de importação no Painel Estratégico com verificação de permissão (PMO e admin)
    status: completed
    dependencies:
      - csv-4
  - id: csv-6
    content: Criar/atualizar template CSV com estrutura completa e exemplos
    status: completed
    dependencies:
      - csv-1
---

# Adapt

ação da Funcionalidade de Importação CSV

## Contexto Atual

A funcionalidade de importação CSV está implementada em [`src/components/initiatives/import-initiatives-modal.tsx`](src/components/initiatives/import-initiatives-modal.tsx) e atualmente:

- Está sendo usada na página `[src/app/(app)/strategic-initiatives/page.tsx](src/app/\\\\\\\\\\\\\\\\\\(app)/strategic-initiatives/page.tsx)`
- Suporta apenas campos básicos: `title`, `owner`, `description`, `status`, `priority`, `deadline`
- Não suporta a estrutura hierárquica atual (itens e subitens obrigatórios)
- A função `bulkAddInitiatives` em [`src/contexts/initiatives-context.tsx`](src/contexts/initiatives-context.tsx) não cria itens

## Mudanças Necessárias

### 1. Atualizar Estrutura de Dados do CSV

**Campos obrigatórios atuais:**

- `title` (string, min 5 caracteres)
- `owner` (string, obrigatório - responsável da iniciativa)
- `description` (string, opcional)
- `status` (enum: 'Pendente', 'Em execução', 'Concluído', 'Suspenso')
- `priority` (enum: 'Baixa', 'Média', 'Alta')
- `deadline` (date, formato 'YYYY-MM-DD', obrigatório)
- `areaId` (string, obrigatório - ID da área de negócio)

**Estrutura hierárquica obrigatória:**

- Cada iniciativa DEVE ter pelo menos 1 item
- Cada item pode ter 0 ou mais subitens

**Campos do item:**

- `item_title` (string, min 3 caracteres, obrigatório)
- `item_deadline` (date, formato 'YYYY-MM-DD', obrigatório)
- `item_status` (enum: 'Pendente', 'Em execução', 'Concluído', 'Suspenso', obrigatório)
- `item_areaId` (string, obrigatório - geralmente igual ao areaId da iniciativa)
- `item_priority` (enum: 'Baixa', 'Média', 'Alta', obrigatório)
- `item_description` (string, opcional)
- `item_responsible` (string, obrigatório)

**Campos do subitem (opcional, mas se presente, todos são obrigatórios):**

- `subitem_title` (string, min 3 caracteres)
- `subitem_deadline` (date, formato 'YYYY-MM-DD')
- `subitem_status` (enum: 'Pendente', 'Em execução', 'Concluído', 'Suspenso')
- `subitem_responsible` (string)
- `subitem_priority` (enum: 'Baixa', 'Média', 'Alta')
- `subitem_description` (string, opcional)

### 2. Atualizar Modal de Importação

**Arquivo:** [`src/components/initiatives/import-initiatives-modal.tsx`](src/components/initiatives/import-initiatives-modal.tsx)**Mudanças:**

- Atualizar validação de campos obrigatórios
- Adicionar suporte para parsing de itens e subitens
- Atualizar instruções/tutorial para refletir a nova estrutura
- Validar que cada iniciativa tem pelo menos 1 item
- Validar campos de item quando presentes
- Validar campos de subitem quando presentes (todos ou nenhum)

**Estrutura CSV esperada:**

```csv
title,owner,description,status,priority,deadline,areaId,item_title,item_deadline,item_status,item_areaId,item_priority,item_description,item_responsible,subitem_title,subitem_deadline,subitem_status,subitem_responsible,subitem_priority,subitem_description
```

### 3. Atualizar Função bulkAddInitiatives

**Arquivo:** [`src/contexts/initiatives-context.tsx`](src/contexts/initiatives-context.tsx)**Mudanças:**

- Modificar `bulkAddInitiatives` para aceitar estrutura com itens
- Criar itens junto com as iniciativas
- Criar subitens dentro dos itens quando presentes
- Validar estrutura antes de salvar
- Usar a mesma lógica de `addInitiative` para garantir consistência

### 4. Mover Botão para Painel Estratégico

**Arquivo origem:** `[src/app/(app)/strategic-initiatives/page.tsx](src/app/\\\\\\\\\\\\\\\\\\(app)/strategic-initiatives/page.tsx)`

- Remover estado `isImportModalOpen`
- Remover import de `ImportInitiativesModal`
- Remover componente `<ImportInitiativesModal>` do JSX
- Remover botão "Importar CSV" da interface

**Arquivo destino:** `[src/app/(app)/page.tsx](src/app/\\\\\\\\\\\\\\\\\\(app)/page.tsx)`

- Adicionar estado `isImportModalOpen`
- Adicionar import de `ImportInitiativesModal`
- Adicionar componente `<ImportInitiativesModal>` no JSX
- Adicionar botão "Importar CSV" no header da página
- Adicionar verificação de permissão (apenas PMO e admin)

### 5. Implementar Verificação de Permissão

**Arquivo:** `[src/app/(app)/page.tsx](src/app/\\\\\\\\\\\\\\\\\\(app)/page.tsx)`**Mudanças:**

- Importar `useAuth` do contexto de autenticação
- Verificar se `userType === 'admin' || userType === 'pmo'`
- Renderizar botão apenas se tiver permissão

### 6. Atualizar Template CSV

**Arquivo:** Criar ou atualizar template CSV de exemplo**Estrutura do template:**

- Incluir todas as colunas obrigatórias
- Incluir exemplo de item
- Incluir exemplo de subitem (opcional)
- Comentários explicativos nas primeiras linhas (se suportado) ou documentação separada

## Implementação Detalhada

### Fase 1: Atualizar Modal de Importação

1. **Atualizar validação de campos:**
   ```typescript
               const requiredFields = [
                 'title', 'owner', 'status', 'priority', 'deadline', 'areaId',
                 'item_title', 'item_deadline', 'item_status', 'item_areaId', 
                 'item_priority', 'item_responsible'
               ];
   ```

2. **Atualizar parsing de dados:**

- Agrupar linhas por iniciativa (mesmo `title` ou usar índice)
- Agrupar itens por iniciativa
- Agrupar subitens por item
- Validar estrutura hierárquica

3. **Atualizar instruções no modal:**

- Explicar estrutura hierárquica
- Listar campos obrigatórios e opcionais
- Fornecer exemplo de estrutura

### Fase 2: Atualizar bulkAddInitiatives

1. **Modificar assinatura da função:**
   ```typescript
               bulkAddInitiatives: (newInitiatives: Array<{
                 title: string;
                 owner: string;
                 description?: string;
                 status: InitiativeStatus;
                 priority: InitiativePriority;
                 deadline: string;
                 areaId: string;
                 items: Array<{
                   title: string;
                   deadline: string;
                   status: InitiativeStatus;
                   areaId: string;
                   priority: InitiativePriority;
                   description?: string;
                   responsible: string;
                   subItems?: Array<{
                     title: string;
                     deadline: string;
                     status: InitiativeStatus;
                     responsible: string;
                     priority: InitiativePriority;
                     description?: string;
                   }>;
                 }>;
               }>) => Promise<void>;
   ```

2. **Implementar criação em lote:**

- Usar `writeBatch` do Firestore
- Criar iniciativa com itens e subitens
- Validar estrutura antes de salvar
- Tratar erros individualmente (se possível) ou em lote

### Fase 3: Mover Botão e Implementar Permissões

1. **Remover de strategic-initiatives/page.tsx:**

- Remover estado e imports relacionados
- Remover botão da UI

2. **Adicionar em page.tsx:**

- Adicionar estado `isImportModalOpen`
- Adicionar verificação de permissão
- Adicionar botão no header (ao lado do título ou em área de ações)
- Adicionar modal no JSX

### Fase 4: Criar/Atualizar Template CSV

1. **Criar arquivo de template:**

- Estrutura com exemplo completo
- Comentários explicativos
- Valores de exemplo válidos
- Usar nomenclatura atualizada (item ao invés de fase)

2. **Atualizar link de download no modal:**

- Garantir que aponta para o template correto
- Verificar se arquivo existe em `public/` ou similar

## Validações Necessárias

1. **Validação de estrutura:**

- Cada iniciativa deve ter pelo menos 1 item
- Campos obrigatórios devem estar presentes
- Status devem ser válidos (enum)
- Prioridades devem ser válidas (enum)
- Datas devem estar no formato correto

2. **Validação de dados:**

- `areaId` deve existir na coleção `businessAreas`
- `item_areaId` deve existir na coleção `businessAreas`
- Datas devem ser válidas
- Strings não devem estar vazias (após trim)

3. **Validação de permissões:**

- Apenas PMO e admin podem ver o botão
- Apenas PMO e admin podem executar a importação

## Testes Sugeridos

1. **Teste de importação básica:**

- CSV com 1 iniciativa, 1 item, 0 subitens
- Verificar se dados são salvos corretamente

2. **Teste de importação completa:**

- CSV com 1 iniciativa, 1 item, 1 subitem
- Verificar estrutura hierárquica

3. **Teste de importação múltipla:**

- CSV com múltiplas iniciativas
- Verificar se todas são criadas

4. **Teste de validação:**

- CSV com campos faltando
- CSV com valores inválidos
- CSV com estrutura incorreta

5. **Teste de permissões:**

- Head não deve ver o botão
- PMO e admin devem ver o botão
- Head não deve conseguir acessar a funcionalidade diretamente

## Arquivos a Modificar

1. [`src/components/initiatives/import-initiatives-modal.tsx`](src/components/initiatives/import-initiatives-modal.tsx) - Atualizar parsing e validação
2. [`src/contexts/initiatives-context.tsx`](src/contexts/initiatives-context.tsx) - Atualizar `bulkAddInitiatives`
3. `[src/app/(app)/strategic-initiatives/page.tsx](src/app/\\\\\\\\\\\\\\\\\\(app)/strategic-initiatives/page.tsx)` - Remover botão e modal
4. `[src/app/(app)/page.tsx](src/app/\\\\\\\\\\\\\\\\\\(app)/page.tsx)` - Adicionar botão e modal com permissões
5. `public/template_iniciativas.csv` (ou similar) - Criar/atualizar template

## Notas Importantes