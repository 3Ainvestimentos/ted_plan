---
name: Correções validação e status automático criação iniciativas
overview: "Corrigir três problemas na criação de iniciativas: limpeza automática de erros de validação, prevenção de erros ao adicionar item após erro de \"sem itens\", e atualização automática de status quando todos os filhos são concluídos."
todos:
  - id: "1"
    content: Alterar reValidateMode para 'onChange' para limpar erros automaticamente
    status: pending
  - id: "2"
    content: Adicionar clearErrors após appendItem para limpar erro de "sem itens"
    status: pending
  - id: "3"
    content: Criar função checkAndUpdateInitiativeStatus para atualizar status automaticamente
    status: pending
  - id: "4"
    content: Adicionar useEffect para observar mudanças nos status e atualizar iniciativa
    status: pending
  - id: "5"
    content: Testar limpeza de erros ao preencher campos obrigatórios
    status: pending
  - id: "6"
    content: Testar que não aparecem erros ao adicionar item após erro de "sem itens"
    status: pending
  - id: "7"
    content: Testar atualização automática de status quando todos os filhos são concluídos
    status: pending
---

# Correções de Validação e Status Automático na Criação de Iniciativas

## Objetivo

Corrigir três problemas críticos na criação de iniciativas:

1. Mensagens de erro de campos obrigatórios não desaparecem após preencher
2. Erros aparecem automaticamente ao adicionar item após erro de "sem itens"
3. Status da iniciativa não atualiza automaticamente quando todos os filhos são concluídos

## Arquivos a Modificar

### 1. `src/components/initiatives/initiative-form.tsx`

#### Problema 1: Mensagens de erro não desaparecem

**Causa atual:**

- `mode: 'onChange'` valida em tempo real, mas pode não estar limpando erros corretamente
- `reValidateMode: 'onSubmit'` pode estar impedindo limpeza automática
- Alguns campos podem não estar disparando revalidação ao serem preenchidos

**Solução:**

- Alterar `mode` para `'onBlur'` ou `'onChange'` com `shouldUnregister: false`
- Adicionar `reValidateMode: 'onChange'` para revalidar e limpar erros quando campos são corrigidos
- Garantir que todos os campos usem `onChange` ou `onBlur` para disparar validação

**Mudanças específicas:**

```typescript
// Linha ~207-208: Ajustar configuração do useForm
mode: 'onChange', // Manter onChange para feedback imediato
reValidateMode: 'onChange', // Mudar de 'onSubmit' para 'onChange' para limpar erros automaticamente
shouldUnregister: false, // Manter valores mesmo quando campos são removidos
```

#### Problema 2: Erros aparecem ao adicionar item após erro de "sem itens"

**Causa atual:**

- Quando `appendItem` é chamado, o novo item vem com campos vazios (undefined)
- O formulário tenta validar imediatamente e encontra erros
- O erro de "sem itens" é resolvido, mas erros de campos vazios aparecem

**Solução:**

- Limpar erros de validação quando um item é adicionado
- Usar `clearErrors` do react-hook-form após `appendItem`
- Adicionar validação condicional: só validar campos de itens quando o item foi "tocado" pelo usuário

**Mudanças específicas:**

```typescript
// Após linha ~211: Adicionar função para limpar erros ao adicionar item
const { clearErrors, trigger } = useForm<InitiativeFormData>({...});

// Modificar appendItem (linha ~749)
onClick={() => {
  const currentAreaId = getValues('areaId') || '';
  appendItem({...});
  
  // Limpar erro de "sem itens" quando um item é adicionado
  clearErrors('items');
  
  // Opcional: validar apenas após usuário interagir com o item
  // Não validar imediatamente para evitar erros em campos vazios
}};
```

**Alternativa mais elegante:**

- Criar função helper `handleAddItem` que:

        1. Adiciona o item
        2. Limpa erros relacionados
        3. Opcionalmente marca o item como "não tocado" para evitar validação prematura

#### Problema 3: Atualização automática de status

**Causa atual:**

- Não há lógica para atualizar status da iniciativa quando todos os itens/subitens são concluídos
- A lógica existe em `initiatives-context.tsx` (`checkAndUpdateParentStatus`) mas não é usada no formulário

**Solução:**

- Criar função helper `checkAndUpdateInitiativeStatus` baseada em `checkAndUpdateParentStatus`
- Usar `useEffect` para observar mudanças nos status dos itens e subitens
- Atualizar status da iniciativa automaticamente usando `setValue`

**Mudanças específicas:**

```typescript
// Adicionar após linha ~300 (após useEffects de limpeza de mensagens)

/**
 * Verifica se todos os itens e subitens estão concluídos e atualiza status da iniciativa
 */
const checkAndUpdateInitiativeStatus = useCallback(() => {
  if (!watchItems || watchItems.length === 0) {
    return;
  }
  
  // Verificar se todos os itens estão concluídos
  const allItemsCompleted = watchItems.every((item: any) => {
    // Se item tem subitens, verificar se todos estão concluídos
    if (item.subItems && item.subItems.length > 0) {
      const allSubItemsCompleted = item.subItems.every((subItem: any) => subItem.status === 'Concluído');
      // Item só está concluído se todos os subitens estiverem concluídos E o item também
      return allSubItemsCompleted && item.status === 'Concluído';
    }
    // Se não tem subitens, verificar apenas o status do item
    return item.status === 'Concluído';
  });
  
  const currentStatus = getValues('status');
  
  // Se todos os itens estão concluídos e iniciativa não está concluída, atualizar
  if (allItemsCompleted && currentStatus !== 'Concluído') {
    setValue('status', 'Concluído', { shouldValidate: false });
  }
  
  // Se nem todos os itens estão concluídos mas iniciativa está concluída, reverter
  if (!allItemsCompleted && currentStatus === 'Concluído') {
    setValue('status', 'Em execução', { shouldValidate: false });
  }
}, [watchItems, getValues, setValue]);

// useEffect para observar mudanças nos status
useEffect(() => {
  checkAndUpdateInitiativeStatus();
}, [
  // Criar string de dependência baseada nos status de todos os itens e subitens
  watchItems?.map((item: any, idx: number) => {
    const itemStatus = item.status || '';
    const subItemsStatus = item.subItems 
      ? item.subItems.map((si: any) => si.status || '').join(',')
      : '';
    return `${idx}:${itemStatus}:${subItemsStatus}`;
  }).join('|'),
  checkAndUpdateInitiativeStatus
]);
```

## Fluxo de Implementação

1. **Corrigir limpeza de erros:**

            - Alterar `reValidateMode` para `'onChange'`
            - Testar que erros desaparecem ao preencher campos

2. **Corrigir erros ao adicionar item:**

            - Adicionar `clearErrors('items')` após `appendItem`
            - Testar que não aparecem erros ao adicionar item após erro de "sem itens"

3. **Implementar atualização automática de status:**

            - Criar função `checkAndUpdateInitiativeStatus`
            - Adicionar `useEffect` para observar mudanças
            - Testar que status muda automaticamente quando todos os filhos são concluídos

4. **Testes:**

            - Preencher campo obrigatório e verificar que erro desaparece
            - Adicionar item após erro de "sem itens" e verificar que não aparecem novos erros
            - Marcar todos os itens como concluídos e verificar que status muda para "Concluído"
            - Marcar um item como não concluído e verificar que status reverte para "Em execução"

## Considerações Técnicas

- Usar `shouldValidate: false` ao atualizar status automaticamente para evitar loops de validação
- A função `checkAndUpdateInitiativeStatus` deve ser memoizada com `useCallback`
- A string de dependência do `useEffect` deve capturar todas as mudanças relevantes
- Manter consistência com a lógica em `initiatives-context.tsx` para evitar divergências

## Validação Final

- [ ] Erros de campos obrigatórios desaparecem ao preencher
- [ ] Não aparecem erros ao adicionar item após erro de "sem itens"
- [ ] Status muda automaticamente para "Concluído" quando todos os filhos são concluídos
- [ ] Status reverte para "Em execução" quando um filho deixa de estar concluído
- [ ] Funciona corretamente com itens que têm subitens
- [ ] Funciona corretamente com itens sem subitens