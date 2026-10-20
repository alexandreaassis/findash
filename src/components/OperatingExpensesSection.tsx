import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DreEntry } from '@/types/dre'
import { formatBRL } from '@/lib/formatters'
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
import { Building2, Users, BadgeDollarSign, WalletCards } from 'lucide-react'

interface OperatingExpensesSectionProps {
  activeEntries: DreEntry[]
  selectedYear: number
  isSimulationActive?: boolean
}

export const OperatingExpensesSection: React.FC<OperatingExpensesSectionProps> = ({
  activeEntries,
  selectedYear,
  isSimulationActive = false,
}) => {
  const closedEntries = activeEntries.filter((e) => e.has_closing !== false)

  const sumAdmin = closedEntries.reduce((a, b) => a + (b.expenses_admin || 0), 0)
  const sumCommercial = closedEntries.reduce((a, b) => a + (b.expenses_commercial || 0), 0)
  const sumFinancial = closedEntries.reduce((a, b) => a + (b.expenses_financial || 0), 0)
  const sumPersonnel = closedEntries.reduce((a, b) => a + (b.expenses_personnel || 0), 0)
  const totalExpenses = closedEntries.reduce((a, b) => a + (b.total_expenses || 0), 0)

  const chartData = closedEntries.map((e) => ({
    name: e.month_name?.slice(0, 3) || `Mês ${e.month}`,
    Administrativo: e.expenses_admin,
    Comercial: e.expenses_commercial,
    Financeiro: e.expenses_financial,
    Funcionários: e.expenses_personnel,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Despesas Operacionais ({selectedYear})
            </h3>
            {isSimulationActive && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
                Simulação
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Acompanhamento executivo dos 4 grupos de despesas operacionais da empresa (
            {selectedYear}). Meses ainda não fechados constam como "—".
          </p>
        </div>
      </div>

      {/* 4 Cards das Categorias de Despesas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Administrativo */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administrativo
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900">{formatBRL(sumAdmin)}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totalExpenses > 0 ? ((sumAdmin / totalExpenses) * 100).toFixed(1) : 0}% das
                despesas totais
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comercial */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Comercial
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <BadgeDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900">{formatBRL(sumCommercial)}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totalExpenses > 0 ? ((sumCommercial / totalExpenses) * 100).toFixed(1) : 0}% das
                despesas totais
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Financeiro
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <WalletCards className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900">{formatBRL(sumFinancial)}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totalExpenses > 0 ? ((sumFinancial / totalExpenses) * 100).toFixed(1) : 0}% das
                despesas totais
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Funcionários / Folha */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Funcionários
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-slate-900">{formatBRL(sumPersonnel)}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totalExpenses > 0 ? ((sumPersonnel / totalExpenses) * 100).toFixed(1) : 0}% das
                despesas totais
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras Empilhadas por Mês */}
      <Card className="border-slate-200/80 shadow-sm">
        <div className="p-5 border-b">
          <h4 className="font-semibold text-slate-900 text-sm">
            Evolução Mensal das Despesas por Categoria ({selectedYear})
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Empilhamento mensal de custos administrativos, comerciais, financeiros e pessoal (meses
            fechados)
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
                <Bar dataKey="Administrativo" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Comercial" stackId="a" fill="#a855f7" />
                <Bar dataKey="Financeiro" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Funcionários" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Decomposta Mês a Mês */}
      <Card className="border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50">
          <h4 className="font-semibold text-slate-900 text-sm">
            Tabela Mensal de Despesas Operacionais ({selectedYear})
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Valores discriminados por mês e somatório acumulado
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mês</th>
                <th className="py-3 px-4 text-right">Administrativo</th>
                <th className="py-3 px-4 text-right">Comercial</th>
                <th className="py-3 px-4 text-right">Financeiro</th>
                <th className="py-3 px-4 text-right">Funcionários</th>
                <th className="py-3 px-4 text-right text-amber-800">Total Despesas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {activeEntries.map((row, idx) => {
                const isClosed = row.has_closing !== false

                if (!isClosed) {
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 opacity-60 transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-slate-500">
                        {row.month_name || `Mês ${row.month}`}
                        <span className="ml-1 text-[9px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded font-sans">
                          Aberto
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">—</td>
                      <td className="py-3 px-4 text-right text-slate-400">—</td>
                      <td className="py-3 px-4 text-right text-slate-400">—</td>
                      <td className="py-3 px-4 text-right text-slate-400">—</td>
                      <td className="py-3 px-4 text-right text-slate-400">—</td>
                    </tr>
                  )
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-slate-800">
                      {row.month_name || `Mês ${row.month}`}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatBRL(row.expenses_admin)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatBRL(row.expenses_commercial)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatBRL(row.expenses_financial)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatBRL(row.expenses_personnel)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">
                      -{formatBRL(row.total_expenses)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold font-mono text-[11px] text-slate-900">
                <td className="py-3 px-4 font-sans font-bold text-slate-950 uppercase text-[10px]">
                  Total Acumulado ({closedEntries.length} meses)
                </td>
                <td className="py-3 px-4 text-right font-bold">{formatBRL(sumAdmin)}</td>
                <td className="py-3 px-4 text-right font-bold">{formatBRL(sumCommercial)}</td>
                <td className="py-3 px-4 text-right font-bold">{formatBRL(sumFinancial)}</td>
                <td className="py-3 px-4 text-right font-bold">{formatBRL(sumPersonnel)}</td>
                <td className="py-3 px-4 text-right font-extrabold text-amber-800">
                  -{formatBRL(totalExpenses)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
