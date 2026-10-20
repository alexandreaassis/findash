import { DreEntry } from '@/types/dre'
import { MONTH_NAMES } from './formatters'
import { loadSheetJS } from './xlsxLoader'

/**
 * Converte número em formato pt-BR ("1.234,56", "(1.200,00)", "- 500,00")
 * ou formato padrão ("1234.56") para float JS. Retorna null se a célula estiver vazia/indefinida.
 */
export function parseNumberCellNullable(raw: any): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') {
    return isNaN(raw) ? null : raw
  }

  let str = String(raw).trim()
  if (!str || str === '-' || str === '—' || str.toLowerCase() === 'null') return null

  let isNegative = false
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true
    str = str.slice(1, -1).trim()
  } else if (str.startsWith('-')) {
    isNegative = true
    str = str.slice(1).trim()
  }

  str = str.replace(/[R$\s]/g, '').trim()

  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      str = str.replace(/,/g, '')
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.')
  }

  const parsed = parseFloat(str)
  if (isNaN(parsed)) return null
  return isNegative ? -Math.abs(parsed) : parsed
}

export function parseNumberCell(raw: any): number {
  return parseNumberCellNullable(raw) ?? 0
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
    if (clean.startsWith(prefixes[i])) return i + 1
  }

  const numeric = parseInt(clean, 10)
  if (!isNaN(numeric) && numeric >= 1 && numeric <= 12) {
    return numeric
  }

  return null
}

export function normalizeLabel(raw: any): string {
  if (!raw) return ''
  return String(raw)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface SheetParseResult {
  year: number
  entries: DreEntry[]
  closedMonthsCount: number
  totalRevenueAnnual: number
  warnings: string[]
}

export interface DreImportResult {
  results: SheetParseResult[]
  allEntries: DreEntry[]
  warnings: string[]
  errors: string[]
}

/**
 * Parser robusto para a aba de DRE (estrutura real da cliente: 2025 ou 2026).
 * Matriz:
 * - Linha 1 (cabeçalhos): Coluna A: CONSOLIDAÇÃO DRE, Col B: DESCRIÇÃO, Col C a N: meses 01 a 12, Col P: total do ano.
 * - Linhas com dados nas colunas A e B:
 *   RECEITA
 *   DEDUÇÕES
 *     IMPOSTOS SOBRE VENDAS
 *     IMPOSTOS SOBRE COMPRAS
 *     CUSTO DIRETO
 *     DEVOLUÇÕES
 *     COMISSÕES
 *     ROYALTIES
 *     FUNDO DE PROPAGANDA
 *     FRETES (apenas 2026)
 *   MARGEM DE CONTRIBUIÇÃO
 *   DESPESAS OPERACIONAIS
 *     ADMINISTRATIVO
 *     COMERCIAL
 *     FINANCEIRO
 *     FUNCIONÁRIOS
 *   RESULTADO OPERACIONAL
 *   RESULTADO MENSAL ACUMULADO
 * - Abaixo disso: percentuais e tabela CUSTOS (que devem ser ignorados).
 */
export function parseDreSheetGrid(grid: any[][], fallbackYear: number): SheetParseResult {
  const warnings: string[] = []

  // 1. Encontra a linha de cabeçalho dos meses
  let headerRowIdx = -1
  let monthCols: { month: number; colIdx: number }[] = []
  let totalColIdx = -1

  for (let r = 0; r < Math.min(10, grid.length); r++) {
    const row = grid[r] || []
    const detected: { month: number; colIdx: number }[] = []

    for (let c = 0; c < row.length; c++) {
      const cellVal = row[c]
      const mIdx = parseMonthIndex(cellVal)
      if (mIdx !== null && mIdx >= 1 && mIdx <= 12) {
        // Evita duplicar o mesmo mês
        if (!detected.some((d) => d.month === mIdx)) {
          detected.push({ month: mIdx, colIdx: c })
        }
      }
    }

    if (detected.length >= 6) {
      headerRowIdx = r
      // Ordena por mês
      monthCols = detected.sort((a, b) => a.month - b.month)
      break
    }
  }

  if (headerRowIdx === -1 || monthCols.length === 0) {
    return {
      year: fallbackYear,
      entries: [],
      closedMonthsCount: 0,
      totalRevenueAnnual: 0,
      warnings: [
        `Não foi possível identificar as colunas de meses (01 a 12) na planilha ${fallbackYear}.`,
      ],
    }
  }

  // Tenta encontrar a coluna de total do ano (ex: coluna P ou coluna com o rótulo do ano / 'TOTAL')
  const headerRow = grid[headerRowIdx] || []
  for (let c = 0; c < headerRow.length; c++) {
    const val = String(headerRow[c] || '').trim()
    if (
      val === String(fallbackYear) ||
      val.toLowerCase().includes('total') ||
      val === '2025' ||
      val === '2026'
    ) {
      // Se não for uma das colunas de mês
      if (!monthCols.some((m) => m.colIdx === c)) {
        totalColIdx = c
        break
      }
    }
  }

  // Se não achou na linha do cabeçalho, procura na linha 0 ou 1 na posição logo após os meses
  if (totalColIdx === -1) {
    const maxMonthCol = Math.max(...monthCols.map((m) => m.colIdx))
    for (let c = maxMonthCol + 1; c < Math.min(maxMonthCol + 5, (grid[0] || []).length); c++) {
      const val = String(
        (grid[headerRowIdx] && grid[headerRowIdx][c]) || (grid[0] && grid[0][c]) || '',
      ).trim()
      if (
        val === String(fallbackYear) ||
        val === '2025' ||
        val === '2026' ||
        val.toLowerCase().includes('total')
      ) {
        totalColIdx = c
        break
      }
    }
  }

  // Identificação do ano pela planilha ou fallback
  let detectedYear = fallbackYear
  for (let r = 0; r < Math.min(5, grid.length); r++) {
    const rowStr = (grid[r] || []).join(' ')
    if (rowStr.includes('2026') && !rowStr.includes('2025')) detectedYear = 2026
    else if (rowStr.includes('2025') && !rowStr.includes('2026')) detectedYear = 2025
  }

  // Mapeamento de rubricas por linha
  type RubricKey =
    | 'gross_revenue'
    | 'total_deductions'
    | 'deductions_taxes'
    | 'deductions_purchases_tax'
    | 'deductions_costs'
    | 'deductions_returns'
    | 'deductions_commissions'
    | 'deductions_royalties'
    | 'deductions_marketing'
    | 'deductions_freight'
    | 'contribution_margin'
    | 'total_expenses'
    | 'expenses_admin'
    | 'expenses_commercial'
    | 'expenses_financial'
    | 'expenses_personnel'
    | 'operating_result'
    | 'accumulated_result'

  // Estrutura para armazenar os valores brutos por mês e o total da coluna anual
  const rubricValues: Record<
    RubricKey,
    { months: Record<number, number | null>; annualTotal: number | null }
  > = {
    gross_revenue: { months: {}, annualTotal: null },
    total_deductions: { months: {}, annualTotal: null },
    deductions_taxes: { months: {}, annualTotal: null },
    deductions_purchases_tax: { months: {}, annualTotal: null },
    deductions_costs: { months: {}, annualTotal: null },
    deductions_returns: { months: {}, annualTotal: null },
    deductions_commissions: { months: {}, annualTotal: null },
    deductions_royalties: { months: {}, annualTotal: null },
    deductions_marketing: { months: {}, annualTotal: null },
    deductions_freight: { months: {}, annualTotal: null },
    contribution_margin: { months: {}, annualTotal: null },
    total_expenses: { months: {}, annualTotal: null },
    expenses_admin: { months: {}, annualTotal: null },
    expenses_commercial: { months: {}, annualTotal: null },
    expenses_financial: { months: {}, annualTotal: null },
    expenses_personnel: { months: {}, annualTotal: null },
    operating_result: { months: {}, annualTotal: null },
    accumulated_result: { months: {}, annualTotal: null },
  }

  // Percorre as linhas a partir de headerRowIdx + 1
  let currentSectionContext = ''

  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r] || []
    if (row.length === 0) continue

    const colA = normalizeLabel(row[0] || '')
    const colB = normalizeLabel(row[1] || '')
    const fullLabel = `${colA} ${colB}`.trim()

    // Para e ignora se chegar na tabela auxiliar "CUSTOS" ou linhas de percentuais inferiores
    if (
      colA.includes('custos') ||
      colB.includes('custos') ||
      colA.includes('ref.') ||
      colB.includes('ref.') ||
      colA.includes('custo variavel') ||
      colB.includes('custo variavel') ||
      row.slice(0, 3).some((c) => normalizeLabel(c) === 'custos' || normalizeLabel(c) === 'ref')
    ) {
      break
    }

    if (colA) {
      currentSectionContext = colA
    }

    let matchedRubric: RubricKey | null = null

    // 1. Receita
    if (
      colA.includes('receita') ||
      (colB.includes('receita') && !colB.includes('liquida') && !colB.includes('outras')) ||
      (fullLabel.includes('receita') && !fullLabel.includes('liquida'))
    ) {
      matchedRubric = 'gross_revenue'
    }
    // 2. Total Deduções
    else if (
      colA.includes('deducoes') ||
      colA.includes('deducoes da receita') ||
      colB === 'deducoes' ||
      colB === 'total deducoes'
    ) {
      matchedRubric = 'total_deductions'
    }
    // Sub-rubricas de deduções
    else if (
      colB.includes('impostos sobre vendas') ||
      colB.includes('imposto sobre vendas') ||
      colB.includes('impostos s/ vendas')
    ) {
      matchedRubric = 'deductions_taxes'
    } else if (
      colB.includes('impostos sobre compras') ||
      colB.includes('imposto sobre compras') ||
      colB.includes('impostos s/ compras')
    ) {
      matchedRubric = 'deductions_purchases_tax'
    } else if (
      colB.includes('custo direto') ||
      colB.includes('custos diretos') ||
      colB === 'custo direto'
    ) {
      matchedRubric = 'deductions_costs'
    } else if (
      colB.includes('devolucoes') ||
      colB.includes('devolucao') ||
      colB.includes('cancelamentos')
    ) {
      matchedRubric = 'deductions_returns'
    } else if (colB.includes('comissoes') || colB.includes('comissao')) {
      matchedRubric = 'deductions_commissions'
    } else if (colB.includes('royalties') || colB.includes('royaltie')) {
      matchedRubric = 'deductions_royalties'
    } else if (
      colB.includes('fundo de propaganda') ||
      colB.includes('propaganda') ||
      colB.includes('marketing')
    ) {
      matchedRubric = 'deductions_marketing'
    } else if (colB.includes('fretes') || colB.includes('frete')) {
      matchedRubric = 'deductions_freight'
    }
    // 3. Margem de Contribuição
    else if (
      colA.includes('margem de contribuicao') ||
      colA.includes('margem contribuicao') ||
      colB.includes('margem de contribuicao') ||
      colB.includes('margem contribuicao') ||
      colA.includes('receita liquida') ||
      colB.includes('receita liquida')
    ) {
      // Ignora linhas que são percentuais de margem (ex: 0.45 ou "45%")
      matchedRubric = 'contribution_margin'
    }
    // 4. Despesas Operacionais (Total)
    else if ((colA.includes('despesas operacionais') || colA === 'despesas') && !colB) {
      matchedRubric = 'total_expenses'
    }
    // Sub-rubricas de Despesas
    else if (colB.includes('administrativo') || colB.includes('despesas administrativas')) {
      matchedRubric = 'expenses_admin'
    } else if (colB.includes('comercial') || colB.includes('despesas comerciais')) {
      matchedRubric = 'expenses_commercial'
    } else if (colB.includes('financeiro') || colB.includes('despesas financeiras')) {
      matchedRubric = 'expenses_financial'
    } else if (
      colB.includes('funcionarios') ||
      colB.includes('funcionario') ||
      colB.includes('pessoal') ||
      colB.includes('folha')
    ) {
      matchedRubric = 'expenses_personnel'
    }
    // 5. Resultado Operacional
    else if (colA.includes('resultado operacional') || colB.includes('resultado operacional')) {
      matchedRubric = 'operating_result'
    }
    // 6. Resultado Mensal Acumulado
    else if (
      colA.includes('resultado mensal acumulado') ||
      colA.includes('acumulado mensal') ||
      colB.includes('resultado mensal acumulado') ||
      colA.includes('resultado acumulado')
    ) {
      matchedRubric = 'accumulated_result'
    }

    // Se encontrou uma rubrica válida, extrai os meses e o total anual
    if (matchedRubric) {
      for (const mCol of monthCols) {
        const rawVal = row[mCol.colIdx]
        const numVal = parseNumberCellNullable(rawVal)
        rubricValues[matchedRubric].months[mCol.month] = numVal
      }

      if (totalColIdx !== -1) {
        const rawAnnual = row[totalColIdx]
        const numAnnual = parseNumberCellNullable(rawAnnual)
        rubricValues[matchedRubric].annualTotal = numAnnual
      }
    }
  }

  // 2. Agora montamos as entradas por mês (01 a 12)
  const entries: DreEntry[] = []
  let closedMonthsCount = 0

  for (let m = 1; m <= 12; m++) {
    const rawRevenue = rubricValues.gross_revenue.months[m]
    const rawDed = rubricValues.total_deductions.months[m]
    const rawExp = rubricValues.total_expenses.months[m]
    const rawRes = rubricValues.operating_result.months[m]

    // Regra de "sem fechamento":
    // Na aba 2026, os meses 10, 11 e 12 estão vazios (ou nulos).
    // Se a receita e todas as principais rubricas forem nulas/vazias, é período não fechado.
    const isClosed = rawRevenue !== null || rawDed !== null || rawExp !== null || rawRes !== null

    if (!isClosed) {
      // Período ainda não fechado
      entries.push({
        year: detectedYear,
        period_type: 'monthly',
        month: m,
        month_name: MONTH_NAMES[m - 1],
        has_closing: false,
        gross_revenue: 0,
        deductions_taxes: 0,
        deductions_purchases_tax: 0,
        deductions_costs: 0,
        deductions_returns: 0,
        deductions_commissions: 0,
        deductions_royalties: 0,
        deductions_marketing: 0,
        deductions_freight: detectedYear === 2026 ? 0 : undefined,
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
        accumulated_result: 0,
        notes: 'Período sem fechamento contábil',
      })
      continue
    }

    closedMonthsCount++

    const grossRevenue = rawRevenue ?? 0
    const deductionsTaxes = rubricValues.deductions_taxes.months[m] ?? 0
    const deductionsPurchasesTax = rubricValues.deductions_purchases_tax.months[m] ?? 0
    const deductionsCosts = rubricValues.deductions_costs.months[m] ?? 0
    const deductionsReturns = rubricValues.deductions_returns.months[m] ?? 0
    const deductionsCommissions = rubricValues.deductions_commissions.months[m] ?? 0
    const deductionsRoyalties = rubricValues.deductions_royalties.months[m] ?? 0
    const deductionsMarketing = rubricValues.deductions_marketing.months[m] ?? 0
    const freightVal = rubricValues.deductions_freight.months[m]
    const deductionsFreight = detectedYear === 2026 ? (freightVal ?? 0) : undefined

    // Total de deduções da planilha (ou somado se a linha de total faltar)
    let totalDeductions = rubricValues.total_deductions.months[m]
    if (totalDeductions === null || totalDeductions === undefined) {
      totalDeductions =
        deductionsTaxes +
        deductionsPurchasesTax +
        deductionsCosts +
        deductionsReturns +
        deductionsCommissions +
        deductionsRoyalties +
        deductionsMarketing +
        (deductionsFreight ?? 0)
    }

    // Margem de contribuição da planilha
    let contributionMargin = rubricValues.contribution_margin.months[m]
    if (contributionMargin === null || contributionMargin === undefined) {
      contributionMargin = grossRevenue - totalDeductions
    }

    const contributionMarginPct = grossRevenue > 0 ? (contributionMargin / grossRevenue) * 100 : 0

    // Despesas operacionais
    const expensesAdmin = rubricValues.expenses_admin.months[m] ?? 0
    const expensesCommercial = rubricValues.expenses_commercial.months[m] ?? 0
    const expensesFinancial = rubricValues.expenses_financial.months[m] ?? 0
    const expensesPersonnel = rubricValues.expenses_personnel.months[m] ?? 0

    let totalExpenses = rubricValues.total_expenses.months[m]
    if (totalExpenses === null || totalExpenses === undefined) {
      totalExpenses = expensesAdmin + expensesCommercial + expensesFinancial + expensesPersonnel
    }

    // Resultado operacional
    let operatingResult = rubricValues.operating_result.months[m]
    if (operatingResult === null || operatingResult === undefined) {
      operatingResult = contributionMargin - totalExpenses
    }

    const operatingResultPct = grossRevenue > 0 ? (operatingResult / grossRevenue) * 100 : 0

    const accumulatedResult = rubricValues.accumulated_result.months[m] ?? undefined

    entries.push({
      year: detectedYear,
      period_type: 'monthly',
      month: m,
      month_name: MONTH_NAMES[m - 1],
      has_closing: true,
      gross_revenue: grossRevenue,
      deductions_taxes: deductionsTaxes,
      deductions_purchases_tax: deductionsPurchasesTax,
      deductions_costs: deductionsCosts,
      deductions_returns: deductionsReturns,
      deductions_commissions: deductionsCommissions,
      deductions_royalties: deductionsRoyalties,
      deductions_marketing: deductionsMarketing,
      deductions_freight: deductionsFreight,
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
      accumulated_result: accumulatedResult,
      annual_total: rubricValues.gross_revenue.annualTotal ?? undefined,
    })
  }

  // 3. Validação dos totais anuais vs soma dos meses fechados
  const sumRevenue = entries
    .filter((e) => e.has_closing)
    .reduce((acc, curr) => acc + curr.gross_revenue, 0)

  const annualReportedRevenue = rubricValues.gross_revenue.annualTotal

  if (annualReportedRevenue !== null && annualReportedRevenue > 0) {
    const diff = Math.abs(sumRevenue - annualReportedRevenue)
    // Tolerância de centavos por arredondamento
    if (diff > 5) {
      warnings.push(
        `Atenção no Ano ${detectedYear}: a soma das receitas mensais fechadas (R$ ${sumRevenue.toFixed(
          2,
        )}) difere do total anual registrado na coluna P da planilha (R$ ${annualReportedRevenue.toFixed(
          2,
        )}). Diferença: R$ ${diff.toFixed(2)}.`,
      )
    }
  }

  return {
    year: detectedYear,
    entries,
    closedMonthsCount,
    totalRevenueAnnual: sumRevenue,
    warnings,
  }
}

/**
 * Lê arquivo Excel .xlsx / .xls e extrai automaticamente as abas "2025" e "2026"
 */
export async function parseDreWorkbook(file: File | ArrayBuffer): Promise<DreImportResult> {
  const XLSX = await loadSheetJS()

  let workbook: any
  if (file instanceof File) {
    const buffer = await file.arrayBuffer()
    workbook = XLSX.read(buffer, { type: 'array' })
  } else {
    workbook = XLSX.read(file, { type: 'array' })
  }

  const sheetNames: string[] = workbook.SheetNames || []
  const results: SheetParseResult[] = []
  const allEntries: DreEntry[] = []
  const warnings: string[] = []
  const errors: string[] = []

  // Procura as abas correspondentes a "2025" e "2026"
  const targetYears = [2025, 2026]

  for (const year of targetYears) {
    const matchedSheetName = sheetNames.find((s) => {
      const clean = s.trim().toLowerCase()
      return clean === String(year) || clean.includes(String(year))
    })

    if (!matchedSheetName) {
      warnings.push(`Aba correspondente ao ano ${year} não foi encontrada no arquivo Excel.`)
      continue
    }

    const worksheet = workbook.Sheets[matchedSheetName]
    if (!worksheet) continue

    // Converte a planilha para grid de matriz de células brutas
    const grid: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: null,
    })

    const parsedSheet = parseDreSheetGrid(grid, year)
    results.push(parsedSheet)
    allEntries.push(...parsedSheet.entries)
    warnings.push(...parsedSheet.warnings)
  }

  if (results.length === 0) {
    errors.push(
      'Nenhuma das abas "2025" ou "2026" foi identificada no arquivo. Verifique se o arquivo possui as abas com os anos.',
    )
  }

  return {
    results,
    allEntries,
    warnings,
    errors,
  }
}

/**
 * Converte linhas de CSV/TSV/texto tabulado (copiado direto do Excel ou arquivo CSV)
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

  // Tenta parse da grade com o layout oficial DRE da cliente
  const sheetResult = parseDreSheetGrid(grid, defaultYear)
  if (sheetResult.entries.length > 0) {
    return sheetResult.entries
  }

  return []
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

    const hasClosing = item.has_closing !== undefined ? Boolean(item.has_closing) : true

    const grossRevenue = parseNumberCell(item.gross_revenue ?? item.receita_bruta ?? item.receita)
    const deductionsTaxes = parseNumberCell(item.deductions_taxes ?? item.impostos)
    const deductionsPurchasesTax = parseNumberCell(
      item.deductions_purchases_tax ?? item.impostos_compras,
    )
    const deductionsCosts = parseNumberCell(item.deductions_costs ?? item.custos)
    const deductionsReturns = parseNumberCell(item.deductions_returns ?? item.devolucoes)
    const deductionsCommissions = parseNumberCell(item.deductions_commissions ?? item.comissoes)
    const deductionsRoyalties = parseNumberCell(item.deductions_royalties ?? item.royalties)
    const deductionsMarketing = parseNumberCell(
      item.deductions_marketing ?? item.propaganda ?? item.marketing,
    )
    const deductionsFreight =
      year === 2026
        ? parseNumberCell(item.deductions_freight ?? item.fretes ?? item.frete)
        : undefined

    const totalDeductions =
      parseNumberCell(item.total_deductions ?? item.total_deducoes) ||
      deductionsTaxes +
        deductionsPurchasesTax +
        deductionsCosts +
        deductionsReturns +
        deductionsCommissions +
        deductionsRoyalties +
        deductionsMarketing +
        (deductionsFreight ?? 0)

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
      has_closing: hasClosing,
      gross_revenue: grossRevenue,
      deductions_taxes: deductionsTaxes,
      deductions_purchases_tax: deductionsPurchasesTax,
      deductions_costs: deductionsCosts,
      deductions_returns: deductionsReturns,
      deductions_commissions: deductionsCommissions,
      deductions_royalties: deductionsRoyalties,
      deductions_marketing: deductionsMarketing,
      deductions_freight: deductionsFreight,
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
