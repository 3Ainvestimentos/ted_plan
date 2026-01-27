# Ted Plan - Sistema de Gestão de Iniciativas Estratégicas

Sistema completo de gestão de iniciativas estratégicas com recursos de IA para análise de riscos, geração de sumários executivos e automação de atas de reunião.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Arquitetura](#arquitetura)
- [Sistema de Permissões](#sistema-de-permissões)
- [Funcionalidades de IA](#funcionalidades-de-ia)
- [Design System](#design-system)
- [Deploy](#deploy)
- [Estrutura de Dados](#estrutura-de-dados)

## 🎯 Sobre o Projeto

**Ted Plan** é uma plataforma de gestão estratégica desenvolvida para facilitar o acompanhamento, análise e gerenciamento de iniciativas estratégicas organizacionais. O sistema oferece:

- **Dashboard Centralizado**: Visão consolidada do status de todas as iniciativas estratégicas
- **Gestão de Iniciativas**: Criação, edição e acompanhamento detalhado de iniciativas com hierarquia de itens e subitens
- **Visualizações Múltiplas**: Dashboard, Tabela/Gantt e Kanban para diferentes necessidades de visualização
- **Inteligência Artificial**: Análise de riscos, geração automática de sumários executivos e automação de atas de reunião
- **Controle de Acesso**: Sistema robusto de permissões baseado em roles (admin, PMO, head)
- **Gestão de Áreas de Negócio**: Organização por áreas com KPIs e OKRs
- **Agenda e Reuniões**: Gestão de agendas e automação de atas de reunião

## 🛠 Tecnologias

### Frontend
- **Next.js 15.3.6** - Framework React com App Router
- **React 18.3.1** - Biblioteca de interface
- **TypeScript 5** - Tipagem estática
- **Tailwind CSS 3.4.1** - Estilização utilitária
- **shadcn/ui** - Componentes de UI baseados em Radix UI
- **Framer Motion 11.2.10** - Animações
- **React Hook Form 7.54.2** - Gerenciamento de formulários
- **Zod 3.24.2** - Validação de schemas
- **Recharts 2.15.1** - Gráficos e visualizações
- **React DnD 16.0.1** - Drag and drop para Kanban

### Backend & Infraestrutura
- **Firebase 10.14.1** - Backend como serviço
  - **Firestore** - Banco de dados NoSQL
  - **Firebase Auth** - Autenticação
  - **Firebase Hosting** - Hospedagem
- **Genkit 1.8.0** - Framework de IA
- **Google AI (Gemini 2.0 Flash)** - Modelo de linguagem para funcionalidades de IA

### Ferramentas de Desenvolvimento
- **Turbopack** - Bundler rápido do Next.js
- **ESLint** - Linter de código
- **PostCSS** - Processamento de CSS

## ✨ Funcionalidades

### 1. Painel Estratégico (Dashboard)
- Visão consolidada de todas as iniciativas estratégicas
- Cards por área de negócio com métricas principais
- Filtros por área e status
- Indicadores de progresso e status

### 2. Iniciativas Estratégicas
- **Criação e Edição**: Formulários completos com validação
- **Hierarquia**: Estrutura de Iniciativa → Itens → Subitens
- **Visualizações**:
  - **Dashboard**: Visão geral com cards
  - **Tabela/Gantt**: Visualização temporal com cronograma
  - **Kanban**: Gestão visual por status
- **Importação CSV**: Importação em massa de iniciativas
- **Filtros Avançados**: Por área, status, responsável, prioridade
- **Dossiê Completo**: Modal com todas as informações da iniciativa

### 3. Agenda
- Visualização de eventos e compromissos
- Filtros por área e período
- Integração com iniciativas

### 4. Automação de Reuniões
- Geração automática de atas de reunião usando IA
- Conversão de atualizações de cards em notas estruturadas
- Histórico de reuniões

### 5. Sumários Executivos
- Geração automática de sumários executivos usando IA
- Análise de progresso e métricas chave
- Relatórios para gestão

### 6. Projetos de Desenvolvimento
- Gestão de projetos técnicos
- Estrutura de itens e subitens
- Sistema de comentários
- Acompanhamento de status e prazos

### 7. M&A (Mergers & Acquisitions)
- Gestão de deals e aquisições
- Visualização Kanban
- Acompanhamento de pipeline

### 8. Configurações (Admin)
- **Áreas de Negócio**: CRUD completo de áreas
- **KPIs**: Gestão de indicadores por área
- **OKRs**: Gestão de objetivos e resultados-chave
- **Colaboradores**: Gestão de usuários e permissões
- **Cargos**: Gestão de posições organizacionais
- **Equipes**: Gestão de equipes
- **Auditoria**: Log de ações dos usuários
- **Modo de Manutenção**: Controle de acesso durante manutenções

## 📁 Estrutura do Projeto

```
ted_plan/
├── src/
│   ├── ai/                          # Funcionalidades de IA
│   │   ├── flows/                   # Fluxos de IA (sumários, atas)
│   │   ├── dev.ts                   # Configuração de desenvolvimento
│   │   └── genkit.ts                # Configuração do Genkit
│   ├── app/                         # Rotas Next.js (App Router)
│   │   ├── (app)/                   # Rotas autenticadas
│   │   │   ├── agenda/              # Página de agenda
│   │   │   ├── executive-summaries/ # Sumários executivos
│   │   │   ├── initiatives/         # Iniciativas estratégicas
│   │   │   ├── strategic-initiatives/ # Iniciativas (alternativa)
│   │   │   ├── settings/            # Configurações (admin)
│   │   │   ├── meeting-automation/  # Automação de reuniões
│   │   │   └── page.tsx             # Dashboard principal
│   │   ├── login/                   # Página de login
│   │   ├── layout.tsx               # Layout raiz
│   │   └── globals.css              # Estilos globais
│   ├── components/                  # Componentes React
│   │   ├── ui/                      # Componentes base (shadcn/ui)
│   │   ├── layout/                  # Componentes de layout
│   │   ├── dashboard/               # Componentes do dashboard
│   │   ├── initiatives/            # Componentes de iniciativas
│   │   ├── agenda/                  # Componentes de agenda
│   │   ├── settings/                # Componentes de configurações
│   │   ├── forms/                   # Formulários reutilizáveis
│   │   └── icons/                   # Ícones customizados
│   ├── contexts/                    # Contextos React
│   │   ├── auth-context.tsx         # Autenticação
│   │   ├── initiatives-context.tsx  # Estado das iniciativas
│   │   ├── settings-context.tsx     # Configurações
│   │   └── ...                      # Outros contextos
│   ├── hooks/                       # Custom hooks
│   ├── lib/                         # Utilitários e helpers
│   │   ├── firebase.ts              # Configuração Firebase
│   │   ├── permissions-config.ts    # Configuração de permissões
│   │   ├── constants.ts             # Constantes da aplicação
│   │   └── utils.ts                 # Funções utilitárias
│   └── types/                       # Definições TypeScript
│       └── index.ts                 # Tipos principais
├── docs/                            # Documentação
│   ├── blueprint.md                 # Blueprint do projeto
│   └── ui-design-reference.md      # Referência de design
├── public/                          # Arquivos estáticos
├── firebase.json                     # Configuração Firebase
├── firestore.rules                   # Regras de segurança Firestore
├── firestore.indexes.json            # Índices Firestore
├── next.config.ts                   # Configuração Next.js
├── tailwind.config.ts               # Configuração Tailwind
├── tsconfig.json                     # Configuração TypeScript
└── package.json                     # Dependências e scripts
```

## 📦 Pré-requisitos

- **Node.js** 18+ (recomendado: 20+)
- **npm** ou **yarn**
- Conta no **Firebase** com projeto configurado
- Conta no **Google AI** (para funcionalidades de IA)
- Acesso ao domínio `@3ainvestimentos.com.br` ou `@3ariva.com.br` (para autenticação)

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd ted_plan
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env.local` na raiz do projeto (veja seção [Configuração](#configuração))

4. **Execute o projeto em desenvolvimento**
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:9002`

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-auth-domain
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=seu-measurement-id

# Google AI (para funcionalidades de IA)
GOOGLE_GENAI_API_KEY=sua-chave-api-google-ai
```

### Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative os seguintes serviços:
   - **Authentication** (com Google Provider)
   - **Firestore Database**
   - **Hosting** (opcional, para deploy)
3. Configure as regras de segurança do Firestore (veja `firestore.rules`)
4. Configure os índices necessários (veja `firestore.indexes.json`)

### Configuração do Google AI

1. Acesse o [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma API key
3. Adicione a chave no arquivo `.env.local` como `GOOGLE_GENAI_API_KEY`

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento com Turbopack (recomendado)
npm run dev

# Desenvolvimento sem Turbopack
npm run dev:no-turbopack

# Desenvolvimento do Genkit (IA)
npm run genkit:dev

# Desenvolvimento do Genkit com watch mode
npm run genkit:watch

# Build de produção
npm run build

# Iniciar servidor de produção
npm start

# Linter
npm run lint

# Verificação de tipos TypeScript
npm run typecheck
```

## 🏗 Arquitetura

### Padrão de Arquitetura

O projeto segue uma arquitetura baseada em:

- **App Router do Next.js**: Roteamento baseado em arquivos
- **Server Components**: Componentes renderizados no servidor quando possível
- **Client Components**: Componentes interativos com `"use client"`
- **Context API**: Gerenciamento de estado global
- **Custom Hooks**: Lógica reutilizável

### Fluxo de Autenticação

1. Usuário acessa a aplicação
2. Sistema verifica autenticação via Firebase Auth
3. Se não autenticado, redireciona para `/login`
4. Login via Google OAuth (apenas emails permitidos)
5. Busca dados do colaborador no Firestore
6. Verifica permissões baseadas em `userType`
7. Aplica regras de acesso por página

### Estrutura de Dados

O sistema utiliza as seguintes coleções principais no Firestore:

- `initiatives` - Iniciativas estratégicas
- `collaborators` - Colaboradores/usuários
- `businessAreas` - Áreas de negócio
- `kpis` - Indicadores-chave de performance
- `okrs` - Objetivos e resultados-chave
- `devProjects` - Projetos de desenvolvimento
- `mnaDeals` - Deals de M&A
- `auditLogs` - Logs de auditoria
- `settings` - Configurações gerais

## 🔐 Sistema de Permissões

O sistema possui três tipos de usuários com diferentes níveis de acesso:

### Admin
- ✅ Acesso total a todas as páginas
- ✅ Pode criar, editar e deletar iniciativas
- ✅ Pode editar qualquer campo (prazo, responsável, status, etc.)
- ✅ Acesso à página de Configurações
- ✅ Pode importar iniciativas via CSV
- ✅ Pode visualizar todas as áreas

### PMO (Project Management Office)
- ✅ Acesso a todas as páginas (exceto Settings)
- ✅ Pode criar, editar e deletar iniciativas
- ✅ Pode editar qualquer campo (prazo, responsável, status, etc.)
- ✅ Pode importar iniciativas via CSV
- ✅ Pode visualizar todas as áreas

### Head (Líder de Área)
- ✅ Acesso limitado: Dashboard, Iniciativas Estratégicas e Agenda
- ❌ Não pode criar ou deletar iniciativas
- ✅ Pode editar status, observações e prioridade **apenas da própria área**
- ❌ **Nunca** pode editar prazos (endDate)
- ❌ Não pode importar iniciativas
- ✅ Pode visualizar apenas iniciativas da própria área

### Regras Detalhadas

As permissões são gerenciadas em `src/lib/permissions-config.ts` e incluem:

- `canAccessPage()` - Verifica acesso a páginas
- `canViewInitiativeArea()` - Verifica visualização por área
- `canCreateInitiative()` - Verifica criação de iniciativas
- `canEditDeadline()` - Verifica edição de prazos
- `canEditDescription()` - Verifica edição de observações
- `canEditPriority()` - Verifica edição de prioridade
- `canImportInitiatives()` - Verifica importação CSV

## 🤖 Funcionalidades de IA

O sistema utiliza **Google Gemini 2.0 Flash** via Genkit para:

### 1. Sumários Executivos
- **Localização**: `src/ai/flows/executive-summary.ts`
- **Função**: `generateExecutiveSummary()`
- **Input**: Descrição do projeto, métricas chave, detalhes de progresso
- **Output**: Sumário executivo conciso

### 2. Atas de Reunião
- **Localização**: `src/ai/flows/meeting-minutes.ts`
- **Função**: `generateMeetingMinutes()`
- **Input**: Atualizações de cards, resumo de discussões
- **Output**: Atas de reunião estruturadas

### Uso das Funcionalidades de IA

As funções de IA são executadas no servidor (Server Actions) e podem ser chamadas de componentes client:

```typescript
import { generateExecutiveSummary } from '@/ai/flows/executive-summary';

const summary = await generateExecutiveSummary({
  projectDescription: "...",
  keyMetrics: "...",
  progressDetails: "..."
});
```

## 🎨 Design System

O projeto utiliza um design system consistente baseado em:

### Cores
- **Primária**: Verde-água (`hsl(170 60% 50%)`)
- **Background**: Branco (light) / Cinza escuro (dark)
- **Foreground**: Cinza escuro (light) / Branco (dark)
- Suporte completo a **Dark Mode**

### Tipografia
- **Fonte Principal**: Archivo (corpo de texto)
- **Fonte de Títulos**: Roboto (headlines)

### Componentes
- Baseado em **shadcn/ui** (Radix UI + Tailwind)
- Componentes acessíveis e customizáveis
- Documentação completa em `docs/ui-design-reference.md`

### Padrões Visuais
- Layout baseado em cards
- Espaçamento consistente (múltiplos de 4px)
- Border radius padrão: `0.5rem`
- Sombras sutis com hover effects

## 🚢 Deploy

### Deploy no Firebase Hosting

1. **Build do projeto**
```bash
npm run build
```

2. **Deploy**
```bash
firebase deploy --only hosting
```

### Configuração do Firebase Hosting

O arquivo `firebase.json` já está configurado para:
- Servir arquivos da pasta `.next`
- Rewrite todas as rotas para `/index.html` (SPA)
- Headers de segurança (CSP)

### Variáveis de Ambiente no Deploy

Configure as variáveis de ambiente no Firebase:
```bash
firebase functions:config:set google.genai.api_key="sua-chave"
```

Ou use Firebase App Hosting (se configurado):
- Configure as variáveis no console do Firebase

## 📊 Estrutura de Dados

### Initiative (Iniciativa Estratégica)

```typescript
interface Initiative {
  id: string;
  topicNumber: string;           // "1", "1.1", "2", etc.
  parentId?: string | null;        // ID da iniciativa pai
  title: string;
  status: InitiativeStatus;       // 'Pendente' | 'Em execução' | 'Concluído' | ...
  owner: string;                  // Responsável obrigatório
  description: string;
  lastUpdate: string;             // Data da última atualização
  progress: number;               // 0-100
  priority: InitiativePriority;    // 'Baixa' | 'Média' | 'Alta'
  startDate: string;              // ISO date 'YYYY-MM-DD' (obrigatório)
  endDate: string;                // ISO date 'YYYY-MM-DD' (obrigatório)
  keyMetrics: Array<{
    name: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
  }>;
  areaId: string;                 // Área de negócio (obrigatório)
  items: InitiativeItem[];       // Itens obrigatórios (mínimo 1)
  archived?: boolean;
  cidade?: string;
  auc?: number;
}
```

### InitiativeItem

```typescript
interface InitiativeItem {
  id: string;
  title: string;
  startDate: string;              // Obrigatório
  endDate: string;                 // Obrigatório
  linkedToPrevious?: boolean;      // Vinculado ao item anterior
  status: InitiativeStatus;
  areaId: string;                  // Obrigatório
  priority: InitiativePriority;
  description: string;            // Observações
  responsible?: string | null;    // Opcional
  subItems?: SubItem[];
}
```

### SubItem

```typescript
interface SubItem {
  id: string;
  title: string;
  completed: boolean;
  startDate: string;               // Obrigatório
  endDate: string;                // Obrigatório
  linkedToPrevious?: boolean;
  status: InitiativeStatus;
  responsible: string;             // Obrigatório
  priority: InitiativePriority;
  description: string;
}
```

### BusinessArea

```typescript
interface BusinessArea {
  id: string;
  name: string;
  icon: string;                   // Nome do ícone lucide-react
  order: number;
  okrs: Okr[];
  kpis: Kpi[];
  generalContext?: string;         // Contextualização geral
}
```

## 🔒 Segurança

### Autenticação
- Login via Google OAuth
- Restrição de emails por domínio (`@3ainvestimentos.com.br`, `@3ariva.com.br`)
- Verificação de autenticação em todas as rotas protegidas

### Firestore Rules
- Apenas usuários autenticados podem ler/escrever
- Regras configuradas em `firestore.rules`
- Modo de manutenção permite leitura pública de configurações

### Validação
- Validação de formulários com Zod
- Validação de tipos com TypeScript
- Sanitização de inputs

## 📝 Notas de Desenvolvimento

### Ignorar Erros de Build
O projeto está configurado para ignorar erros de TypeScript e ESLint durante o build (`next.config.ts`). Isso é útil durante desenvolvimento, mas deve ser revisado antes de produção.

### Patch Package
O projeto utiliza `patch-package` para aplicar patches em dependências. Certifique-se de executar `npm install` após clonar o repositório.

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
2. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
3. Push para a branch (`git push origin feature/nova-feature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Contato

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.

---

**Última atualização**: Dezembro 2024
