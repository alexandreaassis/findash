export interface DreEntry {
  id?: string
  year: number
  period_type: 'monthly' | 'ytd' | 'summary'
  month?: number
  month_name?: string
  has_closing?: boolean
  gross_revenue: number
  // Deduções detalhadas
  deductions_taxes: number // IMPOSTOS SOBRE VENDAS
  deductions_purchases_tax?: number // IMPOSTOS SOBRE COMPRAS
  deductions_costs: number // CUSTO DIRETO
  deductions_returns: number // DEVOLUÇÕES
  deductions_commissions: number // COMISSÕES
  deductions_royalties: number // ROYALTIES
  deductions_marketing: number // FUNDO DE PROPAGANDA
  deductions_freight?: number // FRETES (apenas 2026, ausente em 2025)
  total_deductions: number
  // Margem de contribuição
  contribution_margin: number
  contribution_margin_pct: number
  // Despesas operacionais detalhadas
  expenses_admin: number // ADMINISTRATIVO
  expenses_commercial: number // COMERCIAL
  expenses_financial: number // FINANCEIRO
  expenses_personnel: number // FUNCIONÁRIOS
  total_expenses: number
  // Resultados
  operating_result: number // RESULTADO OPERACIONAL
  operating_result_pct: number
  accumulated_result?: number // RESULTADO MENSAL ACUMULADO
  annual_total?: number // Total da coluna P capturado da planilha
  notes?: string
  created?: string
  updated?: string
}

export interface DreNote {
  id: string
  title: string
  category: 'period' | 'source' | 'methodology' | 'general'
  content: string
  order_num?: number
  created?: string
  updated?: string
}

export interface AppConfig {
  id: string
  config_key: string
  config_value: string
  description?: string
}

export interface DreSummaryCardData {
  grossRevenue: number
  operatingResult: number
  operatingResultPct: number
  contributionMargin: number
  contributionMarginPct: number
  totalDeductions: number
  totalExpenses: number
}

export interface ComparisonMonthData {
  month: number
  monthName: string
  year2025: DreEntry | null
  year2026: DreEntry | null
  revenueDiff: number
  revenueDiffPct: number
  resultDiff: number
  resultDiffPct: number
  marginDiff: number
}
