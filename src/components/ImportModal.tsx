import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  parseDreDelimitedText,
  parseDreJson,
  parseDreWorkbook,
  DreImportResult,
} from '@/lib/dreParser'
import { saveDreEntries, clearAllDreEntries } from '@/services/dre'
import { DreEntry } from '@/types/dre'
import { formatBRL } from '@/lib/formatters'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  FileText,
  Info,
} from 'lucide-react'

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export const ImportModal: React.FC<ImportModalProps> = ({
  open,
  onOpenChange,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'xlsx' | 'paste' | 'file'>('xlsx')
  const [rawText, setRawText] = useState('')
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  const [importSummary, setImportSummary] = useState<DreImportResult | null>(null)
  const [parsedPreview, setParsedPreview] = useState<DreEntry[]>([])

  const handleTextChange = (text: string) => {
    setRawText(text)
    setFeedback(null)
    setImportSummary(null)
    if (!text.trim()) {
      setParsedPreview([])
      return
    }

    try {
      if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const json = JSON.parse(text)
        const entries = parseDreJson(Array.isArray(json) ? json : [json])
        setParsedPreview(entries)
      } else {
        const entries = parseDreDelimitedText(text, selectedYear)
        setParsedPreview(entries)
      }
    } catch (e) {
      setParsedPreview([])
    }
  }

  // Upload direto do arquivo XLSX original da cliente
  const handleXlsxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setFeedback(null)
    setImportSummary(null)
    setParsedPreview([])

    try {
      const result = await parseDreWorkbook(file)

      if (result.errors.length > 0) {
        setFeedback({
          type: 'error',
          message: result.errors.join(' | '),
        })
        setLoading(false)
        return
      }

      setImportSummary(result)
      setParsedPreview(result.allEntries)

      if (result.allEntries.length === 0) {
        setFeedback({
          type: 'error',
          message: 'Nenhum dado financeiro válido foi identificado nas abas do arquivo.',
        })
      }
    } catch (err: any) {
      console.error(err)
      setFeedback({
        type: 'error',
        message: err.message || 'Erro ao processar o arquivo Excel.',
      })
    } finally {
      setLoading(false)
      // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
      e.target.value = ''
    }
  }

  // Upload de arquivo CSV ou JSON
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setFeedback(null)
    setImportSummary(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRawText(content)
      handleTextChange(content)
      setLoading(false)
    }
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Falha ao ler o arquivo selecionado.' })
      setLoading(false)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSaveImport = async (entriesToSave: DreEntry[]) => {
    if (!entriesToSave || entriesToSave.length === 0) {
      setFeedback({ type: 'error', message: 'Nenhum registro válido detectado para gravação.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      // Substitui os dados anteriores no banco
      const count = await saveDreEntries(entriesToSave)
      setFeedback({
        type: 'success',
        message: `Sucesso! ${count} registros da planilha DRE foram importados e gravados no banco de dados.`,
      })
      setTimeout(() => {
        onImportComplete()
        onOpenChange(false)
      }, 1400)
    } catch (err: any) {
      console.error(err)
      setFeedback({
        type: 'error',
        message: err.message || 'Erro ao salvar os dados no banco de dados.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClearDatabase = async () => {
    if (!confirm('Tem certeza que deseja apagar todos os dados do DRE gravados no banco?')) return
    setLoading(true)
    try {
      await clearAllDreEntries()
      setFeedback({
        type: 'success',
        message: 'Todos os registros do DRE foram apagados. A página voltou ao estado vazio.',
      })
      setTimeout(() => {
        onImportComplete()
        onOpenChange(false)
      }, 1000)
    } catch (e) {
      setFeedback({ type: 'error', message: 'Falha ao apagar registros.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Importar Planilha DRE da Empresa
          </DialogTitle>
          <DialogDescription>
            Importe o arquivo <strong>.xlsx original da planilha DRE</strong> ou exporte em CSV. As
            abas <strong>2025</strong> e <strong>2026</strong> são lidas e gravadas com seus valores
            reais no banco de dados (Skip Cloud / PocketBase).
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full mt-2"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="xlsx" className="font-semibold">
              Arquivo Excel (.xlsx)
            </TabsTrigger>
            <TabsTrigger value="paste">Colar Texto / CSV</TabsTrigger>
            <TabsTrigger value="file">Arquivo CSV / JSON</TabsTrigger>
          </TabsList>

          {/* Aba 1: Upload direto do XLSX original */}
          <TabsContent value="xlsx" className="space-y-4">
            <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/30">
              <label className="cursor-pointer flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Clique ou arraste a planilha .xlsx oficial ("CONSOLIDAÇÃO DRE")
                </span>
                <span className="text-xs text-muted-foreground mt-1.5 max-w-md">
                  O sistema reconhece as abas <strong>2025</strong> e <strong>2026</strong>,
                  processa receitas, deduções, margens, despesas operacionais e identifica meses
                  fechados e não fechados.
                </span>
                <span className="inline-block mt-3 px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800">
                  Importa 2025 e 2026 de uma só vez
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleXlsxUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            {/* Resumo do que foi lido para conferência antes de salvar */}
            {importSummary && (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Conferência da Importação (Antes de Gravar no Banco)
                  </h4>
                  <span className="text-xs font-mono text-muted-foreground">
                    {parsedPreview.length} registros prontos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {importSummary.results.map((r) => {
                    const closedList = r.entries.filter((e) => e.has_closing !== false)
                    const unclosedList = r.entries.filter((e) => e.has_closing === false)
                    return (
                      <div
                        key={r.year}
                        className="bg-white dark:bg-slate-950 border rounded-lg p-3.5 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span className="text-sm">Aba do Ano {r.year}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              r.closedMonthsCount === 12
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {r.closedMonthsCount} meses fechados
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                          <span>Receita Acumulada Fechada:</span>
                          <strong className="text-slate-800 dark:text-slate-100 font-mono">
                            {formatBRL(r.totalRevenueAnnual)}
                          </strong>
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5 pt-1 border-t">
                          <p>
                            <strong className="text-slate-800 dark:text-slate-200">
                              Fechados ({closedList.length}):
                            </strong>{' '}
                            {closedList.map((e) => e.month_name?.slice(0, 3)).join(', ') ||
                              'Nenhum'}
                          </p>
                          {unclosedList.length > 0 ? (
                            <p className="text-amber-700 dark:text-amber-400">
                              <strong>Sem fechamento ({unclosedList.length}):</strong>{' '}
                              {unclosedList.map((e) => e.month_name?.slice(0, 3)).join(', ')}{' '}
                              (exibidos como "—")
                            </p>
                          ) : (
                            <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                              • Exercício integralmente fechado (12 meses)
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {importSummary.warnings.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Avisos de Validação da Planilha
                    </div>
                    {importSummary.warnings.map((w, i) => (
                      <p key={i} className="text-[11px] leading-relaxed">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Aba 2: Colar do Excel */}
          <TabsContent value="paste" className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Cole as linhas copiadas diretamente da planilha Excel</span>
              <div className="flex items-center gap-2">
                <span>Ano da aba copiada:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const y = Number(e.target.value)
                    setSelectedYear(y)
                    if (rawText) handleTextChange(rawText)
                  }}
                  className="border rounded px-2 py-0.5 text-xs bg-background"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>

            <Textarea
              placeholder={`Cole aqui as linhas da aba 2025 ou 2026...
Exemplo do layout:
CONSOLIDAÇÃO DRE	DESCRIÇÃO	01	02	03	04	05	06	07	08	09	10	11	12	2025
RECEITA		...
DEDUÇÕES		...
	IMPOSTOS SOBRE VENDAS	...
	CUSTO DIRETO	...`}
              rows={8}
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="font-mono text-xs"
            />

            {parsedPreview.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {parsedPreview.length} meses identificados na colagem
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba 3: Arquivo CSV / JSON */}
          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/30">
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="w-10 h-10 text-indigo-500 mb-2" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Clique para selecionar arquivo .CSV exportado
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Exportação CSV da aba DRE com separador vírgula ou ponto-e-vírgula
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,.json"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {parsedPreview.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Arquivo processado: {parsedPreview.length} registros prontos para gravação
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Mensagem de Feedback */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearDatabase}
            disabled={loading}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs sm:mr-auto"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Limpar Dados Anteriores
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={loading || parsedPreview.length === 0}
            onClick={() => handleSaveImport(parsedPreview)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Gravando no Banco...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Substituir e Gravar no Banco ({parsedPreview.length} registros)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
