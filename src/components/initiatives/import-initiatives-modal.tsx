
"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInitiatives } from "@/contexts/initiatives-context";
import Papa from "papaparse";
import type { Initiative, InitiativePriority, InitiativeStatus } from "@/types";
import { LoadingSpinner } from "../ui/loading-spinner";

interface ImportInitiativesModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportInitiativesModal({ isOpen, onOpenChange }: ImportInitiativesModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const { bulkAddInitiatives } = useInitiatives();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "text/csv") {
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
                    const requiredFields = ['title', 'owner', 'description', 'status', 'priority'];
                    const fileFields = results.meta.fields || [];
                    
                    if (!requiredFields.every(field => fileFields.includes(field))) {
                        throw new Error(`O arquivo CSV deve conter as colunas: ${requiredFields.join(', ')}.`);
                    }

                    const newInitiatives = results.data.map((row: any) => {
                        if (!row.title || !row.owner || !row.description || !row.status || !row.priority) {
                            throw new Error(`Linha inválida encontrada no CSV. Todos os campos são obrigatórios. Linha: ${JSON.stringify(row)}`);
                        }
                        
                        return {
                            title: row.title,
                            owner: row.owner,
                            description: row.description,
                            status: row.status as InitiativeStatus,
                            priority: row.priority as InitiativePriority,
                            deadline: row.deadline // Pass deadline if available
                        } as Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics'>;
                    });
                    
                    bulkAddInitiatives(newInitiatives as any);
                    toast({
                        title: "Importação bem-sucedida!",
                        description: `${newInitiatives.length} iniciativas foram adicionadas.`,
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Importar Iniciativas via CSV</DialogTitle>
                    <DialogDescription>
                        Faça o upload de um arquivo CSV para adicionar múltiplas iniciativas de uma só vez.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-secondary/50 rounded-lg border border-dashed">
                        <h4 className="text-sm font-semibold mb-2">Instruções</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>O arquivo deve ser no formato .csv.</li>
                            <li>A primeira linha deve conter os cabeçalhos.</li>
                            <li>Colunas obrigatórias: <code className="bg-muted px-1 py-0.5 rounded">title</code>, <code className="bg-muted px-1 py-0.5 rounded">owner</code>, <code className="bg-muted px-1 py-0.5 rounded">description</code>, <code className="bg-muted px-1 py-0.5 rounded">status</code>, <code className="bg-muted px-1 py-0.5 rounded">priority</code>.</li>
                            <li>Coluna opcional: <code className="bg-muted px-1 py-0.5 rounded">deadline</code> (formato AAAA-MM-DD).</li>
                        </ul>
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
