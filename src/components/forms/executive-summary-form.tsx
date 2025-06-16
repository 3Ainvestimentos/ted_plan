"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateExecutiveSummary } from "@/ai/flows/executive-summary";
import type { ExecutiveSummaryOutput } from "@/ai/flows/executive-summary";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FormSchema = z.object({
  projectDescription: z.string().min(30, "A descrição deve ter pelo menos 30 caracteres.").max(2000, "Máximo de 2000 caracteres."),
  keyMetrics: z.string().min(20, "As métricas chave devem ter pelo menos 20 caracteres.").max(1000, "Máximo de 1000 caracteres."),
  progressDetails: z.string().min(30, "Os detalhes do progresso devem ter pelo menos 30 caracteres.").max(2000, "Máximo de 2000 caracteres."),
});

export function ExecutiveSummaryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExecutiveSummaryOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      projectDescription: "",
      keyMetrics: "",
      progressDetails: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const summaryResult = await generateExecutiveSummary(data);
      setResult(summaryResult);
    } catch (error) {
      console.error("Falha na geração do sumário executivo:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao gerar o sumário executivo. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Sumários Executivos Gerados por IA</CardTitle>
          <CardDescription>
            Forneça os detalhes do projeto abaixo e a IA gerará um sumário executivo conciso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Projeto</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o projeto, seus objetivos e escopo."
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keyMetrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Métricas Chave</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Liste os principais indicadores de desempenho (KPIs), metas e valores atuais. Ex: Adoção de Usuários: 75% (Meta: 80%), Orçamento Gasto: $50k/$70k."
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="progressDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalhes do Progresso</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Resuma o progresso recente, marcos alcançados e quaisquer desafios ou bloqueios significativos."
                        className="min-h-[120px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Gerar Sumário"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-primary">Sumário Executivo Gerado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap p-4 bg-secondary/30 rounded-md">
              {result.executiveSummary}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
