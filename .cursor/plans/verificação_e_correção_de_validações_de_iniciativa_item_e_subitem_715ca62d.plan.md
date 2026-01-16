---
name: Verificação e correção de validações de iniciativa item e subitem
overview: Plano completo para verificar e corrigir todas as validações de criação de iniciativa, item e subitem, incluindo limpeza automática de erros e correção do bug onde data final do subitem pode ser menor que data inicial.
todos: []
---

# Plano de Verificação e Correção de Validações

## 1. Problema Identificado

**Bug crítico:** A validação do subitem permite que `endDate < startDate` quando `linkedToPrevious === true`. A validação do schema Zod (linhas 75-83) só verifica se ambos existem, mas quando vinculado, o `startDate` pode ser calculado automaticamente e a validação não é reexecutada.

## 2. Áreas de Verificação

### 2.1 Validações de Schema (Zod)

**Arquivo:** `src/components/initiatives/initiative-form.tsx`

#### Iniciativa (linhas 131-163)

- ✅ `title`: min 5 caracteres
- ✅ `owner`: obrigatório
- ✅ `startDate`: obrigatório (via dateSchema)
- ✅ `endDate`: obrigatório (via dateSchema)  
- ✅ `endDate >= startDate`: validado via refine (linhas 141-149)
- ✅ Todos os itens têm `endDate <= initiative.endDate` (linhas 150-162)

#### Item (linhas 86-129)

- ✅ `title`: min 3 caracteres
- ✅ `startDate`: obrigatório se `linkedToPrevious === false` (linhas 98-106)
- ✅ `endDate`: obrigatório (via dateSchema)
- ✅ `endDate >= startDate`: validado via refine (linhas 107-115)
- ✅ `responsible`: obrigatório
- ✅ `areaId`: obrigatório
- ⚠️ **Verificar:** Todos os subitens têm `endDate <= item.endDate` (linhas 116-128)

#### Subitem (linhas 55-84)

- ✅ `title`: min 3 caracteres
- ✅ `startDate`: obrigatório se `linkedToPrevious === false` (linhas 66-74)
- ✅ `endDate`: obrigatório (via dateSchema)
- ❌ **BUG:** `endDate >= startDate` não funciona corretamente quando `linkedToPrevious === true` (linhas 75-83)
  - Quando vinculado, `startDate` é calculado automaticamente via `useEffect` (linhas 422-440)
  - A validação só verifica `if (data.startDate && data.endDate)`, mas quando vinculado, `startDate` pode não estar no objeto de validação no momento certo

### 2.2 Limpeza Automática de Erros (onChange)

#### Campos de Data da Iniciativa

- ❌ `startDate` (linha ~882): Usa `field.onChange` diretamente - **falta limpar erros**
- ❌ `endDate` (linha ~918): Usa `field.onChange` diretamente - **falta limpar erros**

#### Campos de Data do Item

- ❌ `startDate` (linhas 1215-1220): Usa `field.onChange` apenas se não vinculado - **falta limpar erros quando mudar**
- ✅ `endDate` (linhas 1258-1264): **JÁ IMPLEMENTADO** - limpa `subItems.root` e revalida (correto)

#### Campos de Data do Subitem

- ❌ `startDate` (preciso verificar): **Verificar** se limpa erros quando mudar
- ✅ `endDate` (linhas 1580-1587): **JÁ IMPLEMENTADO** - limpa `subItems.root` e revalida (correto)

#### Outros Campos

- Verificar se campos obrigatórios (`title`, `responsible`, etc.) limpam erros ao digitar

### 2.3 Cálculo Automático de Datas (useEffect)

**Linhas 403-443:** Quando `linkedToPrevious === true`, o `startDate` é calculado automaticamente

**Problemas potenciais:**

- Quando o cálculo automático acontece, a validação do subitem pode não detectar que `endDate < startDate`
- O `useEffect` usa `shouldValidate: true`, mas a validação pode acontecer antes do `startDate` ser atualizado

## 3. Correções Necessárias

### 3.1 Corrigir validação de subitem quando vinculado

**Arquivo:** `src/components/initiatives/initiative-form.tsx` (linhas 75-83)

**Problema:** A validação atual só funciona se `startDate` estiver no objeto, mas quando vinculado, o `startDate` pode vir do subitem anterior.

**Solução:** Adicionar validação que verifica `endDate` contra o `startDate` real (calculado ou definido):

```typescript
.refine((data, ctx) => {
  // Se vinculado, usar endDate do subitem anterior como startDate real
  const actualStartDate = data.linkedToPrevious 
    ? ctx.parent?.subItems?.[ctx.path[ctx.path.length - 2] - 1]?.endDate // Precisa acesso ao array
    : data.startDate;
  
  if (actualStartDate && data.endDate) {
    return data.endDate >= actualStartDate;
  }
  return true;
}, {
  message: "A data de fim deve ser maior ou igual à data de início.",
  path: ["endDate"],
})
```

**Alternativa mais simples:** Validar diretamente no `useEffect` que calcula o `startDate` quando vinculado (linhas 422-440), e também adicionar validação customizada que acessa o item pai.

### 3.2 Adicionar limpeza de erros em todos os campos de data

**Adicionar limpeza de erros e revalidação nos campos:**

- Iniciativa `startDate`: limpar erro de `endDate` se houver
- Iniciativa `endDate`: limpar erro de `startDate` e `items` se houver  
- Item `startDate`: limpar erro de `endDate` do item e revalidar
- Subitem `startDate`: limpar erro de `endDate` do subitem e revalidar

### 3.3 Melhorar validação quando startDate é calculado

**Quando `linkedToPrevious === true` e o `startDate` é calculado:**

- Garantir que após o cálculo, o subitem seja revalidado completamente
- Adicionar verificação imediata se `endDate < calculatedStartDate`

### 3.4 Verificar limpeza de erros em campos de texto

**Verificar se campos obrigatórios limpam erros ao digitar:**

- `title` (iniciativa, item, subitem)
- `owner`/`responsible` (iniciativa, item, subitem)
- `description` (opcional, mas pode ter validações)

## 4. Checklist de Testes

### 4.1 Validações de Data

- [ ] Iniciativa: `endDate < startDate` → erro exibido
- [ ] Item não vinculado: `endDate < startDate` → erro exibido
- [ ] Item vinculado: `endDate < startDate` (anterior) → erro exibido
- [ ] Subitem não vinculado: `endDate < startDate` → erro exibido
- [ ] Subitem vinculado: `endDate < startDate` (anterior) → **TESTAR E CORRIGIR**
- [ ] Item: `endDate < any subitem.endDate` → erro exibido
- [ ] Iniciativa: `endDate < any item.endDate` → erro exibido

### 4.2 Limpeza de Erros

- [ ] Ao corrigir data da iniciativa → erros relacionados desaparecem
- [ ] Ao corrigir data do item → erros de subitems desaparecem
- [ ] Ao corrigir data do subitem → erros relacionados desaparecem
- [ ] Ao preencher campo obrigatório vazio → erro desaparece
- [ ] Ao vincular item/subitem → validações são reexecutadas

### 4.3 Cálculo Automático

- [ ] Vincular item calcula `startDate` corretamente
- [ ] Vincular subitem calcula `startDate` corretamente  
- [ ] Se `endDate` calculado for maior que `endDate` do item/subitem → erro
- [ ] Mudança de `endDate` anterior recalcula `startDate` do próximo

## 5. Arquivos a Modificar

1. **`src/components/initiatives/initiative-form.tsx`**

   - Corrigir validação de subitem quando `linkedToPrevious === true` (linhas 75-83)
   - Adicionar limpeza de erros em campos de data da iniciativa (linhas ~882, ~918)
   - Adicionar limpeza de erros em `startDate` do item (linhas 1215-1220)
   - Adicionar limpeza de erros em `startDate` do subitem (verificar se já existe)
   - Melhorar validação após cálculo automático de `startDate` (linhas 422-440)

## 6. Ordem de Implementação

1. **Corrigir bug crítico:** Validação de subitem quando vinculado
2. **Adicionar limpeza de erros:** Campos de data da iniciativa
3. **Adicionar limpeza de erros:** `startDate` do item
4. **Verificar e corrigir:** `startDate` do subitem
5. **Melhorar validação:** Após cálculo automático
6. **Testes manuais:** Todas as validações e limpezas