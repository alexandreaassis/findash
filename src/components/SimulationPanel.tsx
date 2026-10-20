import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CurrencyInput } from '@/components/CurrencyInput'
import { DreEntry } from '@/types/dre'
import {
  EDITABLE_RUBRICS,
  EditableRubricKey,
  recalculateDreEntry,
  countSimulationChanges,
} from '@/lib/simulationHelpers'
import { formatBRL, formatPercent, MONTH_NAMES } from '@/lib/formatters'
import {
  Sparkles,
  RotateCcw,
  X,
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  PieChart,
  Layers,
  Sliders,
  CheckCircle2,
} from 'lucide-react'

interface SimulationPanelProps {
  originalEntries: DreEntry[]
  simulatedEntries: DreEntry[]
  onUpdateEntries: (updated: DreEntry[]) => void
  onReset: () => void
  onExit: () => void
  selectedYear: number
  onSelectYear: (year: number) => void
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  originalEntries,
  simulatedEntries,
  onUpdateEntries,
  onReset,
  onExit,
  selectedYear,
  onSelectYear,
}) => {
  // Mês selecionado para edição detalhada (padrão: 1 = Janeiro ou todos)
  const [selectedMonth, setSelectedMonth] = useState<number>(1)
  const [editMode, setEditMode] = useState<'single-month' | 'batch-scale'>('single-month')
  const [percentageAdjustment, setPercentageAdjustment] = useState<number>(5)

  // Filtra entradas do ano apenas com meses que possuem fechamento (has_closing !== false)
  const yearEntries = simulatedEntries.filter(
    (e) => Number(e.year) === selectedYear && e.month && e.has_closing !== false,
  )
  const origYearEntries = originalEntries.filter(
    (e) => Number(e.year) === selectedYear && e.month && e.has_closing !== false,
  )

  const currentMonthEntry = yearEntries.find((e) => e.month === selectedMonth) ||
    yearEntries[0] || {
      year: selectedYear,
      month: selectedMonth,
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
      period_type: 'monthly',
    }

  const origMonthEntry = origYearEntries.find((e) => e.month === selectedMonth) || currentMonthEntry

  const totalChanges = countSimulationChanges(originalEntries, simulatedEntries)

  // Totais simulados vs originais do ano
  const simRev = yearEntries.reduce((a, b) => a + (b.gross_revenue || 0), 0)
  const origRev = origYearEntries.reduce((a, b) => a + (b.gross_revenue || 0), 0)
  const revDelta = simRev - origRev

  const simMargin = yearEntries.reduce((a, b) => a + (b.contribution_margin || 0), 0)
  const origMargin = origYearEntries.reduce((a, b) => a + (b.contribution_margin || 0), 0)
  const marginDelta = simMargin - origMargin

  const simResult = yearEntries.reduce((a, b) => a + (b.operating_result || 0), 0)
  const origResult = origYearEntries.reduce((a, b) => a + (b.operating_result || 0), 0)
  const resultDelta = simResult - origResult

  const simResultPct = simRev > 0 ? (simResult / simRev) * 100 : 0
  const origResultPct = origRev > 0 ? (origResult / origRev) * 100 : 0

  const handleFieldChange = (key: EditableRubricKey, newValue: number) => {
    const updated = simulatedEntries.map((e) => {
      if (Number(e.year) === selectedYear && e.month === selectedMonth) {
        const modified = { ...e, [key]: newValue }
        return recalculateDreEntry(modified)
      }
      return e
    })
    onUpdateEntries(updated)
  }

  // Ajuste percentual rápido (ex: +5% na receita de todos os meses, ou -10% nas despesas)
  const handleApplyBatchPercentage = (
    targetGroup: 'revenue' | 'deduction' | 'expense',
    pctDelta: number,
  ) => {
    const factor = 1 + pctDelta / 100
    const updated = simulatedEntries.map((e) => {
      if (Number(e.year) === selectedYear && e.month && e.has_closing !== false) {
        const modified = { ...e }
        if (targetGroup === 'revenue') {
          modified.gross_revenue = Math.round(modified.gross_revenue * factor)
        } else if (targetGroup === 'deduction') {
          modified.deductions_taxes = Math.round(modified.deductions_taxes * factor)
          modified.deductions_costs = Math.round(modified.deductions_costs * factor)
          modified.deductions_returns = Math.round(modified.deductions_returns * factor)
          modified.deductions_commissions = Math.round(modified.deductions_commissions * factor)
          modified.deductions_royalties = Math.round(modified.deductions_royalties * factor)
          modified.deductions_marketing = Math.round(modified.deductions_marketing * factor)
          if (e.year === 2026 && modified.deductions_freight) {
            modified.deductions_freight = Math.round(modified.deductions_freight * factor)
          }
        } else if (targetGroup === 'expense') {
          modified.expenses_admin = Math.round(modified.expenses_admin * factor)
          modified.expenses_commercial = Math.round(modified.expenses_commercial * factor)
          modified.expenses_financial = Math.round(modified.expenses_financial * factor)
          modified.expenses_personnel = Math.round(modified.expenses_personnel * factor)
        }
        return recalculateDreEntry(modified)
      }
      return e
    })
    onUpdateEntries(updated)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Faixa de Aviso do Modo de Simulação */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-400/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                  Modo de Simulação Ativo ({selectedYear})
                </span>
                {totalChanges > 0 ? (
                  <Badge className="bg-white text-amber-900 hover:bg-white text-xs font-semibold">
                    {totalChanges} {totalChanges === 1 ? 'campo alterado' : 'campos alterados'}
                  </Badge>
                ) : (
                  <span className="text-xs text-amber-100 italic">
                    Nenhum valor modificado ainda ({yearEntries.length} meses fechados)
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-50 mt-1 max-w-2xl leading-relaxed">
                Edite os valores abaixo para projetar cenários operacionais. Todos os cálculos de
                margens, deduções e resultados são reprocessados em tempo real na tela.
                <strong className="block text-white font-semibold">
                  A simulação é temporária: nada é gravado no banco de dados.
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={totalChanges === 0}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs h-9 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Restaurar Originais
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onExit}
              className="bg-white text-amber-950 hover:bg-amber-50 text-xs font-semibold h-9 shadow-sm"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Sair da Simulação
            </Button>
          </div>
        </div>
      </div>

      {/* Painel de Impacto Comparado em Tempo Real */}
      <Card className="border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 dark:from-slate-900 dark:to-slate-900 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-amber-200/70 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Impacto Acumulado no Exercício {selectedYear} ({yearEntries.length} meses fechados)
              </h4>
            </div>

            {/* Alternador de ano na simulação */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Ano da simulação:</span>
              <div className="inline-flex rounded-lg border border-amber-300 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectYear(2025)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    selectedYear === 2025
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  2025
                </button>
                <button
                  type="button"
                  onClick={() => onSelectYear(2026)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    selectedYear === 2026
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  2026
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Receita Simulada */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
                <span>Receita Bruta Simulada</span>
                <DollarSign className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatBRL(simRev)}
              </div>
              <div className="text-[11px] mt-1 flex items-center gap-1 font-mono">
                <span className="text-muted-foreground">Original: {formatBRL(origRev)}</span>
                {revDelta !== 0 && (
                  <span
                    className={`font-semibold ml-auto flex items-center ${
                      revDelta > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {revDelta > 0 ? '+' : ''}
                    {formatBRL(revDelta)}
                  </span>
                )}
              </div>
            </div>

            {/* Margem Simulada */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
                <span>Margem de Contribuição</span>
                <PieChart className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-indigo-700 dark:text-indigo-400 mt-1">
                {formatBRL(simMargin)}
              </div>
              <div className="text-[11px] mt-1 flex items-center gap-1 font-mono">
                <span className="text-muted-foreground">Original: {formatBRL(origMargin)}</span>
                {marginDelta !== 0 && (
                  <span
                    className={`font-semibold ml-auto flex items-center ${
                      marginDelta > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {marginDelta > 0 ? '+' : ''}
                    {formatBRL(marginDelta)}
                  </span>
                )}
              </div>
            </div>

            {/* Resultado Simulador */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
                <span>Resultado Operacional</span>
                <Layers className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div
                className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                  simResult >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {formatBRL(simResult)}{' '}
                <span className="text-xs font-normal">({formatPercent(simResultPct)})</span>
              </div>
              <div className="text-[11px] mt-1 flex items-center gap-1 font-mono">
                <span className="text-muted-foreground">
                  Original: {formatBRL(origResult)} ({formatPercent(origResultPct)})
                </span>
                {resultDelta !== 0 && (
                  <span
                    className={`font-semibold ml-auto flex items-center ${
                      resultDelta > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {resultDelta > 0 ? '+' : ''}
                    {formatBRL(resultDelta)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de Rubricas: por Mês ou Ajustes Rápidos */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Campos Editáveis do DRE</span>
              <span className="text-xs font-normal text-muted-foreground">
                — Digite novos valores para reprocessar a demonstração
              </span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escolha o mês de referência para alterar as rubricas individuais ou aplique variações
              percentuais em lote.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const entry = simulatedEntries.find(
                  (e) => Number(e.year) === selectedYear && e.month === m,
                )
                const isClosed = entry ? entry.has_closing !== false : false
                const isSelected = selectedMonth === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonth(m)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : isClosed
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-600 border border-dashed border-slate-300 dark:border-slate-800 opacity-75'
                    }`}
                    title={isClosed ? undefined : 'Mês sem fechamento contábil oficial'}
                  >
                    {MONTH_NAMES[m - 1].slice(0, 3)}
                    {!isClosed && ' (aberto)'}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Seletor de Atalhos de Ajuste Rápido (+5%, +10%, etc) */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Ajustes em Lote para {selectedYear} (Meses fechados: {yearEntries.length}):
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => handleApplyBatchPercentage('revenue', 5)}
                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-[11px] border border-blue-200 transition-colors"
                title="Aumenta a receita bruta de todos os meses em +5%"
              >
                +5% Receita
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchPercentage('revenue', 10)}
                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-[11px] border border-blue-200 transition-colors"
                title="Aumenta a receita bruta de todos os meses em +10%"
              >
                +10% Receita
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchPercentage('deduction', -5)}
                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-[11px] border border-rose-200 transition-colors"
                title="Reduz as deduções em -5%"
              >
                -5% Deduções
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchPercentage('expense', -5)}
                className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-[11px] border border-amber-200 transition-colors"
                title="Reduz as despesas operacionais em -5%"
              >
                -5% Despesas
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchPercentage('expense', -10)}
                className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-[11px] border border-amber-200 transition-colors"
                title="Reduz as despesas operacionais em -10%"
              >
                -10% Despesas
              </button>
            </div>
          </div>

          {/* Grid com Inputs das Rubricas no Mês Selecionado */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Editando: {MONTH_NAMES[selectedMonth - 1]} de {selectedYear}
              </h5>
              <span className="text-[11px] text-muted-foreground font-mono">
                Receita atual do mês: {formatBRL(currentMonthEntry.gross_revenue)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bloco 1: Receita */}
              <div className="space-y-3 p-4 rounded-xl border border-blue-100 dark:border-blue-950 bg-blue-50/20 dark:bg-blue-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wide">
                    1. Receita Bruta
                  </span>
                  <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-300">
                    Faturamento
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Receita Bruta do Mês
                  </label>
                  <CurrencyInput
                    value={currentMonthEntry.gross_revenue}
                    onChange={(v) => handleFieldChange('gross_revenue', v)}
                  />
                  <div className="text-[10px] text-muted-foreground">
                    Original:{' '}
                    <span className="font-mono">{formatBRL(origMonthEntry.gross_revenue)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-200/50 space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">Margem Contribuição:</span>
                    <span className="font-mono text-indigo-700">
                      {formatBRL(currentMonthEntry.contribution_margin)} (
                      {formatPercent(currentMonthEntry.contribution_margin_pct)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Deduções */}
              <div className="space-y-3 p-4 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wide">
                    2. Deduções da Receita
                  </span>
                  <Badge variant="outline" className="text-[10px] text-rose-700 border-rose-300">
                    {formatBRL(currentMonthEntry.total_deductions)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Impostos</label>
                    <CurrencyInput
                      value={currentMonthEntry.deductions_taxes}
                      onChange={(v) => handleFieldChange('deductions_taxes', v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">
                      Custos Mercadorias (CMV)
                    </label>
                    <CurrencyInput
                      value={currentMonthEntry.deductions_costs}
                      onChange={(v) => handleFieldChange('deductions_costs', v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Devoluções</label>
                    <CurrencyInput
                      value={currentMonthEntry.deductions_returns}
                      onChange={(v) => handleFieldChange('deductions_returns', v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Comissões</label>
                    <CurrencyInput
                      value={currentMonthEntry.deductions_commissions}
                      onChange={(v) => handleFieldChange('deductions_commissions', v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Royalties</label>
                    <CurrencyInput
                      value={currentMonthEntry.deductions_royalties}
                      onChange={(v) => handleFieldChange('deductions_royalties', v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">
                      Propaganda / Marketing
                    </label>
                    <CurrencyInput
                      value={currentMonthEntry.deductions_marketing}
                      onChange={(v) => handleFieldChange('deductions_marketing', v)}
                    />
                  </div>
                  {selectedYear === 2026 && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-indigo-700">
                        Fretes (Rubrica 2026)
                      </label>
                      <CurrencyInput
                        value={currentMonthEntry.deductions_freight || 0}
                        onChange={(v) => handleFieldChange('deductions_freight', v)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bloco 3: Despesas Operacionais */}
              <div className="space-y-3 p-4 rounded-xl border border-amber-100 dark:border-amber-950 bg-amber-50/20 dark:bg-amber-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                    3. Despesas Operacionais
                  </span>
                  <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                    {formatBRL(currentMonthEntry.total_expenses)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">
                      Administrativas
                    </label>
                    <CurrencyInput
                      value={currentMonthEntry.expenses_admin}
                      onChange={(v) => handleFieldChange('expenses_admin', v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Comerciais</label>
                    <CurrencyInput
                      value={currentMonthEntry.expenses_commercial}
                      onChange={(v) => handleFieldChange('expenses_commercial', v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Financeiras</label>
                    <CurrencyInput
                      value={currentMonthEntry.expenses_financial}
                      onChange={(v) => handleFieldChange('expenses_financial', v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">
                      Funcionários / Folha
                    </label>
                    <CurrencyInput
                      value={currentMonthEntry.expenses_personnel}
                      onChange={(v) => handleFieldChange('expenses_personnel', v)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-200/50 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Resultado do Mês:</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        currentMonthEntry.operating_result >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {formatBRL(currentMonthEntry.operating_result)} (
                      {formatPercent(currentMonthEntry.operating_result_pct)})
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex justify-between">
                    <span>Original:</span>
                    <span className="font-mono">
                      {formatBRL(origMonthEntry.operating_result)} (
                      {formatPercent(origMonthEntry.operating_result_pct)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
