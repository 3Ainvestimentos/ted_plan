
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

export default function CollaboratorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Colaboradores"
        description="Adicione, edite ou remova colaboradores da base de dados."
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
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Em Breve</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              A funcionalidade de gerenciamento de colaboradores, incluindo importação via CSV e configuração de links de Power BI, está sendo desenvolvida.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
