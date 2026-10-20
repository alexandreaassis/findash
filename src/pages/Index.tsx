import React, { useState, useEffect } from 'react'
import { getDreEntries, getDreNotes } from '@/services/dre'
import { isClientAuthenticated, setClientAuthenticated } from '@/services/auth'
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
  Building,
} from 'lucide-react'

export default function Index() {
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [authChecking, setAuthChecking] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)

  const [entries, setEntries] = useState<DreEntry[]>([])
  const [notes, setNotes] = useState<DreNote[]>([])

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
      const [fetchedEntries, fetchedNotes] = await Promise.all([getDreEntries(), getDreNotes()])
      setEntries(fetchedEntries)
      setNotes(fetchedNotes)
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

  // Filtragem dos dados pelos anos
  const entries2025 = entries.filter((e) => Number(e.year) === 2025 && e.month && e.month <= 9)
  const entries2026 = entries.filter((e) => Number(e.year) === 2026 && e.month && e.month <= 9)

  const activeEntries = selectedYearTab === '2025' ? entries2025 : entries2026
  const hasData = entries.length > 0

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  DRE da Empresa
                </h1>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                  Privado & Confidencial
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Demonstrativo Financeiro (2025 – 2026 • Jan–Set)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              variant="ghost"
              size="sm"
              onClick={() => setPasswordOpen(true)}
              className="text-xs h-9 text-slate-600 hover:text-slate-900"
              title="Alterar senha da cliente"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1" />
              <span className="hidden md:inline">Senha</span>
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
              <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <Button
                  variant={activeSection === 'overview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('overview')}
                  className={`text-xs h-8 rounded-xl font-medium shrink-0 ${
                    activeSection === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Visão Geral
                </Button>

                <Button
                  variant={activeSection === 'indicators' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('indicators')}
                  className={`text-xs h-8 rounded-xl font-medium shrink-0 ${
                    activeSection === 'indicators' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                  Indicadores
                </Button>

                <Button
                  variant={activeSection === 'comparison' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveSection('comparison')
                    setSelectedYearTab('comparison')
                  }}
                  className={`text-xs h-8 rounded-xl font-medium shrink-0 ${
                    activeSection === 'comparison' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5 mr-1.5" />
                  Comparação 2025 x 2026
                </Button>

                <Button
                  variant={activeSection === 'revenue-deductions' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('revenue-deductions')}
                  className={`text-xs h-8 rounded-xl font-medium shrink-0 ${
                    activeSection === 'revenue-deductions'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5 mr-1.5" />
                  Receitas & Deduções
                </Button>

                <Button
                  variant={activeSection === 'expenses' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('expenses')}
                  className={`text-xs h-8 rounded-xl font-medium shrink-0 ${
                    activeSection === 'expenses' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  Despesas Operacionais
                </Button>

                <Button
                  variant={activeSection === 'notes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection('notes')}
                  className={`text-xs h-8 rounded-xl font-medium shrink-0 ${
                    activeSection === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
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
                  <TabsList className="h-8 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <TabsTrigger value="2025" className="text-xs px-3 py-1 rounded-lg">
                      2025
                    </TabsTrigger>
                    <TabsTrigger value="2026" className="text-xs px-3 py-1 rounded-lg">
                      2026
                    </TabsTrigger>
                    <TabsTrigger value="comparison" className="text-xs px-3 py-1 rounded-lg">
                      Jan–Set Comparativo
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Cabeçalho de Impressão (Apenas visível em modo print/PDF) */}
            <div className="hidden print:block mb-6 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Demonstrativo Financeiro da Empresa (DRE)
                  </h1>
                  <p className="text-sm text-slate-600">
                    Exercícios 2025 e 2026 (Período Jan–Set) — Relatório Executivo Oficial
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  Documento confidencial gerado via Página Financeira Privada
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
              />
            )}

            {activeSection === 'indicators' && (
              <IndicatorsSection
                activeEntries={activeEntries}
                selectedYear={selectedYearTab === '2025' ? 2025 : 2026}
              />
            )}

            {activeSection === 'comparison' && (
              <ComparisonSection entries2025={entries2025} entries2026={entries2026} />
            )}

            {activeSection === 'revenue-deductions' && (
              <RevenueDeductionsSection
                activeEntries={activeEntries}
                selectedYear={selectedYearTab === '2025' ? 2025 : 2026}
              />
            )}

            {activeSection === 'expenses' && (
              <OperatingExpensesSection
                activeEntries={activeEntries}
                selectedYear={selectedYearTab === '2025' ? 2025 : 2026}
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

      {/* Modal de Alteração de Senha */}
      <PasswordModal open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  )
}
