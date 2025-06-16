"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateMeetingMinutes } from "@/ai/flows/meeting-minutes";
import type { MeetingMinutesOutput } from "@/ai/flows/meeting-minutes";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FormSchema = z.object({
  cardUpdates: z.string().min(30, "As atualizações dos cartões devem ter pelo menos 30 caracteres.").max(3000, "Máximo de 3000 caracteres."),
  discussionSummary: z.string().min(30, "O resumo da discussão deve ter pelo menos 30 caracteres.").max(3000, "Máximo de 3000 caracteres."),
});

export function MeetingMinutesForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MeetingMinutesOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      cardUpdates: "",
      discussionSummary: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const minutesResult = await generateMeetingMinutes(data);
      setResult(minutesResult);
    } catch (error) {
      console.error("Falha na geração da ata da reunião:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao gerar a ata da reunião. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Atas de Reunião Assistidas por IA</CardTitle>
          <CardDescription>
            Insira resumos de atualizações de cartões e discussões, e a IA ajudará a estruturar suas atas de reunião.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="cardUpdates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumo das Atualizações dos Cartões</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Resuma as atualizações dos cartões do Focalboard ou tarefas discutidas. Ex: Tarefa A: Concluída por João. Tarefa B: Bloqueada, precisa de input do Design. Tarefa C: Progresso 70%."
                        className="min-h-[150px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discussionSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumo da Discussão</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Resuma os principais pontos de discussão, decisões tomadas e itens de ação. Ex: Decisão: Prosseguir com a Opção X. Item de Ação: Sarah fará o acompanhamento do orçamento até o final do dia de sexta-feira."
                        className="min-h-[150px] resize-y"
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
                  "Gerar Ata"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-primary">Ata de Reunião Gerada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap p-4 bg-secondary/30 rounded-md">
              {result.minutes}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
