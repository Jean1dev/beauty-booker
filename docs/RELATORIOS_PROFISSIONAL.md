# Planejamento — Feature de Relatórios para a Profissional

> Status: Planejamento • Branch: `claude/professional-reports-planning-2229k5`
> Última atualização: 2026-06-14

## 1. Objetivo

Dar à profissional uma visão analítica do seu negócio a partir dos dados de
agendamentos que já existem no sistema. A feature deve responder perguntas como:

- Quantos atendimentos eu fiz este mês? E comparado ao mês passado?
- Quais serviços são os mais procurados?
- Quantos agendamentos foram cancelados ou não compareceram (no-show)?
- Quem são meus clientes mais frequentes? Quantos voltam?
- Como está a distribuição dos meus atendimentos ao longo do tempo?

### Decisões de escopo (alinhadas com a profissional)

| Tema | Decisão |
|------|---------|
| **Receita / faturamento** | **Fora desta versão.** Hoje não existe campo de preço em `user_services` nem em `appointments`. Relatórios focam em métricas **operacionais**. Receita fica como fase futura (ver §8). |
| **Localização** | **Nova página dedicada `/reports`**, acessível por um card no Dashboard, seguindo o padrão das telas existentes. |
| **Escopo** | **Completo**: KPIs + gráficos + retenção de clientes + top clientes + taxas de cancelamento/no-show + comparação entre períodos + exportação. |
| **No-show** | **Incluído nesta versão.** Adiciona o status `no_show` ao agendamento, ação manual "Não compareceu" na Agenda e inferência de faltas em aberto no relatório (ver §3.5 e Fase 0 em §7). |

## 2. Contexto técnico (estado atual)

- **Stack**: React 18 + TypeScript + Vite, React Router v6, TanStack Query, shadcn/ui (Radix + Tailwind), **Recharts já instalado** (`src/components/ui/chart.tsx`).
- **Backend**: Firebase Firestore (NoSQL). Cada profissional é o `auth.uid`; todos os documentos são filtrados por `userId`.
- **Padrão de dados**: camada `src/services/*.ts` (queries Firestore) → hooks `src/hooks/use-*.tsx` (estado + cache) → páginas `src/pages/*.tsx`.

### Modelo de dados relevante

`appointments` (`src/services/appointments.ts`):

```ts
interface Appointment {
  id?: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;        // usado como identificador de cliente (não há entidade Cliente)
  date: string;               // yyyy-MM-dd
  time: string;               // HH:mm
  dateTime: Timestamp;        // ordenável / filtrável por período
  duration?: number;
  durationUnit?: "min" | "hour";
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"; // no_show adicionado nesta feature
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

`user_services` (`src/services/user-services.ts`): `id, name, color, duration, durationUnit, advanceDays`.

> **No-show**: o status `no_show` **não existe hoje** e será adicionado por esta feature
> (sem migração — documentos antigos seguem válidos). A captura é manual na Agenda e o
> relatório complementa com inferência de faltas em aberto. Detalhes em §3.5 e Fase 0 (§7).

### O que já existe e vamos reutilizar

- `getAppointmentsByDateRange(userId, startDate, endDate)` — base para todas as queries.
- `getAppointmentsByUserId(userId)` — fallback para visão histórica completa.
- `getUserServices(userId)` — nomes e cores dos serviços (cores reaproveitadas nos gráficos).
- `ChartContainer / ChartTooltip / ChartLegend` (`src/components/ui/chart.tsx`) — wrapper Recharts com tema Tailwind.
- Componentes shadcn: `Card`, `Tabs`, `Select`, `Table`, `Badge`, `Button`.
- `src/lib/analytics.ts` — para rastrear o uso da própria tela de relatórios.

## 3. Métricas e visualizações

### 3.1 KPIs (cards no topo)

| KPI | Cálculo | Comparação |
|-----|---------|------------|
| Total de agendamentos | contagem no período | vs. período anterior (Δ%) |
| Atendimentos concluídos | status `completed` | vs. período anterior |
| Taxa de comparecimento | `completed / (completed + cancelled + no_show)` | vs. período anterior |
| Taxa de cancelamento | `cancelled / total` | vs. período anterior |
| Faltas (no-show) | status `no_show` | vs. período anterior |
| Clientes únicos | `clientPhone` distintos | vs. período anterior |
| Clientes recorrentes | clientes com ≥ 2 agendamentos no período | — |
| Ticket de tempo (opcional) | soma de `duration` (horas agendadas) | vs. período anterior |

Cada card mostra valor atual + variação percentual colorida (verde/vermelho) vs. o
período anterior de mesma duração.

### 3.2 Gráficos

1. **Agendamentos ao longo do tempo** — gráfico de linha/área (Recharts `AreaChart`).
   Agrupamento por dia/semana/mês conforme o período selecionado.
2. **Serviços mais populares** — gráfico de barras horizontais, ordenado por contagem,
   usando a `color` de cada serviço.
3. **Distribuição por status** — gráfico de pizza/donut (`completed`, `confirmed`,
   `pending`, `cancelled`, `no_show`) com legenda.
4. **Mapa de calor de horários** (opcional, fase 2 da implementação) — dias da semana × faixa de horário,
   para identificar os horários mais movimentados.

### 3.3 Tabelas

1. **Top clientes** — nome, telefone, nº de agendamentos, último atendimento.
   Ordenável; destaca recorrentes.
2. **Resumo por serviço** — serviço, nº de agendamentos, % do total, tempo total agendado.

### 3.4 Filtros

- Seletor de período: **Últimos 7 dias / 30 dias / Este mês / Mês passado / Este ano / Personalizado**.
- Período personalizado via date range picker.
- Os cálculos de comparação usam o período imediatamente anterior de mesma duração.

### 3.5 Tratamento de no-show (faltas)

O problema: hoje o modelo não distingue "cliente não compareceu" de "agendamento que a
profissional esqueceu de dar baixa". Resolvemos em três camadas:

1. **Modelo** — novo status terminal `no_show` no agendamento. Sem migração: documentos
   existentes continuam válidos; o status só é atribuído daqui para frente.

2. **Captura manual (fonte de verdade)** — na Agenda, agendamentos passados ganham a ação
   **"Não compareceu"**, ao lado de concluir/cancelar. A profissional, que conhece a
   realidade do atendimento, faz a marcação. Esta é a base das métricas de no-show.

3. **Inferência (apoio operacional)** — o relatório classifica como **"faltas em aberto"**
   os agendamentos cuja `dateTime` já passou e que seguem em `pending`/`confirmed`
   (nunca viraram `completed`/`cancelled`/`no_show`). É uma métrica **separada**, exibida
   como alerta ("X atendimentos pendentes de baixa"), que **não** entra na contagem de
   no-show confirmado — evita inflar a métrica e incentiva fechar o status na Agenda.

Métricas resultantes no relatório:

| Métrica | Definição |
|---------|-----------|
| Cancelamentos | status `cancelled` (cliente avisou) |
| Faltas (no-show) | status `no_show` (cliente não avisou e não veio) |
| Taxa de comparecimento | `completed / (completed + cancelled + no_show)` |
| Faltas em aberto | inferido: passado e ainda `pending`/`confirmed` (alerta, não no-show) |

## 4. Arquitetura da implementação

Seguindo o padrão existente (service → hook → page), nenhuma dependência nova é necessária.

### 4.1 Camada de serviço — `src/services/reports.ts` (novo)

Funções puras de agregação no cliente (a base de dados é por-usuário e os volumes são
pequenos; agregação client-side é suficiente para o MVP completo):

```ts
export interface ReportPeriod { start: Date; end: Date; }

export interface ReportMetrics {
  totalAppointments: number;
  completed: number;
  cancelled: number;
  pending: number;
  confirmed: number;
  noShow: number;               // status no_show (falta confirmada)
  openNoShow: number;           // inferido: passado e ainda pending/confirmed
  cancellationRate: number;     // 0..1
  attendanceRate: number;       // completed / (completed + cancelled + no_show)
  uniqueClients: number;
  returningClients: number;
  totalScheduledMinutes: number;
}

export interface ServiceBreakdown {
  serviceId: string;
  serviceName: string;
  color: string;
  count: number;
  percentage: number;
  totalMinutes: number;
}

export interface ClientSummary {
  clientName: string;
  clientPhone: string;
  appointmentsCount: number;
  lastAppointment: Date;
}

export interface TimeSeriesPoint { label: string; date: string; count: number; }

// Busca o dataset uma vez e deriva tudo a partir dele:
export async function getReportData(userId: string, period: ReportPeriod): Promise<{
  current: Appointment[];
  previous: Appointment[];  // período anterior de mesma duração, para comparação
}>;

export function computeMetrics(appts: Appointment[]): ReportMetrics;
export function computeServiceBreakdown(appts: Appointment[], services: Service[]): ServiceBreakdown[];
export function computeTopClients(appts: Appointment[], limit?: number): ClientSummary[];
export function computeTimeSeries(appts: Appointment[], granularity: "day" | "week" | "month"): TimeSeriesPoint[];
```

> As funções `compute*` são **puras** (entram arrays, saem agregados) → fáceis de testar
> com Vitest, sem mockar Firestore.

### 4.2 Hook — `src/hooks/use-reports.tsx` (novo)

```ts
export function useReports({ userId, period }: {
  userId: string | null;
  period: ReportPeriod;
}) {
  // Usa TanStack Query (useQuery) com key ["reports", userId, period.start, period.end]
  // Retorna: metrics, previousMetrics, serviceBreakdown, topClients, timeSeries,
  //          statusDistribution, isLoading, error, refetch
}
```

### 4.3 Página — `src/pages/Reports.tsx` (novo)

Layout (reutiliza estética dos cards `rounded-[20px] border border-border shadow-soft`):

```
Header: "Relatórios" + seletor de período (Select / date range)
─ Grid de KPI cards (4–6 cards com Δ% vs. período anterior)
─ Card: Agendamentos ao longo do tempo (AreaChart)
─ Grid 2 colunas:
    • Card: Serviços mais populares (BarChart)
    • Card: Distribuição por status (PieChart/donut)
─ Card: Top clientes (Table)
─ Card: Resumo por serviço (Table)
─ Botão "Exportar CSV"
```

Estados de loading (spinner igual ao Dashboard) e empty state ("Ainda não há
agendamentos neste período").

### 4.4 Componentes auxiliares — `src/components/reports/` (novos)

- `KpiCard.tsx` — valor, label, ícone (lucide), Δ% colorido.
- `AppointmentsTrendChart.tsx`
- `ServicePopularityChart.tsx`
- `StatusDistributionChart.tsx`
- `TopClientsTable.tsx`
- `PeriodSelector.tsx`

### 4.5 Roteamento — `src/App.tsx` (editar)

```tsx
<Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
```

### 4.6 Entrada no Dashboard — `src/pages/Dashboard.tsx` (editar)

Adicionar item ao `menuItems`:

```ts
{
  title: "Relatórios",
  description: "Acompanhe métricas e o desempenho do seu negócio",
  icon: BarChart3,            // de lucide-react
  path: "/reports",
}
```

### 4.7 Exportação CSV

Gerar CSV no cliente (lista de agendamentos do período + abas de resumo) e disparar
download via Blob. Sem dependência nova.

## 5. Considerações de dados e performance

- **Volume**: agendamentos por profissional são na casa de dezenas/centenas → buscar o
  período e agregar no cliente é adequado. Evita custo/complexidade de aggregation queries.
- **Comparação de período**: uma única função calcula `[start, end]` e o período anterior
  `[start - duração, start]` e reaproveita `getAppointmentsByDateRange`.
- **Índices Firestore**: as queries atuais filtram só por `userId` (sem índice composto).
  Mantemos esse padrão — nenhum índice novo necessário.
- **Identidade do cliente**: `clientPhone` é a chave de deduplicação (não há entidade
  Cliente). Normalizar o telefone (remover espaços/símbolos) antes de agrupar.
- **Cancelados**: incluídos nas contagens de status, mas **excluídos** dos cálculos de
  "atendimentos realizados" e de tempo agendado.
- **Fuso horário**: usar `date-fns` (já no projeto) e `dateTime` (Timestamp) como fonte
  de verdade para agrupamentos.

## 6. Testes

- **Unitários (Vitest)** para `computeMetrics`, `computeServiceBreakdown`,
  `computeTopClients`, `computeTimeSeries` — fixtures de agendamentos cobrindo:
  período vazio, cancelamentos, clientes recorrentes, múltiplos serviços, fronteiras de data.
- **Componente**: render da `Reports` com dados mockados (loading / vazio / preenchido).
- Verificação manual: rodar `npm run dev`, popular agendamentos de teste e validar os números.

## 7. Plano de entrega (incremental)

| Fase | Entrega | Arquivos |
|------|---------|----------|
| **0** | Status `no_show`: adicionar ao tipo `Appointment`; função/cloud function para atualizar status; ação "Não compareceu" (e badge correspondente) no `AppointmentDetailsSheet` | `services/appointments.ts`, `components/calendar/AppointmentDetailsSheet.tsx` |
| **1** | Camada de serviço + testes unitários das agregações (inclui no-show e faltas em aberto) | `services/reports.ts`, `*.test.ts` |
| **2** | Hook + página com KPIs e gráfico de tendência | `hooks/use-reports.tsx`, `pages/Reports.tsx`, rota, card no Dashboard |
| **3** | Gráficos de serviços/status + tabelas (top clientes, resumo) | `components/reports/*` |
| **4** | Filtros de período + comparação vs. período anterior | `PeriodSelector`, lógica de comparação |
| **5** | Exportação CSV + empty/loading states + polimento responsivo | `Reports.tsx` |

Cada fase é commitável e revisável de forma independente.

## 8. Fora de escopo / fases futuras

- **Receita / faturamento**: requer adicionar `price` a `user_services` e gravar o
  valor cobrado no `appointment` (snapshot no momento da reserva, para preservar
  histórico mesmo se o preço do serviço mudar). Habilita: faturamento por período,
  ticket médio, receita por serviço, projeção. **Recomendado como próxima feature.**
- **Entidade Cliente**: hoje o cliente é inferido por `clientPhone`. Uma coleção
  `clients` permitiria histórico, observações e métricas de retenção mais ricas (LTV, frequência média).
- **Relatórios agendados por e-mail** (resumo semanal/mensal via Cloud Function).
- **Exportação em PDF**.

## 9. Resumo de arquivos

| Ação | Arquivo |
|------|---------|
| Novo | `src/services/reports.ts` |
| Novo | `src/services/reports.test.ts` |
| Novo | `src/hooks/use-reports.tsx` |
| Novo | `src/pages/Reports.tsx` |
| Novo | `src/components/reports/{KpiCard,AppointmentsTrendChart,ServicePopularityChart,StatusDistributionChart,TopClientsTable,PeriodSelector}.tsx` |
| Editar | `src/App.tsx` (rota `/reports`) |
| Editar | `src/pages/Dashboard.tsx` (card "Relatórios") |
| Editar | `src/services/appointments.ts` (status `no_show` + atualização de status) |
| Editar | `src/components/calendar/AppointmentDetailsSheet.tsx` (ação "Não compareceu" + badge) |
| Reutilizar | `src/components/ui/chart.tsx`, `src/services/user-services.ts` |

**Sem novas dependências.** Única mudança de modelo: novo valor de status `no_show`
(aditivo, sem migração de dados).
