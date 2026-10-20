import { DreEntry } from '@/types/dre'
import { MONTH_NAMES } from './formatters'

/**
 * Converte número em formato pt-BR ou en-US para float JS
 * Suporta: "1.234.567,89", "1234.56", "(1.200,00)" negativo, "- 500,00", etc.
 */
export function parseNumberCell(raw: any): number {
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw
  if (!raw) return 0

  let str = String(raw).trim()
  if (!str) return 0

  // Se estiver entre parênteses "(1.200,00)", é negativo
  let isNegative = false
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true
    str = str.slice(1, -1).trim()
  } else if (str.startsWith('-')) {
    isNegative = true
    str = str.slice(1).trim()
  }

  // Remove símbolos monetários "R$", "R $", etc.
  str = str.replace(/[R$]/g, '').trim()

  // Se contém vírgula e ponto (ex: 1.234,56 ou 1,234.56)
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // Formato brasileiro 1.234,56
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      // Formato americano 1,234.56
      str = str.replace(/,/g, '')
    }
  } else if (str.includes(',')) {
    // Apenas vírgula: pode ser decimal (1234,56)
    str = str.replace(',', '.')
  }

  const parsed = parseFloat(str)
  if (isNaN(parsed)) return 0
  return isNegative ? -Math.abs(parsed) : parsed
}

export function parseMonthIndex(raw: any): number | null {
  if (!raw) return null
  if (typeof raw === 'number' && raw >= 1 && raw <= 12) return raw

  const str = String(raw).toLowerCase().trim()
  const clean = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const prefixes = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ]
  for (let i = 0; i < prefixes.length; i++) {
    if (clean.startsWith(prefixes[i])) {
      return i + 1
    }
  }

  const numeric = parseInt(clean, 10)
  if (!isNaN(numeric) && numeric >= 1 && numeric <= 12) {
    return numeric
  }

  return null
}

/**
 * Converte linhas de CSV/TSV/texto tabulado ou linhas de planilha em DreEntry[]
 */
export function parseDreDelimitedText(text: string, defaultYear: number = 2025): DreEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  // Detecta separador (, ou ; ou \t)
  const firstLine = lines[0]
  let separator = ','
  if (firstLine.includes('\t')) separator = '\t'
  else if (
    firstLine.includes(';') &&
    (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
  )
    separator = ';'

  const headerCells = firstLine.split(separator).map((c) =>
    c
      .trim()
      .toLowerCase()
      .replace(/^["']|["']$/g, ''),
  )

  const entries: DreEntry[] = []

  for (let i = 1; i < lines.length; i++) {
    const rawCells = lines[i].split(separator).map((c) => c.trim().replace(/^["']|["']$/g, ''))
    if (rawCells.length < 2) continue

    const rowObj: Record<string, string> = {}
    headerCells.forEach((header, idx) => {
      rowObj[header] = rawCells[idx] || ''
    })

    // Detecta ano
    let year = defaultYear
    for (const h of headerCells) {
      if (h.includes('ano') || h.includes('exercicio') || h === 'year') {
        const yVal = parseInt(rowObj[h], 10)
        if (yVal === 2025 || yVal === 2026) year = yVal
      }
    }

    // Detecta mês ou período
    let month: number | null = null
    let monthName = ''
    let periodType: 'monthly' | 'ytd' | 'summary' = 'monthly'

    for (const h of headerCells) {
      if (
        h.includes('mes') ||
        h.includes('mês') ||
        h === 'period' ||
        h === 'periodo' ||
        h === 'month'
      ) {
        const val = rowObj[h]
        if (
          val.toLowerCase().includes('acumulado') ||
          val.toLowerCase().includes('ytd') ||
          val.toLowerCase().includes('total')
        ) {
          periodType = 'ytd'
          monthName = 'Acumulado Jan–Set'
        } else {
          month = parseMonthIndex(val)
          if (month) {
            monthName = MONTH_NAMES[month - 1]
          } else {
            monthName = val
          }
        }
        break
      }
    }

    if (!month && periodType !== 'ytd') {
      // Tenta a primeira coluna
      const val = rawCells[0]
      if (
        val.toLowerCase().includes('acumulado') ||
        val.toLowerCase().includes('ytd') ||
        val.toLowerCase().includes('total')
      ) {
        periodType = 'ytd'
        monthName = 'Acumulado Jan–Set'
      } else {
        month = parseMonthIndex(val)
        if (month) {
          monthName = MONTH_NAMES[month - 1]
        }
      }
    }

    // Busca valores pelas colunas
    const findValue = (keywords: string[]): number => {
      for (const h of headerCells) {
        if (keywords.some((k) => h.includes(k))) {
          return parseNumberCell(rowObj[h])
        }
      }
      return 0
    }

    const grossRevenue = findValue([
      'receita bruta',
      'faturamento',
      'receita',
      'gross_revenue',
      'receitas',
    ])
    const deductionsTaxes = findValue(['imposto', 'tributos', 'taxes'])
    const deductionsCosts = findValue(['custo', 'cmv', 'costs'])
    const deductionsReturns = findValue(['devolu', 'returns'])
    const deductionsCommissions = findValue(['comiss', 'commissions'])
    const deductionsRoyalties = findValue(['royalt'])
    const deductionsMarketing = findValue(['propaganda', 'marketing'])
    const deductionsFreight = findValue(['frete', 'freight'])

    let totalDeductions = findValue(['total dedu', 'deducoes', 'deduções'])
    if (!totalDeductions) {
      totalDeductions =
        deductionsTaxes +
        deductionsCosts +
        deductionsReturns +
        deductionsCommissions +
        deductionsRoyalties +
        deductionsMarketing +
        deductionsFreight
    }

    let contributionMargin = findValue([
      'margem de contrib',
      'margem contrib',
      'contribution_margin',
    ])
    if (!contributionMargin && grossRevenue > 0) {
      contributionMargin = grossRevenue - totalDeductions
    }

    let contributionMarginPct = findValue(['% margem', 'margem %'])
    if (!contributionMarginPct && grossRevenue > 0) {
      contributionMarginPct = (contributionMargin / grossRevenue) * 100
    }

    const expensesAdmin = findValue(['admin', 'administrativ'])
    const expensesCommercial = findValue(['comercial'])
    const expensesFinancial = findValue(['financeir', 'desp. financeiras'])
    const expensesPersonnel = findValue(['funcion', 'folha', 'pessoal'])

    let totalExpenses = findValue(['total desp', 'despesas operacionais', 'despesas'])
    if (!totalExpenses) {
      totalExpenses = expensesAdmin + expensesCommercial + expensesFinancial + expensesPersonnel
    }

    let operatingResult = findValue([
      'resultado operacional',
      'ebitda',
      'resultado',
      'lucro operacional',
    ])
    if (!operatingResult) {
      operatingResult = contributionMargin - totalExpenses
    }

    let operatingResultPct = findValue(['% resultado', 'margem operacional'])
    if (!operatingResultPct && grossRevenue > 0) {
      operatingResultPct = (operatingResult / grossRevenue) * 100
    }

    if (month || periodType === 'ytd' || grossRevenue > 0) {
      entries.push({
        year,
        period_type: periodType,
        month: month || undefined,
        month_name: monthName || (month ? MONTH_NAMES[month - 1] : undefined),
        gross_revenue: grossRevenue,
        deductions_taxes: deductionsTaxes,
        deductions_costs: deductionsCosts,
        deductions_returns: deductionsReturns,
        deductions_commissions: deductionsCommissions,
        deductions_royalties: deductionsRoyalties,
        deductions_marketing: deductionsMarketing,
        deductions_freight: year === 2026 ? deductionsFreight : 0,
        total_deductions: totalDeductions,
        contribution_margin: contributionMargin,
        contribution_margin_pct: contributionMarginPct,
        expenses_admin: expensesAdmin,
        expenses_commercial: expensesCommercial,
        expenses_financial: expensesFinancial,
        expenses_personnel: expensesPersonnel,
        total_expenses: totalExpenses,
        operating_result: operatingResult,
        operating_result_pct: operatingResultPct,
      })
    }
  }

  return entries
}

/**
 * Converte JSON importado para DreEntry[]
 */
export function parseDreJson(jsonData: any[]): DreEntry[] {
  if (!Array.isArray(jsonData)) return []
  return jsonData.map((item) => {
    const year = Number(item.year || item.ano) || 2025
    const month = item.month
      ? Number(item.month)
      : item.mes
        ? parseMonthIndex(item.mes) || undefined
        : undefined
    const monthName =
      item.month_name || item.mes_nome || (month ? MONTH_NAMES[month - 1] : undefined)
    const periodType: 'monthly' | 'ytd' | 'summary' = (item.period_type ||
      (month ? 'monthly' : 'ytd')) as any

    const grossRevenue = parseNumberCell(item.gross_revenue ?? item.receita_bruta ?? item.receita)
    const deductionsTaxes = parseNumberCell(item.deductions_taxes ?? item.impostos)
    const deductionsCosts = parseNumberCell(item.deductions_costs ?? item.custos)
    const deductionsReturns = parseNumberCell(item.deductions_returns ?? item.devolucoes)
    const deductionsCommissions = parseNumberCell(item.deductions_commissions ?? item.comissoes)
    const deductionsRoyalties = parseNumberCell(item.deductions_royalties ?? item.royalties)
    const deductionsMarketing = parseNumberCell(
      item.deductions_marketing ?? item.propaganda ?? item.marketing,
    )
    const deductionsFreight = parseNumberCell(item.deductions_freight ?? item.fretes ?? item.frete)

    const totalDeductions =
      parseNumberCell(item.total_deductions ?? item.total_deducoes) ||
      deductionsTaxes +
        deductionsCosts +
        deductionsReturns +
        deductionsCommissions +
        deductionsRoyalties +
        deductionsMarketing +
        deductionsFreight

    const contributionMargin =
      parseNumberCell(item.contribution_margin ?? item.margem_contribuicao) ||
      grossRevenue - totalDeductions
    const contributionMarginPct =
      parseNumberCell(item.contribution_margin_pct ?? item.margem_contribuicao_pct) ||
      (grossRevenue > 0 ? (contributionMargin / grossRevenue) * 100 : 0)

    const expensesAdmin = parseNumberCell(
      item.expenses_admin ?? item.despesas_administrativas ?? item.administrativo,
    )
    const expensesCommercial = parseNumberCell(
      item.expenses_commercial ?? item.despesas_comerciais ?? item.comercial,
    )
    const expensesFinancial = parseNumberCell(
      item.expenses_financial ?? item.despesas_financeiras ?? item.financeiro,
    )
    const expensesPersonnel = parseNumberCell(
      item.expenses_personnel ?? item.despesas_funcionarios ?? item.funcionarios,
    )

    const totalExpenses =
      parseNumberCell(item.total_expenses ?? item.total_despesas) ||
      expensesAdmin + expensesCommercial + expensesFinancial + expensesPersonnel

    const operatingResult =
      parseNumberCell(item.operating_result ?? item.resultado_operacional) ||
      contributionMargin - totalExpenses

    const operatingResultPct =
      parseNumberCell(item.operating_result_pct ?? item.resultado_operacional_pct) ||
      (grossRevenue > 0 ? (operatingResult / grossRevenue) * 100 : 0)

    return {
      year,
      period_type: periodType,
      month,
      month_name: monthName,
      gross_revenue: grossRevenue,
      deductions_taxes: deductionsTaxes,
      deductions_costs: deductionsCosts,
      deductions_returns: deductionsReturns,
      deductions_commissions: deductionsCommissions,
      deductions_royalties: deductionsRoyalties,
      deductions_marketing: deductionsMarketing,
      deductions_freight: year === 2026 ? deductionsFreight : 0,
      total_deductions: totalDeductions,
      contribution_margin: contributionMargin,
      contribution_margin_pct: contributionMarginPct,
      expenses_admin: expensesAdmin,
      expenses_commercial: expensesCommercial,
      expenses_financial: expensesFinancial,
      expenses_personnel: expensesPersonnel,
      total_expenses: totalExpenses,
      operating_result: operatingResult,
      operating_result_pct: operatingResultPct,
      notes: item.notes || item.observacoes,
    }
  })
}
