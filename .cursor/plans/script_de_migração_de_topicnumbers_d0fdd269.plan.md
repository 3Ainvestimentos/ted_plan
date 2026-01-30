---
name: Script de Migração de TopicNumbers
overview: Criar script Python standalone para migrar topicNumbers de iniciativas de numeração global para numeração sequencial por área e tipo (strategic/other).
todos:
  - id: setup-python-env
    content: Configurar ambiente Python com firebase-admin e python-dotenv
    status: pending
  - id: create-script-structure
    content: Criar estrutura básica do script migrate-topic-numbers.py com funções principais
    status: pending
  - id: implement-firebase-init
    content: Implementar initialize_firebase() com autenticação via service account
    status: pending
    dependencies:
      - setup-python-env
  - id: implement-load-data
    content: Implementar load_all_initiatives() para carregar todas as iniciativas do Firestore
    status: pending
    dependencies:
      - implement-firebase-init
  - id: implement-validation
    content: Implementar validate_initiatives() com validações de campos e formato
    status: pending
    dependencies:
      - implement-load-data
  - id: implement-grouping
    content: Implementar group_by_area_and_type() para agrupar iniciativas por área/tipo
    status: pending
    dependencies:
      - implement-load-data
  - id: implement-migration-logic
    content: Implementar migrate_topic_numbers() com lógica completa de renumeração
    status: pending
    dependencies:
      - implement-grouping
  - id: implement-batch-updates
    content: Implementar apply_updates() com suporte a dry-run e batches de 500
    status: pending
    dependencies:
      - implement-migration-logic
  - id: implement-main-function
    content: Implementar main() com fluxo completo, logging e confirmação
    status: pending
    dependencies:
      - implement-batch-updates
      - implement-validation
  - id: add-cli-arguments
    content: Adicionar parsing de argumentos CLI (--dry-run, --verbose, --log-file, etc)
    status: pending
    dependencies:
      - implement-main-function
  - id: add-logging-system
    content: Implementar sistema de logging detalhado com diferentes níveis
    status: pending
    dependencies:
      - implement-main-function
  - id: test-script-dev
    content: Testar script em ambiente de desenvolvimento com dados reais
    status: pending
    dependencies:
      - add-cli-arguments
      - add-logging-system
---

