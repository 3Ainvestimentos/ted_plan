
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Download, FileText, Upload } from "lucide-react";
import Papa from 'papaparse';
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useTeamControl } from "@/contexts/team-control-context";

export function PersonnelDataManager() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();
    const { bulkUpdateCollaboratorsFromCSV } = useTeamControl();

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
            setSelectedFile(null);
        }
    };
    
    const handleDownloadTemplate = () => {
        const csvContent = "email,date,cargo,remuneration\njohn.doe@example.com,2024-01-15,Analista Jr,5000\njohn.doe@example.com,2025-02-20,Analista Pleno,7500";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "template_dados_pessoal.csv");
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
                    const requiredFields = ['email', 'date', 'cargo', 'remuneration'];
                    const fileFields = results.meta.fields || [];

                    if (!requiredFields.every(field => fileFields.includes(field))) {
                        throw new Error(`O arquivo CSV deve conter as colunas obrigatórias: ${requiredFields.join(', ')}.`);
                    }

                    await bulkUpdateCollaboratorsFromCSV(results.data as any[]);

                    toast({
                        title: "Importação Concluída",
                        description: "Os dados de pessoal foram atualizados com base no arquivo."
                    });
                    
                    setSelectedFile(null);
                    if(fileInputRef.current) fileInputRef.current.value = "";

                } catch (error: any) {
                     toast({
                        variant: "destructive",
                        title: "Erro na Importação",
                        description: error.message || "Não foi possível processar o arquivo.",
                    });
                } finally {
                    setIsImporting(false);
                }
            },
            error: (err: any) => {
                toast({
                    variant: "destructive",
                    title: "Erro de Leitura",
                    description: `Falha ao ler o arquivo: ${err.message}`,
                });
                setIsImporting(false);
            }
        })
    };


    return (
        <CardContent className="pt-6 space-y-6">
            <div>
                <h3 className="text-lg font-medium">Importar Histórico de Colaboradores</h3>
                <p className="text-sm text-muted-foreground">
                    Faça o upload de um arquivo CSV para adicionar dados de promoções e alterações salariais em massa. O sistema usará o e-mail para vincular os dados a um colaborador existente.
                </p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg border border-dashed space-y-2">
                <h4 className="text-sm font-semibold">Instruções de Upload</h4>
                 <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>O arquivo deve ser no formato .csv.</li>
                    <li>Colunas obrigatórias: <code className="bg-muted px-1 py-0.5 rounded">email</code>, <code className="bg-muted px-1 py-0.5 rounded">date</code>, <code className="bg-muted px-1 py-0.5 rounded">cargo</code>, <code className="bg-muted px-1 py-0.5 rounded">remuneration</code>.</li>
                    <li>A coluna <code className="bg-muted px-1 py-0.5 rounded">date</code> deve estar no formato <code className="bg-muted px-1 py-0.5 rounded">AAAA-MM-DD</code>.</li>
                    <li>Cada linha no arquivo representa um evento (uma promoção e/ou alteração salarial) na carreira de um colaborador.</li>
                </ul>
                 <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="mt-2">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Modelo
                </Button>
            </div>

            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                className="hidden"
            />

            <div className="flex gap-4">
                 <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {selectedFile ? 'Trocar Arquivo' : 'Selecionar Arquivo CSV'}
                </Button>
                <Button onClick={handleImport} disabled={!selectedFile || isImporting} className="w-full">
                    {isImporting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                    Importar Dados
                </Button>
            </div>

             {selectedFile && (
                <div className="flex items-center justify-center text-sm text-muted-foreground p-2 bg-secondary/50 rounded-md">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{selectedFile.name}</span>
                </div>
            )}
        </CardContent>
    );
}
