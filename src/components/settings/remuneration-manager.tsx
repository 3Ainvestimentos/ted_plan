
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Download, FileText, Upload, PlusCircle, Edit, Trash2 } from "lucide-react";
import Papa from 'papaparse';
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useTeamControl } from "@/contexts/team-control-context";
import type { Collaborator } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";
import { UpsertRemunerationModal } from "./upsert-remuneration-modal";


export function RemunerationManager() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();
    const { collaborators, isLoading, bulkUpdateRemuneration, updateCollaboratorHistory } = useTeamControl();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{collaborator: Collaborator, remuneration?: any} | null>(null);

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
        const csvContent = "email,date,value\njohn.doe@example.com,2024-01-15,5000";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "template_remuneracao.csv");
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
                    const requiredFields = ['email', 'date', 'value'];
                    const fileFields = results.meta.fields || [];

                    if (!requiredFields.every(field => fileFields.includes(field))) {
                        throw new Error(`O arquivo CSV deve conter as colunas obrigatórias: ${requiredFields.join(', ')}.`);
                    }

                    await bulkUpdateRemuneration(results.data as any[]);

                    toast({
                        title: "Importação Concluída",
                        description: "Os dados de remuneração foram atualizados."
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

    const openAddModal = (collaborator: Collaborator) => {
        setModalData({ collaborator });
        setIsModalOpen(true);
    };

    const openEditModal = (collaborator: Collaborator, remuneration: any) => {
        setModalData({ collaborator, remuneration });
        setIsModalOpen(true);
    };

    const handleDelete = async (collaborator: Collaborator, remunerationToDelete: any) => {
        const updatedHistory = collaborator.remunerationHistory?.filter(r => r.date !== remunerationToDelete.date || r.value !== remunerationToDelete.value) || [];
        await updateCollaboratorHistory(collaborator.id, 'remunerationHistory', updatedHistory);
        toast({ title: "Registro Removido" });
    }

    return (
        <>
        {modalData && (
            <UpsertRemunerationModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                collaborator={modalData.collaborator}
                remuneration={modalData.remuneration}
            />
        )}
        <CardContent className="pt-6 space-y-6">
            <div>
                <h3 className="text-lg font-medium">Gerenciar Histórico de Remuneração</h3>
                <p className="text-sm text-muted-foreground">
                    Adicione ou importe o histórico de salários dos colaboradores.
                </p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg border border-dashed space-y-2">
                <h4 className="text-sm font-semibold">Importar via CSV</h4>
                 <p className="text-sm text-muted-foreground">
                    Faça o upload de um arquivo CSV para adicionar dados em massa. O sistema usará o e-mail para vincular os dados a um colaborador existente.
                </p>
                 <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="mt-2">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Modelo de Remuneração
                </Button>
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
            </div>

            <div className="space-y-4">
                 <h4 className="text-sm font-semibold">Gerenciar Individualmente</h4>
                 {isLoading ? <Skeleton className="h-48 w-full"/> : (
                    collaborators.map(c => (
                        <div key={c.id} className="p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                                <h5 className="font-semibold">{c.name}</h5>
                                <Button size="sm" variant="outline" onClick={() => openAddModal(c)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Registro
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {c.remunerationHistory && c.remunerationHistory.length > 0 ? (
                                        c.remunerationHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((r, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{format(new Date(r.date), "dd/MM/yyyy")}</TableCell>
                                                <TableCell>R$ {r.value.toLocaleString('pt-BR')}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditModal(c, r)}><Edit className="h-4 w-4"/></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                          <AlertDialogHeader><AlertDialogTitle>Remover Registro?</AlertDialogTitle></AlertDialogHeader>
                                                          <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
                                                          <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(c, r)}>Remover</AlertDialogAction>
                                                          </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                      </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-20 text-muted-foreground">Nenhum registro.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ))
                 )}

            </div>
        </CardContent>
        </>
    );
}
