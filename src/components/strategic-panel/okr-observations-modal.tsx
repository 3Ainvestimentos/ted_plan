
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Okr } from "@/types";
import { MessageSquare } from "lucide-react";

interface OkrObservationsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    okr: Okr | null;
}

export function OkrObservationsModal({ isOpen, onOpenChange, okr }: OkrObservationsModalProps) {
    if (!okr) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Observações do OKR
                    </DialogTitle>
                    <DialogDescription>
                        {okr.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {okr.observations ? (
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-secondary/50 p-4 rounded-md border">
                            {okr.observations}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Nenhuma observação foi registrada para este OKR.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
