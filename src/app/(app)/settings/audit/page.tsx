
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, History } from 'lucide-react';
import Link from 'next/link';

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel de Auditoria"
        description="Uma visão centralizada para monitorar a atividade da plataforma."
      >
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Administração
          </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Em Breve</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              Os relatórios de auditoria, com análise de logins e visualização de conteúdos, estarão disponíveis nesta seção.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
