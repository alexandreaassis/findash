export interface DreEntry {
  id?: string
  year: number
  period_type: 'monthly' | 'ytd' | 'summary'
  month?: number
  month_name?: string
  gross_revenue: number
  deductions_taxes: number
  deductions_costs: number
  deductions_returns: number
  deductions_commissions: number
  deductions_royalties: number
  deductions_marketing: number
  deductions_freight?: number
  total_deductions: number
  contribution_margin: number
  contribution_margin_pct: number
  expenses_admin: number
  expenses_commercial: number
  expenses_financial: number
  expenses_personnel: number
  total_expenses: number
  operating_result: number
  operating_result_pct: number
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
