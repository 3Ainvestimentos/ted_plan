
"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollaborators } from "@/contexts/collaborators-context";
import { LoadingSpinner } from "../ui/loading-spinner";
import type { Collaborator } from "@/types";

interface ImportCollaboratorsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportCollaboratorsModal({ isOpen, onOpenChange }: ImportCollaboratorsModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const { bulkAddCollaborators } = useCollaborators();
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
    
    const handleDownloadTemplate = () => {
        const csvContent = "name,email,cargo\n";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "template_colaboradores.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleImport = () => {
        if (!selectedFile) return;

        setIsImporting(true);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const requiredFields = ['name', 'email', 'cargo'];
                    const fileFields = results.meta.fields || [];
                    
                    if (!requiredFields.every(field => fileFields.includes(field))) {
                        throw new Error(`O arquivo CSV deve conter as colunas obrigatórias: ${requiredFields.join(', ')}.`);
                    }

                    const newCollaborators = results.data.map((row: any) => {
                        if (!row.name || !row.email || !row.cargo) {
                            console.warn("Linha ignorada por falta de dados:", row);
                            return null;
                        }
                        
                        return {
                            name: row.name,
                            email: row.email,
                            cargo: row.cargo,
                        } as Omit<Collaborator, 'id'>;
                    }).filter(Boolean); // Remove nulls
                    
                    if(newCollaborators.length > 0) {
                        await bulkAddCollaborators(newCollaborators as any[]);
                        toast({
                            title: "Importação bem-sucedida!",
                            description: `${newCollaborators.length} colaboradores foram adicionados.`,
                        });
                        handleClose();
                    } else {
                         throw new Error("Nenhum colaborador válido encontrado no arquivo.");
                    }
                    
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
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Importar Colaboradores via CSV</DialogTitle>
                    <DialogDescription>
                        Faça o upload de um arquivo CSV para adicionar múltiplos colaboradores.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-secondary/50 rounded-lg border border-dashed">
                        <h4 className="text-sm font-semibold mb-2">Instruções</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>O arquivo deve ser no formato .csv.</li>
                            <li>Colunas obrigatórias: <code className="bg-muted px-1 py-0.5 rounded">name</code>, <code className="bg-muted px-1 py-0.5 rounded">email</code>, <code className="bg-muted px-1 py-0.5 rounded">cargo</code>.</li>
                        </ul>
                    </div>

                    <Button variant="outline" onClick={handleDownloadTemplate}>
                        <Download className="mr-2 h-4 w-4" /> Baixar Modelo
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
                            'Importar Colaboradores'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
