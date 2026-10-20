import React, { useState, useEffect } from 'react'
import a3oneLogo from '@/assets/a3one-solucoes-integradas-2-48667.png'
import { getDreEntries, getDreNotes } from '@/services/dre'
import {
  isClientAuthenticated,
  setClientAuthenticated,
  getClientDisplayName,
  DEFAULT_CLIENT_NAME,
} from '@/services/auth'
import { DreEntry, DreNote } from '@/types/dre'
import { AuthGate } from '@/components/AuthGate'
import { EmptyState } from '@/components/EmptyState'
import { OverviewSection } from '@/components/OverviewSection'
import { IndicatorsSection } from '@/components/IndicatorsSection'
import { ComparisonSection } from '@/components/ComparisonSection'
import { RevenueDeductionsSection } from '@/components/RevenueDeductionsSection'
import { OperatingExpensesSection } from '@/components/OperatingExpensesSection'
import { NotesSection } from '@/components/NotesSection'
import { ImportModal } from '@/components/ImportModal'
import { PasswordModal } from '@/components/PasswordModal'
import { SimulationPanel } from '@/components/SimulationPanel'
import { cloneDreEntries, countSimulationChanges } from '@/lib/simulationHelpers'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileSpreadsheet,
  Lock,
  LogOut,
  Printer,
  Upload,
  KeyRound,
  BarChart3,
  TrendingUp,
  GitCompare,
  Percent,
  Layers,
  HelpCircle,
  Loader2,
  Calendar,
  Building2,
  Edit3,
  Sparkles,
  RotateCcw,
  Sliders,
} from 'lucide-react'

export default function Index() {
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [authChecking, setAuthChecking] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  const [clientName, setClientName] = useState<string>(DEFAULT_CLIENT_NAME)

  // Dados reais persistidos no banco de dados (Skip Cloud / PocketBase)
  const [entries, setEntries] = useState<DreEntry[]>([])
  const [notes, setNotes] = useState<DreNote[]>([])

  // Estado do Modo de Simulação (100% em memória, não afeta o banco)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [simulatedEntries, setSimulatedEntries] = useState<DreEntry[]>([])

  // Navegação entre seções
  const [activeSection, setActiveSection] = useState<
    'overview' | 'indicators' | 'comparison' | 'revenue-deductions' | 'expenses' | 'notes'
  >('overview')

  // Aba de período/ano
  const [selectedYearTab, setSelectedYearTab] = useState<'2025' | '2026' | 'comparison'>('2026')

  // Modais
  const [importOpen, setImportOpen] = useState<boolean>(false)
  const [passwordOpen, setPasswordOpen] = useState<boolean>(false)

  // Verifica estado de autenticação na sessão
  useEffect(() => {
    setAuthenticated(isClientAuthenticated())
    setAuthChecking(false)
  }, [])

  // Carrega dados do banco de dados (Skip Cloud / PocketBase)
  const loadData = async () => {
    setLoading(true)
    try {
      const [fetchedEntries, fetchedNotes, fetchedClientName] = await Promise.all([
        getDreEntries(),
        getDreNotes(),
        getClientDisplayName(),
      ])
      setEntries(fetchedEntries)
      setNotes(fetchedNotes)
      if (fetchedClientName) setClientName(fetchedClientName)
      // Se estiver em simulação, sincroniza a base
      if (isSimulating) {
        setSimulatedEntries(cloneDreEntries(fetchedEntries))
      }
    } catch (err) {
      console.error('Falha ao carregar dados do DRE:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authenticated) {
      loadData()
    }
  }, [authenticated])

  const handleLogout = () => {
    setClientAuthenticated(false)
    setAuthenticated(false)
  }

  const handlePrint = () => {
    window.print()
  }

  // Ativação / Desativação da Simulação
  const handleStartSimulation = () => {
    setSimulatedEntries(cloneDreEntries(entries))
    setIsSimulating(true)
  }

  const handleResetSimulation = () => {
    setSimulatedEntries(cloneDreEntries(entries))
  }

  const handleExitSimulation = () => {
    setIsSimulating(false)
    setSimulatedEntries([])
  }

  // Define os dados a exibir (simulados se ativo, ou reais do banco)
  const currentWorkingEntries = isSimulating ? simulatedEntries : entries

  // Filtragem dos dados pelos anos (todos os 12 meses de cada ano para visão completa, mantendo has_closing para controle de fechamento)
  const entries2025 = currentWorkingEntries.filter(
    (e) => Number(e.year) === 2025 && e.month && e.month >= 1 && e.month <= 12,
  )
  const entries2026 = currentWorkingEntries.filter(
    (e) => Number(e.year) === 2026 && e.month && e.month >= 1 && e.month <= 12,
  )

  const activeEntries = selectedYearTab === '2025' ? entries2025 : entries2026
  const hasData = entries.length > 0
  const simulationChangesCount = isSimulating
    ? countSimulationChanges(entries, simulatedEntries)
    : 0

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  // Se não autenticado pela senha da cliente, bloqueia na tela de acesso
  if (!authenticated) {
    return <AuthGate onSuccess={() => setAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col print:bg-white print:text-black">
      {/* Top Header Privado */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logomarca A3ONE com container suave */}
            <div className="bg-white rounded-lg p-1.5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0">
              <img
                src={a3oneLogo}
                alt="A3ONE — Soluções Integradas"
                className="w-28 sm:w-36 h-auto max-h-9 object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  Demonstrativo Financeiro
                </h1>
                {isSimulating && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-[11px] font-bold">
                    <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                    Simulação
                  </span>
                )}
                <span className="text-slate-400 dark:text-slate-500 text-xs hidden md:inline">
                  •
                </span>
                <button
                  type="button"
                  onClick={() => setPasswordOpen(true)}
                  className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-semibold max-w-[220px] sm:max-w-xs transition-colors"
                  title="Ajustes de administração A3ONE: alterar nome da empresa ou senhas"
                >
                  <Building2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">{clientName}</span>
                  <Edit3 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0 ml-0.5" />
                </button>
                <span className="hidden lg:inline-block text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">
                  Exercícios 2025 e 2026
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate hidden xs:block">
                {clientName} • DRE Comparativo Executivo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Simulação quando há dados importados */}
            {hasData && (
              <Button
                variant={isSimulating ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (isSimulating) {
                    handleExitSimulation()
                  } else {
                    handleStartSimulation()
                  }
                }}
                className={`text-xs h-9 transition-all ${
                  isSimulating
                    ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm'
                    : 'border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40'
                }`}
                title="Ativar modo de simulação para alterar números temporariamente"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                <span>{isSimulating ? 'Fechar Simulação' : 'Simular'}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="hidden sm:inline-flex text-xs h-9"
              title="Baixar ou Imprimir em PDF"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              PDF / Imprimir
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="text-xs h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
              title="Importar dados da planilha para o banco"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              <span className="hidden sm:inline">Importar Planilha</span>
              <span className="sm:hidden">Planilha</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasswordOpen(true)}
              className="text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
              title="Administração A3ONE: editar cliente e senhas"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              <span className="hidden lg:inline">Admin A3ONE</span>
              <span className="lg:hidden hidden sm:inline">Admin A3ONE</span>
              <span className="sm:hidden">Admin</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              title="Encerrar visualização privada"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">
              Consultando demonstrativo no banco de dados...
            </p>
          </div>
        ) : !hasData ? (
          <EmptyState onOpenImport={() => setImportOpen(true)} />
        ) : (
          <>
            {/* Barra de Navegação de Seções */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
              <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <Button
                  variant={activeSection === 'overview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('overview')}
                  className={`text-xs sm:text-sm h-9 rounded-xl font-bold shrink-0 ${
                    activeSection === 'overview'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-1.5" />
                  Visão Geral
                </Button>

                <Button
                  variant={activeSection === 'indicators' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('indicators')}
                  className={`text-xs sm:text-sm h-9 rounded-xl font-bold shrink-0 ${
                    activeSection === 'indicators'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-1.5" />
                  Indicadores
                </Button>

                <Button
                  variant={activeSection === 'comparison' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveSection('comparison')
                    setSelectedYearTab('comparison')
                  }}
                  className={`text-xs sm:text-sm h-9 rounded-xl font-bold shrink-0 ${
                    activeSection === 'comparison'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <GitCompare className="w-4 h-4 mr-1.5" />
                  Comparação 2025 x 2026
                </Button>

                <Button
                  variant={activeSection === 'revenue-deductions' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('revenue-deductions')}
                  className={`text-xs sm:text-sm h-9 rounded-xl font-bold shrink-0 ${
                    activeSection === 'revenue-deductions'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Percent className="w-4 h-4 mr-1.5" />
                  Receitas & Deduções
                </Button>

                <Button
                  variant={activeSection === 'expenses' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('expenses')}
                  className={`text-xs sm:text-sm h-9 rounded-xl font-bold shrink-0 ${
                    activeSection === 'expenses'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <Layers className="w-4 h-4 mr-1.5" />
                  Despesas Operacionais
                </Button>

                <Button
                  variant={activeSection === 'notes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('notes')}
                  className={`text-xs sm:text-sm h-9 rounded-xl font-bold shrink-0 ${
                    activeSection === 'notes'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  Notas & Leitura
                </Button>
              </nav>

              {/* Seletor de Abas de Ano (2025 | 2026 | Comparativo) */}
              <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                <Tabs
                  value={activeSection === 'comparison' ? 'comparison' : selectedYearTab}
                  onValueChange={(val) => {
                    if (val === 'comparison') {
                      setActiveSection('comparison')
                      setSelectedYearTab('comparison')
                    } else {
                      setSelectedYearTab(val as '2025' | '2026')
                      if (activeSection === 'comparison') {
                        setActiveSection('overview')
                      }
                    }
                  }}
                  className="w-auto"
                >
                  <TabsList className="h-9 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <TabsTrigger
                      value="2025"
                      className="text-xs sm:text-sm font-bold px-3 py-1 rounded-lg"
                    >
                      2025
                    </TabsTrigger>
                    <TabsTrigger
                      value="2026"
                      className="text-xs sm:text-sm font-bold px-3 py-1 rounded-lg"
                    >
                      2026
                    </TabsTrigger>
                    <TabsTrigger
                      value="comparison"
                      className="text-xs sm:text-sm font-bold px-3 py-1 rounded-lg"
                    >
                      Jan–Set Comparativo
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Se estiver no Modo Simulação, renderiza o Painel de Edição Interativa no topo */}
            {isSimulating && (
              <SimulationPanel
                originalEntries={entries}
                simulatedEntries={simulatedEntries}
                onUpdateEntries={(updated) => setSimulatedEntries(updated)}
                onReset={handleResetSimulation}
                onExit={handleExitSimulation}
                selectedYear={selectedYearTab === '2025' ? 2025 : 2026}
                onSelectYear={(y) => setSelectedYearTab(y === 2025 ? '2025' : '2026')}
              />
            )}

            {/* Cabeçalho de Impressão (Apenas visível em modo print/PDF) */}
            <div className="hidden print:block mb-6 border-b pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-1 rounded border border-slate-200 shrink-0">
                    <img
                      src={a3oneLogo}
                      alt="A3ONE — Soluções Integradas"
                      className="w-32 sm:w-40 h-auto max-h-14 object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-xs uppercase font-semibold tracking-wider text-indigo-700">
                      {clientName}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                      Demonstrativo Financeiro da Empresa (DRE)
                    </h1>
                    <p className="text-sm text-slate-600">
                      Exercícios 2025 e 2026 (Período Jan–Set) — Relatório Executivo Oficial
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 shrink-0">
                  <p className="font-semibold text-slate-800">{clientName}</p>
                  <p className="font-medium text-slate-600">A3ONE Soluções Integradas</p>
                  <p>Documento confidencial gerado via Página Financeira Privada</p>
                </div>
              </div>
            </div>

            {/* Renderização Condicional da Seção Ativa */}
            {activeSection === 'overview' && (
              <OverviewSection
                entries2025={entries2025}
                entries2026={entries2026}
                selectedYear={selectedYearTab === '2025' ? 2025 : 2026}
                activeEntries={activeEntries}
                isSimulationActive={isSimulating}
              />
            )}

            {activeSection === 'indicators' && (
              <IndicatorsSection
                activeEntries={activeEntries}
                selectedYear={selectedYearTab === '2025' ? 2025 : 2026}
                isSimulationActive={isSimulating}
              />
            )}

            {activeSection === 'comparison' && (
              <ComparisonSection
                entries2025={entries2025}
                entries2026={entries2026}
                isSimulationActive={isSimulating}
              />
            )}

            {activeSection === 'revenue-deductions' && (
              <RevenueDeductionsSection
                activeEntries={activeEntries}
                selectedYear={selectedYearTab === '2025' ? 2025 : 2026}
                isSimulationActive={isSimulating}
              />
            )}

            {activeSection === 'expenses' && (
              <OperatingExpensesSection
                activeEntries={activeEntries}
                selectedYear={selectedYearTab === '2025' ? 2025 : 2026}
                isSimulationActive={isSimulating}
              />
            )}

            {activeSection === 'notes' && <NotesSection notes={notes} />}
          </>
        )}
      </main>

      {/* Rodapé Simples com Navegação */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Página Financeira da Cliente
            </span>
            <span>•</span>
            <span>Demonstrativo DRE 2025 – 2026</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveSection('overview')}
              className="hover:text-indigo-600 transition-colors"
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveSection('indicators')}
              className="hover:text-indigo-600 transition-colors"
            >
              Indicadores
            </button>
            <button
              onClick={() => {
                setActiveSection('comparison')
                setSelectedYearTab('comparison')
              }}
              className="hover:text-indigo-600 transition-colors"
            >
              Comparativo
            </button>
            <button
              onClick={() => setActiveSection('notes')}
              className="hover:text-indigo-600 transition-colors"
            >
              Notas
            </button>
            <button onClick={handlePrint} className="hover:text-indigo-600 transition-colors">
              Exportar PDF
            </button>
          </div>
        </div>
      </footer>

      {/* Modal de Importação de Planilha para o Banco */}
      <ImportModal open={importOpen} onOpenChange={setImportOpen} onImportComplete={loadData} />

      {/* Modal de Alteração de Nome da Cliente e Senha */}
      <PasswordModal
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        currentClientName={clientName}
        onClientNameUpdated={(newName) => setClientName(newName)}
      />
    </div>
  )
}
