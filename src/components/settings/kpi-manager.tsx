
"use client";

import { useState } from "react";
import type { Kpi } from "@/types";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { UpsertKpiModal } from "./upsert-kpi-modal";
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

interface KpiManagerProps {
    areaId: string;
    kpis: Kpi[];
}

export function KpiManager({ areaId, kpis }: KpiManagerProps) {
    const [modalState, setModalState] = useState<{isOpen: boolean; kpi: Kpi | null}>({ isOpen: false, kpi: null });
    const { deleteKpi } = useStrategicPanel();
    const { toast } = useToast();
    
    const openModal = (kpi: Kpi | null = null) => setModalState({ isOpen: true, kpi });

    const handleDelete = async (kpiId: string, kpiName: string) => {
        try {
            await deleteKpi(kpiId);
            toast({ title: "KPI Removido", description: `O KPI "${kpiName}" foi removido.`});
        } catch {
            toast({ variant: 'destructive', title: "Erro", description: `Não foi possível remover o KPI.`});
        }
    };
    
    return (
        <>
            <UpsertKpiModal
                isOpen={modalState.isOpen}
                onOpenChange={(isOpen) => setModalState({ ...modalState, isOpen })}
                areaId={areaId}
                kpi={modalState.kpi}
            />
            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => openModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar KPI
                    </Button>
                </div>
                {kpis.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60%]">Nome</TableHead>
                                <TableHead>Unidade</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {kpis.map(kpi => (
                                <TableRow key={kpi.id}>
                                    <TableCell>{kpi.name}</TableCell>
                                    <TableCell>{kpi.unit}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openModal(kpi)}>
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
                                                <AlertDialogDescription>Tem certeza que deseja remover o KPI "{kpi.name}"?</AlertDialogDescription>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(kpi.id, kpi.name)}>Remover</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum KPI adicionado a esta área.</p>
                )}
            </div>
        </>
    );
}
