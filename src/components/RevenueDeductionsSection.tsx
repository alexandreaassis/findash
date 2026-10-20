import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DreEntry } from '@/types/dre'
import { formatBRL } from '@/lib/formatters'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { CustomChartTooltip } from '@/components/CustomChartTooltip'

interface RevenueDeductionsSectionProps {
  activeEntries: DreEntry[]
  selectedYear: number
  isSimulationActive?: boolean
}

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#06b6d4',
  '#6366f1',
  '#ec4899',
  '#8b5cf6',
]

export const RevenueDeductionsSection: React.FC<RevenueDeductionsSectionProps> = ({
  activeEntries,
  selectedYear,
  isSimulationActive = false,
}) => {
  // Apenas meses com fechamento
  const closedEntries = activeEntries.filter((e) => e.has_closing !== false)

  // Somatórios de deduções para composição
  const sumTaxes = closedEntries.reduce((a, b) => a + (b.deductions_taxes || 0), 0)
  const sumPurchasesTax = closedEntries.reduce((a, b) => a + (b.deductions_purchases_tax || 0), 0)
  const sumCosts = closedEntries.reduce((a, b) => a + (b.deductions_costs || 0), 0)
  const sumReturns = closedEntries.reduce((a, b) => a + (b.deductions_returns || 0), 0)
  const sumCommissions = closedEntries.reduce((a, b) => a + (b.deductions_commissions || 0), 0)
  const sumRoyalties = closedEntries.reduce((a, b) => a + (b.deductions_royalties || 0), 0)
  const sumMarketing = closedEntries.reduce((a, b) => a + (b.deductions_marketing || 0), 0)
  const sumFreight = closedEntries.reduce((a, b) => a + (b.deductions_freight || 0), 0)
  const totalDeductions = closedEntries.reduce((a, b) => a + (b.total_deductions || 0), 0)
  const totalRevenue = closedEntries.reduce((a, b) => a + (b.gross_revenue || 0), 0)

  // Itens para o gráfico de pizza de composição
  const pieData = [
    { name: 'Impostos s/ Venda', value: sumTaxes },
    ...(sumPurchasesTax > 0 ? [{ name: 'Impostos s/ Compra', value: sumPurchasesTax }] : []),
    { name: 'Custo Direto', value: sumCosts },
    { name: 'Devoluções', value: sumReturns },
    { name: 'Comissões', value: sumCommissions },
    { name: 'Royalties', value: sumRoyalties },
    { name: 'Fundo Propaganda', value: sumMarketing },
  ]

  // Fretes: existe somente em 2026
  if (selectedYear === 2026 && sumFreight > 0) {
    pieData.push({ name: 'Fretes (só em 2026)', value: sumFreight })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Receitas e Deduções ({selectedYear})
            </h3>
            {isSimulationActive && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
                Simulação
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Detalhamento executivo de cada rubrica dedutiva incidente sobre o faturamento bruto no
            período fechado de {selectedYear}
            {selectedYear === 2026
              ? ' — inclui a rubrica FRETES presente no exercício de 2026.'
              : ' — rubrica FRETES não existe em 2025.'}
          </p>
        </div>
      </div>

      {/* Grid com Gráfico de Composição e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-200/80 shadow-sm lg:col-span-1">
          <div className="p-5 border-b">
            <h4 className="font-semibold text-slate-900 text-sm">
              Composição das Deduções Acumuladas
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Participação de cada tipo de dedução no total
            </p>
          </div>
          <CardContent className="p-4 flex flex-col items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CustomChartTooltip
                        colorMap={pieData.reduce<Record<string, string>>((acc, item, index) => {
                          acc[item.name] = COLORS[index % COLORS.length]
                          return acc
                        }, {})}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full text-xs space-y-1 mt-2">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    {item.name}
                  </span>
                  <span className="font-mono font-medium text-slate-900">
                    {totalDeductions > 0 ? ((item.value / totalDeductions) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Tabela Decomposta Mês a Mês das Deduções */}
        <Card className="border-slate-200/80 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-5 border-b bg-slate-50/50">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              Valores Mensais e Acumulados das Deduções ({selectedYear})
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Valores expressos em Reais (R$)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-800 font-bold uppercase text-xs tracking-wider">
                  <th className="py-3 px-3 whitespace-nowrap">Mês</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Rec. Bruta</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Imp. Vendas</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Custo Direto</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Devoluções</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Comissões</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Royalties</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Propaganda</th>
                  {selectedYear === 2026 ? (
                    <th className="py-3 px-3 text-right text-indigo-700 whitespace-nowrap">
                      Fretes
                    </th>
                  ) : (
                    <th className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                      Fretes
                    </th>
                  )}
                  <th className="py-3 px-3 text-right text-rose-700 whitespace-nowrap">
                    Total Deduções
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs sm:text-sm">
                {activeEntries.map((row, idx) => {
                  const isClosed = row.has_closing !== false

                  if (!isClosed) {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 opacity-60 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-500 whitespace-nowrap">
                          {row.month_name?.slice(0, 3) || `Mês ${row.month}`}
                          <span className="ml-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-sans font-bold">
                            Aberto
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-medium">—</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-medium">—</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-medium">—</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-medium">—</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-medium">—</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-medium">—</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-medium">—</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-medium">—</td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-medium">—</td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900 whitespace-nowrap">
                        {row.month_name?.slice(0, 3) || `Mês ${row.month}`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-950 whitespace-nowrap">
                        {formatBRL(row.gross_revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-medium whitespace-nowrap">
                        {formatBRL(row.deductions_taxes)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-medium whitespace-nowrap">
                        {formatBRL(row.deductions_costs)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-medium whitespace-nowrap">
                        {formatBRL(row.deductions_returns)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-medium whitespace-nowrap">
                        {formatBRL(row.deductions_commissions)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-medium whitespace-nowrap">
                        {formatBRL(row.deductions_royalties)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-medium whitespace-nowrap">
                        {formatBRL(row.deductions_marketing)}
                      </td>
                      {selectedYear === 2026 ? (
                        <td className="py-2.5 px-3 text-right text-indigo-700 font-semibold whitespace-nowrap">
                          {row.deductions_freight !== undefined
                            ? formatBRL(row.deductions_freight)
                            : '—'}
                        </td>
                      ) : (
                        <td className="py-2.5 px-3 text-right text-slate-400 italic font-sans text-xs whitespace-nowrap">
                          —
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right font-black text-rose-700 whitespace-nowrap">
                        -{formatBRL(row.total_deductions)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold font-mono text-xs sm:text-sm text-slate-900">
                  <td className="py-3 px-3 font-sans font-black text-slate-950 uppercase text-xs whitespace-nowrap">
                    Total Fechado
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-950 whitespace-nowrap">
                    {formatBRL(totalRevenue)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatBRL(sumTaxes)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatBRL(sumCosts)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatBRL(sumReturns)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatBRL(sumCommissions)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatBRL(sumRoyalties)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatBRL(sumMarketing)}
                  </td>
                  {selectedYear === 2026 ? (
                    <td className="py-3 px-3 text-right text-indigo-800 font-black whitespace-nowrap">
                      {formatBRL(sumFreight)}
                    </td>
                  ) : (
                    <td className="py-3 px-3 text-right text-slate-400 italic font-sans text-xs whitespace-nowrap">
                      Ausente
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-black text-rose-700 whitespace-nowrap">
                    -{formatBRL(totalDeductions)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
        =======
        <div className="w-full space-y-1.5 mt-3">
          {pieData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-2 text-slate-800 font-semibold">
                <span
                  className="w-3 h-3 rounded-xs"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {item.name}
              </span>
              <span className="font-mono font-bold text-slate-950">
                {totalDeductions > 0 ? ((item.value / totalDeductions) * 100).toFixed(1) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
