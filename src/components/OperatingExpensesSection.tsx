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
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Administrativo
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatBRL(sumAdmin)}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold mt-1.5">
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
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Comercial
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 flex items-center justify-center">
                <BadgeDollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatBRL(sumCommercial)}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold mt-1.5">
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
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Financeiro
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center justify-center">
                <WalletCards className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatBRL(sumFinancial)}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold mt-1.5">
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
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Funcionários
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatBRL(sumPersonnel)}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold mt-1.5">
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
          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
            Evolução Mensal das Despesas por Categoria ({selectedYear})
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Empilhamento mensal de custos administrativos, comerciais, financeiros e pessoal (meses
            fechados)
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
                  formatter={(val: any) => [formatBRL(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '8px 12px',
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '13px',
                    fontWeight: '600',
                    paddingTop: '12px',
                  }}
                />
                <Bar dataKey="Administrativo" stackId="a" fill="#1d4ed8" />
                <Bar dataKey="Comercial" stackId="a" fill="#9333ea" />
                <Bar dataKey="Financeiro" stackId="a" fill="#d97706" />
                <Bar dataKey="Funcionários" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Decomposta Mês a Mês */}
      <Card className="border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50">
          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
            Tabela Mensal de Despesas Operacionais ({selectedYear})
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Valores discriminados por mês e somatório acumulado
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-800 font-bold uppercase text-xs tracking-wider">
                <th className="py-3.5 px-4 whitespace-nowrap">Mês</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Administrativo</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Comercial</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Financeiro</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Funcionários</th>
                <th className="py-3.5 px-4 text-right text-purple-900 dark:text-purple-300 whitespace-nowrap">
                  Total Despesas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs sm:text-sm">
              {activeEntries.map((row, idx) => {
                const isClosed = row.has_closing !== false

                if (!isClosed) {
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 opacity-60 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-500 whitespace-nowrap">
                        {row.month_name || `Mês ${row.month}`}
                        <span className="ml-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-sans font-bold">
                          Aberto
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium whitespace-nowrap">
                        —
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium whitespace-nowrap">
                        —
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium whitespace-nowrap">
                        —
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium whitespace-nowrap">
                        —
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium whitespace-nowrap">
                        —
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900 whitespace-nowrap">
                      {row.month_name || `Mês ${row.month}`}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 font-medium whitespace-nowrap">
                      {formatBRL(row.expenses_admin)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 font-medium whitespace-nowrap">
                      {formatBRL(row.expenses_commercial)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 font-medium whitespace-nowrap">
                      {formatBRL(row.expenses_financial)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 font-medium whitespace-nowrap">
                      {formatBRL(row.expenses_personnel)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-purple-900 dark:text-purple-300 whitespace-nowrap">
                      -{formatBRL(row.total_expenses)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold font-mono text-xs sm:text-sm text-slate-900">
                <td className="py-3.5 px-4 font-sans font-black text-slate-950 uppercase text-xs whitespace-nowrap">
                  Total Acumulado ({closedEntries.length} meses)
                </td>
                <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                  {formatBRL(sumAdmin)}
                </td>
                <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                  {formatBRL(sumCommercial)}
                </td>
                <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                  {formatBRL(sumFinancial)}
                </td>
                <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                  {formatBRL(sumPersonnel)}
                </td>
                <td className="py-3.5 px-4 text-right font-black text-purple-950 whitespace-nowrap">
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
