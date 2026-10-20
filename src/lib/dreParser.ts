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
/**
 * Normaliza rótulo de rubrica contábil/financeira para detecção flexível
 */
function normalizeRubricKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Tenta fazer o parse de uma planilha onde as rubricas estão nas LINHAS
 * e os meses/períodos estão nas COLUNAS (formato DRE contábil clássico do Excel)
 */
function tryParseTransposedDre(grid: string[][], defaultYear: number): DreEntry[] | null {
  if (grid.length < 3) return null

  // Procura uma linha de cabeçalho que contenha nomes de meses ou "Jan", "Fev", "Mar", etc.
  let headerRowIdx = -1
  let monthCols: { colIdx: number; month: number; monthName: string; year: number }[] = []

  // Verifica se o ano é indicado no texto ou células
  let detectedYear = defaultYear
  for (const row of grid.slice(0, 5)) {
    const full = row.join(' ')
    if (/2026/.test(full) && !/2025/.test(full)) detectedYear = 2026
    else if (/2025/.test(full) && !/2026/.test(full)) detectedYear = 2025
  }

  for (let r = 0; r < Math.min(8, grid.length); r++) {
    const row = grid[r]
    const detected: { colIdx: number; month: number; monthName: string; year: number }[] = []

    for (let c = 0; c < row.length; c++) {
      const val = row[c]
      const mIdx = parseMonthIndex(val)
      if (mIdx) {
        // Tenta ver se tem o ano junto (ex: "Jan/26", "Jan-2026")
        let colYear = detectedYear
        if (/2025|25\b/.test(val)) colYear = 2025
        if (/2026|26\b/.test(val)) colYear = 2026
        detected.push({
          colIdx: c,
          month: mIdx,
          monthName: MONTH_NAMES[mIdx - 1],
          year: colYear,
        })
      }
    }

    if (detected.length >= 2) {
      headerRowIdx = r
      monthCols = detected
      break
    }
  }

  if (headerRowIdx === -1 || monthCols.length === 0) {
    return null
  }

  // Mapa de cada coluna para seu objeto DreEntry inicial
  const colEntriesMap = new Map<number, DreEntry>()
  for (const col of monthCols) {
    colEntriesMap.set(col.colIdx, {
      year: col.year,
      period_type: 'monthly',
      month: col.month,
      month_name: col.monthName,
      gross_revenue: 0,
      deductions_taxes: 0,
      deductions_costs: 0,
      deductions_returns: 0,
      deductions_commissions: 0,
      deductions_royalties: 0,
      deductions_marketing: 0,
      deductions_freight: 0,
      total_deductions: 0,
      contribution_margin: 0,
      contribution_margin_pct: 0,
      expenses_admin: 0,
      expenses_commercial: 0,
      expenses_financial: 0,
      expenses_personnel: 0,
      total_expenses: 0,
      operating_result: 0,
      operating_result_pct: 0,
    })
  }

  // Itera pelas linhas após o cabeçalho procurando rubricas
  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r]
    if (row.length === 0) continue

    // A primeira ou segunda célula costuma ser o nome da rubrica
    const rubricLabel = normalizeRubricKey(row[0] || row[1] || '')
    if (!rubricLabel) continue

    for (const col of monthCols) {
      const cellVal = parseNumberCell(row[col.colIdx])
      const entry = colEntriesMap.get(col.colIdx)!

      if (
        rubricLabel.includes('receita bruta') ||
        rubricLabel.includes('faturamento') ||
        (rubricLabel === 'receita' && entry.gross_revenue === 0)
      ) {
        entry.gross_revenue = Math.abs(cellVal)
      } else if (rubricLabel.includes('imposto') || rubricLabel.includes('tributo')) {
        entry.deductions_taxes = Math.abs(cellVal)
      } else if (
        rubricLabel.includes('custo') ||
        rubricLabel.includes('cmv') ||
        rubricLabel.includes('cpv')
      ) {
        entry.deductions_costs = Math.abs(cellVal)
      } else if (rubricLabel.includes('devolu') || rubricLabel.includes('cancelamento')) {
        entry.deductions_returns = Math.abs(cellVal)
      } else if (rubricLabel.includes('comiss')) {
        entry.deductions_commissions = Math.abs(cellVal)
      } else if (rubricLabel.includes('royalt')) {
        entry.deductions_royalties = Math.abs(cellVal)
      } else if (rubricLabel.includes('propaganda') || rubricLabel.includes('marketing')) {
        entry.deductions_marketing = Math.abs(cellVal)
      } else if (rubricLabel.includes('frete')) {
        entry.deductions_freight = Math.abs(cellVal)
      } else if (
        rubricLabel.includes('total dedu') ||
        rubricLabel === 'deducoes' ||
        rubricLabel === 'deducoes da receita'
      ) {
        entry.total_deductions = Math.abs(cellVal)
      } else if (
        rubricLabel.includes('margem de contrib') ||
        rubricLabel.includes('margem contrib')
      ) {
        if (!rubricLabel.includes('%')) {
          entry.contribution_margin = cellVal
        } else {
          entry.contribution_margin_pct = cellVal
        }
      } else if (
        rubricLabel.includes('admin') ||
        rubricLabel.includes('despesas administrativas')
      ) {
        entry.expenses_admin = Math.abs(cellVal)
      } else if (rubricLabel.includes('comercial') || rubricLabel.includes('despesas comerciais')) {
        entry.expenses_commercial = Math.abs(cellVal)
      } else if (
        rubricLabel.includes('financeir') ||
        rubricLabel.includes('despesas financeiras')
      ) {
        entry.expenses_financial = Math.abs(cellVal)
      } else if (
        rubricLabel.includes('funcion') ||
        rubricLabel.includes('folha') ||
        rubricLabel.includes('pessoal')
      ) {
        entry.expenses_personnel = Math.abs(cellVal)
      } else if (
        rubricLabel.includes('total desp') ||
        rubricLabel === 'despesas operacionais' ||
        rubricLabel === 'despesas'
      ) {
        entry.total_expenses = Math.abs(cellVal)
      } else if (
        rubricLabel.includes('resultado operacional') ||
        rubricLabel.includes('lucro operacional') ||
        rubricLabel === 'ebitda'
      ) {
        if (!rubricLabel.includes('%')) {
          entry.operating_result = cellVal
        } else {
          entry.operating_result_pct = cellVal
        }
      }
    }
  }

  // Recalcula totais derivados para consistência
  const result: DreEntry[] = []
  for (const entry of colEntriesMap.values()) {
    if (entry.gross_revenue === 0 && entry.total_deductions === 0 && entry.total_expenses === 0) {
      continue
    }

    if (!entry.total_deductions) {
      entry.total_deductions =
        entry.deductions_taxes +
        entry.deductions_costs +
        entry.deductions_returns +
        entry.deductions_commissions +
        entry.deductions_royalties +
        entry.deductions_marketing +
        (entry.year === 2026 ? entry.deductions_freight || 0 : 0)
    }

    if (!entry.contribution_margin && entry.gross_revenue > 0) {
      entry.contribution_margin = entry.gross_revenue - entry.total_deductions
    }

    if (!entry.contribution_margin_pct && entry.gross_revenue > 0) {
      entry.contribution_margin_pct = (entry.contribution_margin / entry.gross_revenue) * 100
    }

    if (!entry.total_expenses) {
      entry.total_expenses =
        entry.expenses_admin +
        entry.expenses_commercial +
        entry.expenses_financial +
        entry.expenses_personnel
    }

    if (!entry.operating_result) {
      entry.operating_result = entry.contribution_margin - entry.total_expenses
    }

    if (!entry.operating_result_pct && entry.gross_revenue > 0) {
      entry.operating_result_pct = (entry.operating_result / entry.gross_revenue) * 100
    }

    result.push(entry)
  }

  return result.length > 0 ? result : null
}

/**
 * Converte linhas de CSV/TSV/texto tabulado ou linhas de planilha em DreEntry[]
 * Suporta tanto formato em colunas (cada linha é um mês) quanto formato transposto (cada linha é uma rubrica)
 */
export function parseDreDelimitedText(text: string, defaultYear: number = 2025): DreEntry[] {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (rawLines.length < 2) return []

  // Detecta separador (, ou ; ou \t)
  const firstLine = rawLines[0]
  let separator = ','
  if (firstLine.includes('\t')) separator = '\t'
  else if (
    firstLine.includes(';') &&
    (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
  )
    separator = ';'

  const grid = rawLines.map((line) =>
    line.split(separator).map((c) => c.trim().replace(/^["']|["']$/g, '')),
  )

  // 1) Tenta formato transposto (linhas = rubricas, colunas = meses Jan..Set)
  const transposed = tryParseTransposedDre(grid, defaultYear)
  if (transposed && transposed.length > 0) {
    return transposed
  }

  // 2) Formato padrão (linhas = meses, colunas = rubricas)
  const headerCells = grid[0].map((c) => c.toLowerCase())
  const entries: DreEntry[] = []

  for (let i = 1; i < grid.length; i++) {
    const rawCells = grid[i]
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
