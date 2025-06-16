"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { riskAssessment } from "@/ai/flows/risk-assessment";
import type { RiskAssessmentOutput } from "@/ai/flows/risk-assessment";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FormSchema = z.object({
  boardData: z.string().min(50, {
    message: "Os dados do projeto devem ter pelo menos 50 caracteres.",
  }).max(5000, {
    message: "Os dados do projeto não devem exceder 5000 caracteres."
  }),
});

export function RiskAssessmentForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RiskAssessmentOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      boardData: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const assessmentResult = await riskAssessment({ boardData: data.boardData });
      setResult(assessmentResult);
    } catch (error) {
      console.error("Falha na análise de risco:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao realizar a análise de risco. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Análise de Risco com IA</CardTitle>
          <CardDescription>
            Cole os dados do seu projeto (ex: do Focalboard, listas de tarefas ou atualizações de projeto) abaixo.
            A IA irá analisá-los para identificar riscos e atrasos potenciais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="boardData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dados do Projeto</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cole todas as informações relevantes do projeto aqui. Inclua status de tarefas, prazos, preocupações de membros da equipe, alocação de recursos, etc."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Forneça o máximo de detalhes possível para uma avaliação precisa. (Mín 50, Máx 5000 caracteres)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  "Analisar Riscos"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-primary">Resultados da Análise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Resumo</h3>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{result.summary}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Riscos e Atrasos Potenciais</h3>
              {result.risks.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {result.risks.map((risk, index) => (
                    <li key={index} className="text-sm text-foreground/90 flex items-start">
                       <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-destructive flex-shrink-0" />
                       <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum risco específico identificado com base nos dados fornecidos.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
