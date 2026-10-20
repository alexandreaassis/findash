import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DreNote } from '@/types/dre'
import { Info, Calendar, Database, Calculator, HelpCircle } from 'lucide-react'

interface NotesSectionProps {
  notes: DreNote[]
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes }) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'period':
        return <Calendar className="w-5 h-5 text-blue-600" />
      case 'source':
        return <Database className="w-5 h-5 text-emerald-600" />
      case 'methodology':
        return <Calculator className="w-5 h-5 text-indigo-600" />
      default:
        return <HelpCircle className="w-5 h-5 text-amber-600" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'period':
        return 'Período e Recorte'
      case 'source':
        return 'Fonte e Conciliação'
      case 'methodology':
        return 'Metodologia e Fórmulas'
      default:
        return 'Informações Gerais'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Notas Explicativas & Leitura dos Dados
          </h3>
          <p className="text-xs text-muted-foreground">
            Esclarecimentos sobre períodos analisados, conciliação de fontes e metodologia contábil
            do DRE
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <Card
            key={note.id}
            className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                  {getIcon(note.category)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {getCategoryLabel(note.category)}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{note.title}</h4>
                  <p className="text-sm font-normal text-slate-700 leading-relaxed pt-1">
                    {note.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Destaque Metodológico de Leitura Financeira */}
      <Card className="border-indigo-200 bg-indigo-50/60 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <Info className="w-6 h-6 text-indigo-700 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-indigo-950">
              <h5 className="font-extrabold text-base text-indigo-950">
                Glossário Rápido da Estrutura de DRE da Empresa
              </h5>
              <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-indigo-950 font-medium mt-2 leading-relaxed">
                <li>
                  <strong className="text-indigo-950 font-bold">Receita Bruta:</strong> Faturamento
                  total faturado no período.
                </li>
                <li>
                  <strong className="text-indigo-950 font-bold">Deduções Totais:</strong> Soma de
                  impostos s/ faturamento, custo de mercadorias/serviços, devoluções, comissões,
                  royalties, propaganda e fretes (em 2026).
                </li>
                <li>
                  <strong className="text-indigo-950 font-bold">Margem de Contribuição:</strong>{' '}
                  Receita Bruta menos Deduções Totais. O percentual indica quanto sobra de cada R$
                  100 vendidos para cobrir as despesas operacionais e gerar lucro.
                </li>
                <li>
                  <strong className="text-indigo-950 font-bold">Despesas Operacionais:</strong>{' '}
                  Despesas administrativas, comerciais, financeiras e custo com
                  pessoal/funcionários.
                </li>
                <li>
                  <strong className="text-indigo-950 font-bold">Resultado Operacional:</strong>{' '}
                  Margem de Contribuição deduzida das Despesas Operacionais (EBITDA contábil).
                  Valores negativos indicam déficit no mês e são exibidos em vermelho.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
