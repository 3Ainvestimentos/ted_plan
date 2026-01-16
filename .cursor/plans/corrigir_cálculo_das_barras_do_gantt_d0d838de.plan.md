---
name: Corrigir cálculo das barras do Gantt
overview: Corrigir a lógica de cálculo de barEndIndex que está fazendo as barras terminarem depois da data real quando não encontra um dia posterior no array dateHeaders. O problema ocorre quando uma tarefa termina dentro do período visível mas não há um dia posterior disponível no array.
todos:
  - id: "1"
    content: Criar função helper findBarEndIndex para encapsular a lógica correta de cálculo do índice final da barra
    status: completed
  - id: "2"
    content: Substituir cálculo de barEndIndex para iniciativas (linhas ~1095-1107) pela nova função
    status: completed
  - id: "3"
    content: Substituir cálculo de barEndIndex para itens (linhas ~1399-1409) pela nova função
    status: completed
  - id: "4"
    content: Substituir cálculo de barEndIndex para sub-itens (linhas ~1642-1652) pela nova função
    status: completed
  - id: "5"
    content: Testar visualmente as barras do Gantt com diferentes cenários de datas
    status: pending
---

# Plano para Corrigir Barras do Gantt

## Problema Identificado

O cálculo de `barEndIndex` está incorreto de forma sistemática, afetando TODAS as barras do Gantt. O problema principal ocorre quando uma tarefa termina dentro do período visível mas não há um dia posterior disponível no array `dateHeaders`, fazendo com que a barra sempre termine no último dia do array, independente da data real.

**Causa raiz do bug:**

A lógica atual sempre assume que, se não encontrar um dia posterior no array, a tarefa deve terminar no último dia disponível. Isso causa inconsistências visuais onde:

- Tarefas que terminam antes parecem terminar depois
- A hierarquia visual (sub-itens ≤ itens ≤ iniciativas) não é respeitada
- As barras não refletem as datas reais das tarefas

**Exemplo do bug:**

- Item termina em 28/01/2026
- Iniciativa termina em 30/01/2026
- Array `dateHeaders` vai até 30/01/2026
- O código procura o primeiro dia onde `dayTime > taskTime` (29/01)
- Como 29/01 não existe no array, `findIndex` retorna -1
- O código define `barEndIndex = dateHeaders.length` (ex: índice 55)
- Depois subtrai 1: `barEndIndex = 54`
- O índice 54 é 30/01, fazendo a barra do item terminar no mesmo dia (ou depois) da iniciativa

**Este mesmo problema se repete para todas as barras que terminam próximo ao final do período visível.**

**Lógica atual (linhas 1095-1107, 1399-1409, 1642-1652):**

```typescript
barEndIndex = dateHeaders.findIndex(day => {
  const dayStart = startOfDay(day);
  const dayTime = dayStart.getTime();
  const taskTime = taskEnd.getTime();
  return dayTime > taskTime;  // Procura primeiro dia APÓS o fim
});

if (barEndIndex < 0) {
  barEndIndex = dateHeaders.length;  // ❌ PROBLEMA: Assume último dia + 1
}
barEndIndex = barEndIndex - 1;  // ❌ Se não encontrou, vai para último dia do array
```

## Solução

Ajustar a lógica para, quando não encontrar um dia posterior, buscar o índice do dia que corresponde exatamente ao `taskEnd` ou o último dia disponível que seja menor ou igual ao `taskEnd`.

**Nova lógica:**

1. Tentar encontrar o primeiro dia posterior (`dayTime > taskTime`)
2. Se encontrar, usar esse índice - 1 (dia anterior, que é o último dia da tarefa)
3. Se não encontrar, buscar o índice do último dia onde `dayTime <= taskTime` (o próprio dia final ou o mais próximo disponível)
4. Se ainda assim não encontrar (tarefa termina antes do período), usar o primeiro dia do array

## Arquivos a Modificar

- `src/components/initiatives/table-gantt-view.tsx`
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Linhas 1095-1107: Cálculo de `barEndIndex` para iniciativas
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Linhas 1399-1409: Cálculo de `barEndIndex` para itens
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Linhas 1642-1652: Cálculo de `barEndIndex` para sub-itens

## Implementação

Criar uma função helper `findBarEndIndex` que encapsula a lógica correta:

```typescript
/**
 * Encontra o índice do último dia da barra do Gantt
 * @param dateHeaders Array de datas do Gantt
 * @param taskEnd Data de fim da tarefa
 * @returns Índice do último dia da barra (inclusive)
 */
function findBarEndIndex(dateHeaders: Date[], taskEnd: Date): number {
  const taskTime = startOfDay(taskEnd).getTime();
  
  // 1. Tenta encontrar o primeiro dia APÓS o fim da tarefa
  const nextDayIndex = dateHeaders.findIndex(day => {
    const dayTime = startOfDay(day).getTime();
    return dayTime > taskTime;
  });
  
  // 2. Se encontrou um dia posterior, o fim da barra é o dia anterior
  if (nextDayIndex >= 0) {
    return nextDayIndex - 1;
  }
  
  // 3. Se não encontrou dia posterior, busca o último dia <= taskEnd
  // Procura de trás para frente para pegar o último dia válido
  for (let i = dateHeaders.length - 1; i >= 0; i--) {
    const dayTime = startOfDay(dateHeaders[i]).getTime();
    if (dayTime <= taskTime) {
      return i;
    }
  }
  
  // 4. Fallback: se tarefa termina antes do período, usa primeiro dia
  return 0;
}
```

Substituir as 3 ocorrências do cálculo de `barEndIndex` pela chamada desta função.

## Validação

Após a correção, TODAS as barras devem refletir corretamente suas datas de início e fim. Testar os seguintes cenários:

1. **Tarefa termina no meio do período** (ex: 28/01, array vai até 30/01) - deve terminar em 28/01
2. **Tarefa termina no último dia do período** (ex: 30/01, array vai até 30/01) - deve terminar em 30/01
3. **Tarefa termina após o período** (ex: 15/02, array vai até 30/01) - deve terminar em 30/01 (limite do período)
4. **Tarefa termina antes do período** (ex: 15/12, array começa em 01/01) - deve começar no primeiro dia
5. **Hierarquia de datas** (sub-item 23/01, item 28/01, iniciativa 30/01) - deve respeitar: sub-item ≤ item ≤ iniciativa visualmente
6. **Múltiplas tarefas com mesmo fim** - devem terminar no mesmo ponto visual

**Resultado esperado:** Todas as barras devem estar consistentes com suas datas, respeitando a hierarquia visual e refletindo corretamente as datas de início e fim indicadas nos tooltips.