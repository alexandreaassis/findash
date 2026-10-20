import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Info,
  HelpCircle,
  EyeOff,
  Building2,
  Layers,
  Printer,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const TOUR_STORAGE_KEY = 'findash_welcome_tour_dismissed_v1'

export interface TourStep {
  id: string
  /**
   * Seletor CSS para o elemento alvo (ex: '#tour-client-header')
   * Pode ser null se for um passo introdutório ou explicativo geral.
   */
  targetSelector?: string
  title: string
  description: string
  /**
   * Posição preferencial do balão em relação ao elemento alvo
   */
  placement?: 'bottom' | 'top' | 'left' | 'right' | 'center'
  icon?: React.ReactNode
  badgeText?: string
}

interface WelcomeTourProps {
  open: boolean
  onClose: (dontShowAgain?: boolean) => void
  onComplete: (dontShowAgain?: boolean) => void
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'header-client',
    targetSelector: '#tour-client-header',
    title: 'Identificação da Empresa & DRE',
    description:
      'Aqui você confere o nome da sua empresa e o título do Demonstrativo Financeiro (DRE) oficial para os exercícios de 2025 e 2026. Todas as informações apresentadas são confidenciais e auditadas pela A3ONE.',
    placement: 'bottom',
    badgeText: 'Passo 1 • Identificação',
  },
  {
    id: 'navigation-menu',
    targetSelector: '#tour-nav-sections',
    title: 'Menu de Navegação entre Seções',
    description:
      'Acesse rapidamente cada detalhamento do seu DRE: Visão Geral (resumos e gráficos), Indicadores de Desempenho, Comparação 2025 x 2026 (Jan–Set), Receitas e Deduções detalhadas, Despesas Operacionais e Notas explicativas.',
    placement: 'bottom',
    badgeText: 'Passo 2 • Seções',
  },
  {
    id: 'year-tabs',
    targetSelector: '#tour-year-tabs',
    title: 'Seletor de Período & Anos',
    description:
      'Alterne com facilidade entre os exercícios completos de 2025 e 2026, ou clique em "Jan–Set Comparativo" para avaliar a evolução lado a lado com variações percentuais.',
    placement: 'bottom',
    badgeText: 'Passo 3 • Período',
  },
  {
    id: 'pdf-button',
    targetSelector: '#tour-btn-pdf',
    title: 'Exportar ou Imprimir em PDF',
    description:
      'Clique aqui a qualquer momento para gerar uma versão impressa ou salvar um relatório em PDF com layout executivo limpo e dados organizados para reuniões de diretoria.',
    placement: 'bottom',
    badgeText: 'Passo 4 • Relatório PDF',
  },
  {
    id: 'simulate-button',
    targetSelector: '#tour-btn-simulate',
    title: 'Modo de Simulação Interativa',
    description:
      'Permite alterar valores de receitas e custos para projetar novos cenários e margens. A simulação é temporária, roda apenas na tela e NÃO altera os dados reais do seu banco de dados.',
    placement: 'bottom',
    badgeText: 'Passo 5 • Simulação',
  },
  {
    id: 'admin-button',
    targetSelector: '#tour-btn-admin',
    title: 'Área Administrativa A3ONE',
    description:
      'Espaço de configuração restrito aos consultores da A3ONE Soluções Integradas, protegido por senha mestre, para atualizar o nome da empresa e credenciais de segurança.',
    placement: 'bottom',
    badgeText: 'Passo 6 • A3ONE',
  },
  {
    id: 'help-button',
    targetSelector: '#tour-btn-help',
    title: 'Ajuda & Rever Tutorial',
    description:
      'Sempre que quiser rever esta explicação ou tiver dúvidas sobre as funcionalidades da página, basta clicar neste botão de Ajuda no topo da tela.',
    placement: 'bottom',
    badgeText: 'Passo 7 • Ajuda',
  },
]

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ open, onClose, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number
    left: number
    arrowPlacement: 'top' | 'bottom' | 'center'
  }>({
    top: 0,
    left: 0,
    arrowPlacement: 'center',
  })
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Filtra dinamicamente passos cujos alvos existem ou passos sem alvo obrigatório.
  // Se o botão Simular não estiver visível (ex.: sem dados importados), pula o passo correspondente.
  const availableSteps = React.useMemo(() => {
    return TOUR_STEPS.filter((step) => {
      if (!step.targetSelector) return true
      const el = document.querySelector(step.targetSelector)
      return !!el
    })
  }, [open])

  // Se availableSteps estiver vazio por algum motivo, faz fallback para TOUR_STEPS
  const stepsToUse = availableSteps.length > 0 ? availableSteps : TOUR_STEPS
  const totalSteps = stepsToUse.length
  const activeStep = stepsToUse[currentStepIndex] || stepsToUse[0]

  // Atualiza a posição do elemento alvo
  const updatePosition = useCallback(() => {
    if (!open) return

    const step = stepsToUse[currentStepIndex]
    if (!step) return

    let element: HTMLElement | null = null
    if (step.targetSelector) {
      element = document.querySelector(step.targetSelector) as HTMLElement | null
    }

    if (element) {
      // Faz scroll suave até o elemento se não estiver visível na janela
      const rect = element.getBoundingClientRect()
      const isVisibleInView =
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)

      if (!isVisibleInView) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }

      // Reavalia rect após scroll
      const updatedRect = element.getBoundingClientRect()
      setTargetRect(updatedRect)

      // Calcula posicionamento do balão
      const popoverWidth = Math.min(420, window.innerWidth - 32)
      const popoverHeightEst = 260
      const margin = 14

      let top = 0
      let left = 0
      let arrowPlacement: 'top' | 'bottom' | 'center' = 'top'

      // Centraliza horizontalmente em relação ao alvo, com padding de segurança
      left = updatedRect.left + updatedRect.width / 2 - popoverWidth / 2
      if (left < 16) left = 16
      if (left + popoverWidth > window.innerWidth - 16) {
        left = window.innerWidth - popoverWidth - 16
      }

      // Tenta colocar abaixo do elemento alvo
      if (updatedRect.bottom + popoverHeightEst + margin < window.innerHeight) {
        top = updatedRect.bottom + margin
        arrowPlacement = 'top'
      } else if (updatedRect.top - popoverHeightEst - margin > 0) {
        // Coloca acima do alvo
        top = Math.max(16, updatedRect.top - popoverHeightEst - margin)
        arrowPlacement = 'bottom'
      } else {
        // Fallback: centraliza na tela
        top = Math.max(16, (window.innerHeight - popoverHeightEst) / 2)
        arrowPlacement = 'center'
      }

      setPopoverPosition({ top, left, arrowPlacement })
    } else {
      // Sem elemento alvo no DOM (ou passo geral): centraliza na viewport
      setTargetRect(null)
      const popoverWidth = Math.min(420, window.innerWidth - 32)
      const popoverHeightEst = 260
      setPopoverPosition({
        top: Math.max(20, (window.innerHeight - popoverHeightEst) / 2),
        left: (window.innerWidth - popoverWidth) / 2,
        arrowPlacement: 'center',
      })
    }
  }, [open, currentStepIndex])

  // Garante que o currentStepIndex não ultrapasse totalSteps caso mude
  useEffect(() => {
    if (currentStepIndex >= totalSteps && totalSteps > 0) {
      setCurrentStepIndex(totalSteps - 1)
    }
  }, [totalSteps, currentStepIndex])

  useEffect(() => {
    if (open) {
      updatePosition()
      const handleResize = () => updatePosition()
      const handleScroll = () => updatePosition()
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, { passive: true })

      // Pequenos timeouts para dar tempo de renderização de transições
      const timer1 = setTimeout(updatePosition, 100)
      const timer2 = setTimeout(updatePosition, 300)

      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll)
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [open, currentStepIndex, updatePosition])

  // Fecha com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') {
        handleDismiss()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, currentStepIndex, dontShowAgain])

  if (!open) return null

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      } catch {
        // ignore
      }
    }
    onClose(dontShowAgain)
  }

  const handleComplete = () => {
    // Ao concluir, sempre marca como visto para não abrir sozinho novamente
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    } catch {
      // ignore
    }
    onComplete(true)
  }

  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1

  return (
    <div className="fixed inset-0 z-50 print:hidden select-none pointer-events-auto">
      {/* Overlay com corte (spotlight/recorte SVG ou backdrop escuro) */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300"
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* Retângulo branco = overlay visível */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Recorte preto = área vazada iluminando o elemento alvo */}
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - 6)}
                y={Math.max(0, targetRect.top - 6)}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Camada escurecida semi-transparente */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.75)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Anel de destaque / borda pulsante ao redor do elemento ativo */}
      {targetRect && (
        <div
          className="fixed pointer-events-none border-2 border-indigo-400 dark:border-indigo-300 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300 animate-pulse"
          style={{
            top: Math.max(0, targetRect.top - 6),
            left: Math.max(0, targetRect.left - 6),
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            zIndex: 51,
          }}
        />
      )}

      {/* Balão do Tour (Card Flutuante Ancorado) */}
      <div
        ref={popoverRef}
        className="fixed z-52 w-[92vw] max-w-[420px] transition-all duration-200 ease-out"
        style={{
          top: `${popoverPosition.top}px`,
          left: `${popoverPosition.left}px`,
        }}
      >
        <div className="relative bg-white dark:bg-slate-900 border-2 border-indigo-500/30 dark:border-indigo-500/40 rounded-2xl shadow-2xl p-5 text-slate-900 dark:text-slate-100 backdrop-blur-md">
          {/* Header do Balão: Badge, Contador e Botão Fechar */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                {activeStep.badgeText || `Passo ${currentStepIndex + 1} de ${totalSteps}`}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {currentStepIndex + 1} de {totalSteps}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Fechar tutorial (Esc)"
              aria-label="Fechar tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conteúdo Explicativo com tipografia reforçada */}
          <div className="py-3 space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {activeStep.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {activeStep.description}
            </p>
          </div>

          {/* Indicador visual de progresso (pontinhos) */}
          <div className="flex items-center justify-center gap-1.5 py-2">
            {stepsToUse.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                    : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
                title={`Ir para passo ${idx + 1}: ${step.title}`}
                aria-label={`Ir para passo ${idx + 1}`}
              />
            ))}
          </div>

          {/* Opção "Não mostrar novamente" e Ações de Navegação */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-medium">Não apresentar este tutorial novamente</span>
            </label>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={isFirstStep}
                className="text-xs font-bold h-9 px-3 border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Retornar
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs font-medium h-9 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Pular
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleNext}
                  className="text-xs font-bold h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {isLastStep ? (
                    <>
                      Concluir
                      <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
