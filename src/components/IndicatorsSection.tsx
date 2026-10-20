import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DreEntry } from '@/types/dre'
import { formatBRL, formatPercent } from '@/lib/formatters'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { CustomChartTooltip } from '@/components/CustomChartTooltip'

interface IndicatorsSectionProps {
  activeEntries: DreEntry[]
  selectedYear: number
  isSimulationActive?: boolean
}

export const IndicatorsSection: React.FC<IndicatorsSectionProps> = ({
  activeEntries,
  selectedYear,
  isSimulationActive = false,
}) => {
  const chartData = activeEntries
    .filter((e) => e.has_closing !== false)
    .map((e) => ({
      name: e.month_name?.slice(0, 3) || `Mês ${e.month}`,
      receita: e.gross_revenue,
      deducoes: e.total_deductions,
      margem: e.contribution_margin,
      despesas: e.total_expenses,
      resultado: e.operating_result,
    }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Indicadores Mensais Detalhados ({selectedYear})
            </h3>
            {isSimulationActive && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
                Simulação
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Acompanhe a decomposição financeira por mês. Períodos ainda não fechados são indicados
            com "—" e não interferem nos acumulados.
          </p>
        </div>
      </div>

      {/* Gráfico de Barras com todos os componentes do DRE */}
      <Card className="border-slate-200/80 shadow-sm">
        <div className="p-5 border-b">
          <h4 className="font-semibold text-slate-900 text-sm">
            Composição Mensal: Receita vs. Deduções vs. Margem vs. Despesas vs. Resultado
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Valores mensais fechados expressos em Reais (R$)
          </p>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
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
                      order={['receita', 'deducoes', 'margem', 'despesas', 'resultado']}
                      labelMap={{
                        receita: 'Receita Bruta',
                        deducoes: 'Deduções',
                        margem: 'Margem Contribuição',
                        despesas: 'Despesas Totais',
                        resultado: 'Resultado Operacional',
                      }}
                      colorMap={{
                        receita: '#1d4ed8',
                        deducoes: '#e11d48',
                        margem: '#d97706',
                        despesas: '#7c3aed',
                        resultado: '#059669',
                      }}
                    />
                  }
                />
                <Legend
                  content={() => {
                    const items = [
                      { label: 'Receita Bruta', color: '#1d4ed8' },
                      { label: 'Deduções', color: '#e11d48' },
                      { label: 'Margem Contribuição', color: '#d97706' },
                      { label: 'Despesas Totais', color: '#7c3aed' },
                      { label: 'Resultado Operacional', color: '#059669' },
                    ]
                    return (
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3 text-[13px] font-semibold text-slate-700">
                        {items.map((item) => (
                          <div key={item.label} className="inline-flex items-center gap-1.5">
                            <span
                              className="inline-block h-3 w-3 rounded-xs shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                  wrapperStyle={{
                    fontSize: '13px',
                    fontWeight: '600',
                    paddingTop: '12px',
                  }}
                />
                <Bar dataKey="receita" name="Receita Bruta" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deducoes" name="Deduções" fill="#e11d48" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="margem"
                  name="Margem Contribuição"
                  fill="#d97706"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="despesas"
                  name="Despesas Totais"
                  fill="#7c3aed"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="resultado"
                  name="Resultado Operacional"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Indicadores Mês a Mês */}
      <Card className="border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50">
          <h4 className="font-semibold text-slate-900 text-sm">
            Tabela Analítica de Indicadores ({selectedYear})
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Valores negativos são destacados automaticamente em vermelho
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-800 font-bold uppercase text-xs tracking-wider">
                <th className="py-3.5 px-4">Mês</th>
                <th className="py-3.5 px-4 text-right">Receita Bruta</th>
                <th className="py-3.5 px-4 text-right">Deduções Totais</th>
                <th className="py-3.5 px-4 text-right">Margem Contribuição</th>
                <th className="py-3.5 px-4 text-right">% Margem</th>
                <th className="py-3.5 px-4 text-right">Despesas Operacionais</th>
                <th className="py-3.5 px-4 text-right">Resultado Operacional</th>
                <th className="py-3.5 px-4 text-right">% Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs sm:text-sm">
              {activeEntries.map((row, idx) => {
                const isClosed = row.has_closing !== false
                const isNegativeResult = row.operating_result < 0

                if (!isClosed) {
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 opacity-60 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-500">
                        {row.month_name || `Mês ${row.month}`}
                        <span className="ml-2 text-xs text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded font-sans">
                          Em aberto
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium">—</td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium">—</td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium">—</td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium">—</td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium">—</td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium">—</td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium">—</td>
                    </tr>
                  )
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                      {row.month_name || `Mês ${row.month}`}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-950 font-bold">
                      {formatBRL(row.gross_revenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-700 font-bold">
                      -{formatBRL(row.total_deductions)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-900 dark:text-amber-400 font-extrabold">
                      {formatBRL(row.contribution_margin)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-800 dark:text-amber-300 font-bold">
                      {formatPercent(row.contribution_margin_pct)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-purple-900 dark:text-purple-300 font-bold">
                      -{formatBRL(row.total_expenses)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-black ${isNegativeResult ? 'text-rose-700' : 'text-emerald-700'}`}
                    >
                      {formatBRL(row.operating_result)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-extrabold ${isNegativeResult ? 'text-rose-700' : 'text-emerald-700'}`}
                    >
                      {formatPercent(row.operating_result_pct)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Linha de Totais Acumulados (apenas meses fechados) */}
            <tfoot>
              {(() => {
                const closedEntries = activeEntries.filter((e) => e.has_closing !== false)
                const sumRev = closedEntries.reduce((a, b) => a + (b.gross_revenue || 0), 0)
                const sumDed = closedEntries.reduce((a, b) => a + (b.total_deductions || 0), 0)
                const sumMar = closedEntries.reduce((a, b) => a + (b.contribution_margin || 0), 0)
                const sumExp = closedEntries.reduce((a, b) => a + (b.total_expenses || 0), 0)
                const sumRes = closedEntries.reduce((a, b) => a + (b.operating_result || 0), 0)
                const marPct = sumRev > 0 ? (sumMar / sumRev) * 100 : 0
                const resPct = sumRev > 0 ? (sumRes / sumRev) * 100 : 0
                const isNeg = sumRes < 0

                return (
                  <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold font-mono text-xs sm:text-sm text-slate-900">
                    <td className="py-3.5 px-4 font-sans font-black text-slate-950 uppercase tracking-wider text-xs">
                      Total Acumulado ({closedEntries.length} meses)
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-950">
                      {formatBRL(sumRev)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-700 font-black">
                      -{formatBRL(sumDed)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-900 dark:text-amber-400 font-black">
                      {formatBRL(sumMar)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-900 dark:text-amber-400 font-black">
                      {formatPercent(marPct)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-purple-950 font-black">
                      -{formatBRL(sumExp)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-black text-base ${isNeg ? 'text-rose-700' : 'text-emerald-700'}`}
                    >
                      {formatBRL(sumRes)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-black ${isNeg ? 'text-rose-700' : 'text-emerald-700'}`}
                    >
                      {formatPercent(resPct)}
                    </td>
                  </tr>
                )
              })()}
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
