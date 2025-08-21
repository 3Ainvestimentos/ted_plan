
"use client";

import { useState } from "react";
import type { Okr } from "@/types";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { UpsertOkrModal } from "./upsert-okr-modal";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "../ui/progress";

interface OkrManagerProps {
    areaId: string;
    okrs: Okr[];
}

export function OkrManager({ areaId, okrs }: OkrManagerProps) {
    const [modalState, setModalState] = useState<{isOpen: boolean; okr: Okr | null}>({ isOpen: false, okr: null });
    const { deleteOkr } = useStrategicPanel();
    const { toast } = useToast();
    
    const openModal = (okr: Okr | null = null) => setModalState({ isOpen: true, okr });

    const handleDelete = async (okrId: string, okrName: string) => {
        try {
            await deleteOkr(okrId);
            toast({ title: "OKR Removido", description: `O OKR "${okrName}" foi removido.`});
        } catch {
            toast({ variant: 'destructive', title: "Erro", description: `Não foi possível remover o OKR.`});
        }
    };
    
    return (
        <>
            <UpsertOkrModal
                isOpen={modalState.isOpen}
                onOpenChange={(isOpen) => setModalState({ ...modalState, isOpen })}
                areaId={areaId}
                okr={modalState.okr}
            />
            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => openModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar OKR
                    </Button>
                </div>
                {okrs.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50%]">Nome</TableHead>
                                <TableHead>Progresso</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {okrs.map(okr => (
                                <TableRow key={okr.id}>
                                    <TableCell>{okr.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={okr.progress} className="w-24 h-2" />
                                            <span>{okr.progress}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{okr.status}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openModal(okr)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></AlertDialogHeader>
                                                <AlertDialogDescription>Tem certeza que deseja remover o OKR "{okr.name}"?</AlertDialogDescription>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(okr.id, okr.name)}>Remover</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum OKR adicionado a esta área.</p>
                )}
            </div>
        </>
    );
}
