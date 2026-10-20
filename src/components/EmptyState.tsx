import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Upload, Lock, ShieldCheck, ArrowRight } from 'lucide-react'

interface EmptyStateProps {
  onOpenImport: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenImport }) => {
  return (
    <div className="py-16 px-4 max-w-3xl mx-auto text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-sm mb-6">
        <FileSpreadsheet className="w-10 h-10" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
        Nenhum dado da planilha DRE importado ainda
      </h2>

      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
        Os relatórios, tabelas de receitas, deduções, margem de contribuição, despesas e comparativo
        Jan–Set 2025 x 2026 serão gerados automaticamente assim que a planilha for gravada no banco
        de dados.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          onClick={onOpenImport}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 h-auto shadow-md"
        >
          <Upload className="w-4 h-4 mr-2" />
          Importar Planilha DRE Agora
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left">
        <Card className="border-dashed border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Acesso Protegido</h3>
            <p className="text-xs text-muted-foreground">
              Apenas quem possuir a senha única da cliente tem acesso a esta página confidencial.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Gravação no Banco</h3>
            <p className="text-xs text-muted-foreground">
              Os dados não ficam fixos no código; vêm da planilha importada para o PocketBase.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-3">
              <ArrowRight className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Modelo Pré-configurado</h3>
            <p className="text-xs text-muted-foreground">
              Você pode carregar a planilha modelo com 1 clique para ver a visualização completa.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
