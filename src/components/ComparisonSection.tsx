import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DreEntry } from '@/types/dre'
import { formatBRL, formatPercent } from '@/lib/formatters'
import { MONTH_NAMES } from '@/lib/formatters'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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

interface ComparisonSectionProps {
  entries2025: DreEntry[]
  entries2026: DreEntry[]
  isSimulationActive?: boolean
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  entries2025,
  entries2026,
  isSimulationActive = false,
}) => {
  // Construir matriz comparativa mês a mês (Jan a Set: meses 1 a 9, pois 2026 só tem fechamento até Setembro)
  const comparisonRows = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => {
    const row25 = entries2025.find((e) => e.month === m) || null
    const row26 = entries2026.find((e) => e.month === m) || null

    const rev25 = row25?.gross_revenue || 0
    const rev26 = row26?.gross_revenue || 0
    const revDiff = rev26 - rev25
    const revDiffPct = rev25 > 0 ? (revDiff / rev25) * 100 : 0

    const res25 = row25?.operating_result || 0
    const res26 = row26?.operating_result || 0
    const resDiff = res26 - res25
    const resDiffPct = res25 > 0 ? (resDiff / Math.abs(res25)) * 100 : 0

    const mar25Pct =
      row25?.contribution_margin_pct ||
      (rev25 > 0 ? ((row25?.contribution_margin || 0) / rev25) * 100 : 0)
    const mar26Pct =
      row26?.contribution_margin_pct ||
      (rev26 > 0 ? ((row26?.contribution_margin || 0) / rev26) * 100 : 0)

    const exp25 = row25?.total_expenses || 0
    const exp26 = row26?.total_expenses || 0

    return {
      month: m,
      monthName: MONTH_NAMES[m - 1],
      rev25,
      rev26,
      revDiff,
      revDiffPct,
      res25,
      res26,
      resDiff,
      resDiffPct,
      mar25Pct,
      mar26Pct,
      exp25,
      exp26,
    }
  })

  // Totais Acumulados no período comparável (meses 1 a 9)
  const comparable2025 = entries2025.filter(
    (e) => e.month && e.month <= 9 && e.has_closing !== false,
  )
  const comparable2026 = entries2026.filter(
    (e) => e.month && e.month <= 9 && e.has_closing !== false,
  )

  const totalRev25 = comparable2025.reduce((a, b) => a + (b.gross_revenue || 0), 0)
  const totalRev26 = comparable2026.reduce((a, b) => a + (b.gross_revenue || 0), 0)
  const totalRevDiff = totalRev26 - totalRev25
  const totalRevDiffPct = totalRev25 > 0 ? (totalRevDiff / totalRev25) * 100 : 0

  const totalRes25 = comparable2025.reduce((a, b) => a + (b.operating_result || 0), 0)
  const totalRes26 = comparable2026.reduce((a, b) => a + (b.operating_result || 0), 0)
  const totalResDiff = totalRes26 - totalRes25
  const totalResDiffPct = totalRes25 > 0 ? (totalResDiff / Math.abs(totalRes25)) * 100 : 0

  const totalMar25 = comparable2025.reduce((a, b) => a + (b.contribution_margin || 0), 0)
  const totalMar26 = comparable2026.reduce((a, b) => a + (b.contribution_margin || 0), 0)
  const totalMar25Pct = totalRev25 > 0 ? (totalMar25 / totalRev25) * 100 : 0
  const totalMar26Pct = totalRev26 > 0 ? (totalMar26 / totalRev26) * 100 : 0

  const totalExp25 = comparable2025.reduce((a, b) => a + (b.total_expenses || 0), 0)
  const totalExp26 = comparable2026.reduce((a, b) => a + (b.total_expenses || 0), 0)

  // Gráfico comparativo de receita e resultado
  const chartData = comparisonRows.map((r) => ({
    name: r.monthName.slice(0, 3),
    'Receita 2025': r.rev25,
    'Receita 2026': r.rev26,
    'Resultado 2025': r.res25,
    'Resultado 2026': r.res26,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Comparação Direta 2025 x 2026 (Recorte Jan–Set)
            </h3>
            {isSimulationActive && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
                Comparativo com Simulação
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Análise executiva de variações nominais e percentuais entre os mesmos 9 meses fechados
          </p>
        </div>
      </div>

      {/* Cards Comparativos Globais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card: Variação de Receita */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Variação de Receita (Jan–Set)
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <div className="text-2xl font-bold text-slate-900">{formatBRL(totalRevDiff)}</div>
              <div
                className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                  totalRevDiff >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {totalRevDiff >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {totalRevDiff >= 0 ? '+' : ''}
                {totalRevDiffPct.toFixed(1)}%
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-3 border-t">
              <span>
                2025: <strong className="text-slate-800">{formatBRL(totalRev25)}</strong>
              </span>
              <span>
                2026: <strong className="text-indigo-600">{formatBRL(totalRev26)}</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card: Variação de Resultado Operacional */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Variação de Resultado Operacional
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <div
                className={`text-2xl font-bold ${totalResDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {formatBRL(totalResDiff)}
              </div>
              <div
                className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                  totalResDiff >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {totalResDiff >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {totalResDiff >= 0 ? '+' : ''}
                {totalResDiffPct.toFixed(1)}%
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-3 border-t">
              <span>
                2025: <strong className="text-slate-800">{formatBRL(totalRes25)}</strong>
              </span>
              <span>
                2026: <strong className="text-emerald-700">{formatBRL(totalRes26)}</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card: Estrutura de Margem e Custos */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estrutura de Margem Contribuição
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <div className="text-2xl font-bold text-indigo-700">
                {formatPercent(totalMar26Pct)}
              </div>
              <span className="text-xs text-muted-foreground">
                em 2026 (vs {formatPercent(totalMar25Pct)} em 2025)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-3 border-t">
              <span>
                Despesas '25: <strong className="text-slate-800">{formatBRL(totalExp25)}</strong>
              </span>
              <span>
                Despesas '26: <strong className="text-amber-700">{formatBRL(totalExp26)}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo 2025 vs 2026 */}
      <Card className="border-slate-200/80 shadow-sm">
        <div className="p-5 border-b">
          <h4 className="font-semibold text-slate-900 text-sm">
            Evolução Comparada: 2025 x 2026 (Jan a Set)
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comparação das curvas de receita bruta e resultado operacional
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
                <Bar dataKey="Receita 2025" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Receita 2026" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resultado 2025" fill="#a7f3d0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resultado 2026" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Comparativa Completa Jan–Set */}
      <Card className="border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50">
          <h4 className="font-semibold text-slate-900 text-sm">
            Tabela Comparativa Mês a Mês (Jan–Set 2025 x 2026)
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Variação absoluta (R$) e percentual (%) com indicadores em vermelho para quedas
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mês</th>
                <th className="py-3 px-4 text-right">Receita 2025</th>
                <th className="py-3 px-4 text-right">Receita 2026</th>
                <th className="py-3 px-4 text-right">Var. Receita (R$)</th>
                <th className="py-3 px-4 text-right">Var. %</th>
                <th className="py-3 px-4 text-right">Margem '25</th>
                <th className="py-3 px-4 text-right">Margem '26</th>
                <th className="py-3 px-4 text-right">Resultado '25</th>
                <th className="py-3 px-4 text-right">Resultado '26</th>
                <th className="py-3 px-4 text-right">Var. Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {comparisonRows.map((row, idx) => {
                const isRevPos = row.revDiff >= 0
                const isResPos = row.resDiff >= 0
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-slate-800">
                      {row.monthName}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatBRL(row.rev25)}</td>
                    <td className="py-3 px-4 text-right text-blue-700 font-semibold">
                      {formatBRL(row.rev26)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-medium ${isRevPos ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {isRevPos ? '+' : ''}
                      {formatBRL(row.revDiff)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-semibold ${isRevPos ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {isRevPos ? '+' : ''}
                      {row.revDiffPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatPercent(row.mar25Pct)}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-700 font-semibold">
                      {formatPercent(row.mar26Pct)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatBRL(row.res25)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                      {formatBRL(row.res26)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${isResPos ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {isResPos ? '+' : ''}
                      {formatBRL(row.resDiff)} ({isResPos ? '+' : ''}
                      {row.resDiffPct.toFixed(1)}%)
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold font-mono text-[11px] text-slate-900">
                <td className="py-3 px-4 font-sans font-bold text-slate-950 uppercase tracking-wider text-[10px]">
                  Total Acumulado (Jan–Set)
                </td>
                <td className="py-3 px-4 text-right font-bold">{formatBRL(totalRev25)}</td>
                <td className="py-3 px-4 text-right text-blue-700 font-bold">
                  {formatBRL(totalRev26)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-bold ${totalRevDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                >
                  {totalRevDiff >= 0 ? '+' : ''}
                  {formatBRL(totalRevDiff)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-bold ${totalRevDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                >
                  {totalRevDiff >= 0 ? '+' : ''}
                  {totalRevDiffPct.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right font-bold">{formatPercent(totalMar25Pct)}</td>
                <td className="py-3 px-4 text-right text-indigo-700 font-bold">
                  {formatPercent(totalMar26Pct)}
                </td>
                <td className="py-3 px-4 text-right font-bold">{formatBRL(totalRes25)}</td>
                <td className="py-3 px-4 text-right text-emerald-700 font-bold">
                  {formatBRL(totalRes26)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-extrabold ${totalResDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                >
                  {totalResDiff >= 0 ? '+' : ''}
                  {formatBRL(totalResDiff)} ({totalResDiff >= 0 ? '+' : ''}
                  {totalResDiffPct.toFixed(1)}%)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
