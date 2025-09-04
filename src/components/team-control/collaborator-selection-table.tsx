
"use client";

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Collaborator } from '@/types';

interface CollaboratorSelectionTableProps {
    collaborators: Collaborator[];
    onSelectionChange: (selected: Collaborator[]) => void;
}

export function CollaboratorSelectionTable({ collaborators, onSelectionChange }: CollaboratorSelectionTableProps) {
    const [selection, setSelection] = useState<Record<string, boolean>>({});
    
    useEffect(() => {
        const selected = collaborators.filter(c => selection[c.id]);
        onSelectionChange(selected);
    }, [selection, collaborators, onSelectionChange]);

    const handleSelect = (collaboratorId: string, isSelected: boolean) => {
        setSelection(prev => ({
            ...prev,
            [collaboratorId]: isSelected
        }));
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo Atual</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {collaborators.map(collaborator => (
                        <TableRow key={collaborator.id}>
                            <TableCell>
                                <Checkbox 
                                    checked={!!selection[collaborator.id]}
                                    onCheckedChange={(checked) => handleSelect(collaborator.id, !!checked)}
                                    id={`select-${collaborator.id}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium">{collaborator.name}</TableCell>
                            <TableCell>{collaborator.cargo}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
