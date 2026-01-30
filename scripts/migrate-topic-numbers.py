#!/usr/bin/env python3
"""
Script de migração de topicNumbers por área e tipo.

Este script migra as iniciativas existentes de numeração global (1, 2, 3...)
para numeração sequencial por área e tipo (cada combinação área+tipo tem
sua própria sequência começando em 1).

Funcionalidades:
- Adiciona campo createdAt para iniciativas antigas (baseado em lastUpdate)
- Agrupa iniciativas por área e tipo
- Renumera iniciativas ativas sequencialmente por grupo
- Aplica atualizações em batches de 500 documentos
- Suporta modo dry-run para simulação sem salvar

Uso:
    python scripts/migrate-topic-numbers.py --dry-run
    python scripts/migrate-topic-numbers.py
    python scripts/migrate-topic-numbers.py --log-file migration.log
"""

import firebase_admin
from firebase_admin import credentials, firestore
from collections import defaultdict
import sys
import argparse
from datetime import datetime, timezone
import os
import functools
import logging
from typing import Dict, List, Tuple, Optional


# Configuração padrão
DEFAULT_SERVICE_ACCOUNT = 'ted-plan-286a458fc93c.json'
BATCH_SIZE = 500  # Limite do Firestore


def setup_logging(log_file: Optional[str] = None) -> logging.Logger:
    """
    Configura sistema de logging.
    
    Args:
        log_file: Caminho opcional para arquivo de log
        
    Returns:
        Logger configurado
    """
    logger = logging.getLogger('migration')
    logger.setLevel(logging.INFO)
    
    # Formato do log
    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Handler para console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Handler para arquivo (se especificado)
    if log_file:
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


def initialize_firebase(service_account_path: str = DEFAULT_SERVICE_ACCOUNT) -> firestore.Client:
    """
    Inicializa Firebase Admin SDK usando conta de serviço.
    
    Args:
        service_account_path: Caminho para arquivo de conta de serviço
        
    Returns:
        Cliente Firestore inicializado
        
    Raises:
        FileNotFoundError: Se arquivo de conta de serviço não for encontrado
        ValueError: Se inicialização do Firebase falhar
    """
    if not firebase_admin._apps:
        # Caminho relativo à raiz do projeto
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        cred_path = os.path.join(project_root, service_account_path)
        
        if not os.path.exists(cred_path):
            raise FileNotFoundError(
                f"Service account file not found: {cred_path}\n"
                f"Please ensure the file exists in the project root."
            )
        
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            raise ValueError(f"Failed to initialize Firebase: {e}")
    
    return firestore.client()


def load_all_initiatives(db: firestore.Client, logger: logging.Logger) -> List[Dict]:
    """
    Carrega todas as iniciativas do Firestore.
    
    Args:
        db: Cliente Firestore
        logger: Logger para mensagens
        
    Returns:
        Lista de iniciativas com seus dados
    """
    logger.info("Loading all initiatives from Firestore...")
    
    try:
        initiatives_ref = db.collection('initiatives')
        docs = initiatives_ref.stream()
        
        initiatives = []
        for doc in docs:
            init_data = doc.to_dict()
            init_data['id'] = doc.id
            initiatives.append(init_data)
        
        logger.info(f"Loaded {len(initiatives)} initiatives")
        return initiatives
    
    except Exception as e:
        logger.error(f"Error loading initiatives: {e}")
        raise


def validate_initiatives(initiatives: List[Dict], logger: logging.Logger) -> None:
    """
    Valida iniciativas carregadas.
    
    Args:
        initiatives: Lista de iniciativas
        logger: Logger para mensagens
        
    Raises:
        ValueError: Se validação falhar
    """
    logger.info("Validating initiatives...")
    
    missing_area_id = []
    invalid_topic_number = []
    
    for init in initiatives:
        # Validar areaId
        if not init.get('areaId'):
            missing_area_id.append(init.get('id', 'unknown'))
        
        # Validar topicNumber (deve ser número inteiro, sem pontos)
        topic_number = init.get('topicNumber', '')
        if topic_number and '.' in str(topic_number):
            invalid_topic_number.append({
                'id': init.get('id', 'unknown'),
                'topicNumber': topic_number
            })
    
    if missing_area_id:
        logger.warning(f"Found {len(missing_area_id)} initiatives without areaId")
    
    if invalid_topic_number:
        logger.warning(f"Found {len(invalid_topic_number)} initiatives with invalid topicNumber (contains '.')")
        for item in invalid_topic_number[:5]:  # Mostrar apenas primeiros 5
            logger.warning(f"  - ID: {item['id']}, topicNumber: {item['topicNumber']}")


def add_created_at_for_old_initiatives(
    initiatives: List[Dict],
    logger: logging.Logger
) -> List[Dict]:
    """
    Adiciona createdAt para iniciativas antigas baseado em lastUpdate.
    
    Args:
        initiatives: Lista de iniciativas
        logger: Logger para mensagens
        
    Returns:
        Lista de atualizações de createdAt a serem aplicadas
    """
    logger.info("Checking for initiatives without createdAt...")
    
    created_at_updates = []
    migration_timestamp = datetime.now(timezone.utc).isoformat()
    
    for init in initiatives:
        if 'createdAt' not in init or not init.get('createdAt'):
            # Usar lastUpdate se disponível, senão usar timestamp atual
            created_at = init.get('lastUpdate')
            reason = 'lastUpdate'
            
            if not created_at:
                created_at = migration_timestamp
                reason = 'migration_timestamp'
            
            created_at_updates.append({
                'id': init['id'],
                'createdAt': created_at,
                'reason': reason
            })
    
    logger.info(f"Found {len(created_at_updates)} initiatives without createdAt")
    if created_at_updates:
        last_update_count = sum(1 for u in created_at_updates if u['reason'] == 'lastUpdate')
        migration_count = len(created_at_updates) - last_update_count
        logger.info(f"  - {last_update_count} will use lastUpdate")
        logger.info(f"  - {migration_count} will use migration timestamp")
    
    return created_at_updates


def group_by_area_and_type(initiatives: List[Dict]) -> Dict[str, Dict]:
    """
    Agrupa iniciativas ativas por área e tipo.
    
    Args:
        initiatives: Lista de iniciativas
        
    Returns:
        Dicionário com grupos de iniciativas por área/tipo
    """
    groups = defaultdict(list)
    
    for init in initiatives:
        # Ignorar soft-deleted
        if init.get('deletedAt'):
            continue
        
        area_id = init.get('areaId', 'unknown')
        init_type = init.get('initiativeType', 'strategic')
        key = f"{area_id}::{init_type}"
        
        groups[key].append(init)
    
    return dict(groups)


def sort_initiatives(initiatives: List[Dict]) -> List[Dict]:
    """
    Ordena iniciativas: createdAt quando disponível, senão topicNumber.
    
    Segue exatamente a lógica de renumberAfterDelete() em:
    src/contexts/initiatives-context.tsx:527-540
    
    Args:
        initiatives: Lista de iniciativas
        
    Returns:
        Lista ordenada de iniciativas
    """
    def compare(a: Dict, b: Dict) -> int:
        # Se ambos têm createdAt, ordena por data
        if a.get('createdAt') and b.get('createdAt'):
            try:
                # Converter string ISO para datetime
                a_str = a['createdAt'].replace('Z', '+00:00')
                b_str = b['createdAt'].replace('Z', '+00:00')
                a_time = datetime.fromisoformat(a_str)
                b_time = datetime.fromisoformat(b_str)
                
                if a_time != b_time:
                    delta = (a_time - b_time).total_seconds()
                    return int(delta) if abs(delta) < 1 else (1 if delta > 0 else -1)
            except (ValueError, AttributeError):
                # Se falhar ao parsear, usar fallback
                pass
        
        # Fallback para topicNumber
        a_num = int(a.get('topicNumber', '0') or '0')
        b_num = int(b.get('topicNumber', '0') or '0')
        return a_num - b_num
    
    return sorted(initiatives, key=functools.cmp_to_key(compare))


def calculate_renumbering(
    groups: Dict[str, List[Dict]],
    logger: logging.Logger
) -> List[Dict]:
    """
    Calcula novas numerações para cada grupo.
    
    Args:
        groups: Dicionário com grupos de iniciativas por área/tipo
        logger: Logger para mensagens
        
    Returns:
        Lista de atualizações de topicNumber
    """
    logger.info(f"Calculating renumbering for {len(groups)} groups...")
    
    updates = []
    
    for key, group_initiatives in groups.items():
        area_id, init_type = key.split('::')
        
        # Ordenar iniciativas do grupo
        sorted_initiatives = sort_initiatives(group_initiatives)
        
        # Renumerar sequencialmente começando em 1
        for index, init in enumerate(sorted_initiatives, start=1):
            new_number = str(index)
            old_number = str(init.get('topicNumber', ''))
            
            # Só adicionar atualização se o número mudou
            if old_number != new_number:
                updates.append({
                    'id': init['id'],
                    'oldTopicNumber': old_number,
                    'newTopicNumber': new_number,
                    'areaId': area_id,
                    'initiativeType': init_type
                })
        
        logger.info(f"  - Group {key}: {len(sorted_initiatives)} initiatives, "
                   f"{sum(1 for u in updates if u.get('areaId') == area_id and u.get('initiativeType') == init_type)} updates")
    
    logger.info(f"Total updates needed: {len(updates)}")
    return updates


def apply_updates(
    db: firestore.Client,
    created_at_updates: List[Dict],
    topic_number_updates: List[Dict],
    dry_run: bool,
    logger: logging.Logger
) -> None:
    """
    Aplica atualizações em batches.
    
    Args:
        db: Cliente Firestore
        created_at_updates: Lista de atualizações de createdAt
        topic_number_updates: Lista de atualizações de topicNumber
        dry_run: Se True, não salva no Firestore
        logger: Logger para mensagens
    """
    if dry_run:
        logger.info("DRY-RUN mode: No changes will be saved")
    
    # Aplicar createdAt primeiro
    if created_at_updates:
        logger.info(f"Applying {len(created_at_updates)} createdAt updates...")
        
        if not dry_run:
            for i in range(0, len(created_at_updates), BATCH_SIZE):
                batch = db.batch()
                chunk = created_at_updates[i:i + BATCH_SIZE]
                
                for update in chunk:
                    ref = db.collection('initiatives').document(update['id'])
                    batch.update(ref, {'createdAt': update['createdAt']})
                
                batch.commit()
                logger.info(f"  - Batch {i // BATCH_SIZE + 1}: {len(chunk)} updates applied")
        else:
            logger.info(f"  - Would apply {len(created_at_updates)} createdAt updates")
    
    # Aplicar topicNumber
    if topic_number_updates:
        logger.info(f"Applying {len(topic_number_updates)} topicNumber updates...")
        
        if not dry_run:
            for i in range(0, len(topic_number_updates), BATCH_SIZE):
                batch = db.batch()
                chunk = topic_number_updates[i:i + BATCH_SIZE]
                
                for update in chunk:
                    ref = db.collection('initiatives').document(update['id'])
                    batch.update(ref, {'topicNumber': update['newTopicNumber']})
                
                batch.commit()
                logger.info(f"  - Batch {i // BATCH_SIZE + 1}: {len(chunk)} updates applied")
        else:
            logger.info(f"  - Would apply {len(topic_number_updates)} topicNumber updates")


def generate_report(
    initiatives: List[Dict],
    created_at_updates: List[Dict],
    topic_number_updates: List[Dict],
    groups: Dict[str, List[Dict]],
    logger: logging.Logger
) -> None:
    """
    Gera relatório detalhado da migração.
    
    Args:
        initiatives: Lista completa de iniciativas
        created_at_updates: Lista de atualizações de createdAt
        topic_number_updates: Lista de atualizações de topicNumber
        groups: Grupos de iniciativas por área/tipo
        logger: Logger para mensagens
    """
    logger.info("\n" + "="*60)
    logger.info("MIGRATION REPORT")
    logger.info("="*60)
    
    # Estatísticas gerais
    total_initiatives = len(initiatives)
    active_initiatives = sum(1 for i in initiatives if not i.get('deletedAt'))
    soft_deleted = total_initiatives - active_initiatives
    
    logger.info(f"\nTotal initiatives: {total_initiatives}")
    logger.info(f"  - Active: {active_initiatives}")
    logger.info(f"  - Soft-deleted: {soft_deleted}")
    
    # Estatísticas de createdAt
    logger.info(f"\nCreatedAt updates: {len(created_at_updates)}")
    if created_at_updates:
        last_update_count = sum(1 for u in created_at_updates if u['reason'] == 'lastUpdate')
        migration_count = len(created_at_updates) - last_update_count
        logger.info(f"  - Based on lastUpdate: {last_update_count}")
        logger.info(f"  - Based on migration timestamp: {migration_count}")
    
    # Estatísticas de topicNumber
    logger.info(f"\nTopicNumber updates: {len(topic_number_updates)}")
    
    # Estatísticas por grupo
    logger.info(f"\nGroups (area + type): {len(groups)}")
    for key, group_initiatives in sorted(groups.items()):
        area_id, init_type = key.split('::')
        updates_count = sum(1 for u in topic_number_updates 
                          if u.get('areaId') == area_id and u.get('initiativeType') == init_type)
        logger.info(f"  - {key}: {len(group_initiatives)} initiatives, {updates_count} updates")
    
    logger.info("\n" + "="*60)


def main():
    """Função principal do script."""
    parser = argparse.ArgumentParser(
        description='Migrate topicNumbers from global to per-area/type numbering',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry-run (simulate without saving)
  python scripts/migrate-topic-numbers.py --dry-run
  
  # Execute migration
  python scripts/migrate-topic-numbers.py
  
  # With log file
  python scripts/migrate-topic-numbers.py --log-file migration.log
        """
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simulate migration without saving changes'
    )
    
    parser.add_argument(
        '--log-file',
        type=str,
        help='Path to log file'
    )
    
    parser.add_argument(
        '--service-account',
        type=str,
        default=DEFAULT_SERVICE_ACCOUNT,
        help=f'Path to service account JSON file (default: {DEFAULT_SERVICE_ACCOUNT})'
    )
    
    args = parser.parse_args()
    
    # Configurar logging
    logger = setup_logging(args.log_file)
    
    try:
        logger.info("Starting migration script...")
        logger.info(f"Mode: {'DRY-RUN' if args.dry_run else 'LIVE'}")
        
        # Inicializar Firebase
        logger.info("Initializing Firebase...")
        db = initialize_firebase(args.service_account)
        logger.info("Firebase initialized successfully")
        
        # Carregar iniciativas
        initiatives = load_all_initiatives(db, logger)
        
        if not initiatives:
            logger.warning("No initiatives found. Exiting.")
            return
        
        # Validar iniciativas
        validate_initiatives(initiatives, logger)
        
        # Adicionar createdAt para iniciativas antigas
        created_at_updates = add_created_at_for_old_initiatives(initiatives, logger)
        
        # Agrupar por área e tipo
        logger.info("Grouping initiatives by area and type...")
        groups = group_by_area_and_type(initiatives)
        logger.info(f"Found {len(groups)} groups")
        
        # Calcular renumerações
        topic_number_updates = calculate_renumbering(groups, logger)
        
        # Gerar relatório
        generate_report(initiatives, created_at_updates, topic_number_updates, groups, logger)
        
        # Confirmar antes de executar (exceto dry-run)
        if not args.dry_run:
            logger.info("\n" + "="*60)
            response = input("Do you want to proceed with the migration? (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                logger.info("Migration cancelled by user.")
                return
            logger.info("Proceeding with migration...")
        
        # Aplicar atualizações
        apply_updates(db, created_at_updates, topic_number_updates, args.dry_run, logger)
        
        if args.dry_run:
            logger.info("\nDRY-RUN completed. No changes were saved.")
        else:
            logger.info("\nMigration completed successfully!")
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        sys.exit(1)
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
