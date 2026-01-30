# Script de Migração de TopicNumbers

Script Python para migrar `topicNumbers` de iniciativas de numeração global para numeração sequencial por área e tipo.

## Objetivo

Este script migra as iniciativas existentes de numeração global (1, 2, 3...) para numeração sequencial por área e tipo. Cada combinação de área + tipo terá sua própria sequência começando em 1.

## Pré-requisitos

- Python 3.8 ou superior
- Conta de serviço do Firebase (`ted-plan-286a458fc93c.json` na raiz do projeto)
- Acesso ao Firestore do projeto `ted-plan`

## Instalação

1. Instale as dependências:

```bash
pip install -r scripts/requirements.txt
```

## Uso

### Modo Dry-Run (Simulação)

Execute o script em modo dry-run para simular a migração sem salvar alterações:

```bash
python scripts/migrate-topic-numbers.py --dry-run
```

### Executar Migração

Execute o script para aplicar a migração:

```bash
python scripts/migrate-topic-numbers.py
```

O script pedirá confirmação antes de aplicar as mudanças.

### Com Arquivo de Log

Para salvar o log em arquivo:

```bash
python scripts/migrate-topic-numbers.py --log-file migration.log
```

### Opções Disponíveis

- `--dry-run`: Simula a migração sem salvar alterações
- `--log-file <arquivo>`: Salva o log em arquivo
- `--service-account <caminho>`: Especifica caminho customizado para conta de serviço (padrão: `ted-plan-286a458fc93c.json`)

## O que o Script Faz

1. **Carrega todas as iniciativas** do Firestore
2. **Valida** os dados (areaId, topicNumber, etc.)
3. **Adiciona `createdAt`** para iniciativas antigas:
   - Usa `lastUpdate` se disponível
   - Usa timestamp atual da migração se `lastUpdate` não existir
4. **Agrupa iniciativas** por `areaId` + `initiativeType`
5. **Ordena iniciativas** em cada grupo:
   - Por `createdAt` quando disponível (ordenação cronológica)
   - Por `topicNumber` atual quando `createdAt` não disponível
6. **Renumera sequencialmente** cada grupo (1, 2, 3...)
7. **Aplica atualizações** em batches de 500 documentos

## Segurança

- O script **nunca executa sem confirmação** (exceto em modo dry-run)
- Todas as operações são **validadas** antes de aplicar
- Atualizações são aplicadas em **batches** para evitar timeouts
- **Logs detalhados** de todas as operações
- **Tratamento de erros** robusto

## Backup Recomendado

Antes de executar a migração, é recomendado fazer backup dos dados:

1. Exportar dados do Firestore via Console
2. Ou usar script de backup separado

## Exemplo de Saída

```
2024-01-15 10:30:00 - INFO - Starting migration script...
2024-01-15 10:30:00 - INFO - Mode: DRY-RUN
2024-01-15 10:30:00 - INFO - Initializing Firebase...
2024-01-15 10:30:01 - INFO - Firebase initialized successfully
2024-01-15 10:30:01 - INFO - Loading all initiatives from Firestore...
2024-01-15 10:30:02 - INFO - Loaded 150 initiatives
2024-01-15 10:30:02 - INFO - Validating initiatives...
2024-01-15 10:30:02 - INFO - Checking for initiatives without createdAt...
2024-01-15 10:30:02 - INFO - Found 120 initiatives without createdAt
2024-01-15 10:30:02 - INFO - Grouping initiatives by area and type...
2024-01-15 10:30:02 - INFO - Found 8 groups
2024-01-15 10:30:02 - INFO - Calculating renumbering for 8 groups...
2024-01-15 10:30:02 - INFO - Total updates needed: 45

============================================================
MIGRATION REPORT
============================================================

Total initiatives: 150
  - Active: 130
  - Soft-deleted: 20

CreatedAt updates: 120
  - Based on lastUpdate: 115
  - Based on migration timestamp: 5

TopicNumber updates: 45

Groups (area + type): 8
  - area-1::strategic: 25 initiatives, 10 updates
  - area-1::other: 15 initiatives, 5 updates
  ...

============================================================
```

## Notas Importantes

- O script deve ser executado **uma única vez**
- Após a migração, novas iniciativas já usarão `getNextTopicNumberForArea()`
- Soft deletes futuros usarão `renumberAfterDelete()` automaticamente
- Não há necessidade de executar novamente após migração inicial

## Troubleshooting

### Erro: "Service account file not found"

Certifique-se de que o arquivo `ted-plan-286a458fc93c.json` está na raiz do projeto.

### Erro: "Failed to initialize Firebase"

Verifique se a conta de serviço tem permissões adequadas no Firestore.

### Erro durante batch update

O script continuará com os próximos batches mesmo se um falhar. Verifique os logs para identificar qual batch falhou.

## Suporte

Em caso de problemas, verifique:
1. Logs do script
2. Permissões da conta de serviço
3. Conectividade com Firestore
4. Formato dos dados no Firestore
