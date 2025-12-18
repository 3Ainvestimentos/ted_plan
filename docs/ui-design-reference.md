# Referência de Design System - UX/UI

Este documento serve como referência completa do design system utilizado no projeto para manter a padronização visual e de componentes em outros projetos.

---

## 1. Sistema de Cores

### Paleta de Cores (HSL com CSS Variables)

O projeto utiliza variáveis CSS em formato HSL para facilitar a manipulação de temas claro/escuro.

#### Tema Claro (Light Mode)

```css
:root {
  /* Cores Principais */
  --background: 0 0% 100%;           /* Branco */
  --foreground: 220 10% 23%;         /* Texto principal */
  
  /* Cards e Popovers */
  --card: 0 0% 100%;
  --card-foreground: 220 10% 23%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 10% 23%;
  
  /* Cores Primárias */
  --primary: 170 60% 50%;            /* Verde-água (cor principal) */
  --primary-foreground: 0 0% 100%;   /* Texto sobre primária */
  
  /* Cores Secundárias */
  --secondary: 220 16% 94%;          /* Cinza claro */
  --secondary-foreground: 220 10% 20%;
  
  /* Cores Muted */
  --muted: 220 15% 90%;              /* Fundo muted */
  --muted-foreground: 220 10% 45%;   /* Texto muted */
  
  /* Cores Accent */
  --accent: 220 16% 92%;
  --accent-foreground: 220 10% 20%;
  
  /* Cores Destrutivas */
  --destructive: 0 75% 60%;          /* Vermelho */
  --destructive-foreground: 0 0% 100%;
  
  /* Bordas e Inputs */
  --border: 220 15% 88%;
  --input: 220 16% 94%;
  --ring: 220 15% 88%;
  
  /* Border Radius */
  --radius: 0.5rem;
  
  /* Cores de Gráficos */
  --chart-1: 170 60% 45%;
  --chart-2: 180 65% 55%;
  --chart-3: 45 85% 60%;
  --chart-4: 0 75% 60%;
  --chart-5: 270 70% 65%;
  
  /* Sidebar */
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 220 10% 45%;
  --sidebar-primary: 220 16% 94%;
  --sidebar-primary-foreground: 220 10% 20%;
  --sidebar-accent: 0 0% 94%;
  --sidebar-accent-foreground: 0 0% 13%;
  --sidebar-border: 0 0% 89%;
  --sidebar-ring: transparent;
}
```

#### Tema Escuro (Dark Mode)

```css
.dark {
  /* Cores Principais */
  --background: 220 10% 10%;         /* Fundo escuro */
  --foreground: 0 0% 98%;            /* Texto claro */
  
  /* Cards e Popovers */
  --card: 220 10% 12%;
  --card-foreground: 0 0% 98%;
  --popover: 220 10% 12%;
  --popover-foreground: 0 0% 98%;
  
  /* Cores Primárias */
  --primary: 170 60% 50%;            /* Mesma cor primária */
  --primary-foreground: 0 0% 10%;
  
  /* Cores Secundárias */
  --secondary: 220 10% 18%;
  --secondary-foreground: 0 0% 98%;
  
  /* Cores Muted */
  --muted: 220 10% 20%;
  --muted-foreground: 220 10% 65%;
  
  /* Cores Accent */
  --accent: 220 10% 22%;
  --accent-foreground: 0 0% 98%;
  
  /* Cores Destrutivas */
  --destructive: 0 70% 55%;
  --destructive-foreground: 0 0% 100%;
  
  /* Bordas e Inputs */
  --border: 220 10% 25%;
  --input: 220 10% 15%;
  --ring: 220 10% 25%;
  
  /* Cores de Gráficos */
  --chart-1: 170 60% 50%;
  --chart-2: 180 65% 60%;
  --chart-3: 45 85% 65%;
  --chart-4: 0 70% 55%;
  --chart-5: 270 70% 70%;
  
  /* Sidebar */
  --sidebar-background: 220 10% 10%;
  --sidebar-foreground: 210 20% 95%;
  --sidebar-primary: 210 15% 22%;
  --sidebar-primary-foreground: 210 20% 95%;
  --sidebar-accent: 210 15% 22%;
  --sidebar-accent-foreground: 210 20% 95%;
  --sidebar-border: 210 20% 12%;
  --sidebar-ring: transparent;
}
```

### Uso das Cores no Tailwind

As cores são acessadas via classes Tailwind:

```tsx
// Exemplos de uso
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="bg-secondary text-secondary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="bg-destructive text-destructive-foreground">
<div className="border-border">
<div className="bg-card text-card-foreground">
```

---

## 2. Tipografia

### Fontes

O projeto utiliza duas fontes do Google Fonts:

- **Archivo** (sans-serif) - Fonte principal para corpo de texto
- **Roboto** (sans-serif) - Fonte para títulos e headlines

### Configuração

```css
body {
  font-family: 'Archivo', sans-serif;
  font-weight: 400;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Roboto', sans-serif;
}
```

### Classes Tailwind

```tsx
// Body text
<p className="font-body">Texto do corpo</p>

// Headlines
<h1 className="font-headline">Título</h1>
```

### Tamanhos e Pesos Padrão

- **Títulos de Página**: `text-3xl font-semibold tracking-tight` (font-headline)
- **Títulos de Card**: `text-xl font-semibold` (font-headline)
- **Títulos de Dialog**: `text-lg font-semibold leading-none tracking-tight`
- **Texto de Descrição**: `text-sm text-muted-foreground`
- **Texto do Corpo**: `text-sm` ou `text-base` (font-body)

### Exemplo de Uso

```tsx
<h1 className="font-headline text-3xl font-semibold tracking-tight">
  Título da Página
</h1>
<p className="text-muted-foreground">
  Descrição da página
</p>
```

---

## 3. Componentes Base (shadcn/ui)

### Lista de Componentes Disponíveis

O projeto utiliza [shadcn/ui](https://ui.shadcn.com/) como base de componentes. Componentes disponíveis:

- `accordion` - Acordeão expansível
- `alert` - Alertas e notificações
- `alert-dialog` - Diálogos de confirmação
- `avatar` - Avatares de usuário
- `badge` - Badges e tags
- `button` - Botões com variantes
- `calendar` - Calendário
- `card` - Cards e containers
- `chart` - Gráficos (Recharts)
- `checkbox` - Checkboxes
- `dialog` - Modais e diálogos
- `dropdown-menu` - Menus dropdown
- `form` - Formulários (React Hook Form)
- `input` - Campos de entrada
- `label` - Labels de formulário
- `loading-spinner` - Spinner de carregamento
- `menubar` - Barra de menu
- `popover` - Popovers
- `progress` - Barras de progresso
- `radio-group` - Grupos de radio
- `scroll-area` - Área com scroll
- `select` - Seletores dropdown
- `separator` - Separadores visuais
- `sheet` - Painéis laterais
- `sidebar` - Barra lateral
- `skeleton` - Placeholders de carregamento
- `slider` - Controles deslizantes
- `switch` - Interruptores
- `table` - Tabelas
- `tabs` - Abas
- `textarea` - Áreas de texto
- `toast` - Notificações toast
- `tooltip` - Tooltips

### Configuração shadcn/ui

Arquivo `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Padrões de Uso Comuns

#### Botões

```tsx
import { Button } from "@/components/ui/button";

// Variantes disponíveis
<Button variant="default">Padrão</Button>
<Button variant="destructive">Destrutivo</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
<Button size="icon">Ícone</Button>
```

#### Cards

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Descrição do card</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo do card
  </CardContent>
  <CardFooter>
    Rodapé do card
  </CardFooter>
</Card>
```

---

## 4. Padrões de Layout

### Estrutura Principal

O layout principal consiste em:

1. **Sidebar** (lateral esquerda) - Navegação principal
2. **Header** (topo) - Controles e ações
3. **Main Content** (centro) - Conteúdo da página

### Estrutura de Código

```tsx
<SidebarProvider>
  <div className="flex h-screen bg-background">
    <Sidebar>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-lg sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <SidebarTrigger className="sm:hidden" />
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  </div>
</SidebarProvider>
```

### Header de Páginas

Componente `PageHeader` padrão:

```tsx
import { PageHeader } from "@/components/layout/page-header";

<PageHeader 
  title="Título da Página"
  description="Descrição opcional da página"
>
  {/* Ações adicionais (botões, etc) */}
</PageHeader>
```

Estrutura interna:

```tsx
<div className="space-y-2">
  <h1 className="font-headline text-3xl font-semibold tracking-tight">
    {title}
  </h1>
  {description && (
    <p className="text-muted-foreground">{description}</p>
  )}
  {children}
</div>
```

### Cards de Dashboard

Padrão para cards clicáveis:

```tsx
<Link href={href} className="group">
  <Card className="h-full hover:border-primary transition-colors shadow-sm hover:shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-base font-medium">{title}</CardTitle>
      <Icon className="w-5 h-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
    <div className="flex items-center p-6 pt-0">
      <div className="text-sm font-medium text-primary flex items-center gap-2">
        Acessar
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  </Card>
</Link>
```

---

## 5. Padrões de Formulários

### Stack Tecnológico

- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **@hookform/resolvers** - Integração Zod + React Hook Form

### Estrutura de Formulário

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Schema de validação
const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Digite o título" {...field} />
              </FormControl>
              <FormDescription>
                Descrição opcional do campo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </Form>
  );
}
```

### Padrão Alternativo (sem FormField)

Para formulários mais simples:

```tsx
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SimpleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" {...register("title")} placeholder="Digite o título" />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>
      <Button type="submit">Enviar</Button>
    </form>
  );
}
```

### Grid de Campos

Para formulários com múltiplas colunas:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <FormField ... />
  <FormField ... />
</div>
```

---

## 6. Padrões de Modais/Dialogs

### Estrutura Básica

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function MyModal({ isOpen, onOpenChange }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Título do Modal</DialogTitle>
          <DialogDescription>
            Descrição do que o modal faz
          </DialogDescription>
        </DialogHeader>
        
        {/* Conteúdo do modal */}
        <div className="space-y-4">
          {/* Formulário ou conteúdo aqui */}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Padrão com Formulário

```tsx
export function UpsertModal({ isOpen, onOpenChange, initialData }: Props) {
  const isEditing = !!initialData;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Item' : 'Criar Novo Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize os detalhes do item.' 
              : 'Preencha as informações abaixo para cadastrar um novo item.'}
          </DialogDescription>
        </DialogHeader>
        
        <MyForm 
          onSubmit={handleSubmit} 
          onCancel={() => onOpenChange(false)} 
          initialData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### Classes Importantes

- `sm:max-w-3xl` - Largura máxima responsiva
- `max-h-[90vh] overflow-y-auto` - Altura máxima com scroll
- `space-y-4` ou `space-y-6` - Espaçamento vertical entre elementos

---

## 7. Espaçamento e Bordas

### Border Radius

O projeto utiliza um border radius padrão de `0.5rem`:

```css
--radius: 0.5rem;
```

Classes Tailwind correspondentes:

- `rounded-lg` = `var(--radius)` = `0.5rem`
- `rounded-md` = `calc(var(--radius) - 2px)`
- `rounded-sm` = `calc(var(--radius) - 4px)`

### Espaçamentos Padrão

O projeto segue o sistema de espaçamento do Tailwind (múltiplos de 4px):

#### Espaçamento Vertical (space-y)

- `space-y-2` = 0.5rem (8px) - Espaçamento pequeno
- `space-y-4` = 1rem (16px) - Espaçamento médio
- `space-y-6` = 1.5rem (24px) - Espaçamento grande (padrão em formulários)
- `space-y-8` = 2rem (32px) - Espaçamento extra grande

#### Padding

- Cards: `p-6` (1.5rem / 24px)
- CardHeader: `p-6` com `pb-2` (padding-bottom menor)
- CardContent: `p-6 pt-0` (padding-top zero)
- Main content: `p-4 md:p-6` (responsivo)
- Inputs: `px-4 py-2` (h-10 padrão)

#### Gaps (Grid/Flex)

- `gap-4` = 1rem (16px) - Padrão em grids
- `gap-6` = 1.5rem (24px) - Em grids maiores

### Shadows

- `shadow-sm` - Sombra pequena (padrão em cards)
- `shadow-lg` - Sombra grande (hover em cards)

---

## 8. Configurações Técnicas

### Tailwind CSS

Arquivo `tailwind.config.ts`:

```typescript
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Archivo', 'sans-serif'],
        headline: ['Roboto', 'sans-serif'],
      },
      colors: {
        // Cores mapeadas das CSS variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... outras cores
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

### Dark Mode (next-themes)

Configuração do ThemeProvider:

```tsx
import { ThemeProvider } from '@/components/layout/theme-provider';

<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

### Ícones (Lucide React)

O projeto utiliza [Lucide React](https://lucide.dev/) para ícones:

```tsx
import { ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";

<ArrowRight className="w-4 h-4" />
<CheckCircle className="w-5 h-5 text-primary" />
```

Tamanhos padrão:
- `w-4 h-4` - Ícones pequenos (16px)
- `w-5 h-5` - Ícones médios (20px)
- `w-6 h-6` - Ícones grandes (24px)

### Dependências Principais

```json
{
  "dependencies": {
    "@radix-ui/*": "^1.x.x",        // Componentes base
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "next-themes": "^0.3.0",
    "lucide-react": "^0.475.0",
    "react-hook-form": "^7.54.2",
    "@hookform/resolvers": "^4.1.3",
    "zod": "^3.24.2"
  }
}
```

---

## 9. Padrões de Acessibilidade

### Semântica HTML

- Uso de elementos semânticos (`<header>`, `<main>`, `<nav>`, etc.)
- Labels apropriados em formulários
- ARIA labels quando necessário

### Navegação por Teclado

- Todos os componentes interativos são focáveis
- Navegação lógica com Tab
- Atalhos de teclado quando aplicável

### Contraste

- Cores seguem WCAG AA mínimo
- Texto sobre fundos com contraste adequado
- Estados de hover/focus visíveis

---

## 10. Exemplos de Uso Completo

### Página Completa com Formulário

```tsx
"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
});

export default function ExamplePage() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    console.log(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exemplo de Página"
        description="Esta é uma página de exemplo"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Formulário de Exemplo</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 11. Checklist para Novos Projetos

Ao iniciar um novo projeto seguindo este design system:

- [ ] Copiar variáveis CSS de cores (`globals.css`)
- [ ] Configurar fontes (Archivo e Roboto) no layout
- [ ] Configurar `tailwind.config.ts` com cores e fontes
- [ ] Instalar dependências principais (shadcn/ui, next-themes, lucide-react)
- [ ] Configurar `components.json` do shadcn/ui
- [ ] Instalar componentes shadcn/ui necessários
- [ ] Configurar ThemeProvider no layout raiz
- [ ] Criar estrutura de layout (Sidebar + Main)
- [ ] Implementar PageHeader component
- [ ] Configurar React Hook Form + Zod para formulários
- [ ] Seguir padrões de espaçamento e border radius

---

## Notas Finais

- Este design system prioriza **consistência** e **acessibilidade**
- Cores e espaçamentos devem ser mantidos consistentes em todo o projeto
- Componentes shadcn/ui podem ser customizados, mas mantendo a estrutura base
- Sempre testar em modo claro e escuro
- Manter contraste adequado para acessibilidade

---

**Última atualização**: Baseado no estado atual do projeto `ted_plan`

