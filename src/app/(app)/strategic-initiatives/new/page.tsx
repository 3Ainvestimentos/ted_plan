
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { InitiativeStatus, InitiativePriority } from "@/types";
import { useInitiatives } from "@/contexts/initiatives-context";

const initiativeSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  owner: z.string().min(2, "O nome do responsável é obrigatório."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  status: z.enum(['A Fazer', 'Em Dia', 'Em Risco', 'Atrasado', 'Concluído']),
  deadline: z.date({
    required_error: "A data de prazo é obrigatória.",
  }),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4'])
});

type InitiativeFormData = z.infer<typeof initiativeSchema>;

// Mock owners for the select dropdown
const MOCK_OWNERS = ["Alice W.", "Bob T.", "Charlie B.", "David C.", "Anne K.", "Fred L."];

export default function NewInitiativePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addInitiative } = useInitiatives();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeSchema),
    defaultValues: {
      status: 'A Fazer',
      priority: 'P3',
    }
  });

  const onSubmit = (data: InitiativeFormData) => {
    setIsLoading(true);
    
    // Map form data to the structure expected by addInitiative
    const initiativeDataForContext = {
      title: data.title,
      owner: data.owner,
      description: data.description,
      status: data.status,
      priority: data.priority,
      // The context will handle id, lastUpdate, topicNumber, progress, and keyMetrics
    };

    addInitiative(initiativeDataForContext as any);

    setTimeout(() => {
        toast({
            title: "Iniciativa Criada!",
            description: `A iniciativa "${data.title}" foi criada com sucesso.`,
        });
        router.push("/strategic-initiatives");
    }, 500); // Short delay to allow state update
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
            <Link href="/strategic-initiatives">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Link>
        </Button>
        <h1 className="font-headline text-3xl font-semibold tracking-tight">Criar Nova Iniciativa</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes da Iniciativa</CardTitle>
          <CardDescription>Preencha as informações abaixo para cadastrar uma nova iniciativa estratégica.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Iniciativa</Label>
              <Input id="title" {...register("title")} placeholder="Ex: Otimizar o Funil de Vendas" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Prazo (Conclusão Alvo)</Label>
                    <Controller
                        name="deadline"
                        control={control}
                        render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        )}
                    />
                    {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="owner">Responsável</Label>
                     <Controller
                        name="owner"
                        control={control}
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MOCK_OWNERS.map(owner => (
                                        <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.owner && <p className="text-sm text-destructive">{errors.owner.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="status">Execução (Status)</Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status inicial" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A Fazer">A Fazer</SelectItem>
                                    <SelectItem value="Em Dia">Em Dia</SelectItem>
                                    <SelectItem value="Em Risco">Em Risco</SelectItem>
                                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                                    <SelectItem value="Concluído">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="P0">P0 (Crítica)</SelectItem>
                                    <SelectItem value="P1">P1 (Alta)</SelectItem>
                                    <SelectItem value="P2">P2 (Média)</SelectItem>
                                    <SelectItem value="P3">P3 (Baixa)</SelectItem>
                                    <SelectItem value="P4">P4 (Mais Baixa)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {errors.priority && <p className="text-sm text-destructive">{errors.priority.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Observações (Descrição)</Label>
              <Textarea id="description" {...register("description")} placeholder="Descreva o objetivo principal, escopo e os resultados esperados desta iniciativa." rows={5} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Iniciativa"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
