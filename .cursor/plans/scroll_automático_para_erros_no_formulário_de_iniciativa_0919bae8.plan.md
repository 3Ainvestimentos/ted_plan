---
name: Scroll automático para erros no formulário de iniciativa
overview: Implementar sistema robusto de scroll automático para qualquer erro de validação no formulário de criação de iniciativa, melhorando a experiência do usuário ao destacar visualmente o campo com erro.
todos:
  - id: "1"
    content: Criar função findElementByErrorPath com todas as estratégias de busca (data-attribute, name, id, campos especiais)
    status: completed
  - id: "2"
    content: Adicionar data-field-path aos campos da iniciativa (title, owner, startDate, endDate, areaId, status, priority, description)
    status: completed
  - id: "3"
    content: Adicionar data-field-path aos campos de items (title, startDate, endDate, responsible, status, priority, description)
    status: completed
  - id: "4"
    content: Adicionar data-field-path aos campos de subitems (title, startDate, endDate, responsible, status, priority, description)
    status: completed
  - id: "5"
    content: Refatorar handler onError para usar findElementByErrorPath e remover lógica antiga de scroll
    status: completed
  - id: "6"
    content: Ajustar timeout e usar requestAnimationFrame para garantir DOM atualizado antes do scroll
    status: completed
  - id: "7"
    content: Testar todos os tipos de erros e verificar se scroll funciona corretamente em cada caso
    status: completed
---

# Plano: Scroll Automático para Erros no Formulário de Iniciativa

## Situação Atual

O código já possui um sistema parcial de scroll implementado no handler `onError` (linhas 745-901), que trata alguns casos específicos:

- Erro de items vazio (`hasItemsMinError`)
- Erro de `item.endDate > initiative.endDate` 
- Erro de `subItem.endDate > item.endDate` (via `subItems.root`)
- Fallback genérico que tenta encontrar elementos por `name` ou `id`

**Problemas identificados:**

1. O fallback genérico (linhas 868-900) é frágil e pode falhar para campos complexos (Calendar/Popover, Select)
2. Não há data-attributes consistentes em todos os campos para facilitar a busca
3. A lógica de busca não cobre todos os tipos de campos (Controller com Popover, Select, Textarea)
4. O timeout de 150ms pode ser insuficiente para renderização completa

## Objetivo

Criar um sistema robusto que **sempre** encontre e faça scroll para qualquer campo com erro, independentemente do tipo de campo ou localização no formulário.

## Estratégia de Implementação

### 1. Criar Função Utilitária para Mapear Path de Erro para Elemento DOM

Criar função `findElementByErrorPath(errorPath: string): Element | null` que:

- Aceita paths como `"title"`, `"items.0.endDate"`, `"items.1.subItems.2.startDate"`
- Tenta múltiplas estratégias de busca em ordem de prioridade:

  1. Data-attribute específico: `[data-field-path="${errorPath}"]`
  2. Name attribute do Controller: `[name="${errorPath}"]`
  3. ID baseado no path: `#${fieldName}` ou `#item-${index}-${fieldName}`
  4. Para campos de data: buscar botão PopoverTrigger associado
  5. Para Select: buscar SelectTrigger pelo name
  6. Para arrays: buscar o container do item/subitem pelo índice

### 2. Adicionar Data-Attributes aos Campos do Formulário

Adicionar `data-field-path` a todos os campos para facilitar a busca:

**Campos da Iniciativa:**

- `title` → `data-field-path="title"`
- `owner` → `data-field-path="owner"`
- `startDate` → `data-field-path="startDate"` (no PopoverTrigger Button)
- `endDate` → `data-field-path="endDate"` (no PopoverTrigger Button)
- `areaId` → `data-field-path="areaId"` (no SelectTrigger)
- `status` → `data-field-path="status"` (no SelectTrigger)
- `priority` → `data-field-path="priority"` (no SelectTrigger)
- `description` → `data-field-path="description"`

**Campos de Items (índice dinâmico):**

- `items.${index}.title` → `data-field-path="items.${index}.title"`
- `items.${index}.startDate` → `data-field-path="items.${index}.startDate"` (no Button)
- `items.${index}.endDate` → `data-field-path="items.${index}.endDate"` (no Button)
- `items.${index}.responsible` → `data-field-path="items.${index}.responsible"`
- `items.${index}.status` → `data-field-path="items.${index}.status"`
- `items.${index}.priority` → `data-field-path="items.${index}.priority"`
- `items.${index}.description` → `data-field-path="items.${index}.description"`

**Campos de SubItems (índices dinâmicos):**

- `items.${index}.subItems.${subIndex}.title` → `data-field-path="items.${index}.subItems.${subIndex}.title"`
- `items.${index}.subItems.${subIndex}.startDate` → `data-field-path="items.${index}.subItems.${subIndex}.startDate"`
- `items.${index}.subItems.${subIndex}.endDate` → `data-field-path="items.${index}.subItems.${subIndex}.endDate"`
- `items.${index}.subItems.${subIndex}.responsible` → `data-field-path="items.${index}.subItems.${subIndex}.responsible"`

### 3. Refatorar Handler `onError` para Usar a Nova Função

Substituir a lógica atual de scroll (linhas 804-900) por:

1. Extrair o primeiro erro usando `extractErrorMessages`
2. Chamar `findElementByErrorPath` com o path do erro
3. Se encontrar elemento: fazer scroll com `scrollToElementWithOffset`
4. Se não encontrar: fazer fallback para scroll da seção relevante (items, subitems, ou topo do form)

### 4. Melhorar Tratamento de Casos Especiais

**Erros em arrays (`items`, `subItems`):**

- Se erro no nível do array (`items.message`): scroll para `[data-items-section]`
- Se erro em item específico: usar índice do erro para encontrar o container do item
- Se erro em subitem: usar índices para encontrar o container do subitem

**Erros em campos aninhados:**

- Mapear path completo: `items.1.subItems.0.endDate` → encontrar o container do subitem 0 do item 1

### 5. Ajustar Timeout e Scroll Behavior

- Aumentar timeout inicial para 200ms para garantir renderização
- Usar `requestAnimationFrame` para garantir que o DOM está atualizado antes do scroll
- Manter offset de 100-120px para não colar o campo no topo da tela

## Arquivos a Modificar

1. **`src/components/initiatives/initiative-form.tsx`**

   - Criar função `findElementByErrorPath` (após `scrollToElementWithOffset`, ~linha 802)
   - Refatorar handler `onError` (linhas 804-900)
   - Adicionar `data-field-path` a todos os campos do formulário:
     - Campos da iniciativa (~linhas 1005-1230)
     - Campos de items (~linhas 1330-1620)
     - Campos de subitems (~linhas 1650-1890)

## Detalhamento da Função `findElementByErrorPath`

```typescript
const findElementByErrorPath = (errorPath: string): Element | null => {
  // 1. Tentar data-attribute específico
  let element = document.querySelector(`[data-field-path="${errorPath}"]`);
  if (element) return element;
  
  // 2. Tentar name attribute (para inputs diretos)
  element = document.querySelector(`[name="${errorPath}"]`);
  if (element) return element;
  
  // 3. Para paths aninhados, extrair partes e tentar estratégias específicas
  const parts = errorPath.split('.');
  const fieldName = parts[parts.length - 1];
  const isInItems = errorPath.startsWith('items.');
  const isInSubItems = errorPath.includes('.subItems.');
  
  // 4. Para campos de data (startDate/endDate), buscar botão PopoverTrigger
  if (fieldName === 'startDate' || fieldName === 'endDate') {
    // Estratégia específica para campos de data...
  }
  
  // 5. Para Select, buscar SelectTrigger
  if (fieldName === 'areaId' || fieldName === 'status' || fieldName === 'priority') {
    // Estratégia específica para Select...
  }
  
  // 6. Fallback: buscar pelo fieldName genérico
  element = document.querySelector(`#${fieldName}`) || 
            document.querySelector(`[name="${fieldName}"]`);
  
  return element;
};
```

## Ordem de Implementação

1. **Passo 1**: Criar função `findElementByErrorPath` com todas as estratégias de busca
2. **Passo 2**: Adicionar `data-field-path` aos campos da iniciativa (campos simples primeiro)
3. **Passo 3**: Adicionar `data-field-path` aos campos de items
4. **Passo 4**: Adicionar `data-field-path` aos campos de subitems
5. **Passo 5**: Refatorar handler `onError` para usar a nova função
6. **Passo 6**: Testar todos os tipos de erros e ajustar conforme necessário

## Testes Necessários

- [ ] Erro em campo simples da iniciativa (title, owner)
- [ ] Erro em campo de data da iniciativa (startDate, endDate)
- [ ] Erro em Select da iniciativa (areaId, status, priority)
- [ ] Erro em campo de item (title, responsible, endDate)
- [ ] Erro em campo de subitem (title, endDate)
- [ ] Erro de validação customizada (items.endDate > initiative.endDate)
- [ ] Erro de validação aninhada (subItems.root)
- [ ] Múltiplos erros simultâneos (deve scrollar para o primeiro)

## Considerações Técnicas

- **Performance**: Usar `document.querySelector` é eficiente, mas evitar múltiplas buscas desnecessárias
- **Acessibilidade**: Manter focus no elemento após scroll pode melhorar a experiência
- **Compatibilidade**: A solução deve funcionar em todos os navegadores modernos
- **Manutenibilidade**: Código deve ser fácil de estender para novos tipos de campos no futuro