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
  const chartData = activeEntries.map((e) => ({
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
            Acompanhe a decomposição financeira por mês de Janeiro a Setembro (Período Fechado
            Jan–Set {selectedYear})
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
            Valores mensais expressos em Reais (R$)
          </p>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
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
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="receita" name="Receita Bruta" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deducoes" name="Deduções" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="margem"
                  name="Margem Contribuição"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="despesas"
                  name="Despesas Totais"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="resultado"
                  name="Resultado Operacional"
                  fill="#10b981"
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
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mês</th>
                <th className="py-3 px-4 text-right">Receita Bruta</th>
                <th className="py-3 px-4 text-right">Deduções Totais</th>
                <th className="py-3 px-4 text-right">Margem Contribuição</th>
                <th className="py-3 px-4 text-right">% Margem</th>
                <th className="py-3 px-4 text-right">Despesas Operacionais</th>
                <th className="py-3 px-4 text-right">Resultado Operacional</th>
                <th className="py-3 px-4 text-right">% Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {activeEntries.map((row, idx) => {
                const isNegativeResult = row.operating_result < 0
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-slate-800">
                      {row.month_name || `Mês ${row.month}`}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-900 font-semibold">
                      {formatBRL(row.gross_revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600">
                      -{formatBRL(row.total_deductions)}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-700 font-semibold">
                      {formatBRL(row.contribution_margin)}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-600">
                      {formatPercent(row.contribution_margin_pct)}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-700">
                      -{formatBRL(row.total_expenses)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${isNegativeResult ? 'text-rose-600' : 'text-emerald-700'}`}
                    >
                      {formatBRL(row.operating_result)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-semibold ${isNegativeResult ? 'text-rose-600' : 'text-emerald-700'}`}
                    >
                      {formatPercent(row.operating_result_pct)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Linha de Totais Acumulados Jan–Set */}
            <tfoot>
              {(() => {
                const sumRev = activeEntries.reduce((a, b) => a + (b.gross_revenue || 0), 0)
                const sumDed = activeEntries.reduce((a, b) => a + (b.total_deductions || 0), 0)
                const sumMar = activeEntries.reduce((a, b) => a + (b.contribution_margin || 0), 0)
                const sumExp = activeEntries.reduce((a, b) => a + (b.total_expenses || 0), 0)
                const sumRes = activeEntries.reduce((a, b) => a + (b.operating_result || 0), 0)
                const marPct = sumRev > 0 ? (sumMar / sumRev) * 100 : 0
                const resPct = sumRev > 0 ? (sumRes / sumRev) * 100 : 0
                const isNeg = sumRes < 0

                return (
                  <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold font-mono text-[11px] text-slate-900">
                    <td className="py-3 px-4 font-sans font-bold text-slate-950 uppercase tracking-wider text-[10px]">
                      Acumulado Jan–Set
                    </td>
                    <td className="py-3 px-4 text-right font-bold">{formatBRL(sumRev)}</td>
                    <td className="py-3 px-4 text-right text-rose-600 font-bold">
                      -{formatBRL(sumDed)}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-700 font-bold">
                      {formatBRL(sumMar)}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-700 font-bold">
                      {formatPercent(marPct)}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-800 font-bold">
                      -{formatBRL(sumExp)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-extrabold ${isNeg ? 'text-rose-600' : 'text-emerald-700'}`}
                    >
                      {formatBRL(sumRes)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${isNeg ? 'text-rose-600' : 'text-emerald-700'}`}
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
