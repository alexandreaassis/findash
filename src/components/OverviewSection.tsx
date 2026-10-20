import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Wallet,
  Layers,
  ShieldCheck,
} from 'lucide-react'
import { formatBRL, formatPercent } from '@/lib/formatters'
import { DreEntry } from '@/types/dre'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface OverviewSectionProps {
  entries2025: DreEntry[]
  entries2026: DreEntry[]
  selectedYear: number
  activeEntries: DreEntry[]
  isSimulationActive?: boolean
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  entries2025,
  entries2026,
  selectedYear,
  activeEntries,
  isSimulationActive = false,
}) => {
  // Apenas meses com fechamento realizado entram na soma do consolidado
  const closedActiveEntries = activeEntries.filter((e) => e.has_closing !== false)

  // Totais do ano selecionado
  const totalRevenue = closedActiveEntries.reduce((acc, curr) => acc + (curr.gross_revenue || 0), 0)
  const totalDeductions = closedActiveEntries.reduce(
    (acc, curr) => acc + (curr.total_deductions || 0),
    0,
  )
  const totalMargin = closedActiveEntries.reduce(
    (acc, curr) => acc + (curr.contribution_margin || 0),
    0,
  )
  const totalExpenses = closedActiveEntries.reduce(
    (acc, curr) => acc + (curr.total_expenses || 0),
    0,
  )
  const totalOperatingResult = closedActiveEntries.reduce(
    (acc, curr) => acc + (curr.operating_result || 0),
    0,
  )

  const marginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0
  const resultPct = totalRevenue > 0 ? (totalOperatingResult / totalRevenue) * 100 : 0

  // Comparativo Jan–Set entre os dois anos para cálculo de delta equivalente (meses 1 a 9)
  const comparableSamePeriod = (entries: DreEntry[]) =>
    entries.filter((e) => e.month && e.month <= 9 && e.has_closing !== false)

  const currentComparableRevenue = comparableSamePeriod(activeEntries).reduce(
    (acc, curr) => acc + (curr.gross_revenue || 0),
    0,
  )
  const currentComparableResult = comparableSamePeriod(activeEntries).reduce(
    (acc, curr) => acc + (curr.operating_result || 0),
    0,
  )

  const otherEntries = selectedYear === 2026 ? entries2025 : entries2026
  const otherComparableEntries = comparableSamePeriod(otherEntries)
  const otherRevenue = otherComparableEntries.reduce(
    (acc, curr) => acc + (curr.gross_revenue || 0),
    0,
  )
  const otherResult = otherComparableEntries.reduce(
    (acc, curr) => acc + (curr.operating_result || 0),
    0,
  )

  // Crescimento comparando período comparável fechado (Jan–Set 2026 vs Jan–Set 2025)
  const revenueGrowth =
    otherRevenue > 0 ? ((currentComparableRevenue - otherRevenue) / otherRevenue) * 100 : 0
  const resultGrowth =
    otherResult !== 0 ? ((currentComparableResult - otherResult) / Math.abs(otherResult)) * 100 : 0

  // Dados para o gráfico de evolução: inclui meses fechados
  const chartData = closedActiveEntries.map((e) => ({
    name: e.month_name?.slice(0, 3) || `Mês ${e.month}`,
    receita: e.gross_revenue,
    margem: e.contribution_margin,
    resultado: e.operating_result,
  }))

  const unclosedCount = activeEntries.filter((e) => e.has_closing === false).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Resumo Executivo / Leitura Estratégica */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-900/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Leitura Executiva {selectedYear === 2026 ? 'Jan–Set 2026' : 'Exercício 2025'}
              {isSimulationActive && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded text-[10px]">
                  Cenário Simulado
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Performance Financeira Consolidada da Empresa ({selectedYear})
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              No período com fechamento contábil de {selectedYear} ({closedActiveEntries.length}{' '}
              meses fechados), a receita acumulada foi de{' '}
              <span className="font-semibold text-white">{formatBRL(totalRevenue)}</span>, gerando
              um Resultado Operacional de{' '}
              <span
                className={`font-semibold ${totalOperatingResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {formatBRL(totalOperatingResult)} ({formatPercent(resultPct)})
              </span>{' '}
              com Margem de Contribuição de{' '}
              <span className="font-semibold text-indigo-300">{formatPercent(marginPct)}</span>.
              {unclosedCount > 0 && (
                <span className="block mt-1 text-amber-300/90">
                  * {unclosedCount} meses (Outubro a Dezembro) estão sem fechamento e não entram no
                  acumulado nem nos gráficos.
                </span>
              )}
            </p>
          </div>

          <div className="shrink-0 bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700/60 text-right min-w-[200px]">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Resultado Acumulado Fechado
            </span>
            <div
              className={`text-2xl font-bold mt-0.5 ${totalOperatingResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {formatBRL(totalOperatingResult)}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-end gap-1">
              <span>Margem líquida:</span>
              <span className="font-semibold">{formatPercent(resultPct)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Receita Bruta Acumulada */}
        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Receita Acumulada
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                {formatBRL(totalRevenue)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                {selectedYear === 2026 && otherRevenue > 0 ? (
                  <span
                    className={`inline-flex items-center font-medium ${revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                    title="Comparação Jan–Set 2026 vs Jan–Set 2025"
                  >
                    {revenueGrowth >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    )}
                    {revenueGrowth >= 0 ? '+' : ''}
                    {revenueGrowth.toFixed(1)}% vs 2025 (Jan–Set)
                  </span>
                ) : (
                  <span className="text-muted-foreground">12 meses fechados no exercício</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Margem de Contribuição */}
        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Margem Contribuição
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                {formatBRL(totalMargin)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {formatPercent(marginPct)} da receita
                </span>
                <span className="text-muted-foreground">após custos e deduções</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Despesas Operacionais Totais */}
        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Despesas Operacionais
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                {formatBRL(totalExpenses)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <span>Total Período Fechado</span>
                <span>•</span>
                <span>Admin, Com., Fin., Func.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Resultado Operacional Acumulado */}
        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resultado Operacional
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  totalOperatingResult >= 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div
                className={`text-2xl font-bold tracking-tight ${
                  totalOperatingResult >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatBRL(totalOperatingResult)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                {selectedYear === 2026 && otherResult !== 0 ? (
                  <span
                    className={`inline-flex items-center font-medium ${resultGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                    title="Comparação Jan–Set 2026 vs Jan–Set 2025"
                  >
                    {resultGrowth >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    )}
                    {resultGrowth >= 0 ? '+' : ''}
                    {resultGrowth.toFixed(1)}% vs 2025 (Jan–Set)
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {formatPercent(resultPct)} margem op. anual
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução Geral Mensal */}
      <Card className="border-slate-200/80 shadow-sm">
        <div className="p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">
              Evolução Mensal: Receita vs. Margem vs. Resultado ({selectedYear})
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Valores dos meses fechados em Reais (R$)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
              Receita
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
              Margem Contrib.
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              Resultado
            </span>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMargem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorResultado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatBRL(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  name="Receita Bruta"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                />
                <Area
                  type="monotone"
                  dataKey="margem"
                  name="Margem Contribuição"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMargem)"
                />
                <Area
                  type="monotone"
                  dataKey="resultado"
                  name="Resultado Operacional"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorResultado)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
