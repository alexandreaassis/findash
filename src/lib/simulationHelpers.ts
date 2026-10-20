import { DreEntry } from '@/types/dre'

export type EditableRubricKey =
  | 'gross_revenue'
  | 'deductions_taxes'
  | 'deductions_costs'
  | 'deductions_returns'
  | 'deductions_commissions'
  | 'deductions_royalties'
  | 'deductions_marketing'
  | 'deductions_freight'
  | 'expenses_admin'
  | 'expenses_commercial'
  | 'expenses_financial'
  | 'expenses_personnel'

export interface RubricDefinition {
  key: EditableRubricKey
  label: string
  group: 'revenue' | 'deduction' | 'expense'
  tooltip?: string
  appliesToYear?: (year: number) => boolean
}

export const EDITABLE_RUBRICS: RubricDefinition[] = [
  { key: 'gross_revenue', label: 'Receita Bruta', group: 'revenue' },
  { key: 'deductions_taxes', label: 'Impostos', group: 'deduction' },
  { key: 'deductions_costs', label: 'Custos (CMV)', group: 'deduction' },
  { key: 'deductions_returns', label: 'Devoluções', group: 'deduction' },
  { key: 'deductions_commissions', label: 'Comissões', group: 'deduction' },
  { key: 'deductions_royalties', label: 'Royalties', group: 'deduction' },
  { key: 'deductions_marketing', label: 'Propaganda / Mkt', group: 'deduction' },
  {
    key: 'deductions_freight',
    label: 'Fretes (2026)',
    group: 'deduction',
    appliesToYear: (y) => y === 2026,
  },
  { key: 'expenses_admin', label: 'Desp. Administrativas', group: 'expense' },
  { key: 'expenses_commercial', label: 'Desp. Comerciais', group: 'expense' },
  { key: 'expenses_financial', label: 'Desp. Financeiras', group: 'expense' },
  { key: 'expenses_personnel', label: 'Desp. Funcionários / Folha', group: 'expense' },
]

/**
 * Recalcula métricas derivadas de uma entrada do DRE com precisão matemática:
 * total_deductions = soma de impostos, custos, devoluções, comissões, royalties, marketing e fretes
 * contribution_margin = gross_revenue - total_deductions
 * contribution_margin_pct = (contribution_margin / gross_revenue) * 100
 * total_expenses = soma de admin, comercial, financeiro, pessoal
 * operating_result = contribution_margin - total_expenses
 * operating_result_pct = (operating_result / gross_revenue) * 100
 */
export function recalculateDreEntry(entry: DreEntry): DreEntry {
  const freight = entry.year === 2026 ? Number(entry.deductions_freight || 0) : 0
  const totalDeductions =
    Number(entry.deductions_taxes || 0) +
    Number(entry.deductions_costs || 0) +
    Number(entry.deductions_returns || 0) +
    Number(entry.deductions_commissions || 0) +
    Number(entry.deductions_royalties || 0) +
    Number(entry.deductions_marketing || 0) +
    freight

  const revenue = Number(entry.gross_revenue || 0)
  const margin = revenue - totalDeductions
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0

  const totalExpenses =
    Number(entry.expenses_admin || 0) +
    Number(entry.expenses_commercial || 0) +
    Number(entry.expenses_financial || 0) +
    Number(entry.expenses_personnel || 0)

  const operatingResult = margin - totalExpenses
  const resultPct = revenue > 0 ? (operatingResult / revenue) * 100 : 0

  return {
    ...entry,
    deductions_freight: freight,
    total_deductions: Math.round(totalDeductions * 100) / 100,
    contribution_margin: Math.round(margin * 100) / 100,
    contribution_margin_pct: Math.round(marginPct * 100) / 100,
    total_expenses: Math.round(totalExpenses * 100) / 100,
    operating_result: Math.round(operatingResult * 100) / 100,
    operating_result_pct: Math.round(resultPct * 100) / 100,
  }
}

/**
 * Cria uma cópia profunda dos registros DRE para isolamento estrito da simulação
 */
export function cloneDreEntries(entries: DreEntry[]): DreEntry[] {
  return entries.map((e) => recalculateDreEntry({ ...e }))
}

/**
 * Conta quantas alterações foram feitas em relação ao conjunto original
 */
export function countSimulationChanges(original: DreEntry[], current: DreEntry[]): number {
  let changes = 0
  for (const curr of current) {
    const orig = original.find((o) => o.year === curr.year && o.month === curr.month)
    if (!orig) continue

    for (const rubric of EDITABLE_RUBRICS) {
      if (rubric.appliesToYear && !rubric.appliesToYear(curr.year)) continue
      const origVal = Number((orig as any)[rubric.key] || 0)
      const currVal = Number((curr as any)[rubric.key] || 0)
      if (Math.abs(origVal - currVal) > 0.001) {
        changes++
      }
    }
  }
  return changes
}
