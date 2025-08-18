
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
import type { InitiativeStatus } from "@/types";

const initiativeSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  owner: z.string().min(2, "O nome do responsável é obrigatório."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  status: z.enum(['A Fazer', 'Em Dia', 'Em Risco', 'Atrasado', 'Concluído']),
  deadline: z.date({
    required_error: "A data de prazo é obrigatória.",
  }),
});

type InitiativeFormData = z.infer<typeof initiativeSchema>;

// Mock owners for the select dropdown
const MOCK_OWNERS = ["Alice W.", "Bob T.", "Charlie B.", "David C.", "Anne K.", "Fred L."];

export default function NewInitiativePage() {
  const router = useRouter();
  const { toast } = useToast();
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
    }
  });

  const onSubmit = (data: InitiativeFormData) => {
    setIsLoading(true);
    console.log("Nova iniciativa submetida:", data);
    // Here you would typically send the data to your backend/API
    // For now, we'll just show a success toast and redirect.
    setTimeout(() => {
        toast({
        title: "Iniciativa Criada!",
        description: `A iniciativa "${data.title}" foi criada com sucesso.`,
        });
        router.push("/initiatives");
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
            <Link href="/initiatives">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Link>
        </Button>
        <h1 className="text-3xl font-headline font-semibold tracking-tight">Criar Nova Iniciativa</h1>
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
