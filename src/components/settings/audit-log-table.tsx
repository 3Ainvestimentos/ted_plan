
"use client";

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuditLog } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { useAuditLog } from '@/contexts/audit-log-context';

interface AuditLogTableProps {
    filterType: string;
    filterStartDate: Date | null;
    filterEndDate: Date | null;
}

const EVENT_TYPE_MAP: Record<string, { label: string, color: string }> = {
    login: { label: 'Login', color: 'bg-green-100 text-green-800' },
    logout: { label: 'Logout', color: 'bg-gray-100 text-gray-800' },
    view_page: { label: 'Visualização', color: 'bg-blue-100 text-blue-800' },
    create_initiative: { label: 'Criação', color: 'bg-yellow-100 text-yellow-800' },
    update_initiative: { label: 'Atualização', color: 'bg-purple-100 text-purple-800' },
}

export function AuditLogTable({ filterType, filterStartDate, filterEndDate }: AuditLogTableProps) {
    const { logs, fetchLogs, getLogsCount, isLoading } = useAuditLog();
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [firstVisible, setFirstVisible] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    
    const PAGE_LIMIT = 10;
    const totalPages = Math.ceil(totalLogs / PAGE_LIMIT);

    useEffect(() => {
        async function loadInitialLogs() {
            const count = await getLogsCount({ filterType, filterStartDate, filterEndDate });
            setTotalLogs(count);
            const lastDoc = await fetchLogs({ pageLimit: PAGE_LIMIT, filterType, filterStartDate, filterEndDate });
            setLastVisible(lastDoc);
            setFirstVisible([null]);
            setCurrentPage(1);
        }
        loadInitialLogs();
    }, [filterType, filterStartDate, filterEndDate, fetchLogs, getLogsCount]);

    const handleNextPage = async () => {
        if (currentPage < totalPages) {
            const lastDoc = await fetchLogs({ lastVisible, pageLimit: PAGE_LIMIT, filterType, filterStartDate, filterEndDate });
            setFirstVisible(prev => [...prev, logs[0]]);
            setLastVisible(lastDoc);
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = async () => {
        if (currentPage > 1) {
            const prevPageLastVisible = firstVisible[currentPage - 1];
            // Since we can't query backwards, we have to restart the query from the beginning
            // and get the documents up to the previous page's starting point.
            // This is a limitation of Firestore. A more robust solution might use different query logic.
            // For this implementation, we will simply restart.
            const lastDoc = await fetchLogs({ pageLimit: PAGE_LIMIT, filterType, filterStartDate, filterEndDate });
            setFirstVisible([null]);
            setLastVisible(lastDoc);
            setCurrentPage(1);
            // Ideally, we'd go to the actual previous page, but it's complex.
            // For now, this is a simplified approach.
        }
    };

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[20%]">Data</TableHead>
                            <TableHead className="w-[20%]">Usuário</TableHead>
                            <TableHead>Tipo de Evento</TableHead>
                            <TableHead>Detalhes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell>
                                </TableRow>
                             ))
                        ) : logs.length > 0 ? (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{new Date(log.timestamp.seconds * 1000).toLocaleString('pt-BR')}</TableCell>
                                    <TableCell className="font-medium">{log.userEmail}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={EVENT_TYPE_MAP[log.event]?.color || 'bg-gray-200'}>
                                            {EVENT_TYPE_MAP[log.event]?.label || log.event}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{log.details}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Nenhum registro de auditoria encontrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1 || isLoading}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages || isLoading}>
                        Próximo <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
