"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInitiatives } from "@/contexts/initiatives-context";
import Papa from "papaparse";
import type { InitiativePriority, InitiativeStatus, InitiativeItem, SubItem } from "@/types";
import { LoadingSpinner } from "../ui/loading-spinner";
import { doc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ImportInitiativesModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Interface para representar uma linha do CSV com estrutura hierárquica
 */
interface CSVRow {
    // Campos da iniciativa
    title?: string;
    owner?: string;
    description?: string;
    status?: string;
    priority?: string;
    startDate?: string; // Data de início (opcional)
    endDate?: string; // Data de fim (obrigatório)
    areaId?: string;
    
    // Campos do item
    item_title?: string;
    item_startDate?: string; // Data de início do item (opcional)
    item_endDate?: string; // Data de fim do item (obrigatório)
    item_status?: string;
    item_areaId?: string;
    item_priority?: string;
    item_description?: string;
    item_responsible?: string;
    
    // Campos do subitem
    subitem_title?: string;
    subitem_startDate?: string; // Data de início do subitem (opcional)
    subitem_endDate?: string; // Data de fim do subitem (obrigatório)
    subitem_status?: string;
    subitem_responsible?: string;
    subitem_priority?: string;
    subitem_description?: string;
}

/**
 * Agrupa linhas do CSV por iniciativa, item e subitem
 * 
 * @param rows - Array de linhas do CSV
 * @returns Array de iniciativas com itens e subitens agrupados (usando startDate e endDate)
 */
function groupCSVRowsByHierarchy(rows: CSVRow[]): Array<{
    title: string;
    owner: string;
    description?: string;
    status: InitiativeStatus;
    priority: InitiativePriority;
    startDate: string;
    endDate: string;
    areaId: string;
    items: Array<{
        title: string;
        startDate: string;
        endDate: string;
        status: InitiativeStatus;
        areaId: string;
        priority: InitiativePriority;
        description?: string;
        responsible: string;
        subItems: Array<{
            title: string;
            startDate: string;
            endDate: string;
            status: InitiativeStatus;
            responsible: string;
            priority: InitiativePriority;
            description?: string;
        }>;
    }>;
}> {
    const initiativesMap = new Map<string, {
        title: string;
        owner: string;
        description?: string;
        status: InitiativeStatus;
        priority: InitiativePriority;
        startDate: string;
        endDate: string;
        areaId: string;
        items: Map<string, {
            title: string;
            startDate: string;
            endDate: string;
            status: InitiativeStatus;
            areaId: string;
            priority: InitiativePriority;
            description?: string;
            responsible: string;
            subItems: Array<{
                title: string;
                startDate: string;
                endDate: string;
                status: InitiativeStatus;
                responsible: string;
                priority: InitiativePriority;
                description?: string;
            }>;
        }>;
    }>();

    rows.forEach((row, index) => {
        // Validar campos obrigatórios da iniciativa
        if (!row.title || !row.owner || !row.status || !row.priority || !row.startDate || !row.endDate || !row.areaId) {
            throw new Error(`Linha ${index + 2}: Campos obrigatórios da iniciativa faltando. Requeridos: title, owner, status, priority, startDate, endDate, areaId`);
        }

        // Validar campos obrigatórios do item
        if (!row.item_title || !row.item_startDate || !row.item_endDate || !row.item_status || !row.item_areaId || !row.item_priority || !row.item_responsible) {
            throw new Error(`Linha ${index + 2}: Campos obrigatórios do item faltando. Requeridos: item_title, item_startDate, item_endDate, item_status, item_areaId, item_priority, item_responsible`);
        }

        // Validar status e priority
        const validStatuses: InitiativeStatus[] = ['Pendente', 'Em execução', 'Concluído', 'Suspenso'];
        const validPriorities: InitiativePriority[] = ['Baixa', 'Média', 'Alta'];

        if (!validStatuses.includes(row.status as InitiativeStatus)) {
            throw new Error(`Linha ${index + 2}: Status inválido "${row.status}". Valores válidos: ${validStatuses.join(', ')}`);
        }

        if (!validPriorities.includes(row.priority as InitiativePriority)) {
            throw new Error(`Linha ${index + 2}: Prioridade inválida "${row.priority}". Valores válidos: ${validPriorities.join(', ')}`);
        }

        if (!validStatuses.includes(row.item_status as InitiativeStatus)) {
            throw new Error(`Linha ${index + 2}: Status do item inválido "${row.item_status}". Valores válidos: ${validStatuses.join(', ')}`);
        }

        if (!validPriorities.includes(row.item_priority as InitiativePriority)) {
            throw new Error(`Linha ${index + 2}: Prioridade do item inválida "${row.item_priority}". Valores válidos: ${validPriorities.join(', ')}`);
        }

        // Validar datas da iniciativa
        const startDate = new Date(row.startDate!);
        if (isNaN(startDate.getTime())) {
            throw new Error(`Linha ${index + 2}: Data de início inválida "${row.startDate}". Formato esperado: YYYY-MM-DD`);
        }

        const endDate = new Date(row.endDate!);
        if (isNaN(endDate.getTime())) {
            throw new Error(`Linha ${index + 2}: Data de fim inválida "${row.endDate}". Formato esperado: YYYY-MM-DD`);
        }

        if (endDate < startDate) {
            throw new Error(`Linha ${index + 2}: A data de fim deve ser maior ou igual à data de início.`);
        }

        // Validar datas do item
        const itemStartDate = new Date(row.item_startDate!);
        if (isNaN(itemStartDate.getTime())) {
            throw new Error(`Linha ${index + 2}: Data de início do item inválida "${row.item_startDate}". Formato esperado: YYYY-MM-DD`);
        }

        const itemEndDate = new Date(row.item_endDate!);
        if (isNaN(itemEndDate.getTime())) {
            throw new Error(`Linha ${index + 2}: Data de fim do item inválida "${row.item_endDate}". Formato esperado: YYYY-MM-DD`);
        }

        if (itemEndDate < itemStartDate) {
            throw new Error(`Linha ${index + 2}: A data de fim do item deve ser maior ou igual à data de início.`);
        }

        // Obter ou criar iniciativa
        const initiativeKey = row.title.trim();
        if (!initiativesMap.has(initiativeKey)) {
            initiativesMap.set(initiativeKey, {
                title: row.title.trim(),
                owner: row.owner.trim(),
                description: row.description?.trim() || '',
                status: row.status as InitiativeStatus,
                priority: row.priority as InitiativePriority,
                startDate: row.startDate!.trim(),
                endDate: row.endDate!.trim(),
                areaId: row.areaId.trim(),
                items: new Map(),
            });
        }

        const initiative = initiativesMap.get(initiativeKey)!;

        // Obter ou criar item
        const itemKey = row.item_title.trim();
        if (!initiative.items.has(itemKey)) {
            initiative.items.set(itemKey, {
                title: row.item_title.trim(),
                startDate: row.item_startDate!.trim(),
                endDate: row.item_endDate!.trim(),
                status: row.item_status as InitiativeStatus,
                areaId: row.item_areaId.trim(),
                priority: row.item_priority as InitiativePriority,
                description: row.item_description?.trim() || '',
                responsible: row.item_responsible.trim(),
                subItems: [],
            });
        }

        const item = initiative.items.get(itemKey)!;

        // Adicionar subitem se presente (todos os campos ou nenhum)
        const hasSubItemFields = row.subitem_title || row.subitem_startDate || row.subitem_endDate || row.subitem_status || 
                                 row.subitem_responsible || row.subitem_priority || row.subitem_description;
        
        if (hasSubItemFields) {
            // Validar que todos os campos obrigatórios do subitem estão presentes
            if (!row.subitem_title || !row.subitem_startDate || !row.subitem_endDate || !row.subitem_status || 
                !row.subitem_responsible || !row.subitem_priority) {
                throw new Error(`Linha ${index + 2}: Se houver campos de subitem, todos os campos obrigatórios devem estar presentes. Requeridos: subitem_title, subitem_startDate, subitem_endDate, subitem_status, subitem_responsible, subitem_priority`);
            }

            // Validar status e priority do subitem
            if (!validStatuses.includes(row.subitem_status as InitiativeStatus)) {
                throw new Error(`Linha ${index + 2}: Status do subitem inválido "${row.subitem_status}". Valores válidos: ${validStatuses.join(', ')}`);
            }

            if (!validPriorities.includes(row.subitem_priority as InitiativePriority)) {
                throw new Error(`Linha ${index + 2}: Prioridade do subitem inválida "${row.subitem_priority}". Valores válidos: ${validPriorities.join(', ')}`);
            }

            // Validar datas do subitem
            const subItemStartDate = new Date(row.subitem_startDate);
            if (isNaN(subItemStartDate.getTime())) {
                throw new Error(`Linha ${index + 2}: Data de início do subitem inválida "${row.subitem_startDate}". Formato esperado: YYYY-MM-DD`);
            }

            const subItemEndDate = new Date(row.subitem_endDate);
            if (isNaN(subItemEndDate.getTime())) {
                throw new Error(`Linha ${index + 2}: Data de fim do subitem inválida "${row.subitem_endDate}". Formato esperado: YYYY-MM-DD`);
            }

            if (subItemEndDate < subItemStartDate) {
                throw new Error(`Linha ${index + 2}: A data de fim do subitem deve ser maior ou igual à data de início.`);
            }

            item.subItems.push({
                title: row.subitem_title.trim(),
                startDate: row.subitem_startDate.trim(),
                endDate: row.subitem_endDate.trim(),
                status: row.subitem_status as InitiativeStatus,
                responsible: row.subitem_responsible.trim(),
                priority: row.subitem_priority as InitiativePriority,
                description: row.subitem_description?.trim() || '',
            });
        }
    });

    // Converter Map para Array
    const initiatives = Array.from(initiativesMap.values()).map(initiative => ({
        ...initiative,
        items: Array.from(initiative.items.values()),
    }));

    // Validar que cada iniciativa tem pelo menos 1 item
    initiatives.forEach((init, index) => {
        if (init.items.length === 0) {
            throw new Error(`Iniciativa "${init.title}" não possui itens. Cada iniciativa deve ter pelo menos 1 item.`);
        }
    });

    return initiatives;
}

export function ImportInitiativesModal({ isOpen, onOpenChange }: ImportInitiativesModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const { bulkAddInitiatives } = useInitiatives();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
            setSelectedFile(file);
        } else {
            toast({
                variant: "destructive",
                title: "Arquivo Inválido",
                description: "Por favor, selecione um arquivo no formato .csv",
            });
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleImport = () => {
        if (!selectedFile) return;

        setIsImporting(true);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    // Validar que o arquivo tem pelo menos uma linha de dados
                    if (!results.data || results.data.length === 0) {
                        throw new Error("O arquivo CSV está vazio ou não contém dados.");
                    }

                    // Validar campos obrigatórios básicos
                    const requiredInitiativeFields = ['title', 'owner', 'status', 'priority', 'startDate', 'endDate', 'areaId'];
                    const requiredItemFields = ['item_title', 'item_startDate', 'item_endDate', 'item_status', 'item_areaId', 'item_priority', 'item_responsible'];
                    const fileFields = results.meta.fields || [];
                    
                    const missingInitiativeFields = requiredInitiativeFields.filter(field => !fileFields.includes(field));
                    const missingItemFields = requiredItemFields.filter(field => !fileFields.includes(field));
                    
                    if (missingInitiativeFields.length > 0) {
                        throw new Error(`O arquivo CSV deve conter as colunas obrigatórias da iniciativa: ${missingInitiativeFields.join(', ')}.`);
                    }

                    if (missingItemFields.length > 0) {
                        throw new Error(`O arquivo CSV deve conter as colunas obrigatórias do item: ${missingItemFields.join(', ')}.`);
                    }

                    // Agrupar linhas por hierarquia
                    const groupedInitiatives = groupCSVRowsByHierarchy(results.data as CSVRow[]);

                    if (groupedInitiatives.length === 0) {
                        throw new Error("Nenhuma iniciativa válida foi encontrada no arquivo CSV.");
                    }

                    // Importar iniciativas
                    bulkAddInitiatives(groupedInitiatives as any);
                    
                    const totalItems = groupedInitiatives.reduce((sum, init) => sum + init.items.length, 0);
                    const totalSubItems = groupedInitiatives.reduce((sum, init) => 
                        sum + init.items.reduce((itemSum, item) => itemSum + item.subItems.length, 0), 0
                    );

                    toast({
                        title: "Importação bem-sucedida!",
                        description: `${groupedInitiatives.length} iniciativa(s), ${totalItems} item(ns) e ${totalSubItems} subitem(ns) foram adicionados.`,
                    });
                    handleClose();
                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Erro na Importação",
                        description: error.message || "Não foi possível processar o arquivo CSV.",
                    });
                } finally {
                    setIsImporting(false);
                }
            },
            error: (error: any) => {
                toast({
                    variant: "destructive",
                    title: "Erro de Leitura",
                    description: `Falha ao ler o arquivo: ${error.message}`,
                });
                setIsImporting(false);
            }
        });
    };

    const handleClose = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importar Iniciativas via CSV</DialogTitle>
                    <DialogDescription>
                        Faça o upload de um arquivo CSV para adicionar múltiplas iniciativas de uma só vez.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-secondary/50 rounded-lg border border-dashed">
                        <h4 className="text-sm font-semibold mb-2">Instruções</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p><strong>Estrutura Hierárquica:</strong></p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>Cada iniciativa DEVE ter pelo menos 1 item</li>
                                <li>Cada item pode ter 0 ou mais subitens</li>
                            </ul>
                            
                            <p className="mt-3"><strong>Campos Obrigatórios da Iniciativa:</strong></p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li><code className="bg-muted px-1 py-0.5 rounded">title</code> - Título da iniciativa (mín. 5 caracteres)</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">owner</code> - Responsável da iniciativa</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">status</code> - Pendente, Em execução, Concluído ou Suspenso</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">priority</code> - Baixa, Média ou Alta</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">startDate</code> - Data de início no formato YYYY-MM-DD</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">endDate</code> - Data de fim no formato YYYY-MM-DD</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">areaId</code> - ID da área de negócio</li>
                            </ul>

                            <p className="mt-3"><strong>Campos Obrigatórios do Item:</strong></p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li><code className="bg-muted px-1 py-0.5 rounded">item_title</code> - Título do item (mín. 3 caracteres)</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">item_startDate</code> - Data de início no formato YYYY-MM-DD</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">item_endDate</code> - Data de fim no formato YYYY-MM-DD</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">item_status</code> - Pendente, Em execução, Concluído ou Suspenso</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">item_areaId</code> - ID da área (geralmente igual ao areaId da iniciativa)</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">item_priority</code> - Baixa, Média ou Alta</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">item_responsible</code> - Responsável do item</li>
                            </ul>

                            <p className="mt-3"><strong>Campos Opcionais:</strong></p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li><code className="bg-muted px-1 py-0.5 rounded">description</code> - Descrição da iniciativa</li>
                                <li><code className="bg-muted px-1 py-0.5 rounded">item_description</code> - Descrição do item</li>
                                <li>Campos de subitem (se presentes, todos são obrigatórios): <code className="bg-muted px-1 py-0.5 rounded">subitem_title</code>, <code className="bg-muted px-1 py-0.5 rounded">subitem_startDate</code>, <code className="bg-muted px-1 py-0.5 rounded">subitem_endDate</code>, <code className="bg-muted px-1 py-0.5 rounded">subitem_status</code>, <code className="bg-muted px-1 py-0.5 rounded">subitem_responsible</code>, <code className="bg-muted px-1 py-0.5 rounded">subitem_priority</code>, <code className="bg-muted px-1 py-0.5 rounded">subitem_description</code></li>
                            </ul>
                        </div>
                    </div>

                    <Button variant="outline" asChild>
                        <a href="/template_iniciativas.csv" download>
                            <Download className="mr-2 h-4 w-4" /> Baixar Modelo
                        </a>
                    </Button>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".csv"
                        className="hidden"
                    />

                    <Button variant="outline" className="w-full" onClick={triggerFileSelect}>
                        <Upload className="mr-2 h-4 w-4" />
                        {selectedFile ? 'Trocar Arquivo' : 'Anexar Planilha CSV'}
                    </Button>

                    {selectedFile && (
                        <div className="flex items-center justify-center text-sm text-muted-foreground p-2 bg-secondary/50 rounded-md">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>{selectedFile.name}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
                        {isImporting ? (
                            <>
                                <LoadingSpinner className="mr-2 h-4 w-4" />
                                Importando...
                            </>
                        ) : (
                            'Importar Iniciativas'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
