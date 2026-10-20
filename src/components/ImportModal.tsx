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
import { parseDreDelimitedText, parseDreJson } from '@/lib/dreParser'
import { SAMPLE_DRE_TEMPLATE } from '@/lib/sampleTemplate'
import { saveDreEntries, clearAllDreEntries } from '@/services/dre'
import { DreEntry } from '@/types/dre'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sparkles,
  FileText,
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
  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'template'>('paste')
  const [rawText, setRawText] = useState('')
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [parsedPreview, setParsedPreview] = useState<DreEntry[]>([])

  const handleTextChange = (text: string) => {
    setRawText(text)
    setFeedback(null)
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
      // Parse em andamento, não acusa erro imediato
      setParsedPreview([])
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setFeedback(null)

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
  }

  const handleSaveImport = async (entriesToSave: DreEntry[]) => {
    if (!entriesToSave || entriesToSave.length === 0) {
      setFeedback({ type: 'error', message: 'Nenhum registro válido detectado para gravação.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      const count = await saveDreEntries(entriesToSave)
      setFeedback({
        type: 'success',
        message: `Sucesso! ${count} registros da planilha DRE foram gravados no banco de dados.`,
      })
      setTimeout(() => {
        onImportComplete()
        onOpenChange(false)
      }, 1200)
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

  const handleLoadOfficialTemplate = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const count = await saveDreEntries(SAMPLE_DRE_TEMPLATE)
      setFeedback({
        type: 'success',
        message: `Planilha modelo Jan–Set 2025 e 2026 gravada com sucesso (${count} meses e comparativos)!`,
      })
      setTimeout(() => {
        onImportComplete()
        onOpenChange(false)
      }, 1200)
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Erro ao carregar a planilha modelo no banco.',
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
            Importar Planilha DRE para o Banco
          </DialogTitle>
          <DialogDescription>
            Os dados serão gravados diretamente no banco de dados (Skip Cloud / PocketBase). A
            página financeira refletirá os dados reais da planilha assim que salvos.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full mt-2"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="paste">Colar Dados (Excel/CSV)</TabsTrigger>
            <TabsTrigger value="file">Arquivo (.csv / .json)</TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Planilha Modelo DRE
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Copie e cole as linhas da sua planilha do Excel ou Google Sheets (com cabeçalhos)
              </span>
              <div className="flex items-center gap-2">
                <span>Ano padrão caso omitido:</span>
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
              placeholder={`Exemplo de colunas aceitas:
Mês	Receita Bruta	Impostos	Custos	Devoluções	Comissões	Royalties	Propaganda	Frete	Margem Contribuição	Admin	Comercial	Financeiro	Funcionários	Resultado Operacional
Jan	160000	14400	54400	3200	4800	3200	4800	3500	71700	17000	10500	5100	20000	19100`}
              rows={8}
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="font-mono text-xs"
            />

            {parsedPreview.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {parsedPreview.length} meses/registros detectados com sucesso
                </div>
                <div className="mt-2 max-h-36 overflow-y-auto text-[11px] font-mono space-y-1">
                  {parsedPreview.slice(0, 4).map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between border-b border-emerald-200/50 pb-1"
                    >
                      <span>
                        {p.year} - {p.month_name || `Mês ${p.month}`}:
                      </span>
                      <span>
                        Receita: R$ {p.gross_revenue.toLocaleString('pt-BR')} | Resultado: R${' '}
                        {p.operating_result.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                  {parsedPreview.length > 4 && (
                    <div className="text-muted-foreground pt-1 italic">
                      ... e mais {parsedPreview.length - 4} registros
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/30">
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="w-10 h-10 text-indigo-500 mb-2" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Clique para selecionar arquivo .CSV ou .JSON
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Planilhas exportadas como CSV separado por vírgula ou ponto-e-vírgula
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,.json"
                  onChange={handleFileUpload}
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

          <TabsContent value="template" className="space-y-4">
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                    Planilha Modelo Jan–Set (2025 x 2026)
                  </h4>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-300 leading-relaxed">
                    Você pode gravar no banco de dados a planilha modelo oficial pré-formatada. Ela
                    contém todos os meses de Janeiro a Setembro para 2025 e 2026, com receitas,
                    deduções detalhadas (impostos, custos, devoluções, comissões, royalties,
                    propaganda e fretes em 2026), margens e despesas administrativas, comerciais,
                    financeiras e funcionários.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleLoadOfficialTemplate}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs w-full sm:w-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Gravar Planilha Modelo no Banco
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
            Limpar Banco DRE
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>

          {activeTab !== 'template' && (
            <Button
              type="button"
              disabled={loading || parsedPreview.length === 0}
              onClick={() => handleSaveImport(parsedPreview)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Gravando no Banco...
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Salvar no Banco ({parsedPreview.length} registros)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
