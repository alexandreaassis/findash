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
import { CustomChartTooltip } from '@/components/CustomChartTooltip'

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
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Performance Financeira Consolidada da Empresa ({selectedYear})
            </h3>
            <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed pt-1">
              No período com fechamento contábil de {selectedYear} ({closedActiveEntries.length}{' '}
              meses fechados), a receita acumulada foi de{' '}
              <span className="font-bold text-white">{formatBRL(totalRevenue)}</span>, gerando um
              Resultado Operacional de{' '}
              <span
                className={`font-bold ${totalOperatingResult >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}
              >
                {formatBRL(totalOperatingResult)} ({formatPercent(resultPct)})
              </span>{' '}
              com Margem de Contribuição de{' '}
              <span className="font-bold text-amber-300">{formatPercent(marginPct)}</span>.
              {unclosedCount > 0 && (
                <span className="block mt-1.5 text-amber-300 font-semibold text-xs sm:text-sm">
                  * {unclosedCount} meses (Outubro a Dezembro) estão sem fechamento e não entram no
                  acumulado nem nos gráficos.
                </span>
              )}
            </p>
          </div>

          <div className="shrink-0 bg-slate-800/90 backdrop-blur rounded-xl p-4 sm:p-5 border border-slate-700/70 text-right min-w-[220px]">
            <span className="text-xs uppercase tracking-wider text-slate-300 font-bold block">
              Resultado Acumulado Fechado
            </span>
            <div
              className={`text-2xl sm:text-3xl font-black mt-1 ${totalOperatingResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {formatBRL(totalOperatingResult)}
            </div>
            <div className="text-xs sm:text-sm text-slate-200 mt-1.5 flex items-center justify-end gap-1.5">
              <span className="font-medium">Margem líquida:</span>
              <span className="font-bold text-white">{formatPercent(resultPct)}</span>
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
              <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Receita Acumulada
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {formatBRL(totalRevenue)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs sm:text-sm font-medium">
                {selectedYear === 2026 && otherRevenue > 0 ? (
                  <span
                    className={`inline-flex items-center font-bold ${revenueGrowth >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}
                    title="Comparação Jan–Set 2026 vs Jan–Set 2025"
                  >
                    {revenueGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-0.5" />
                    )}
                    {revenueGrowth >= 0 ? '+' : ''}
                    {revenueGrowth.toFixed(1)}% vs 2025 (Jan–Set)
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    12 meses fechados no exercício
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Margem de Contribuição */}
        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Margem Contribuição
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {formatBRL(totalMargin)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs sm:text-sm">
                <span className="font-bold text-amber-800 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 px-2 py-0.5 rounded">
                  {formatPercent(marginPct)} da receita
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  após custos e deduções
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Despesas Operacionais Totais */}
        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Despesas Operacionais
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {formatBRL(totalExpenses)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
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
              <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Resultado Operacional
              </span>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  totalOperatingResult >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  totalOperatingResult >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {formatBRL(totalOperatingResult)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs sm:text-sm">
                {selectedYear === 2026 && otherResult !== 0 ? (
                  <span
                    className={`inline-flex items-center font-bold ${resultGrowth >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}
                    title="Comparação Jan–Set 2026 vs Jan–Set 2025"
                  >
                    {resultGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-0.5" />
                    )}
                    {resultGrowth >= 0 ? '+' : ''}
                    {resultGrowth.toFixed(1)}% vs 2025 (Jan–Set)
                  </span>
                ) : (
                  <span className="font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded">
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
          <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block shadow-xs" />
              Receita Bruta
            </span>
            <span className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block shadow-xs" />
              Margem Contribuição
            </span>
            <span className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block shadow-xs" />
              Resultado Operacional
            </span>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMargem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorResultado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 13, fill: '#334155', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={
                    <CustomChartTooltip
                      order={['receita', 'margem', 'resultado']}
                      labelMap={{
                        receita: 'Receita Bruta',
                        margem: 'Margem Contribuição',
                        resultado: 'Resultado Operacional',
                      }}
                      colorMap={{
                        receita: '#1d4ed8',
                        margem: '#d97706',
                        resultado: '#059669',
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  name="Receita Bruta"
                  stroke="#1d4ed8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                />
                <Area
                  type="monotone"
                  dataKey="margem"
                  name="Margem Contribuição"
                  stroke="#d97706"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMargem)"
                />
                <Area
                  type="monotone"
                  dataKey="resultado"
                  name="Resultado Operacional"
                  stroke="#059669"
                  strokeWidth={3}
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
